// MongoDB Database Helper Functions
require('dotenv').config();
const fs = require('fs').promises;
const mongoose = require('mongoose');
const path = require('path');
const { Order, Department, Employee, ShiprocketConfig, PincodeEntry } = require('./models');
const dataAccess = require('./dataAccess');

const EMPLOYEES_FILE = path.join(__dirname, 'data', 'employees.json');
const PINCODES_FILE = path.join(__dirname, 'public', 'data', 'pincodes.json');

async function seedEmployeesFromJson() {
    try {
        const raw = await fs.readFile(EMPLOYEES_FILE, 'utf8');
        const employees = JSON.parse(raw);
        const employeeIds = Object.keys(employees || {});

        if (employeeIds.length === 0) {
            return 0;
        }

        const operations = employeeIds.map((employeeId) => ({
            updateOne: {
                filter: { employeeId },
                update: {
                    $setOnInsert: {
                        employeeId,
                        name: employees[employeeId].name || employeeId,
                        password: employees[employeeId].password || '',
                        createdAt: employees[employeeId].createdAt || new Date().toISOString()
                    }
                },
                upsert: true
            }
        }));

        const result = await Employee.bulkWrite(operations, { ordered: false });
        return result.upsertedCount || 0;
    } catch (error) {
        console.error('âŒ Failed to seed employees from JSON:', error.message);
        return 0;
    }
}

function normalizePincodeEntry(record) {
    return {
        officeName: String(record.officeName || '').trim(),
        pincode: Number(record.pincode) || 0,
        taluk: String(record.taluk || '').trim(),
        districtName: String(record.districtName || '').trim(),
        stateName: String(record.stateName || '').trim()
    };
}

async function seedPincodesFromJson() {
    try {
        const raw = await fs.readFile(PINCODES_FILE, 'utf8');
        const records = JSON.parse(raw);
        const validRecords = records
            .map(normalizePincodeEntry)
            .filter((record) => record.officeName && record.pincode && record.districtName && record.stateName);

        if (validRecords.length === 0) {
            return 0;
        }

        const batchSize = 5000;
        for (let index = 0; index < validRecords.length; index += batchSize) {
            const batch = validRecords.slice(index, index + batchSize);
            await PincodeEntry.insertMany(batch, { ordered: false });
        }

        return validRecords.length;
    } catch (error) {
        console.error('âŒ Failed to seed pincodes from JSON:', error.message);
        return 0;
    }
}

// Connect to MongoDB
async function connectDatabase() {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
        dataAccess.setMongoStatus(false);
        throw new Error('MONGODB_URI environment variable not set');
    }

    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected Successfully!');
        console.log('Database:', mongoose.connection.name);
        dataAccess.setMongoStatus(true);
        return true;
    } catch (error) {
        dataAccess.setMongoStatus(false);
        throw new Error(`MongoDB connection failed: ${error.message}`);
    }
}

// Initialize default data if database is empty
async function initializeDefaultData() {
    try {
        // Check if any data exists
        const orderCount = await Order.countDocuments();
        const deptCount = await Department.countDocuments();
        const employeeCount = await Employee.countDocuments();
        const configCount = await ShiprocketConfig.countDocuments();
        const pincodeCount = await PincodeEntry.countDocuments();

        // Create default Shiprocket config if not exists
        if (configCount === 0) {
            console.log('ðŸ“¦ Creating default Shiprocket configuration...');

            await ShiprocketConfig.create({
                configId: 'main',
                enabled: true,
                apiEmail: process.env.SHIPROCKET_API_EMAIL || '',
                apiPassword: process.env.SHIPROCKET_API_PASSWORD || '',
                pickupAddress: {
                    name: 'PRIMARY',
                    phone: '9876543210',
                    address: 'Sample Address',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001'
                },
                defaultDimensions: {
                    length: 20,
                    breadth: 16,
                    height: 8,
                    weight: 0.5
                },
                shiprocketOrderCounter: 7417
            });

            console.log('âœ… Default Shiprocket config created');
        }

        const seededEmployees = await seedEmployeesFromJson();
        let seededPincodes = 0;

        if (pincodeCount === 0) {
            console.log('ðŸ“® Syncing pincode/post office dataset to MongoDB...');
            seededPincodes = await seedPincodesFromJson();
            console.log(`âœ… Pincode dataset synced: ${seededPincodes.toLocaleString()} records`);
        }

        console.log(`ðŸ“Š Database Status: ${orderCount} orders, ${deptCount} departments, ${(employeeCount + seededEmployees)} employees, ${(pincodeCount + seededPincodes)} pincodes`);

    } catch (error) {
        console.error('âŒ Error initializing default data:', error.message);
    }
}

module.exports = {
    connectDatabase,
    initializeDefaultData,
    Order,
    Department,
    Employee,
    ShiprocketConfig,
    PincodeEntry
};
