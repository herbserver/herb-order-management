const mongoose = require('mongoose');
require('dotenv').config();
const { Order } = require('./models');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find orders where distt or city might have real data
        const orders = await Order.find({
            $or: [
                { city: { $exists: true, $ne: '', $ne: 'Same' } },
                { distt: { $exists: true, $ne: '', $ne: 'Same' } }
            ]
        }).limit(10);

        console.log(`Found ${orders.length} potential sample orders.`);
        orders.forEach(o => {
            console.log(`ID: ${o.orderId} | City: "${o.city}" | Distt: "${o.distt}" | State: "${o.state}" | Pin: "${o.pincode || o.pin}"`);
        });

        // Search for specific common city names if needed
        const mumbaiOrders = await Order.countDocuments({ address: /Mumbai/i });
        const delhiOrders = await Order.countDocuments({ address: /Delhi/i });
        console.log(`\nAddress Keyword Counts:`);
        console.log(`Address contains "Mumbai": ${mumbaiOrders}`);
        console.log(`Address contains "Delhi": ${delhiOrders}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
