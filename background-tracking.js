// Background Tracking Service - Runs on Server 24/7
require('dotenv').config();
const shiprocket = require('./shiprocket');
const { Order } = require('./models');

// Store notified orders in memory (production me Redis/DB use karo)
const notifiedOrders = new Set();

// Check for Out for Delivery orders
async function checkOutForDelivery() {
    try {
        console.log('🔔 [Background] Checking for Out for Delivery orders...');

        // Get all dispatched orders with AWB
        const orders = await Order.find({
            status: 'Dispatched',
            'shiprocket.awb': { $exists: true, $ne: '' }
        });

        console.log(`📦 Found ${orders.length} dispatched orders to track`);

        for (const order of orders) {
            const awb = order.shiprocket.awb;

            // Skip if already notified
            if (notifiedOrders.has(order.orderId)) {
                continue;
            }

            // Get tracking from Shiprocket
            const tracking = await shiprocket.trackShipment(awb);

            if (tracking.success) {
                const status = tracking.currentStatus || '';

                // Check if Out for Delivery
                if (status.toLowerCase().includes('out for delivery')) {
                    console.log(`🚚 OUT FOR DELIVERY: ${order.orderId} - ${order.customerName} (${order.telNo})`);

                    // Mark as notified
                    notifiedOrders.add(order.orderId);

                    // Update order in database
                    await Order.findOneAndUpdate(
                        { orderId: order.orderId },
                        {
                            'tracking.currentStatus': tracking.currentStatus,
                            'tracking.lastUpdate': tracking.lastUpdate,
                            'tracking.lastUpdatedAt': new Date().toISOString()
                        }
                    );

                    // LOG ALERT (production me SMS/Email/Push notification bhej sakte ho)
                    console.log('═'.repeat(60));
                    console.log('🔔 OUT FOR DELIVERY ALERT!');
                    console.log('Order ID:', order.orderId);
                    console.log('Customer:', order.customerName);
                    console.log('Phone:', order.telNo);
                    console.log('Employee:', order.employee, `(${order.employeeId})`);
                    console.log('Location:', tracking.location);
                    console.log('Status:', tracking.currentStatus);
                    console.log('═'.repeat(60));

                    // TODO: Send notification
                    // - SMS to employee
                    // - WhatsApp message
                    // - Push notification
                    // - Email alert
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log('✅ [Background] Check complete\n');

    } catch (error) {
        console.error('❌ [Background] Error:', error.message);
    }
}

// Run check every 5 minutes
const INTERVAL = 5 * 60 * 1000; // 5 minutes

console.log('🚀 Starting Background Tracking Service...');
console.log(`⏰ Check interval: ${INTERVAL / 1000 / 60} minutes\n`);

// Initial check
checkOutForDelivery();

// Schedule recurring checks
setInterval(checkOutForDelivery, INTERVAL);

// Keep process alive
process.on('SIGINT', () => {
    console.log('\n👋 Stopping Background Tracking Service...');
    process.exit(0);
});
