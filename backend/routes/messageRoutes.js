const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 }).limit(10);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ msg: "Server Error" });
    }
});

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

// Admin, HOD, and faculty can delete messages
router.delete('/:id', auth, async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ msg: "Message Cleared" });
    } catch (err) {
        res.status(500).json({ msg: "Delete Failed" });
    }
});

module.exports = router;
