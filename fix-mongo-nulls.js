const { connectDatabase } = require('./database');
const { Order } = require('./models');

async function fixNulls() {
    await connectDatabase();

    console.log(`\n🧹 Searching for orders with NULL shiprocket or tracking fields...`);

    // Find orders where shiprocket is literally null
    const ordersWithNullShiprocket = await Order.find({ shiprocket: null });
    console.log(`   - Found ${ordersWithNullShiprocket.length} orders with shiprocket: null`);

    for (const order of ordersWithNullShiprocket) {
        await Order.updateOne(
            { _id: order._id },
            { $unset: { shiprocket: "" } }
        );
        console.log(`     ✅ Cleared shiprocket: null for ${order.orderId}`);
    }

    // Find orders where tracking is literally null
    const ordersWithNullTracking = await Order.find({ tracking: null });
    console.log(`   - Found ${ordersWithNullTracking.length} orders with tracking: null`);

    for (const order of ordersWithNullTracking) {
        await Order.updateOne(
            { _id: order._id },
            { $unset: { tracking: "" } }
        );
        console.log(`     ✅ Cleared tracking: null for ${order.orderId}`);
    }

    console.log(`\n✨ Successfully repaired all corrupted records.`);
    console.log('🚀 Now restart the server and try "Sync AWB" again.');
    process.exit();
}

fixNulls().catch(err => {
    console.error('CRITICAL ERROR:', err);
    process.exit(1);
});
