const mongoose = require('mongoose');
const BatchSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., MCA-1
    studentCount: { type: Number, required: true }, // For Room selection optimization
    semester: { type: Number, required: true },
    department: { type: String, required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }] // Subjects this batch studies
});
module.exports = mongoose.model('Batch', BatchSchema);