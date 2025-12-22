const { connectDatabase } = require('./database');
const { Order } = require('./models');
const shiprocket = require('./shiprocket');
require('dotenv').config();

async function oneTimeSync() {
    try {
        await connectDatabase();
        console.log('📦 Finding non-delivered orders with AWB...');
        const orders = await Order.find({
            'shiprocket.awb': { $exists: true, $ne: '' },
            status: { $nin: ['Delivered', 'Cancelled'] }
        });

        console.log(`🔍 Found ${orders.length} orders to check.`);

        for (const order of orders) {
            try {
                process.stdout.write(`Checking ${order.orderId}... `);
                const tracking = await shiprocket.trackShipment(order.shiprocket.awb);

                if (tracking.success) {
                    const statusText = (tracking.currentStatus || '').toLowerCase();
                    const isDelivered = tracking.delivered || statusText.includes('delivered');

                    if (isDelivered) {
                        console.log('✅ DELIVERED');
                        await Order.findOneAndUpdate(
                            { orderId: order.orderId },
                            {
                                status: 'Delivered',
                                deliveredAt: new Date().toISOString(),
                                deliveredBy: 'Force-Sync Tool',
                                'tracking.currentStatus': 'Delivered',
                                'tracking.lastUpdate': tracking.lastUpdate,
                                'tracking.lastUpdatedAt': new Date().toISOString()
                            }
                        );
                    } else if (statusText.includes('rto') || statusText.includes('cancelled') || statusText.includes('returned')) {
                        console.log('❌ CANCELLED / RTO');
                        await Order.findOneAndUpdate(
                            { orderId: order.orderId },
                            { status: 'Cancelled' }
                        );
                    } else {
                        console.log(`ℹ️ ${tracking.currentStatus}`);
                        await Order.findOneAndUpdate(
                            { orderId: order.orderId },
                            {
                                'tracking.currentStatus': tracking.currentStatus,
                                'tracking.lastUpdate': tracking.lastUpdate,
                                'tracking.lastUpdatedAt': new Date().toISOString()
                            }
                        );
                    }
                } else {
                    console.log(`⚠️ ${tracking.message}`);
                }
            } catch (innerError) {
                console.log(`❌ Error: ${innerError.message}`);
            }
            // Rate limit protection
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        console.log('🎉 Force sync complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal Error:', error.message);
        process.exit(1);
    }
}

oneTimeSync();
