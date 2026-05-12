const Batch = require('../models/Batch');
const User = require('../models/User');

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
        const { name, studentCount, subjects, isElective } = req.body; 
        
        const existing = await Batch.findOne({ name: name.trim() });
        // Reject the request if this batch name is already in use
        if (existing) return res.status(400).json({ msg: "This Batch ID already exists." });

        const newBatch = new Batch({
            name: name.trim(),
            studentCount: Number(studentCount),
            semester: 1,
            department: 'MCA',
            subjects: subjects || [],
            isElective: isElective || false
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
        
        // Reset all students assigned to this batch and clear their elective enrollment too
        await User.updateMany(
            { batch: deleted.name },
            { $set: { batch: '', rollNo: 0, group: 'N/A' } }
        );
        await User.updateMany(
            { electiveBatch: deleted.name },
            { $set: { electiveBatch: '' } }
        );
        
        res.json({ msg: "Batch purged successfully, students reset" });
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
        // Pull in full subject details so the response is ready for the frontend
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
