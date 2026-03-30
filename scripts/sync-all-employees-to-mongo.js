/**
 * One-time sync script for copying every employee from data/employees.json
 * into the MongoDB employee department record.
 *
 * Run:
 *   npm run sync:employees
 */

require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');

const dataAccess = require('../dataAccess');
const { connectDatabase } = require('../database');
const { readJSON } = require('../utils/fileHelpers');

const EMPLOYEES_FILE = path.join(__dirname, '../data/employees.json');
const EMPLOYEE_DEPARTMENT_ID = 'HON-EMP';

async function syncAllEmployeesToMongo() {
    console.log('Starting employee sync to MongoDB...');

    const employees = readJSON(EMPLOYEES_FILE, {});
    const employeeIds = Object.keys(employees);

    if (employeeIds.length === 0) {
        throw new Error('No employees found in data/employees.json');
    }

    console.log(`Found ${employeeIds.length} employees in JSON source`);

    const connected = await connectDatabase();
    if (!connected || !dataAccess.getMongoStatus()) {
        throw new Error('MongoDB connection failed. Check MONGODB_URI and database access.');
    }

    let employeeDept = await dataAccess.getDepartment(EMPLOYEE_DEPARTMENT_ID);
    if (!employeeDept) {
        const allDepartments = await dataAccess.getAllDepartments();
        employeeDept = allDepartments.find((department) => department.departmentType === 'employee') || null;
    }

    if (!employeeDept) {
        const seedEmployee = employees[employeeIds[0]];
        console.log(`Employee department not found. Creating ${EMPLOYEE_DEPARTMENT_ID}...`);
        await dataAccess.createDepartment(
            EMPLOYEE_DEPARTMENT_ID,
            'Employee Department',
            seedEmployee.password || 'SYNC_ONLY',
            'employee'
        );
        employeeDept = await dataAccess.getDepartment(EMPLOYEE_DEPARTMENT_ID);
    }

    if (!employeeDept) {
        throw new Error('Employee department could not be created or loaded.');
    }

    const previousCount = Object.keys(employeeDept.employees || {}).length;
    await dataAccess.updateDepartment(employeeDept.departmentId, { employees });

    const updatedDept = await dataAccess.getDepartment(employeeDept.departmentId);
    const syncedEmployees = updatedDept?.employees || {};
    const syncedCount = Object.keys(syncedEmployees).length;
    const missingIds = employeeIds.filter((employeeId) => !syncedEmployees[employeeId]);

    const employeesCollection = mongoose.connection.collection('employees');
    const bulkOperations = employeeIds.map((employeeId) => ({
        updateOne: {
            filter: { employeeId },
            update: {
                $set: {
                    employeeId,
                    name: employees[employeeId].name,
                    password: employees[employeeId].password,
                    createdAt: employees[employeeId].createdAt || new Date().toISOString()
                }
            },
            upsert: true
        }
    }));

    const bulkResult = await employeesCollection.bulkWrite(bulkOperations, { ordered: false });
    const mongoEmployeesCount = await employeesCollection.countDocuments({});

    console.log('----------------------------------------');
    console.log(`Department: ${employeeDept.departmentId}`);
    console.log(`Before sync: ${previousCount} employees`);
    console.log(`After sync: ${syncedCount} employees`);
    console.log(`Source count: ${employeeIds.length} employees`);
    console.log(`Employees collection count: ${mongoEmployeesCount}`);
    console.log(`Employees collection upserts: ${bulkResult.upsertedCount || 0}`);
    console.log(`Employees collection modified: ${bulkResult.modifiedCount || 0}`);
    if (missingIds.length > 0) {
        console.log(`Missing after sync: ${missingIds.join(', ')}`);
    } else {
        console.log('All employees synced successfully.');
    }
    console.log('----------------------------------------');
}

syncAllEmployeesToMongo()
    .then(async () => {
        await mongoose.connection.close();
        process.exit(0);
    })
    .catch(async (error) => {
        console.error('Employee sync failed:', error.message);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(1);
    });
