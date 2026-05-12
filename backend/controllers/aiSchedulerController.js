const Room = require('../models/Room');
const User = require('../models/User');
const Batch = require('../models/Batch');
const Timetable = require('../models/Timetable');

// Strips subgroup suffix (G1/G2) from a batch name to find its parent
const getParentBatchName = (batchName) => {
    if (!batchName) return '';
    const match = batchName.match(/^(.+?)\s*[GG]1\s*$/i) || batchName.match(/^(.+?)[GG]1$/i);
    return match ? match[1].trim() : batchName.trim();
};

// Returns G1, G2, or null based on the batch name suffix
const getSubGroup = (batchName) => {
    if (!batchName) return null;
    if (/G1$/i.test(batchName)) return 'G1';
    if (/G2$/i.test(batchName)) return 'G2';
    return null;
};

exports.generateAITimetable = async (req, res) => {
    try {
        const { maxLoad, batchId, fixedSlots } = req.body; 
        // Build a complete timetable — match every subject to a room, teacher, and free slot
        const rooms = await Room.find();
        const allFaculties = await User.find({ 
            role: { $in: ['faculty', 'hod'] },
            name: { $ne: '' } 
        });
        
        let batchQuery = (batchId && batchId !== 'all') ? { _id: batchId } : {};
        const batches = await Batch.find(batchQuery).populate('subjects');

        if (!batches || batches.length === 0) {
            return res.status(400).json({ msg: "No batches found." });
        }

        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const timeSlots = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "01:00 - 02:00", "02:00 - 03:00", "03:00 - 04:00"];

        // Block slots where elective students already have regular classes
        let blockedSlots = new Set();
        
        for (const b of batches) {
            if (b.isElective) {
                const electiveStudents = await User.find({ 
                    electiveBatch: b.name, 
                    role: 'student' 
                });
                
                const regularBatchNames = [...new Set(
                    electiveStudents
                        .map(s => s.batch)
                        .filter(batch => batch && batch !== '')
                )];
                
                if (regularBatchNames.length > 0) {
                    const existingTimetable = await Timetable.find({ 
                        batch: { $in: regularBatchNames } 
                    });
                    
                    for (const entry of existingTimetable) {
                        blockedSlots.add(`${entry.day}|${entry.timeSlot}`);
                    }
                }
            }
        }
        
        const blockedSlotsArray = Array.from(blockedSlots).map(s => {
            const [day, timeSlot] = s.split('|');
            return { day, timeSlot };
        });

        let totalRequired = 0;
        const masterTaskList = [];
        
        for (const b of batches) {
            // Count G1 and G2 students to decide if this batch needs split scheduling
            const g1Students = await User.countDocuments({ batch: b.name, role: 'student', group: 'G1' });
            const g2Students = await User.countDocuments({ batch: b.name, role: 'student', group: 'G2' });
            const hasG1Students = g1Students > 0;
            const hasG2Students = g2Students > 0;
            const hasSplitStudents = hasG1Students || hasG2Students;
            
            const subjects = b.subjects || [];
            for (const sub of subjects) {
                // Guard against corrupted subject entries
                if (!sub || !sub.name) continue;
                
                // Mark lab subjects early — they need dedicated room types
                const typeLower = (sub.type || '').toLowerCase();
                const isLab = typeLower.includes('lab') || typeLower.includes('practical');
                
                // Each subgroup gets its own lab time so both groups get hands-on practice
                if (hasSplitStudents && isLab) {
                    if (hasG1Students) {
                        totalRequired += sub.weeklyHours;
                        masterTaskList.push({ 
                            batchName: b.name, 
                            parentBatch: b.name,
                            subGroup: 'G1',
                            studentCount: g1Students,
                            subjectName: sub.name, 
                            subjectCode: sub.code,
                            subjectType: sub.type || 'Theory',
                            remainingHours: sub.weeklyHours,
                            dept: b.department,
                            isLab: true
                        });
                    }
                    if (hasG2Students) {
                        totalRequired += sub.weeklyHours;
                        masterTaskList.push({ 
                            batchName: b.name, 
                            parentBatch: b.name,
                            subGroup: 'G2',
                            studentCount: g2Students,
                            subjectName: sub.name, 
                            subjectCode: sub.code,
                            subjectType: sub.type || 'Theory',
                            remainingHours: sub.weeklyHours,
                            dept: b.department,
                            isLab: true
                        });
                    }
                } else {
                    totalRequired += sub.weeklyHours;
                    masterTaskList.push({ 
                        batchName: b.name, 
                        parentBatch: b.name,
                        subGroup: '0',
                        studentCount: b.studentCount,
                        subjectName: sub.name, 
                        subjectCode: sub.code,
                        subjectType: sub.type || 'Theory',
                        remainingHours: sub.weeklyHours,
                        dept: b.department,
                        isLab: isLab
                    });
                }
            }
        }

        let baseSchedule = [];
        let baseAssigned = 0;
        const allTasks = JSON.parse(JSON.stringify(masterTaskList));
        
        const findSlot = (task, schedule, usedFacultyForSubject = {}) => {
            const subKey = `${task.batchName}|${task.subjectName}`;
            const usedForSub = usedFacultyForSubject[subKey] || [];
            
            for (let d = 0; d < days.length; d++) {
                const day = days[d];
                
                const sameDayCount = schedule.filter(s => 
                    s.day === day && s.batch === task.batchName && s.subject === task.subjectName
                ).length;
                if (sameDayCount >= 2) continue;
                
                for (let s = 0; s < timeSlots.length; s++) {
                    const slot = timeSlots[s];
                    
                    const isBlocked = blockedSlots.has(`${day}|${slot}`);
                    if (isBlocked) {
                        continue;
                    }
                    
                    const batchConflict = schedule.some(s => 
                        s.day === day && s.timeSlot === slot && s.batch === task.batchName
                    );
                    if (batchConflict) {
                        continue;
                    }
                    
                    let faculty = allFaculties.find(f => {
                        const hasExp = f.expertise && f.expertise.some(e => 
                            e.trim().toLowerCase() === task.subjectName.trim().toLowerCase()
                        );
                        const isFree = !schedule.some(s => 
                            s.day === day && s.timeSlot === slot && 
                            (s.facultyName === f.name || s.subject === task.subjectName)
                        );
                        return hasExp && isFree && !usedForSub.includes(f.name);
                    });
                    if (!faculty) {
                        faculty = allFaculties.find(f => {
                            const hasExp = f.expertise && f.expertise.some(e => 
                                e.trim().toLowerCase() === task.subjectName.trim().toLowerCase()
                            );
                            const isFree = !schedule.some(s => 
                                s.day === day && s.timeSlot === slot && 
                                (s.facultyName === f.name || s.subject === task.subjectName)
                            );
                            return hasExp && isFree;
                        });
                    }
                    if (!faculty) {
                        continue;
                    }
                    
                    const room = rooms.find(r => {
                        const isFree = !schedule.some(s => 
                            s.day === day && s.timeSlot === slot && s.room === r.roomNumber
                        );
                        if (task.isLab) {
                            const roomType = (r.type || '').toLowerCase();
                            return isFree && r.capacity >= task.studentCount && 
                                   (roomType.includes('lab') || roomType.includes('practical'));
                        }
                        return isFree && r.capacity >= task.studentCount;
                    });
                    if (!room) {
                        continue;
                    }
                    
                    return { day, slot, faculty, room };
                }
            }
            return null;
        };
        
        const usedFacultyForSubject = {};
        
        for (let task of allTasks) {
            let placed = 0;
            while (placed < task.remainingHours) {
                const found = findSlot(task, baseSchedule, usedFacultyForSubject);
                if (!found) {
                    break;
                }
                
                const subKey = `${task.batchName}|${task.subjectName}`;
                if (!usedFacultyForSubject[subKey]) usedFacultyForSubject[subKey] = [];
                usedFacultyForSubject[subKey].push(found.faculty.name);
                
                baseSchedule.push({
                    day: found.day, 
                    timeSlot: found.slot, 
                    subject: task.subjectName, 
                    subjectCode: task.subjectCode,
                    type: task.subjectType, 
                    facultyName: found.faculty.name, 
                    facultyUid: found.faculty.uid,
                    room: found.room.roomNumber, 
                    batch: task.batchName,
                    subGroup: task.subGroup, 
                    department: task.dept
                });
                placed++;
                baseAssigned++;
            }
        }

        const variants = [];
        const finalCount = baseSchedule.length;
        
        const variantConfigs = [
            { id: 1, label: 'Day-wise', sortKey: 'day' },
            { id: 2, label: 'Subject-wise', sortKey: 'subject' },
            { id: 3, label: 'Room-wise', sortKey: 'room' }
        ];
        
        for (let v = 1; v <= 3; v++) {
            let variantSchedule = [];
            const tasksCopy = JSON.parse(JSON.stringify(masterTaskList));
            const variantUsedFaculty = {};
            
            if (v === 1) {
            } else if (v === 2) {
                tasksCopy.reverse();
            } else {
                tasksCopy.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
            }
            
            for (let task of tasksCopy) {
                let placed = 0;
                while (placed < task.remainingHours) {
                    const found = findSlot(task, variantSchedule, variantUsedFaculty);
                    if (!found) break;
                    
                    const subKey = `${task.batchName}|${task.subjectName}`;
                    if (!variantUsedFaculty[subKey]) variantUsedFaculty[subKey] = [];
                    variantUsedFaculty[subKey].push(found.faculty.name);
                    
                    variantSchedule.push({
                        day: found.day, 
                        timeSlot: found.slot, 
                        subject: task.subjectName, 
                        subjectCode: task.subjectCode,
                        type: task.subjectType, 
                        facultyName: found.faculty.name, 
                        facultyUid: found.faculty.uid,
                        room: found.room.roomNumber, 
                        batch: task.batchName,
                        subGroup: task.subGroup, 
                        department: task.dept
                    });
                    placed++;
                }
            }
            
            variantSchedule.sort((a, b) => {
                const dayDiff = days.indexOf(a.day) - days.indexOf(b.day);
                if (dayDiff !== 0) return dayDiff;
                return timeSlots.indexOf(a.timeSlot) - timeSlots.indexOf(b.timeSlot);
            });
            
            variants.push({
                variantId: v,
                label: variantConfigs[v-1].label,
                utilizationScore: `100%`,
                schedule: variantSchedule,
                totalClasses: variantSchedule.length
            });
        }

        res.json({ success: true, variants });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
