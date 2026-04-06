const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['admin', 'hod', 'faculty', 'student'], 
        required: true,
        lowercase: true
    },
    department: { 
        type: String, 
        required: true
    },
    verified: { 
        type: Boolean, 
        default: false // HOD accounts need admin verification
    },
    uid: { 
        type: String, 
        unique: true,
        required: true
    },

    // --- FACULTY / HOD PARAMETERS (AI Engine ke liye) ---
    maxWorkload: { 
        type: Number, 
        default: 18 // Haftay mein max kitne ghante padha sakte hain
    },
    avgLeaves: { 
        type: Number, 
        default: 2 // Monthly average leaves (AI buffer calculation ke liye)
    },
    expertise: [{ 
        type: String // Subjects jo ye faculty padha sakti hai (AI Matching)
    }],

    // --- STUDENT PARAMETERS ---
    batch: { 
        type: String, 
        default: '' // MCA-1, BTech-3 etc. (Student isi batch ka timetable dekhega)
    },
    electiveBatch: { 
        type: String, 
        default: '' // Elective batch name for elective subjects
    },
    rollNo: { type: Number, default: 0 },
    group: { type: String, enum: ['G1', 'G2', 'N/A'], default: 'N/A' },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);