const { connectDatabase, Order } = require('./database');

async function fixOrder0059() {
    try {
        await connectDatabase();
        console.log('🔧 FIXING ORDER ID-0059\n');

        // Direct MongoDB update with $set
        const result = await Order.findOneAndUpdate(
            { orderId: 'Order ID-0059' },
            {
                $set: {
                    'shiprocket.orderId': 3775758,
                    'shiprocket.shipmentId': 4271929,
                    'shiprocket.awb': null
                }
            },
            { new: true }
        );

        if (result) {
            console.log('✅ Update successful!');
            console.log('\nUpdated Order:');
            console.log('  Order ID:', result.orderId);
            console.log('  Status:', result.status);
            console.log('  Shiprocket Order ID:', result.shiprocket?.orderId);
            console.log('  Shipment ID:', result.shiprocket?.shipmentId);
            console.log('  AWB:', result.shiprocket?.awb || 'Not yet generated');
        } else {
            console.log('❌ Order not found');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixOrder0059();
