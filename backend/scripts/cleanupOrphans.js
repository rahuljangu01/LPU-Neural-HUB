const mongoose = require('mongoose');

const cleanupOrphans = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    
    const User = mongoose.model('User', require('../models/User').schema);
    const Batch = mongoose.model('Batch', require('../models/Batch').schema);
    
    const allBatches = await Batch.find().lean();
    const batchNames = allBatches.map(b => b.name);
    
    // Clear students whose batch no longer exists
    const result1 = await User.updateMany(
        { batch: { $nin: batchNames }, batch: { $ne: '' } },
        { $set: { batch: '', rollNo: 0, group: 'N/A' } }
    );
    
    // Clear students whose electiveBatch no longer exists
    const result2 = await User.updateMany(
        { electiveBatch: { $nin: batchNames }, electiveBatch: { $ne: '' } },
        { $set: { electiveBatch: '' } }
    );
    
    console.log(`Cleaned ${result1.modifiedCount} regular batch orphans`);
    console.log(`Cleaned ${result2.modifiedCount} elective batch orphans`);
    
    await mongoose.disconnect();
};

cleanupOrphans().catch(console.error);
