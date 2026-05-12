const User = require('../models/User');
const Batch = require('../models/Batch');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx'); 

// Create a new user account - either student, faculty, hod or admin
exports.register = async (req, res) => {
    const { name, email, password, role, department, batch, uid } = req.body;
    try {
        if (!name || !email || !password || !role) {
            return res.status(400).json({ msg: "Please fill all required identity fields" });
        }

        let finalUid = uid;
        if (finalUid) {
            const uidRegex = /^\d{5,15}$/;
            if (!uidRegex.test(finalUid)) {
                return res.status(400).json({ msg: "Invalid ID: Must be a numeric string" });
            }
            const existingUid = await User.findOne({ uid: finalUid });
            if (existingUid) return res.status(400).json({ msg: "Conflict: ID already assigned." });
        } else {
            // Auto-generate UID if none provided
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

// Authenticate user and return JWT token with user details
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
                group: user.group || 'N/A',
                electiveBatch: user.electiveBatch || '',
                uid: user.uid,
                rollNo: user.rollNo || 0,
                verified: user.verified || false
            });
        });
    } catch (err) {
        res.status(500).send('Authentication hub offline');
    }
};

// Parse an Excel file and bulk-create user accounts
exports.bulkImportStudents = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (data.length > 0) {
            console.log("📋 Excel Headers Found:", Object.keys(data[0]));
        }

        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash("Lpu123", salt);
        
        let importCount = 0;
        let skippedCount = 0;
        const importedUsers = [];

        for (let row of data) {
            const rowKeys = Object.keys(row);
            
            // Matches column headers regardless of case or extra spaces
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
            
            const uidValue = getColumn(row, 'UID', 'uid', 'User ID', 'UserID', 'Faculty ID', 'Teacher ID', 'Emp ID', 'Employee ID', 'EmpID', 'ID', 'EmpCode', 'Emp Code');
            const regValue = getColumn(row, 'RegNo', 'Reg No', 'Reg No.', 'Registration No', 'Reg. No', 'Registration Number', 'RegNumber', 'Reg', 'RegNumber', 'Reg Num', 'Roll No', 'RollNo', 'Student ID', 'SID');

            if (!email || !name || !role) {
                console.log(`Skipping: ${name || 'Unknown'} - Missing name/email/role`);
                skippedCount++;
                continue;
            }

            const exists = await User.findOne({ email: email.toLowerCase() });
            
            if (exists) {
                console.log(`Skipping: ${name} (${email}) - Already exists`);
                continue;
            }

            const userRole = role.toLowerCase().trim();
            
            // Prefer UID for faculty, RegNo for students; fallback to auto-generate
            let finalUID = uidValue || regValue;
            
            if (!finalUID && userRole === 'student') {
                let isUnique = false;
                while (!isUnique) {
                    finalUID = Math.floor(10000 + Math.random() * 90000).toString();
                    const existingUid = await User.findOne({ uid: finalUID });
                    if (!existingUid) isUnique = true;
                }
                console.log(`Auto-generated UID: ${finalUID} for ${name}`);
            }

            if (!finalUID) {
                console.log(`Skipping: ${name} (${email}) - No UID/RegNo found`);
                skippedCount++;
                continue;
            }

            finalUID = finalUID.replace(/[^0-9]/g, '');

            if (finalUID.length < 5 || finalUID.length > 15) {
                console.log(`Skipping: ${name} - Invalid UID: "${finalUID}" (must be 5-15 digits)`);
                skippedCount++;
                continue;
            }

            const uidExists = await User.findOne({ uid: finalUID });
            if (uidExists) {
                console.log(`Skipping: ${name} - UID ${finalUID} already taken`);
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
            console.log(`Imported: ${name} | UID: ${finalUID} | Role: ${userRole}`);
            importCount++;
            importedUsers.push({ name, uid: finalUID, role: userRole });
        }
        
        console.log("\nIMPORT SUMMARY:");
        console.log(`Imported: ${importCount} | Skipped: ${skippedCount}`);
        if (importedUsers.length > 0) {
            console.log("Imported Users:");
            importedUsers.forEach(u => {
                console.log(`   ${u.name} - UID: ${u.uid} (${u.role})`);
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

// Returns all users sorted by most recent
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: "Matrix sync failed" });
    }
};

// Picks the smallest available roll number in a batch (reuses gaps from removed students)
const getNextRollNo = async (batchName) => {
    const students = await User.find({ batch: batchName, role: 'student' }).sort({ createdAt: -1 });
    if (students.length === 0) return 1;
    const usedRollNos = students.map(s => s.rollNo).filter(r => r > 0);
    for (let i = 1; i <= students.length + 1; i++) {
        if (!usedRollNos.includes(i)) return i;
    }
    return students.length + 1;
};

