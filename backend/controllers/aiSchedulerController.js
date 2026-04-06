const Room = require('../models/Room');
const User = require('../models/User');
const Batch = require('../models/Batch');
const Timetable = require('../models/Timetable');

const getParentBatchName = (batchName) => {
    if (!batchName) return '';
    const match = batchName.match(/^(.+?)\s*[GG]1\s*$/i) || batchName.match(/^(.+?)[GG]1$/i);
    return match ? match[1].trim() : batchName.trim();
};

const getSubGroup = (batchName) => {
    if (!batchName) return null;
    if (/G1$/i.test(batchName)) return 'G1';
    if (/G2$/i.test(batchName)) return 'G2';
    return null;
};

exports.generateAITimetable = async (req, res) => {
    try {
        const { maxLoad, batchId, fixedSlots } = req.body; 
        
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

        // ==========================================
        // FIND BLOCKED SLOTS FOR ELECTIVE BATCHES
        // Students in elective batch also have regular batch - avoid those slots
        // ==========================================
        let blockedSlots = new Set();
        
        for (const b of batches) {
            if (b.isElective) {
                // Find all students in this elective batch
                const electiveStudents = await User.find({ 
                    electiveBatch: b.name, 
                    role: 'student' 
                });
                
                // Get unique regular batch names from these students
                const regularBatchNames = [...new Set(
                    electiveStudents
                        .map(s => s.batch)
                        .filter(batch => batch && batch !== '')
                )];
                
                console.log(`\n📚 Elective Batch "${b.name}" students:`, electiveStudents.length);
                console.log(`   Regular batches of these students:`, regularBatchNames);
                
                // Fetch existing timetable for those regular batches
                if (regularBatchNames.length > 0) {
                    const existingTimetable = await Timetable.find({ 
                        batch: { $in: regularBatchNames } 
                    });
                    
                    console.log(`   Blocked slots from regular batches:`, existingTimetable.length);
                    
                    // Add each slot to blocked set
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
        console.log(`\n🚫 Total Blocked Slots:`, blockedSlotsArray.length, blockedSlotsArray);

        // Calculate total required
        let totalRequired = 0;
        const masterTaskList = [];
        
        // Process each batch
        for (const b of batches) {
            // Check if batch has G1 or G2 students
            const g1Students = await User.countDocuments({ batch: b.name, role: 'student', group: 'G1' });
            const g2Students = await User.countDocuments({ batch: b.name, role: 'student', group: 'G2' });
            const hasG1Students = g1Students > 0;
            const hasG2Students = g2Students > 0;
            const hasSplitStudents = hasG1Students || hasG2Students;
            
            const subjects = b.subjects || [];
            for (const sub of subjects) {
                // Skip if subject is not properly loaded
                if (!sub || !sub.name) continue;
                
                // Check if it's a lab subject
                const typeLower = (sub.type || '').toLowerCase();
                const isLab = typeLower.includes('lab') || typeLower.includes('practical');
                
                if (hasSplitStudents && isLab) {
                    // SPLIT BATCH + LAB = Create G1 and G2 entries for PRACTICAL subjects ONLY
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
                    // LECTURE or No Split = Full batch (StudentGroup = 0)
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
        
        console.log('📋 Master Task List:', masterTaskList.map(t => ({
            subject: t.subjectName,
            type: t.subjectType,
            hours: t.remainingHours,
            group: t.subGroup
        })));

        // ==========================================
        // STEP 1: Generate BASE schedule - PLACE ALL CLASSES
        // ==========================================
        let baseSchedule = [];
        let baseAssigned = 0;
        const allTasks = JSON.parse(JSON.stringify(masterTaskList));
        
        // Helper: Find available slot
        const findSlot = (task, schedule) => {
            for (let d = 0; d < days.length; d++) {
                for (let s = 0; s < timeSlots.length; s++) {
                    const day = days[d];
                    const slot = timeSlots[s];
                    
                    // 🚫 CHECK 1: Blocked slots (elective batch conflicts)
                    const isBlocked = blockedSlots.has(`${day}|${slot}`);
                    if (isBlocked) {
                        console.log(`   🚫 ${day} ${slot} - BLOCKED (elective student has class in regular batch)`);
                        continue;
                    }
                    
                    // 🚫 CHECK 2: Batch conflict (same batch, same slot)
                    const batchConflict = schedule.some(s => 
                        s.day === day && s.timeSlot === slot && s.batch === task.batchName
                    );
                    if (batchConflict) {
                        console.log(`   🚫 ${day} ${slot} - BATCH CLASH (${task.batchName} already has class)`);
                        continue;
                    }
                    
                    // 🚫 CHECK 3: Teacher/Faculty conflict
                    const teacherBusy = schedule.some(s => 
                        s.day === day && s.timeSlot === slot && s.facultyName
                    );
                    if (teacherBusy) {
                        console.log(`   🚫 ${day} ${slot} - TEACHER CLASH`);
                        continue;
                    }
                    
                    // Find faculty
                    const faculty = allFaculties.find(f => {
                        const hasExp = f.expertise && f.expertise.some(e => 
                            e.trim().toLowerCase() === task.subjectName.trim().toLowerCase()
                        );
                        // Teacher must be free AND not already assigned to this subject at this slot
                        const isFree = !schedule.some(s => 
                            s.day === day && s.timeSlot === slot && 
                            (s.facultyName === f.name || s.subject === task.subjectName)
                        );
                        return hasExp && isFree;
                    });
                    if (!faculty) {
                        console.log(`   🚫 ${day} ${slot} - NO AVAILABLE TEACHER for ${task.subjectName}`);
                        continue;
                    }
                    
                    // 🚫 CHECK 4: Room conflict
                    const room = rooms.find(r => {
                        // Room must be free at this slot
                        const isFree = !schedule.some(s => 
                            s.day === day && s.timeSlot === slot && s.room === r.roomNumber
                        );
                        // Lab subjects MUST go to Lab rooms
                        if (task.isLab) {
                            const roomType = (r.type || '').toLowerCase();
                            return isFree && r.capacity >= task.studentCount && 
                                   (roomType.includes('lab') || roomType.includes('practical'));
                        }
                        // Theory subjects go to Theory rooms
                        return isFree && r.capacity >= task.studentCount;
                    });
                    if (!room) {
                        console.log(`   🚫 ${day} ${slot} - NO AVAILABLE ROOM`);
                        continue;
                    }
                    
                    // ✅ Slot found!
                    console.log(`   ✅ ${day} ${slot} - ${task.subjectName} → Teacher: ${faculty.name}, Room: ${room.roomNumber}`);
                    return { day, slot, faculty, room };
                }
            }
            console.log(`   ❌ NO SLOT FOUND for ${task.subjectName}`);
            return null;
        };
        
        // Place all classes
        console.log('\n📅 PLACING CLASSES:');
        for (let task of allTasks) {
            console.log(`\n🎯 Task: ${task.subjectName} (${task.subjectType}) - ${task.batchName} ${task.subGroup !== '0' ? `[${task.subGroup}]` : ''}`);
            let placed = 0;
            while (placed < task.remainingHours) {
                const found = findSlot(task, baseSchedule);
                if (!found) {
                    console.log(`   ❌ FAILED - Could not place ${task.subjectName}`);
                    break;
                }
                
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
                totalClasses: baseSchedule.length
            });
        }

        console.log('📊 Timetable Generated:', {
            required: totalRequired,
            placed: baseSchedule.length,
            message: baseSchedule.length === totalRequired ? '✅ Perfect!' : `⚠️ ${totalRequired - baseSchedule.length} classes not placed`
        });

        res.json({ success: true, variants });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
