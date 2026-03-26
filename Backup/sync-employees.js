// sync-employees.js - Run this once to sync employees to MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const newEmployees = {
    "HON-E015": {
        "name": "Neha Shivani",
        "password": "$2b$10$L4PPkRN4FqeeYnIGxbtaueSaOzCI6kAhUFiVp.xeMo7YezJ7IdCVO",
        "createdAt": "2025-12-31T08:45:00.000Z"
    },
    "HON-E016": {
        "name": "Geeta",
        "password": "$2b$10$L4PPkRN4FqeeYnIGxbtaueSaOzCI6kAhUFiVp.xeMo7YezJ7IdCVO",
        "createdAt": "2025-12-31T08:45:00.000Z"
    }
};

async function syncEmployees() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected!');

        const db = mongoose.connection.db;
        const deptCollection = db.collection('departments');

        // Find employee department
        const empDept = await deptCollection.findOne({
            $or: [
                { departmentType: 'employee' },
                { departmentId: 'HON-EMP' }
            ]
        });

        if (!empDept) {
            console.log('❌ Employee department not found!');
            process.exit(1);
        }

        console.log(`📁 Found department: ${empDept.departmentId}`);
        console.log(`   Current employees: ${Object.keys(empDept.employees || {}).length}`);

        // Merge new employees
        const updatedEmployees = { ...empDept.employees, ...newEmployees };

        // Update in database
        await deptCollection.updateOne(
            { _id: empDept._id },
            { $set: { employees: updatedEmployees } }
        );

        console.log(`✅ Updated! Total employees now: ${Object.keys(updatedEmployees).length}`);
        console.log('   Added: HON-E015 (Neha Shivani), HON-E016 (Geeta)');

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

syncEmployees();
