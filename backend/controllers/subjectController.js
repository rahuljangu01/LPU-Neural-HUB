const Subject = require('../models/Subject');
const User = require('../models/User');

exports.addSubject = async (req, res) => {
    try {
        const { name, type, department, classesPerWeek, labDuration } = req.body;

        // Allow duplicate names only when the type differs (Theory vs Lab)
        const existing = await Subject.findOne({ name: name.trim(), type });
        if (existing) return res.status(400).json({ msg: 'Subject name already exists with this type' });

        const newSubject = new Subject({ 
            name: name.trim(), 
            type: type || 'Theory', 
            department: department || 'General',
            classesPerWeek: Number(classesPerWeek) || 4,
            labDuration: Number(labDuration) || 2
        });
        
        await newSubject.save();
        res.status(201).json(newSubject);
    } catch (err) {
        res.status(500).json({ msg: 'Database error' });
    }
};

exports.getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ msg: 'Fetch error' });
    }
};

exports.updateSubject = async (req, res) => {
    try {
        const updatedSubject = await Subject.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!updatedSubject) return res.status(404).json({ msg: 'Subject not found' });
        res.json(updatedSubject);
    } catch (err) {
        res.status(500).json({ msg: 'Update failed' });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) return res.status(404).json({ msg: 'Subject not found' });
        
        // Remove this subject from every faculty member who was teaching it
        await User.updateMany(
            { expertise: subject.name },
            { $pull: { expertise: subject.name } }
        );
        
        await Subject.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Subject deleted and removed from all faculty' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.updateSubject = async (req, res) => {
    try {
        // Apply the incoming changes directly to the subject record
        const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ msg: "Subject logic updated", subject });
    } catch (err) {
        res.status(500).send("Update failed");
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) return res.status(404).json({ msg: 'Subject not found' });
        
        // Scrub this subject from every faculty member's expertise list before deleting it
        await User.updateMany(
            { expertise: subject.name },
            { $pull: { expertise: subject.name } }
        );
        
        await Subject.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Logic module purged from matrix, removed from all teachers' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};
