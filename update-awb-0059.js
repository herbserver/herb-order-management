const { connectDatabase, Order } = require('./database');

async function updateAWB() {
    try {
        await connectDatabase();
        console.log('📦 UPDATING AWB FOR ORDER ID-0059\n');

        const result = await Order.updateOne(
            { orderId: 'Order ID-0059' },
            {
                $set: {
                    'shiprocket.awb': '80975376705',
                    'shiprocket.courierName': 'Blue Dart Air'
                }
            }
        );

        console.log('Update Result:', result);

        if (result.modifiedCount > 0) {
            console.log('✅ AWB updated successfully');
        } else {
            console.log('ℹ️ No changes (already updated)');
        }

        // Verify
        const order = await Order.findOne({ orderId: 'Order ID-0059' });
        console.log('\n📋 VERIFICATION:');
        console.log('Order ID:', order.orderId);
        console.log('Shiprocket Order ID:', order.shiprocket?.shiprocketOrderId);
        console.log('Courier:', order.shiprocket?.courierName);
        console.log('AWB:', order.shiprocket?.awb);

        if (order.shiprocket?.awb === '80975376705') {
            console.log('\n✅ SUCCESS! AWB saved to database');
            console.log('🔗 Track: https://www.bluedart.com/tracking');
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    }
}

updateAWB();