// Splits batch into G1/G2 only when 25+ students enrolled, otherwise everyone is N/A
const syncBatchGroups = async (batchName) => {
    const MIN_SPLIT = 25;
    const students = await User.find({ batch: batchName, role: 'student' }).sort({ rollNo: 1 });
    
    if (students.length < MIN_SPLIT) {
        await User.updateMany({ batch: batchName }, { $set: { group: 'N/A' } });
    } else {
        const half = Math.ceil(students.length / 2);
        for (let i = 0; i < students.length; i++) {
            const newGroup = i < half ? 'G1' : 'G2';
            if (students[i].group !== newGroup) {
                await User.findByIdAndUpdate(students[i]._id, { $set: { group: newGroup } });
            }
        }
    }
};

// Main handler for batch assignment, elective enrollment, expertise updates
exports.updateUserAI = async (req, res) => {
    try {
        const { userId, expertise, maxWorkload, avgLeaves, batch, group, electiveBatch } = req.body;
        console.log('updateUserAI called:', { userId, batch, electiveBatch });
        const updateFields = {};

        if (expertise !== undefined) {
            updateFields.expertise = typeof expertise === 'string' 
                ? expertise.split(',').map(item => item.trim()) 
                : expertise;
        }

        if (electiveBatch !== undefined) {
            updateFields.electiveBatch = electiveBatch;
            // When only electiveBatch is being updated (no batch field in request), return early
            if (electiveBatch && req.body.batch === undefined) {
                console.log('Saving only electiveBatch:', updateFields);
                const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true }).select('-password');
                if (!updatedUser) return res.status(404).json({ msg: 'Identity node not found' });
                return res.json({ msg: 'Neural Parameters Synced!', user: updatedUser });
            }
        }

        let batchToSync = null;

        if (batch !== undefined) {
            const user = await User.findById(userId);
            const oldBatch = user?.batch;
            
            if (user && user.role === 'student') {
                if (batch !== '' && oldBatch !== batch) {
                    const batchInfo = await Batch.findOne({ name: batch });
                    const totalCapacity = batchInfo?.studentCount || 50;
                    
                    const currentCount = await User.countDocuments({ batch, role: 'student' });
                    if (currentCount >= totalCapacity) {
                        return res.status(400).json({ msg: `Batch ${batch} is full (${totalCapacity}/${totalCapacity})` });
                    }
                    
                    const newRollNo = await getNextRollNo(batch);
                    updateFields.rollNo = newRollNo;
                    updateFields.batch = batch;
                    
                    if (group) {
                        updateFields.group = group;
                    } else {
                        updateFields.group = 'N/A';
                    }
                    batchToSync = batch;
                } else if (batch === '') {
                    updateFields.batch = '';
                    updateFields.rollNo = 0;
                    updateFields.group = 'N/A';
                    batchToSync = oldBatch;
                } else {
                    updateFields.batch = batch;
                    if (group) {
                        updateFields.group = group;
                    }
                }
            } else {
                updateFields.batch = batch;
            }
        }

        if (maxWorkload !== undefined) updateFields.maxWorkload = Number(maxWorkload);
        if (avgLeaves !== undefined) updateFields.avgLeaves = Number(avgLeaves);

        console.log('Final updateFields:', updateFields);
        const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true }).select('-password');
        if (!updatedUser) return res.status(404).json({ msg: 'Identity node not found' });

        // Re-sync G1/G2 groups for the affected batch after the change
        if (batchToSync) {
            await syncBatchGroups(batchToSync);
        }

        res.json({ msg: 'Neural Parameters Synced!', user: updatedUser });
    } catch (err) {
        res.status(500).json({ msg: 'Failed to update node logic' });
    }
};

// Permanently remove a user from the system
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

// Allow authenticated users to update their own password
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

// Admin can grant or revoke HOD dashboard access
exports.verifyHOD = async (req, res) => {
    try {
        const { userId, verified } = req.body;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        if (user.role !== 'hod') {
            return res.status(400).json({ msg: 'Only HOD accounts can be verified' });
        }
        
        user.verified = verified;
        await user.save();
        
        res.json({ 
            msg: verified ? 'HOD verified successfully' : 'HOD verification revoked', 
            user: { ...user.toObject(), password: undefined } 
        });
    } catch (err) {
        res.status(500).json({ msg: 'Failed to update HOD status' });
    }
};
