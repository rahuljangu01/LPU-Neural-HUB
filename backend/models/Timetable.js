const mongoose = require('mongoose');
const TimetableSchema = new mongoose.Schema({
    day: { type: String, required: true },
    timeSlot: { type: String, required: true },
    subject: { type: String, required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    room: { type: String, required: true },
    batch: { type: String, required: true },
    department: { type: String }
});
module.exports = mongoose.model('Timetable', TimetableSchema);