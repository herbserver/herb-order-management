const { connectDatabase, Order } = require('./database');

async function linkShiprocketOrder() {
    try {
        await connectDatabase();
        console.log('🔗 LINKING ORDER ID-0059 TO SHIPROCKET ORDER 7664\n');

        // Update database with manual Shiprocket Order ID
        const result = await Order.updateOne(
            { orderId: 'Order ID-0059' },
            {
                $set: {
                    'shiprocket.shiprocketOrderId': '7664',
                    'status': 'Dispatched',
                    'dispatchedAt': new Date().toISOString()
                }
            }
        );

        console.log('Update Result:', result);

        if (result.matchedCount === 0) {
            console.error('❌ Order not found');
            process.exit(1);
        }

        if (result.modifiedCount > 0) {
            console.log('✅ Database updated successfully');
        } else {
            console.log('ℹ️ No changes made (data already same)');
        }

        // Verify
        const order = await Order.findOne({ orderId: 'Order ID-0059' });
        console.log('\n📋 VERIFICATION:');
        console.log('Order ID:', order.orderId);
        console.log('Status:', order.status);
        console.log('Shiprocket Order ID:', order.shiprocket?.shiprocketOrderId);
        console.log('AWB:', order.shiprocket?.awb || 'Not synced yet');

        if (order.shiprocket?.shiprocketOrderId === '7664') {
            console.log('\n✅ SUCCESS! Order linked to Shiprocket Order 7664');
            console.log('\n💡 Next Step:');
            console.log('Use "Sync Shiprocket Status" in dispatch panel to get AWB and tracking info');
        } else {
            console.log('\n❌ Link failed - shiprocketOrderId not saved');
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    }
}

linkShiprocketOrder();
