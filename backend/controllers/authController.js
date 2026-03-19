const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. User Registration
exports.register = async (req, res) => {
    const { name, email, password, role, department, batch } = req.body;
    try {
        // Validation: Basic fields check
        if (!name || !email || !password || !role) {
            return res.status(400).json({ msg: "Please fill all required identity fields" });
        }

        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) return res.status(400).json({ msg: 'Identity Node already exists with this email' });

        user = new User({ 
            name, 
            email: email.toLowerCase(), 
            password, 
            role: role.toLowerCase(), 
            department: department || 'General',
            batch: batch || '', // Student batch from register page
            expertise: [], // Default empty, admin will update later
            maxWorkload: 18, 
            avgLeaves: 2 
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        res.json({ msg: 'Node integrated successfully', userId: user._id });
    } catch (err) {
        console.error("Register Error:", err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: "Conflict: Email or Name already registered." });
        }
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
                batch: user.batch 
            });
        });
    } catch (err) {
        res.status(500).send('Authentication hub offline');
    }
};

// 3. Get All Users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: "Matrix sync failed" });
    }
};

// 4. Update AI Node (Teacher expertise/leaves OR Student batch)
exports.updateUserAI = async (req, res) => {
    try {
        const { userId, expertise, maxWorkload, avgLeaves, batch } = req.body;

        // Logic: Agar expertise string mein aayi hai (comma separated), toh array banao
        let formattedExpertise = expertise;
        if (typeof expertise === 'string') {
            formattedExpertise = expertise.split(',').map(item => item.trim());
        }

        const updateFields = {};
        if (expertise !== undefined) updateFields.expertise = formattedExpertise;
        if (maxWorkload !== undefined) updateFields.maxWorkload = Number(maxWorkload);
        if (avgLeaves !== undefined) updateFields.avgLeaves = Number(avgLeaves);
        if (batch !== undefined) updateFields.batch = batch;

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { $set: updateFields }, 
            { new: true } 
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ msg: 'Identity node not found' });

        res.json({ msg: 'Neural Parameters Synced!', user: updatedUser });
    } catch (err) {
        console.error("Update User Error:", err.message);
        res.status(500).json({ msg: 'Failed to update node logic' });
    }
};

// 5. Delete User
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'Personnel node not found' });
        
        // Safety lock for Admin
        if (user.email === 'admin@gmail.com') {
            return res.status(403).json({ msg: 'Access Denied: Cannot purge System Admin' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Personnel purged from registry' });
    } catch (err) {
        res.status(500).send('Server error during purge');
    }
};