require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('./models');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const orders = await Order.find({ agent: { $exists: true, $ne: null } }).select('agent employeeId status').limit(2);
        console.log('Orders with agent:', orders);
        
        const orders2 = await Order.find({ employeeId: { $exists: true, $ne: null } }).select('agent employeeId status').limit(2);
        console.log('Orders with employeeId:', orders2);
        
        const myOrders = await Order.find({ employeeId: 'HON-E018' }).select('agent employeeId status orderDate').limit(5);
        console.log('HON-E018 orders by employeeId:', myOrders);

        const myOrdersAgent = await Order.find({ agent: 'HON-E018' }).select('agent employeeId status orderDate').limit(5);
        console.log('HON-E018 orders by agent:', myOrdersAgent);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
});
