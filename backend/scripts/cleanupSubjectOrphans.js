require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model('User', require('../models/User').schema);
    const Subject = mongoose.model('Subject', require('../models/Subject').schema);
    
    const allSubjects = await Subject.find().lean();
    const subjectNames = allSubjects.map(s => s.name);
    console.log('Existing subjects:', subjectNames);
    
    const allUsers = await User.find({ expertise: { $exists: true, $ne: [] } }).lean();
    let cleaned = 0;
    for (const u of allUsers) {
        const original = u.expertise;
        const filtered = u.expertise.filter(s => subjectNames.includes(s));
        if (filtered.length !== original.length) {
            await User.findByIdAndUpdate(u._id, { $set: { expertise: filtered } });
            cleaned++;
            console.log(`${u.name} had [${original.filter(s => !subjectNames.includes(s)).join(', ')}] removed`);
        }
    }
    console.log(`Cleaned ${cleaned} teachers`);
    await mongoose.disconnect();
};

run().catch(console.error);
