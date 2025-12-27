const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const { Order } = require('./models');

async function capture() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const orders = await Order.find().sort({ _id: -1 }).limit(20);
        fs.writeFileSync('sample_orders.json', JSON.stringify(orders, null, 2));
        console.log('Sample orders captured to sample_orders.json');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
capture();
