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
        lowercase: true // Taaki 'Faculty' aur 'faculty' ka locha na ho
    },
    department: { 
        type: String, 
        required: true // Har user kisi dept ka hona chahiye (MCA, CSE, etc.)
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

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);