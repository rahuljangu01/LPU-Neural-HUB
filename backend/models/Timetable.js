const mongoose = require('mongoose');
const TimetableSchema = new mongoose.Schema({
    day: { type: String, required: true },
    timeSlot: { type: String, required: true },
    subject: { type: String, required: true },
    subjectCode: { type: String },
    type: { type: String, default: 'Theory' }, // Theory ya Lab/Practical
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    facultyUid: { type: String },
    room: { type: String, required: true },
    batch: { type: String, required: true },
    studentGroup: { type: String, default: 'Full Batch' }, // G1, G2, ya Full Batch
    department: { type: String }
});
module.exports = mongoose.model('Timetable', TimetableSchema);