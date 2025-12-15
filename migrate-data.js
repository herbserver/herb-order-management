// Data Migration Script - Upload Local JSON to MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Order, Department, ShiprocketConfig } = require('./models');

// File paths
const DATA_DIR = path.join(__dirname, 'data');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');
const DEPARTMENTS_FILE = path.join(DATA_DIR, 'departments.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SHIPROCKET_CONFIG_FILE = path.join(DATA_DIR, 'shiprocket_config.json');

// Helper to read JSON
function readJSON(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        console.warn(`⚠️ File not found: ${filePath}`);
        return defaultValue;
    } catch (error) {
        console.error(`❌ Error reading ${filePath}:`, error.message);
        return defaultValue;
    }
}

async function migrateData() {
    try {
        console.log('🚀 Starting Data Migration to MongoDB...\n');

        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI not found in .env file!');
        }

        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB Atlas!\n');

        // Read local data
        console.log('📂 Reading local data files...');
        const employees = readJSON(EMPLOYEES_FILE, {});
        const departments = readJSON(DEPARTMENTS_FILE, {});
        const orders = readJSON(ORDERS_FILE, []);
        const shiprocketConfig = readJSON(SHIPROCKET_CONFIG_FILE, {});

        console.log(`   - Employees: ${Object.keys(employees).length}`);
        console.log(`   - Departments: ${Object.keys(departments).length}`);
        console.log(`   - Orders: ${orders.length}`);
        console.log(`   - Shiprocket Config: ${shiprocketConfig.enabled ? 'Yes' : 'No'}\n`);

        // Migrate Departments (includes Employees within departments)
        console.log('📦 Migrating Departments...');
        let deptCount = 0;
        for (const [deptId, dept] of Object.entries(departments)) {
            await Department.findOneAndUpdate(
                { departmentId: deptId },
                {
                    departmentId: deptId,
                    departmentName: dept.name || deptId,
                    password: dept.password,
                    departmentType: dept.type || 'verification',
                    employees: dept.employees || {}
                },
                { upsert: true, new: true }
            );
            deptCount++;
        }
        console.log(`✅ Migrated ${deptCount} departments\n`);

        // Migrate Orders
        console.log('📦 Migrating Orders...');
        let orderCount = 0;
        for (const order of orders) {
            await Order.findOneAndUpdate(
                { orderId: order.orderId },
                {
                    orderId: order.orderId,
                    customerName: order.customerName,
                    phone: order.phone,
                    alternatePhone: order.alternatePhone,
                    address: order.address,
                    postOffice: order.postOffice,
                    pincode: order.pincode,
                    district: order.district,
                    state: order.state,
                    tahTaluka: order.tahTaluka,
                    product: order.product,
                    quantity: order.quantity,
                    price: order.price,
                    status: order.status || 'Pending',
                    timestamp: order.timestamp,
                    employeeId: order.employeeId,
                    employeeName: order.employeeName,
                    verifiedBy: order.verifiedBy,
                    verifiedAt: order.verifiedAt,
                    verificationRemarks: order.verificationRemarks,
                    dispatchedBy: order.dispatchedBy,
                    dispatchedAt: order.dispatchedAt,
                    courierName: order.courierName,
                    trackingNumber: order.trackingNumber,
                    deliveredAt: order.deliveredAt,
                    deliveryRequestedBy: order.deliveryRequestedBy,
                    deliveryApprovedBy: order.deliveryApprovedBy,
                    shiprocket: order.shiprocket
                },
                { upsert: true, new: true }
            );
            orderCount++;
            if (orderCount % 50 === 0) {
                console.log(`   Processed ${orderCount} orders...`);
            }
        }
        console.log(`✅ Migrated ${orderCount} orders\n`);

        // Migrate Shiprocket Config
        if (shiprocketConfig && shiprocketConfig.enabled !== undefined) {
            console.log('📦 Migrating Shiprocket Configuration...');
            await ShiprocketConfig.findOneAndUpdate(
                { configId: 'main' },
                {
                    configId: 'main',
                    enabled: shiprocketConfig.enabled,
                    apiEmail: shiprocketConfig.apiEmail || process.env.SHIPROCKET_API_EMAIL,
                    apiPassword: shiprocketConfig.apiPassword || process.env.SHIPROCKET_API_PASSWORD,
                    token: shiprocketConfig.token,
                    tokenExpiry: shiprocketConfig.tokenExpiry,
                    pickupAddress: shiprocketConfig.pickupAddress,
                    defaultDimensions: shiprocketConfig.defaultDimensions,
                    shiprocketOrderCounter: shiprocketConfig.shiprocketOrderCounter || 7417
                },
                { upsert: true, new: true }
            );
            console.log('✅ Migrated Shiprocket configuration\n');
        }

        // Summary
        console.log('╔════════════════════════════════════════╗');
        console.log('║   🎉 MIGRATION COMPLETED SUCCESSFULLY! ║');
        console.log('╠════════════════════════════════════════╣');
        console.log(`║  Departments:  ${deptCount.toString().padEnd(23)} ║`);
        console.log(`║  Orders:       ${orderCount.toString().padEnd(23)} ║`);
        console.log(`║  Shiprocket:   ${shiprocketConfig.enabled ? 'Enabled'.padEnd(23) : 'Disabled'.padEnd(23)} ║`);
        console.log('╚════════════════════════════════════════╝');

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB. Migration complete!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration Failed:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run migration
migrateData();
