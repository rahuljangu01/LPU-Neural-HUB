const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@gmail.com';
        const adminPassword = 'Admin123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        let admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            admin = new User({
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                department: 'Administration'
            });
            await admin.save();
            console.log("✅ Admin seeded successfully.");
        }
    } catch (err) { console.error("Seeding Error:", err.message); }
};

const startServer = async () => {
    try {
        await connectDB(); 
        await seedAdmin();

        // API ROUTES
        app.use('/api/auth', require('./routes/authRoutes'));
        app.use('/api/rooms', require('./routes/roomRoutes'));
        app.use('/api/subjects', require('./routes/subjectRoutes'));
        app.use('/api/timetable', require('./routes/timetableRoutes'));
        app.use('/api/messages', require('./routes/messageRoutes'));
        app.use('/api/scheduler', require('./routes/schedulerRoutes'));
        app.use('/api/batches', require('./routes/batchRoutes'));

        app.get('/', (req, res) => res.send("🚀 LPU Sched AI Engine Online"));

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`🚀 AI ENGINE RUNNING ON PORT ${PORT}`));
    } catch (error) {
        console.error("🔥 CRITICAL ERROR:", error.message);
        process.exit(1);
    }
};

startServer();