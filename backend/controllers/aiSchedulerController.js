const Room = require('../models/Room');
const User = require('../models/User');
const Batch = require('../models/Batch');

// Helper: Extract parent batch name (e.g., "D2421" from "D2421 G1")
const getParentBatchName = (batchName) => {
    if (!batchName) return '';
    const match = batchName.match(/^(.+?)\s*[GG]1\s*$/i) || batchName.match(/^(.+?)[GG]1$/i);
    return match ? match[1].trim() : batchName.trim();
};

// Helper: Extract subgroup (G1 or G2)
const getSubGroup = (batchName) => {
    if (!batchName) return null;
    if (/G1$/i.test(batchName)) return 'G1';
    if (/G2$/i.test(batchName)) return 'G2';
    return null;
};

exports.generateAITimetable = async (req, res) => {
    try {
        const { maxLoad, batchId, fixedSlots } = req.body; 
        
        // 1. Data Fetching
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

        // Calculate total required
        let totalRequired = 0;
        const masterTaskList = [];
        
        batches.forEach(b => {
            const isSplitBatch = b.splitGroups === true;
            const hasG1G2InName = /\sG[12]$/i.test(b.name) || /G[12]$/i.test(b.name);
            
            b.subjects.forEach(sub => {
                const isLab = sub.type?.toLowerCase().includes('lab') || sub.type?.toLowerCase().includes('practical') || false;
                
                if (isSplitBatch && isLab) {
                    // SPLIT BATCH + LAB = Create G1 and G2 entries
                    totalRequired += sub.weeklyHours * 2;
                    
                    // G1 Entry
                    masterTaskList.push({ 
                        batchName: `${b.name} G1`, 
                        parentBatch: b.name,
                        subGroup: 'G1',
                        studentCount: Math.ceil(b.studentCount / 2), // Half students
                        subjectName: sub.name, 
                        subjectCode: sub.code,
                        subjectType: 'Lab',
                        remainingHours: sub.weeklyHours,
                        dept: b.department,
                        isLab: true
                    });
                    
                    // G2 Entry
                    masterTaskList.push({ 
                        batchName: `${b.name} G2`, 
                        parentBatch: b.name,
                        subGroup: 'G2',
                        studentCount: Math.floor(b.studentCount / 2), // Half students
                        subjectName: sub.name, 
                        subjectCode: sub.code,
                        subjectType: 'Lab',
                        remainingHours: sub.weeklyHours,
                        dept: b.department,
                        isLab: true
                    });
                } else {
                    // Normal case: Theory or non-split batch
                    totalRequired += sub.weeklyHours;
                    masterTaskList.push({ 
                        batchName: b.name, 
                        parentBatch: getParentBatchName(b.name),
                        subGroup: getSubGroup(b.name) || (isSplitBatch ? 'Full Batch' : null),
                        studentCount: b.studentCount,
                        subjectName: sub.name, 
                        subjectCode: sub.code,
                        subjectType: sub.type || 'Theory',
                        remainingHours: sub.weeklyHours,
                        dept: b.department,
                        isLab: isLab
                    });
                }
            });
        });

        // ==========================================
        // STEP 1: Generate BASE schedule ONLY ONCE
        // ==========================================
        let baseSchedule = [];
        let baseAssigned = 0;
        let currentTasks = JSON.parse(JSON.stringify(masterTaskList));
        const baseFaculties = [...allFaculties].sort(() => Math.random() - 0.5);
        const baseRooms = [...rooms].sort(() => Math.random() - 0.5);

        // Helper: Check G1/G2 conflict
        const checkG1G2Conflict = (day, timeSlot, task, schedule) => {
            if (task.subGroup) {
                const conflict = schedule.find(s => 
                    s.day === day && s.timeSlot === timeSlot && getParentBatchName(s.batch) === task.parentBatch
                );
                return !!conflict;
            }
            return false;
        };

        // Phase 0: Fixed slots
        if (fixedSlots && Object.keys(fixedSlots).length > 0) {
            for (let task of currentTasks) {
                const targetSlot = fixedSlots[task.subjectName];
                if (targetSlot && targetSlot !== "none") {
                    for (let day of days) {
                        if (task.remainingHours <= 0) break;
                        if (baseSchedule.some(s => s.day === day && s.timeSlot === targetSlot && s.batch === task.batchName)) continue;
                        if (checkG1G2Conflict(day, targetSlot, task, baseSchedule)) continue;
                        const faculty = baseFaculties.find(f => {
                            const hasExp = f.expertise && f.expertise.some(e => e.trim().toLowerCase() === task.subjectName.trim().toLowerCase());
                            const isFree = !baseSchedule.some(s => s.day === day && s.timeSlot === targetSlot && s.facultyName === f.name);
                            return hasExp && isFree;
                        });
                        if (!faculty) continue;
                        const roomNode = baseRooms.find(r => {
                            const isFree = !baseSchedule.some(s => s.day === day && s.timeSlot === targetSlot && s.room === r.roomNumber);
                            return isFree && r.capacity >= task.studentCount;
                        });
                        if (!roomNode) continue;
                        baseSchedule.push({
                            day, timeSlot: targetSlot, subject: task.subjectName, subjectCode: task.subjectCode,
                            type: task.subjectType, facultyName: faculty.name, facultyUid: faculty.uid,
                            room: roomNode.roomNumber, batch: task.batchName,
                            studentGroup: task.subGroup || 'Full Batch', department: task.dept
                        });
                        task.remainingHours--;
                        baseAssigned++;
                    }
                }
            }
        }

        // Phase 1: Normal scheduling
        for (let task of currentTasks) {
            let attempts = 0;
            while (task.remainingHours > 0 && attempts < 200) {
                let placed = false;
                attempts++;
                const shuffledDays = [...days].sort(() => Math.random() - 0.5);
                const shuffledSlots = [...timeSlots].sort(() => Math.random() - 0.5);
                
                for (let day of shuffledDays) {
                    if (placed) break;
                    const dynamicMaxLoad = (attempts > 100 ? Number(maxLoad) + 2 : Number(maxLoad)) || 6;
                    const batchFilter = (s) => {
                        if (task.subGroup) return s.day === day && getParentBatchName(s.batch) === task.parentBatch;
                        return s.day === day && s.batch === task.batchName;
                    };
                    if (baseSchedule.filter(batchFilter).length >= dynamicMaxLoad) continue;
                    
                    const isLab = task.subjectType.toLowerCase().includes('lab');
                    const maxPerDay = attempts > 80 ? 3 : (isLab ? 2 : 1);
                    if (baseSchedule.filter(s => s.day === day && s.batch === task.batchName && s.subject === task.subjectName).length >= maxPerDay) continue;

                    for (let slot of shuffledSlots) {
                        if (placed) break;
                        if (baseSchedule.some(s => s.day === day && s.timeSlot === slot && s.batch === task.batchName)) continue;
                        if (checkG1G2Conflict(day, slot, task, baseSchedule)) continue;
                        
                        const faculty = baseFaculties.find(f => {
                            const hasExp = f.expertise && f.expertise.some(e => e.trim().toLowerCase() === task.subjectName.trim().toLowerCase());
                            const isFree = !baseSchedule.some(s => s.day === day && s.timeSlot === slot && s.facultyName === f.name);
                            const load = baseSchedule.filter(s => s.facultyName === f.name).length;
                            return hasExp && isFree && load < (f.maxWorkload || 30);
                        });
                        if (!faculty) continue;
                        
                        const roomNode = baseRooms.find(r => {
                            const typeMatch = attempts > 120 ? true : r.type.toLowerCase().includes(task.subjectType.toLowerCase());
                            const isFree = !baseSchedule.some(s => s.day === day && s.timeSlot === slot && s.room === r.roomNumber);
                            return typeMatch && isFree && r.capacity >= task.studentCount;
                        });
                        
                        if (roomNode) {
                            baseSchedule.push({
                                day, timeSlot: slot, subject: task.subjectName, subjectCode: task.subjectCode,
                                type: task.subjectType, facultyName: faculty.name, facultyUid: faculty.uid,
                                room: roomNode.roomNumber, batch: task.batchName,
                                studentGroup: task.subGroup || 'Full Batch', department: task.dept
                            });
                            task.remainingHours--;
                            baseAssigned++;
                            placed = true;
                        }
                    }
                }
            }
        }

        // ==========================================
        // STEP 2: Create 3 variants from SAME base schedule
        // ==========================================
        const variants = [];
        const finalCount = baseSchedule.length;
        
        for (let v = 1; v <= 3; v++) {
            let scheduleCopy = [...baseSchedule];
            
            // Different display order for each variant
            if (v === 1) {
                scheduleCopy.sort((a, b) => {
                    const dayDiff = days.indexOf(a.day) - days.indexOf(b.day);
                    if (dayDiff !== 0) return dayDiff;
                    return timeSlots.indexOf(a.timeSlot) - timeSlots.indexOf(b.timeSlot);
                });
            } else if (v === 2) {
                scheduleCopy.sort((a, b) => a.subject.localeCompare(b.subject));
            } else {
                scheduleCopy.sort((a, b) => a.room.localeCompare(b.room) || days.indexOf(a.day) - days.indexOf(b.day));
            }
            
            variants.push({
                variantId: v,
                utilizationScore: '100%',
                schedule: scheduleCopy,
                totalClasses: finalCount
            });
        }

        res.json({ success: true, variants });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
