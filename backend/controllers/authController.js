const User = require('../models/User');
const Batch = require('../models/Batch');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx'); 

// 1. User Registration (Individual)
exports.register = async (req, res) => {
    const { name, email, password, role, department, batch, uid } = req.body;
    try {
        if (!name || !email || !password || !role) {
            return res.status(400).json({ msg: "Please fill all required identity fields" });
        }

        let finalUid = uid;
        if (finalUid) {
            const uidRegex = /^\d{5,15}$/; // Standardized for both short UID and long RegNo
            if (!uidRegex.test(finalUid)) {
                return res.status(400).json({ msg: "Invalid ID: Must be a numeric string" });
            }
            const existingUid = await User.findOne({ uid: finalUid });
            if (existingUid) return res.status(400).json({ msg: "Conflict: ID already assigned." });
        } else {
            let isUnique = false;
            while (!isUnique) {
                finalUid = Math.floor(10000 + Math.random() * 90000).toString();
                const existingUid = await User.findOne({ uid: finalUid });
                if (!existingUid) isUnique = true; 
            }
        }

        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) return res.status(400).json({ msg: 'Identity Node already exists with this email' });

        user = new User({ 
            uid: finalUid,
            name, 
            email: email.toLowerCase(), 
            password, 
            role: role.toLowerCase(), 
            department: department || 'General',
            batch: batch || '', 
            rollNo: 0,
            group: 'N/A',
            expertise: [], 
            maxWorkload: 18, 
            avgLeaves: 2 
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        res.json({ msg: 'Node integrated successfully', userId: user._id });
    } catch (err) {
        res.status(500).send('Server integration error');
    }
};

// 2. User Login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ msg: 'Terminal Access Denied: Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Terminal Access Denied: Key Mismatch' });

        const payload = { user: { id: user.id, role: user.role } };
        
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10h' }, (err, token) => {
            if (err) throw err;
            res.json({ 
                token, 
                role: user.role, 
                name: user.name,
                email: user.email,
                department: user.department,
                batch: user.batch,
                uid: user.uid
            });
        });
    } catch (err) {
        res.status(500).send('Authentication hub offline');
    }
};

// 3. Bulk Import from Excel (Supports UID for Faculty & RegNo for Students)
exports.bulkImportStudents = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Debug: Log all headers from first row
        if (data.length > 0) {
            console.log("📋 Excel Headers Found:", Object.keys(data[0]));
        }

        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash("Lpu123", salt);
        
        let importCount = 0;
        let skippedCount = 0;
        const importedUsers = [];

        for (let row of data) {
            // Get all keys from the row and normalize them
            const rowKeys = Object.keys(row);
            
            // Find column names (case insensitive, handles spaces)
            const getColumn = (row, ...names) => {
                for (let name of names) {
                    const normalizedName = name.toLowerCase().replace(/\s+/g, ' ').trim();
                    const key = rowKeys.find(k => {
                        const rowKeyNormalized = k.toLowerCase().replace(/\s+/g, ' ').trim();
                        return rowKeyNormalized === normalizedName;
                    });
                    if (key && row[key] !== undefined && row[key] !== null && row[key] !== '') {
                        const value = row[key];
                        return value.toString().replace(/\s+/g, ' ').trim();
                    }
                }
                return null;
            };

            const name = getColumn(row, 'Name', 'name', 'NAME', 'Faculty Name', 'Teacher Name', 'User Name', 'username');
            const email = getColumn(row, 'Email', 'email', 'EMAIL', 'Mail', 'mail', 'E-Mail', 'E mail');
            const role = getColumn(row, 'Role', 'role', 'ROLE', 'Type', 'User Type', 'UserType', 'user type');
            const dept = getColumn(row, 'Dept', 'Department', 'department', 'DEPT', 'DEPARTMENT', 'dept');
            
            // UID columns - check ALL possible variations
            const uidValue = getColumn(row, 'UID', 'uid', 'User ID', 'UserID', 'Faculty ID', 'Teacher ID', 'Emp ID', 'Employee ID', 'EmpID', 'ID', 'EmpCode', 'Emp Code');
            // Reg No columns - for Students
            const regValue = getColumn(row, 'RegNo', 'Reg No', 'Reg No.', 'Registration No', 'Reg. No', 'Registration Number', 'RegNumber', 'Reg', 'RegNumber', 'Reg Num');

            if (!email || !name || !role) {
                console.log(`❌ Skipping: ${name || 'Unknown'} - Missing name/email/role`);
                skippedCount++;
                continue;
            }

            const exists = await User.findOne({ email: email.toLowerCase() });
            
            if (exists) {
                console.log(`❌ Skipping: ${name} (${email}) - Already exists`);
                continue;
            }

            const userRole = role.toLowerCase().trim();
            
            // For Faculty/HOD, UID is required. For Students, use RegNo
            let finalUID = uidValue || regValue;
            
            // If no UID/RegNo provided, don't create user
            if (!finalUID) {
                console.log(`❌ Skipping: ${name} (${email}) - No UID/RegNo found`);
                skippedCount++;
                continue;
            }

            // Clean the UID - remove any spaces or special characters, keep only numbers
            finalUID = finalUID.replace(/[^0-9]/g, '');

            // Validate UID format (5 digits for LPU)
            if (finalUID.length !== 5) {
                console.log(`❌ Skipping: ${name} - Invalid UID: "${finalUID}" (must be 5 digits)`);
                skippedCount++;
                continue;
            }

            // Check if UID already exists
            const uidExists = await User.findOne({ uid: finalUID });
            if (uidExists) {
                console.log(`❌ Skipping: ${name} - UID ${finalUID} already taken`);
                skippedCount++;
                continue;
            }

            const newUser = new User({
                name: name,
                email: email.toLowerCase(),
                uid: finalUID,
                password: defaultPassword,
                role: userRole,
                department: dept || 'MCA',
                batch: '',      
                rollNo: 0,      
                group: 'N/A'    
            });

            await newUser.save();
            console.log(`✅ Imported: ${name} | UID: ${finalUID} | Role: ${userRole}`);
            importCount++;
            importedUsers.push({ name, uid: finalUID, role: userRole });
        }
        
        console.log("\n📊 IMPORT SUMMARY:");
        console.log(`Imported: ${importCount} | Skipped: ${skippedCount}`);
        if (importedUsers.length > 0) {
            console.log("\n📋 Imported Users:");
            importedUsers.forEach(u => {
                console.log(`   • ${u.name} - UID: ${u.uid} (${u.role})`);
            });
        }
        
        res.json({ 
            msg: `Imported ${importCount} users. Skipped ${skippedCount}. Check console for details.`,
            imported: importCount,
            skipped: skippedCount,
            users: importedUsers
        });
    } catch (err) {
        console.error("Bulk Import Error:", err);
        res.status(500).json({ msg: "Excel processing failed: " + err.message });
    }
};

