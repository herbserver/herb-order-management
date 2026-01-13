require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('./models');

async function checkOrders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const count = await Order.countDocuments();
        console.log('\n📊 Total Orders in MongoDB:', count);

        if (count > 0) {
            console.log('\n🔍 Recent Orders:');
            const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
            orders.forEach(o => {
                console.log(`  - ${o.orderId}: ${o.customerName} | ${o.status} | ₹${o.total}`);
            });

            // Status breakdown
            const statuses = await Order.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);
            console.log('\n📋 Orders by Status:');
            statuses.forEach(s => {
                console.log(`  - ${s._id}: ${s.count}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkOrders();
