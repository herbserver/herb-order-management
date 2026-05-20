require('dotenv').config();
const mongoose = require('mongoose');
const { Department, Employee, Order } = require('../models');

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        console.log('\n--- DEPARTMENTS ---');
        const depts = await Department.find({}).lean();
        console.log(depts);

        console.log('\n--- EMPLOYEES (First 5) ---');
        const emps = await Employee.find({}).limit(5).lean();
        console.log(emps);

        console.log('\n--- ORDERS (First 5) ---');
        const orders = await Order.find({}).limit(5).lean();
        console.log(orders.map(o => ({ orderId: o.orderId, customerName: o.customerName, status: o.status })));

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

main();
