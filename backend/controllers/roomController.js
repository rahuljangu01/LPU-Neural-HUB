const Room = require('../models/Room');

exports.addRoom = async (req, res) => {
    try {
        const { roomNumber, capacity, type, block } = req.body;
        
        if (!roomNumber || !capacity) {
            return res.status(400).json({ msg: "Room Number and Capacity are mandatory" });
        }

        // Skip creation if this room number is already registered
        const existingRoom = await Room.findOne({ roomNumber: roomNumber.trim() });
        if (existingRoom) return res.status(400).json({ msg: "Room already exists in database" });

        const newRoom = new Room({
            roomNumber: roomNumber.trim(),
            capacity: Number(capacity),
            type: type || 'Theory', 
            block: block || 'General'
        });

        await newRoom.save();
        res.status(201).json({ msg: 'Infrastructure unit secured!', room: newRoom });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find().sort({ roomNumber: 1 });
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const deletedRoom = await Room.findByIdAndDelete(req.params.id);
        if (!deletedRoom) {
            return res.status(404).json({ msg: "Room not found" });
        }
        res.json({ msg: "Infrastructure unit removed successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server Error during deletion" });
    }
};
