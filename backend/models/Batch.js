const mongoose = require('mongoose');
const BatchSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., MCA-1, D2421
    parentBatch: { type: String }, // e.g., "D2421" (for G1/G2 subgroups, null for regular batches)
    subGroup: { type: String, enum: ['G1', 'G2', null], default: null }, // Subgroup identifier
    studentCount: { type: Number, required: true }, // Total students
    splitGroups: { type: Boolean, default: false }, // Auto-split into G1/G2?
    semester: { type: Number, required: true },
    department: { type: String, required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }] // Subjects this batch studies
});
module.exports = mongoose.model('Batch', BatchSchema);