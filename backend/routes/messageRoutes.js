const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/authMiddleware');

// 1. Get All Messages
router.get('/', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 }).limit(10);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ msg: "Server Error" });
    }
});

// 2. Send Message (Broadcast)
router.post('/', async (req, res) => {
    try {
        const { senderName, senderRole, content } = req.body;
        const newMessage = new Message({ senderName, senderRole, content });
        await newMessage.save();
        res.status(201).json({ msg: "Broadcast Dispatched!" });
    } catch (err) {
        res.status(500).json({ msg: "Transmission Failed" });
    }
});

// 3. Delete Message - Protected route (Admin, HOD, Faculty can delete)
router.delete('/:id', auth, async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ msg: "Message Cleared" });
    } catch (err) {
        res.status(500).json({ msg: "Delete Failed" });
    }
});

module.exports = router;