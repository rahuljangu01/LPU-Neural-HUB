const Batch = require('../models/Batch');

exports.getBatches = async (req, res) => {
    try {
        const batches = await Batch.find().sort({ name: 1 });
        res.json(batches);
    } catch (err) {
        res.status(500).json({ msg: "Fetch Error" });
    }
};

exports.addBatch = async (req, res) => {
    try {
        // NAYA FIX: req.body se 'subjects' ko bhi receive kiya
        const { name, studentCount, subjects } = req.body; 
        
        const existing = await Batch.findOne({ name: name.trim() });
        if (existing) return res.status(400).json({ msg: "This Batch ID already exists." });

        const newBatch = new Batch({
            name: name.trim(),
            studentCount: Number(studentCount),
            semester: 1,
            department: 'MCA',
            // NAYA FIX: subjects ko database mein save kiya
            subjects: subjects ||[] 
        });
        
        await newBatch.save();
        res.status(201).json(newBatch);
    } catch (err) {
        res.status(500).json({ msg: "Database Error" });
    }
};
exports.deleteBatch = async (req, res) => {
    try {
        const deleted = await Batch.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ msg: "Batch not found" });
        res.json({ msg: "Batch purged successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Delete Failed" });
    }
};
exports.updateBatch = async (req, res) => {
    try {
        const updatedBatch = await Batch.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate('subjects');

        if (!updatedBatch) {
            return res.status(404).json({ msg: "Batch not found" });
        }

        res.json(updatedBatch);
    } catch (err) {
        console.error("Batch Update Error:", err.message);
        res.status(500).json({ msg: "Server Error during update" });
    }
};