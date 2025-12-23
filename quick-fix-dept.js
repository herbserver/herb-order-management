// Quick fix for HON-D002
const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        const Department = mongoose.model('Department');

        const result = await Department.updateOne(
            { deptId: 'HON-D002' },
            { $set: { type: 'delivery' } }
        );

        console.log('Update result:', result);

        // Verify
        const dept = await Department.findOne({ deptId: 'HON-D002' });
        console.log('\n✅ Updated department:');
        console.log('   ID:', dept.deptId);
        console.log('   Name:', dept.name);
        console.log('   Type:', dept.type);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

fix();
