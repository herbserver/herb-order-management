require('dotenv').config();
const mongoose = require('mongoose');
const { Department } = require('../models');
const bcrypt = require('bcrypt');

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        const hashedPassword = await bcrypt.hash('123456', 10);
        
        console.log('Updating password for HON-V001...');
        const vUpdate = await Department.findOneAndUpdate(
            { departmentId: 'HON-V001' },
            { $set: { password: hashedPassword } },
            { new: true }
        );
        console.log('Updated verification dept password:', vUpdate ? 'Success' : 'Failed');

        console.log('Updating password for HON-D001...');
        const dUpdate = await Department.findOneAndUpdate(
            { departmentId: 'HON-D001' },
            { $set: { password: hashedPassword } },
            { new: true }
        );
        console.log('Updated dispatch dept password:', dUpdate ? 'Success' : 'Failed');

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

main();
