/**
 * Script to sync employees from local JSON to MongoDB
 * This will add all employees to the employee department
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const departmentSchema = new mongoose.Schema({
    departmentId: String,
    departmentName: String,
    password: String,
    departmentType: String,
    employees: mongoose.Schema.Types.Mixed,
    createdAt: String
}, { collection: 'departments' });

const Department = mongoose.model('Department', departmentSchema);

async function syncEmployees() {
    try {
        console.log('Reading local employees.json...');
        const employeesPath = path.join(__dirname, '..', 'data', 'employees.json');
        const localEmployees = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));

        console.log('Local employees found: ' + Object.keys(localEmployees).length);
        console.log('Employee IDs:', Object.keys(localEmployees).sort().join(', '));

        console.log('\nConnecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!\n');

        // Check if employee department exists
        let empDept = await Department.findOne({ departmentType: 'employee' });

        if (!empDept) {
            console.log('Creating employee department...');
            empDept = new Department({
                departmentId: 'HON-EMP',
                departmentName: 'Employee Department',
                password: '$2b$10$L4PPkRN4FqeeYnIGxbtaueSaOzCI6kAhUFiVp.xeMo7YezJ7IdCVO',
                departmentType: 'employee',
                employees: {},
                createdAt: new Date().toISOString()
            });
            await empDept.save();
            console.log('Employee department created!');
        }

        console.log('\nCurrent department: ' + empDept.departmentName + ' (' + empDept.departmentId + ')');
        console.log('Current employees in MongoDB: ' + Object.keys(empDept.employees || {}).length);

        // Merge employees
        const mergedEmployees = { ...(empDept.employees || {}), ...localEmployees };

        console.log('\nUpdating with ' + Object.keys(mergedEmployees).length + ' employees...');

        // Update the department
        await Department.updateOne(
            { _id: empDept._id },
            { $set: { employees: mergedEmployees } }
        );

        console.log('Done! Employees synced successfully.\n');

        // Verify
        const updatedDept = await Department.findOne({ _id: empDept._id });
        console.log('Verification - Employees in MongoDB now: ' + Object.keys(updatedDept.employees || {}).length);

        Object.entries(updatedDept.employees || {}).forEach(([id, emp]) => {
            console.log('  ' + id + ': ' + emp.name);
        });

    } catch (error) {
        console.error('Error: ' + error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected.');
    }
}

syncEmployees();
