require('dotenv').config();
const mongoose = require('mongoose');
const dataAccess = require('./dataAccess');

async function run() {
    console.log('Connecting to MongoDB...');
    const startObj = Date.now();
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected in ${Date.now() - startObj}ms`);

    dataAccess.setMongoStatus(true);
    
    console.log('Testing getAllOrders() LIMIT 10...');
    const start1 = Date.now();
    const result1 = await dataAccess.getAllOrders(1, 10);
    console.log(`getAllOrders(1, 10) took ${Date.now() - start1}ms. Total returned documents: ${result1.orders ? result1.orders.length : result1.length}`);

    console.log('Testing getOrdersByStatus("Out For Delivery")...');
    const start2 = Date.now();
    const result2 = await dataAccess.getOrdersByStatus('Out For Delivery');
    console.log(`getOrdersByStatus took ${Date.now() - start2}ms. Total returned documents: ${result2.orders ? result2.orders.length : result2.length}`);

    await mongoose.disconnect();
    console.log('Done.');
}

run().catch(console.error);