// 4. Get All Users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: "Matrix sync failed" });
    }
};

// Helper: Get next available roll number for a batch
const getNextRollNo = async (batchName) => {
    const students = await User.find({ batch: batchName, role: 'student' }).sort({ rollNo: 1 });
    if (students.length === 0) return 1;
    for (let i = 1; i <= students.length + 1; i++) {
        if (!students.find(s => s.rollNo === i)) return i;
    }
    return students.length + 1;
};

// Helper: Re-number all students in a batch
const renumberBatch = async (batchName) => {
    const students = await User.find({ batch: batchName, role: 'student' }).sort({ rollNo: 1 });
    const batchInfo = await Batch.findOne({ name: batchName });
    const totalCapacity = batchInfo?.studentCount || 50;
    const halfCapacity = Math.ceil(totalCapacity / 2);
    
    for (let i = 0; i < students.length; i++) {
        const newRollNo = i + 1;
        const newGroup = (newRollNo <= halfCapacity) ? 'G1' : 'G2';
        await User.findByIdAndUpdate(students[i]._id, { rollNo: newRollNo, group: newGroup });
    }
};

// 5. Update AI Node (Auto RollNo + Grouping Logic)
exports.updateUserAI = async (req, res) => {
    try {
        const { userId, expertise, maxWorkload, avgLeaves, batch } = req.body;
        const updateFields = {};

        if (expertise !== undefined) {
            updateFields.expertise = typeof expertise === 'string' 
                ? expertise.split(',').map(item => item.trim()) 
                : expertise;
        }

        if (batch !== undefined) {
            const user = await User.findById(userId);
            if (user && user.role === 'student') {
                const oldBatch = user.batch;
                
                if (batch !== '' && oldBatch !== batch) {
                    const newRollNo = await getNextRollNo(batch);
                    updateFields.rollNo = newRollNo;
                    updateFields.batch = batch;
                    
                    const batchInfo = await Batch.findOne({ name: batch });
                    const totalCapacity = batchInfo?.studentCount || 50;
                    const halfCapacity = Math.ceil(totalCapacity / 2);
                    updateFields.group = (newRollNo <= halfCapacity) ? 'G1' : 'G2';
                    
                    if (oldBatch) await renumberBatch(oldBatch);
                } else if (batch === '') {
                    updateFields.batch = '';
                    updateFields.rollNo = 0;
                    updateFields.group = 'N/A';
                    if (oldBatch) await renumberBatch(oldBatch);
                } else {
                    updateFields.batch = batch;
                }
            } else {
                updateFields.batch = batch;
            }
        }

        if (maxWorkload !== undefined) updateFields.maxWorkload = Number(maxWorkload);
        if (avgLeaves !== undefined) updateFields.avgLeaves = Number(avgLeaves);

        const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true }).select('-password');
        if (!updatedUser) return res.status(404).json({ msg: 'Identity node not found' });

        res.json({ msg: 'Neural Parameters Synced!', user: updatedUser });
    } catch (err) {
        res.status(500).json({ msg: 'Failed to update node logic' });
    }
};

// 6. Delete User
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'Personnel node not found' });
        
        if (user.email === 'admin@gmail.com') {
            return res.status(403).json({ msg: 'Access Denied: Cannot purge System Admin' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Personnel purged from registry' });
    } catch (err) {
        res.status(500).send('Server error during purge');
    }
};

// 7. Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: "Please provide both current and new password" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Failed to change password" });
    }
};