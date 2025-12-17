const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Mongoose Models Schemas (Simplified for migration)
const EmployeeSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    password: { type: String },
    full_name: { type: String },
    email: { type: String },
    phone: { type: String },
    role: { type: String },
    department: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { strict: false });

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    // Allow any other fields
}, { strict: false });

// Reusable connection logic
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

const migrateEmployees = async () => {
    // Check multiple paths for employees
    const paths = [
        path.join(__dirname, 'data', 'employees.json'),
        path.join(__dirname, 'data', 'New folder', 'employees.json')
    ];

    let employeeData = {};
    for (const p of paths) {
        if (fs.existsSync(p)) {
            try {
                console.log(`Reading employees from: ${p}`);
                const data = JSON.parse(fs.readFileSync(p, 'utf8'));
                // Merge data (handling both object and array formats if necessary)
                if (data.employees && Array.isArray(data.employees)) {
                    data.employees.forEach(e => employeeData[e.employeeId] = e);
                } else if (Array.isArray(data)) {
                    data.forEach(e => employeeData[e.employeeId] = e);
                } else {
                    // Object format: { "ID": { ... } }
                    Object.entries(data).forEach(([id, details]) => {
                        employeeData[id] = { ...details, employeeId: id };
                    });
                }
            } catch (e) {
                console.warn(`Failed to read ${p}: ${e.message}`);
            }
        }
    }

    const employees = Object.values(employeeData);
    if (employees.length === 0) {
        console.warn('⚠️ No employees found to migrate.');
        return;
    }

    console.log(`Processing ${employees.length} unique employees...`);
    const Employee = mongoose.model('Employee', EmployeeSchema);

    let success = 0;
    let errors = 0;

    for (const emp of employees) {
        try {
            await Employee.updateOne(
                { employeeId: emp.employeeId },
                { $set: emp },
                { upsert: true }
            );
            success++;
        } catch (e) {
            console.error(`Error migrating employee ${emp.employeeId}:`, e.message);
            errors++;
        }
    }
    console.log(`✅ Employees Migrated: ${success}, Errors: ${errors}`);
};

const migrateOrders = async () => {
    // Check multiple possible locations for orders
    // Added 'data/New folder/orders.json' as primary source since main one was empty
    const possiblePaths = [
        path.join(__dirname, 'data', 'New folder', 'orders.json'),
        path.join(__dirname, 'data', 'orders.json'),
        path.join(__dirname, 'data', 'Sale File 2025 All Orders.json')
    ];

    let orders = [];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            try {
                console.log(`Reading orders from: ${p}`);
                const data = JSON.parse(fs.readFileSync(p, 'utf8'));
                if (data.orders && Array.isArray(data.orders)) {
                    orders = orders.concat(data.orders);
                } else if (Array.isArray(data)) {
                    orders = orders.concat(data);
                } else if (data.General) {
                    // Skip raw Excel dump format for now unless essential
                    console.log('Skipping raw Excel dump format in', p);
                }
            } catch (e) {
                console.warn(`Failed to read ${p}: ${e.message}`);
            }
        }
    }

    if (orders.length === 0) {
        console.warn('⚠️ No orders found to migrate.');
        return;
    }

    // Remove duplicates based on orderId
    const uniqueOrders = Array.from(new Map(orders.map(item => [item.orderId, item])).values());

    console.log(`Processing ${uniqueOrders.length} unique orders...`);
    const Order = mongoose.model('Order', OrderSchema);

    let success = 0;
    let errors = 0;

    for (const order of uniqueOrders) {
        try {
            // Ensure timestamp is a valid date object
            if (order.timestamp) {
                order.timestamp = new Date(order.timestamp);
            }

            await Order.updateOne(
                { orderId: order.orderId },
                { $set: order },
                { upsert: true }
            );
            success++;
            if (success % 50 === 0) process.stdout.write('.');
        } catch (e) {
            errors++;
        }
    }
    console.log(`\n✅ Orders Migrated: ${success}, Errors: ${errors}`);
};

const runMigration = async () => {
    await connectDB();

    console.log('\n--- STARTING DATA MIGRATION ---\n');
    await migrateEmployees();
    await migrateOrders();
    console.log('\n--- MIGRATION COMPLETE ---');

    await mongoose.connection.close();
    process.exit(0);
};

runMigration();
