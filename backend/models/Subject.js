const mongoose = require('mongoose');
const SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true },
    department: { type: String },
    type: { type: String, enum: ['Theory', 'Lab'], default: 'Theory' },
    weeklyHours: { type: Number, required: true } // Required classes per week
});
module.exports = mongoose.model('Subject', SubjectSchema);
