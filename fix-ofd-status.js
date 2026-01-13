
const dataAccess = require('./dataAccess');
const { connectDatabase } = require('./database');
const { Order } = require('./models');
require('dotenv').config();

async function fixMismatches() {
    await connectDatabase();

    console.log('🔧 Fixing Mismatched Orders...');

    // Find orders where tracking says "Out for Delivery" but main status is NOT
    const mismatchOrders = await Order.find({
        status: { $ne: 'Out For Delivery' },
        'tracking.currentStatus': { $regex: /out for delivery/i }
    });

    console.log(`Found ${mismatchOrders.length} orders to fix.`);

    for (const order of mismatchOrders) {
        console.log(`Fixing Order: ${order.orderId} (Current: ${order.status})`);
        order.status = 'Out For Delivery';
        order.updatedAt = new Date().toISOString();
        await order.save();
    }

    console.log('✅ All fixes applied!');
    process.exit();
}

fixMismatches();
