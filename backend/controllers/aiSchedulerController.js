const Room = require('../models/Room');
const User = require('../models/User');
const Batch = require('../models/Batch');

exports.generateAITimetable = async (req, res) => {
    try {
        // Naya: fixedSlots ko request body se liya
        const { maxLoad, batchId, fixedSlots } = req.body; 
        
        // 1. Data Fetching
        const rooms = await Room.find();
        const allFaculties = await User.find({ 
            role: { $in: ['faculty', 'hod'] },
            name: { $nin: ['teacher', 'TEACHER', 'Teacher', ''] } 
        });
        
        let batchQuery = (batchId && batchId !== 'all') ? { _id: batchId } : {};
        const batches = await Batch.find(batchQuery).populate('subjects');

        if (!batches || batches.length === 0) {
            return res.status(400).json({ msg: "No batches found." });
        }

        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const timeSlots = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "01:00 - 02:00", "02:00 - 03:00", "03:00 - 04:00"];

        let variants = [];

        // 2. Generating 3 Variants
        for (let v = 1; v <= 3; v++) {
            let optimizedSchedule = [];
            let totalAssigned = 0;
            let totalRequired = 0;
            
            // Task List creation
            let variantTaskList = [];
            batches.forEach(b => {
                b.subjects.forEach(sub => {
                    totalRequired += sub.weeklyHours;
                    variantTaskList.push({ 
                        batchName: b.name, 
                        studentCount: b.studentCount,
                        subjectName: sub.name, 
                        subjectType: sub.type || 'Theory',
                        remainingHours: sub.weeklyHours,
                        dept: b.department
                    });
                });
            });

            // Deep copy of task list for each variant
            let currentVariantTasks = JSON.parse(JSON.stringify(variantTaskList));
            const shuffledFaculties = [...allFaculties].sort(() => Math.random() - 0.5);
            const shuffledRooms = [...rooms].sort(() => Math.random() - 0.5);

            // ==========================================
            // 🚀 PHASE 0: FIXED SLOTS ASSIGNMENT (Priority)
            // ==========================================
            if (fixedSlots && Object.keys(fixedSlots).length > 0) {
                for (let task of currentVariantTasks) {
                    const targetSlot = fixedSlots[task.subjectName];
                    
                    // Agar is subject ke liye koi time fix kiya gaya hai
                    if (targetSlot && targetSlot !== "none") {
                        // Fixed slot ko har din check karo jab tak hours bache hain
                        for (let day of days) {
                            if (task.remainingHours <= 0) break;

                            // Check 1: Batch free hai?
                            const isBatchBusy = optimizedSchedule.some(s => s.day === day && s.timeSlot === targetSlot && s.batch === task.batchName);
                            if (isBatchBusy) continue;

                            // Check 2: Faculty free hai aur available hai?
                            const faculty = shuffledFaculties.find(f => {
                                const hasExp = f.expertise && f.expertise.some(e => e.trim().toLowerCase() === task.subjectName.trim().toLowerCase());
                                const isFree = !optimizedSchedule.some(s => s.day === day && s.timeSlot === targetSlot && s.facultyName === f.name);
                                return hasExp && isFree;
                            });
                            if (!faculty) continue;

                            // Check 3: Room free hai aur capacity sahi hai?
                            const roomNode = shuffledRooms.find(r => {
                                const typeMatch = r.type.toLowerCase().trim().includes(task.subjectType.toLowerCase().trim());
                                const isFree = !optimizedSchedule.some(s => s.day === day && s.timeSlot === targetSlot && s.room === r.roomNumber);
                                const capacityMatch = r.capacity >= task.studentCount;
                                return typeMatch && isFree && capacityMatch;
                            });
                            if (!roomNode) continue;

                            // Success: Fixed slot allot kar diya
                            optimizedSchedule.push({
                                day, timeSlot: targetSlot,
                                subject: task.subjectName,
                                facultyName: faculty.name,
                                room: roomNode.roomNumber,
                                batch: task.batchName,
                                department: task.dept
                            });
                            task.remainingHours--;
                            totalAssigned++;
                        }
                    }
                }
            }

            // ==========================================
            // 🚀 PHASE 1: NORMAL AI LOOP (Remaining Hours)
            // ==========================================
            for (let task of currentVariantTasks) {
                let attempts = 0; 
                
                while (task.remainingHours > 0 && attempts < 300) {
                    let placed = false;
                    attempts++;

                    const currentShuffledDays = [...days].sort(() => Math.random() - 0.5);
                    const currentShuffledSlots = [...timeSlots].sort(() => Math.random() - 0.5);

                    for (let day of currentShuffledDays) {
                        if (placed) break;

                        let dynamicMaxLoad = Number(maxLoad) || 6;
                        if (attempts > 100) dynamicMaxLoad += 1; 

                        const batchDayLoad = optimizedSchedule.filter(s => s.day === day && s.batch === task.batchName).length;
                        if (batchDayLoad >= dynamicMaxLoad) continue;

                        const isLab = task.subjectType.toLowerCase().includes('lab');
                        let maxSubjectPerDay = isLab ? 2 : 1; 
                        if (attempts > 100) maxSubjectPerDay = 3;             

                        const subjectDayLoad = optimizedSchedule.filter(s => s.day === day && s.batch === task.batchName && s.subject === task.subjectName).length;
                        if (subjectDayLoad >= maxSubjectPerDay) continue;

                        for (let slot of currentShuffledSlots) {
                            if (placed) break;

                            // Overlap check
                            const isSlotBusy = optimizedSchedule.some(s => s.day === day && s.timeSlot === slot && s.batch === task.batchName);
                            if (isSlotBusy) continue;

                            const faculty = shuffledFaculties.find(f => {
                                const hasExp = f.expertise && f.expertise.some(e => e.trim().toLowerCase() === task.subjectName.trim().toLowerCase());
                                const isFree = !optimizedSchedule.some(s => s.day === day && s.timeSlot === slot && s.facultyName === f.name);
                                let effectiveMaxLoad = f.maxWorkload || 30;
                                const currentFacultyLoad = optimizedSchedule.filter(s => s.facultyName === f.name).length;
                                return hasExp && isFree && (currentFacultyLoad < effectiveMaxLoad);
                            });

                            if (!faculty) continue;

                            const roomNode = shuffledRooms.find(r => {
                                const typeMatch = attempts > 150 ? true : r.type.toLowerCase().trim().includes(task.subjectType.toLowerCase().trim());
                                const isFree = !optimizedSchedule.some(s => s.day === day && s.timeSlot === slot && s.room === r.roomNumber);
                                const capacityMatch = r.capacity >= task.studentCount;
                                return typeMatch && isFree && capacityMatch;
                            });

                            if (roomNode) {
                                optimizedSchedule.push({
                                    day, timeSlot: slot,
                                    subject: task.subjectName,
                                    facultyName: faculty.name,
                                    room: roomNode.roomNumber,
                                    batch: task.batchName,
                                    department: task.dept
                                });
                                task.remainingHours--;
                                totalAssigned++;
                                placed = true;
                            }
                        }
                    }
                }
            }

            // Score and Variant creation
            const score = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0;
            optimizedSchedule.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day));

            variants.push({
                variantId: v,
                utilizationScore: `${score}%`,
                schedule: optimizedSchedule
            });
        }
        res.json({ success: true, variants });
    } catch (err) {
        console.error("Critical AI Engine Error: ", err.message);
        res.status(500).json({ error: err.message });
    }
};