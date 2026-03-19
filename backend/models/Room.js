const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    type: { type: String, default: 'Theory' },
    block: { type: String, required: true }
});

module.exports = mongoose.model('Room', RoomSchema);