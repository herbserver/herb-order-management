const { connectDatabase } = require('./database');
const dataAccess = require('./dataAccess');

async function fixData() {
    await connectDatabase();
    const orders = await dataAccess.getAllOrders();
    const awbMap = {};

    // 1. Identify duplicates
    orders.forEach(order => {
        const awb = order.shiprocket?.awb || order.tracking?.trackingId;
        if (awb && awb !== 'Coming Soon' && awb !== 'In process' && awb !== 'N/A') {
            if (!awbMap[awb]) awbMap[awb] = [];
            awbMap[awb].push(order.orderId);
        }
    });

    console.log('\n🧹 Starting Data Cleanup...');

    let clearedCount = 0;
    for (const [awb, orderIds] of Object.entries(awbMap)) {
        if (orderIds.length > 1) {
            console.log(`\n❌ AWB ${awb} is corrupted (shared by ${orderIds.length} orders)`);
            console.log(`   Orders: ${orderIds.join(', ')}`);

            for (const orderId of orderIds) {
                // Clear the bad data
                await dataAccess.updateOrder(orderId, {
                    'shiprocket.awb': null,
                    'shiprocket.shipmentId': null,
                    'tracking': null
                });
                console.log(`   ✅ Cleared data for ${orderId}`);
                clearedCount++;
            }
        }
    }

    console.log(`\n✨ Cleanup complete! Cleared bad data from ${clearedCount} orders.`);
    console.log('🚀 Now you can run the Sync button in Admin to get correct AWBs.');

    process.exit();
}

fixData().catch(err => {
    console.error('CRITICAL ERROR:', err);
    process.exit(1);
});
