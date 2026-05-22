require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('../models');

async function searchOrders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected.');
        const ordersByName = await Order.find({
            customerName: { $regex: /hardeep/i }
        }).lean();
        console.log('Orders found by name "hardeep":');
        ordersByName.forEach(o => {
            console.log(`OrderId: ${o.orderId}, Name: ${o.customerName}, status: ${o.status}, telNo: ${o.telNo}, mobile: ${o.mobile}, altNo: ${o.altNo}`);
        });

        const allOrders = await Order.find({}).limit(5).lean();
        console.log('\nSample orders to see phone format:');
        allOrders.forEach(o => {
            console.log(`OrderId: ${o.orderId}, telNo: ${o.telNo}, mobile: ${o.mobile}, altNo: ${o.altNo}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

searchOrders();
