const Timetable = require('../models/Timetable');
const Room = require('../models/Room');
const User = require('../models/User');

// 1. AI BULK DEPLOYMENT - COMPLETELY REPLACE old timetable
exports.addBulkSlots = async (req, res) => {
    try {
        const { schedule } = req.body;

        if (!schedule || schedule.length === 0) {
            return res.status(400).json({ msg: "No schedule data received from AI Engine." });
        }

        console.log('📥 addBulkSlots received:', {
            count: schedule.length,
            batches: [...new Set(schedule.map(slot => slot.batch))]
        });

        // COMPLETELY DELETE all timetable entries first
        await Timetable.deleteMany({});

        const finalSchedule = await Promise.all(schedule.map(async (slot) => {
            const facultyUser = await User.findOne({ uid: slot.facultyUid});
            
            // Extract G1/G2 from batch name - more robust check
            let studentGroup = '0';
            if (slot.batch) {
                const batchStr = slot.batch.toString();
                const batchUpper = batchStr.toUpperCase();
                const batchClean = batchUpper.replace(/\s+/g, '');
                
                // Check for G1 or G2 at end or anywhere in batch name
                if (/G1$/i.test(batchStr) || batchClean.endsWith('G1') || /\sG1$/i.test(batchStr)) {
                    studentGroup = 'G1';
                } else if (/G2$/i.test(batchStr) || batchClean.endsWith('G2') || /\sG2$/i.test(batchStr)) {
                    studentGroup = 'G2';
                }
            }
            
            const entry = {
                day: slot.day,
                timeSlot: slot.timeSlot,
                subject: slot.subject,
                subjectCode: slot.subjectCode,
                type: slot.type || 'Theory',
                faculty: facultyUser ? facultyUser._id : null,
                facultyUid: slot.facultyUid,
                room: slot.room,
                batch: slot.batch,
                studentGroup: studentGroup,
                department: slot.department || 'General'
            };
            
            return entry;
        }));

        console.log('💾 Saving to DB (replacing ALL):', {
            count: finalSchedule.length,
            batches: [...new Set(finalSchedule.map(e => e.batch))]
        });

        await Timetable.insertMany(finalSchedule);
        
        // Verify the save
        const savedCount = await Timetable.countDocuments();
        console.log('✅ Verified - Total entries in DB:', savedCount);
        
        res.json({ msg: '✅ Neural Matrix Deployed & Locked Successfully!', count: finalSchedule.length, total: savedCount });
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
        const busySlots = await Timetable.find({ day, timeSlot }).populate('faculty', 'name uid');

        const availabilityData = allRooms.map(room => {
            const occupation = busySlots.find(slot => slot.room === room.roomNumber);
            return {
                roomNumber: room.roomNumber,
                block: room.block,
                capacity: room.capacity,
                type: room.type, // 👈 Yeh line missing thi, ise add karein
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

// Function 4 ko isse replace karein:
exports.getTimetable = async (req, res) => {
    try {
        // Naya: 'name uid' dono fetch honge
        const timetable = await Timetable.find().populate('faculty', 'name uid').sort({ day: 1 });
        
        console.log('📋 Timetable fetched from DB:', {
            count: timetable.length,
            batches: [...new Set(timetable.map(t => t.batch))],
            firstEntry: timetable[0]
        });
        
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