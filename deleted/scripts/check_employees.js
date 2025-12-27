/**
 * Script to check all employees in MongoDB and save to file
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

const departmentSchema = new mongoose.Schema({
    departmentId: String,
    departmentName: String,
    password: String,
    departmentType: String,
    employees: mongoose.Schema.Types.Mixed,
    createdAt: String
}, { collection: 'departments' });

const Department = mongoose.model('Department', departmentSchema);

async function checkEmployees() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        log('Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI);
        log('Connected!\n');

        const departments = await Department.find({});
        log('Departments found: ' + departments.length);

        const allEmployees = [];

        for (const dept of departments) {
            log('\nDepartment: ' + dept.departmentName + ' (' + dept.departmentId + ')');
            log('Type: ' + dept.departmentType);

            if (dept.employees && Object.keys(dept.employees).length > 0) {
                const empIds = Object.keys(dept.employees);
                log('Employees in this dept: ' + empIds.length);

                for (const empId of empIds) {
                    const emp = dept.employees[empId];
                    log('  ' + empId + ': ' + (emp.name || 'No name'));
                    allEmployees.push({
                        id: empId,
                        name: emp.name || 'No name',
                        dept: dept.departmentName
                    });
                }
            } else {
                log('Employees in this dept: 0');
            }
        }

        log('\n========================================');
        log('TOTAL EMPLOYEES: ' + allEmployees.length);
        log('========================================\n');

        // Sort and display
        allEmployees.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

        log('ALL EMPLOYEES (sorted):');
        allEmployees.forEach((emp, i) => {
            log((i + 1) + '. ' + emp.id + ' - ' + emp.name);
        });

        log('\n--- CHECK HON-E001 to HON-E014 ---');
        const existingIds = allEmployees.map(e => e.id);
        const missing = [];
        const found = [];

        for (let i = 1; i <= 14; i++) {
            const id = 'HON-E' + String(i).padStart(3, '0');
            if (existingIds.includes(id)) {
                const emp = allEmployees.find(e => e.id === id);
                log('[OK] ' + id + ': ' + emp.name);
                found.push(id);
            } else {
                log('[MISSING] ' + id);
                missing.push(id);
            }
        }

        log('\n--- SUMMARY ---');
        log('Found: ' + found.length);
        log('Missing: ' + missing.length);
        if (missing.length > 0) {
            log('Missing IDs: ' + missing.join(', '));
        }

    } catch (error) {
        log('Error: ' + error.message);
    } finally {
        await mongoose.disconnect();
        log('\nDone.');

        // Save output to file
        fs.writeFileSync('employee_check_result.txt', output, 'utf8');
        console.log('\nOutput saved to employee_check_result.txt');
    }
}

checkEmployees();
