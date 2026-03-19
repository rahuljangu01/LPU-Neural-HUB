const Timetable = require('../models/Timetable');
const Room = require('../models/Room');
const User = require('../models/User');

// 1. AI BULK DEPLOYMENT (Updated to NOT delete other batches)
exports.addBulkSlots = async (req, res) => {
    try {
        const { schedule } = req.body;

        if (!schedule || schedule.length === 0) {
            return res.status(400).json({ msg: "No schedule data received from AI Engine." });
        }

        // NAYA LOGIC: Pata lagao ki is naye schedule mein kaun-kaun se batches hain
        const incomingBatches =[...new Set(schedule.map(slot => slot.batch))];

        // Sirf unhi batches ka purana timetable delete karo jo abhi update ho rahe hain (Baaki safe rahenge)
        await Timetable.deleteMany({ batch: { $in: incomingBatches } });

        const finalSchedule = await Promise.all(schedule.map(async (slot) => {
            const facultyUser = await User.findOne({ name: slot.facultyName });
            return {
                day: slot.day,
                timeSlot: slot.timeSlot,
                subject: slot.subject,
                faculty: facultyUser ? facultyUser._id : null,
                room: slot.room,
                batch: slot.batch,
                department: slot.department || 'General'
            };
        }));

        await Timetable.insertMany(finalSchedule);
        res.json({ msg: '✅ Neural Matrix Deployed & Locked Successfully!' });
    } catch (err) {
        console.error("Bulk Deploy Error:", err.message);
        res.status(500).json({ msg: 'Deployment Logic Failure', error: err.message });
    }
};

// 2. Manual Overrides (Single Slot Addition)
exports.addSlot = async (req, res) => {
    const { day, timeSlot, subject, faculty, room, batch, department } = req.body;
    try {
        const conflict = await Timetable.findOne({ 
            day, timeSlot, 
            $or:[{ faculty }, { room }, { batch }] 
        });
        
        if (conflict) {
            return res.status(400).json({ msg: 'AI Conflict: Faculty/Room/Batch already engaged!' });
        }

        const newSlot = new Timetable({ day, timeSlot, subject, faculty, room, batch, department });
        await newSlot.save();
        res.json({ msg: '✅ Node added to matrix', newSlot });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// 3. LIVE Tracking
exports.checkLiveStatus = async (req, res) => {
    const { day, timeSlot } = req.query; 
    try {
        const allRooms = await Room.find();
        const busySlots = await Timetable.find({ day, timeSlot }).populate('faculty', 'name');

        const availabilityData = allRooms.map(room => {
            const occupation = busySlots.find(slot => slot.room === room.roomNumber);
            return {
                roomNumber: room.roomNumber,
                block: room.block,
                capacity: room.capacity,
                isAvailable: !occupation,
                facultyName: occupation && occupation.faculty ? occupation.faculty.name : null,
                subject: occupation ? occupation.subject : null
            };
        });
        res.json(availabilityData);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching availability' });
    }
};

// 4. Fetch Full Timetable
exports.getTimetable = async (req, res) => {
    try {
        const timetable = await Timetable.find().populate('faculty', 'name').sort({ day: 1 });
        res.json(timetable);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// 5. Delete Specific Slot
exports.cancelSlot = async (req, res) => {
    try {
        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ msg: "Node de-authorized successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server Error" });
    }
};