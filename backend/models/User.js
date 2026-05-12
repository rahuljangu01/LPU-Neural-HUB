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
        default: false // HOD accounts require admin approval
    },
    uid: { 
        type: String, 
        unique: true,
        required: true
    },

    // Faculty / HOD parameters for AI scheduling
    maxWorkload: { 
        type: Number, 
        default: 18 // Max teaching hours per week
    },
    avgLeaves: { 
        type: Number, 
        default: 2 // Monthly average leaves for AI buffer calculation
    },
    expertise: [{ 
        type: String // Subjects this faculty can teach (used for AI matching)
    }],

    // Student parameters
    batch: { 
        type: String, 
        default: '' // e.g., MCA-1, BTech-3 - determines which timetable the student sees
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
