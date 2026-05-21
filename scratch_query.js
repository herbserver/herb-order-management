require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('./models');

async function checkDb() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected.');
        const order = await Order.findOne({ orderId: /8731/ });
        if (order) {
            console.log('--- FOUND ORDER ---');
            console.log('orderId:', order.orderId);
            console.log('customerName:', order.customerName);
            console.log('gender:', order.gender);
            console.log('fatherOrHusbandName:', order.fatherOrHusbandName);
            console.log('--------------------');
        } else {
            console.log('Order with ID 8731 not found in MongoDB.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkDb();
