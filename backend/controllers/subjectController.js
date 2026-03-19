const Subject = require('../models/Subject');

// 1. Add Subject
exports.addSubject = async (req, res) => {
    try {
        const { name, code, weeklyHours, type, department } = req.body;

        // Manual check before Mongoose check
        const existing = await Subject.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ msg: "Subject name already exists in database." });
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