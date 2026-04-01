const Subject = require('../models/Subject');

// 1. Add Subject
exports.addSubject = async (req, res) => {
    try {
        const { name, code, weeklyHours, type, department } = req.body;

        // Manual check - allow same name if type is different (Theory vs Lab)
        const existing = await Subject.findOne({ name: name.trim(), type: type || 'Theory' });
        if (existing) {
            return res.status(400).json({ msg: `This ${type || 'Theory'} subject already exists. Try a different name or change the type.` });
        }
        
        // Also check if same code is used
        const codeExists = await Subject.findOne({ code: code?.trim() });
        if (codeExists) {
            return res.status(400).json({ msg: "Subject code already exists. Use a unique code." });
        }

        const newSubject = new Subject({
            name: name.trim(),
            code: code || `SUB-${Date.now()}`,
            weeklyHours: Number(weeklyHours),
            type: type || 'Theory',
            department: department || 'MCA'
        });

        await newSubject.save();
        res.status(201).json(newSubject);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ msg: "Database Conflict: Duplicate Entry." });
        }
        res.status(500).json({ msg: "Internal Error" });
    }
};
// 2. Get All
exports.getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// 3. Update Subject (For Rearrangements)
exports.updateSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ msg: "Subject logic updated", subject });
    } catch (err) {
        res.status(500).send("Update failed");
    }
};

// 4. Delete Subject (Purge Node)
exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) return res.status(404).json({ msg: 'Subject not found' });
        
        await Subject.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Logic module purged from matrix' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};