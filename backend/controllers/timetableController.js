const Timetable = require('../models/Timetable');
const Room = require('../models/Room');
const User = require('../models/User');

exports.addBulkSlots = async (req, res) => {
    try {
        const { schedule } = req.body;

        if (!schedule || schedule.length === 0) {
            return res.status(400).json({ msg: "No schedule data received from AI Engine." });
        }

        const uids = [...new Set(schedule.map(s => s.facultyUid).filter(Boolean))];
        const facultyMap = {};
        if (uids.length > 0) {
            const facultyUsers = await User.find({ uid: { $in: uids } });
            for (const fu of facultyUsers) {
                facultyMap[fu.uid] = fu._id;
            }
        }

        const batchesToReplace = [...new Set(schedule.map(slot => slot.batch).filter(Boolean))];
        if (batchesToReplace.length > 0) {
            await Timetable.deleteMany({ batch: { $in: batchesToReplace } });
        }

        const finalSchedule = schedule.map((slot) => {
            const groupValue = slot.subGroup || slot.studentGroup;
            let studentGroup = '0';
            if (groupValue === 'G1' || groupValue === 'G2') {
                studentGroup = groupValue;
            }

            return {
                day: slot.day,
                timeSlot: slot.timeSlot,
                subject: slot.subject,
                subjectCode: slot.subjectCode,
                type: slot.type || 'Theory',
                faculty: slot.facultyUid ? (facultyMap[slot.facultyUid] || null) : null,
                facultyUid: slot.facultyUid || null,
                room: String(slot.room),
                batch: String(slot.batch),
                studentGroup: studentGroup,
                department: slot.department || 'General'
            };
        });

        await Timetable.insertMany(finalSchedule);

        res.json({ msg: 'Timetable Deployed Successfully!', count: finalSchedule.length });
    } catch (err) {
        console.error("Bulk Deploy Error:", err.message);
        console.error("Bulk Deploy Stack:", err.stack);
        res.status(500).json({ msg: 'Deployment Logic Failure', error: err.message, stack: err.stack });
    }
};

// Manually add a single slot — fails if the same room, faculty or batch is already booked
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

// Return every room with its current booking status for a given day and time
exports.checkLiveStatus = async (req, res) => {
    const { day, timeSlot } = req.query; 
    try {
        const allRooms = await Room.find();
        const busySlots = await Timetable.find({ day, timeSlot }).populate('faculty', 'name uid');

        const availabilityData = allRooms.map(room => {
            const occupation = busySlots.find(slot => slot.room === room.roomNumber);
            return {
                roomNumber: room.roomNumber,
                block: room.block,
                capacity: room.capacity,
                type: room.type,
                isAvailable: !occupation,
                facultyName: occupation && occupation.faculty ? occupation.faculty.name : null,
                facultyUid: occupation && occupation.faculty ? occupation.faculty.uid : null,
                subject: occupation ? occupation.subject : null
            };
        });
        res.json(availabilityData);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching availability' });
    }
};

// Fetch all timetable entries with faculty name/uid populated
exports.getTimetable = async (req, res) => {
    try {
        const timetable = await Timetable.find().populate('faculty', 'name uid').sort({ day: 1 });
        
        res.json(timetable);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.cancelSlot = async (req, res) => {
    try {
        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ msg: "Node de-authorized successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server Error" });
    }
};
