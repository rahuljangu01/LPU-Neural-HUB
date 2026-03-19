const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);