// Background Tracking Service - Runs on Server 24/7
require('dotenv').config();
const shiprocket = require('./shiprocket');
const { connectDatabase } = require('./database');
const { Order } = require('./models');

// Store notified orders in memory to avoid redundant alerts
const notifiedOrders = new Set();

/**
 * Main function to sync tracking statuses for all active shipments
 */
async function syncAllTrackingStatuses() {
    try {
        console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Checking Shiprocket for updates...`);

        // Get all orders with AWB that are not yet Delivered or Cancelled
        const orders = await Order.find({
            'shiprocket.awb': { $exists: true, $ne: '' },
            status: { $nin: ['Delivered', 'Cancelled'] }
        });

        if (orders.length === 0) {
            console.log('ℹ️ No active shipments to track.');
            return;
        }

        console.log(`📦 Found ${orders.length} orders to synchronize.`);

        for (const order of orders) {
            try {
                const awb = order.shiprocket.awb;
                const tracking = await shiprocket.trackShipment(awb);

                if (!tracking.success) {
                    console.warn(`⚠️ Tracking failed for Order ${order.orderId}: ${tracking.message}`);
                    continue;
                }

                const currentStatus = tracking.currentStatus || '';
                const isDelivered = tracking.delivered;

                // 1. Handle Delivered Status
                if (isDelivered || currentStatus.toLowerCase().includes('delivered')) {
                    console.log(`✅ DELIVERED: ${order.orderId} - Updating database...`);

                    await Order.findOneAndUpdate(
                        { orderId: order.orderId },
                        {
                            status: 'Delivered',
                            deliveredAt: new Date().toISOString(),
                            deliveredBy: 'Shiprocket Auto-Sync',
                            'tracking.currentStatus': 'Delivered',
                            'tracking.lastUpdate': tracking.lastUpdate,
                            'tracking.lastUpdatedAt': new Date().toISOString()
                        }
                    );
                    continue; // Move to next order
                }

                // 2. Handle RTO / Cancelled
                if (currentStatus.toLowerCase().includes('rto') || currentStatus.toLowerCase().includes('cancelled')) {
                    console.log(`❌ RTO/CANCELLED: ${order.orderId} (${currentStatus})`);
                    await Order.findOneAndUpdate(
                        { orderId: order.orderId },
                        {
                            status: 'Cancelled',
                            'tracking.currentStatus': currentStatus,
                            'tracking.lastUpdate': tracking.lastUpdate,
                            'tracking.lastUpdatedAt': new Date().toISOString(),
                            'cancellationInfo.cancelledAt': new Date(),
                            'cancellationInfo.cancelledBy': 'Shiprocket Auto-Sync',
                            'cancellationInfo.cancellationReason': `Shiprocket Status: ${currentStatus}`
                        }
                    );
                    continue;
                }

                // 3. Handle "Out for Delivery" Alert
                if (currentStatus.toLowerCase().includes('out for delivery') && !notifiedOrders.has(order.orderId)) {
                    console.log(`🚚 OUT FOR DELIVERY ALERT: ${order.orderId}`);
                    notifiedOrders.add(order.orderId);
                    // We don't change overall status to a new state here, just update tracking info
                }

                // Generic Tracking Info Update (keeps it fresh)
                await Order.findOneAndUpdate(
                    { orderId: order.orderId },
                    {
                        'tracking.currentStatus': currentStatus,
                        'tracking.lastUpdate': tracking.lastUpdate,
                        'tracking.lastUpdatedAt': new Date().toISOString()
                    }
                );

                // Small delay to avoid Shiprocket rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (orderError) {
                console.error(`❌ Error processing Order ${order.orderId}:`, orderError.message);
            }
        }

        console.log('✅ Status synchronization complete.');

    } catch (error) {
        console.error('❌ [Sync Status] Fatal error:', error.message);
    }
}

/**
 * Check for Hold Order Dispatch Reminders
 */
async function checkHoldOrderReminders() {
    try {
        const now = new Date();
        const hour = now.getHours();

        // Alert only during working hours (9 AM - 7 PM)
        if (hour < 9 || hour >= 19) return;

        console.log('📅 Checking for hold order reminders...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const holdOrders = await Order.find({
            'holdDetails.isOnHold': true,
            'holdDetails.expectedDispatchDate': { $gte: today, $lt: tomorrow },
            status: 'On Hold'
        });

        if (holdOrders.length > 0) {
            console.log(`🔔 REMINDER: ${holdOrders.length} hold orders due today!`);
        }

    } catch (error) {
        console.error('❌ [Hold Reminders] Error:', error.message);
    }
}

/**
 * Start the background service
 * @param {boolean} alreadyConnected - Whether the DB is already connected
 */
async function startTracking(alreadyConnected = false) {
    console.log('🚀 Starting Background tracking & Alert Service...');

    if (!alreadyConnected) {
        const connected = await connectDatabase();
        if (!connected) {
            console.error('❌ Could not connect to MongoDB. Tracking service NOT started.');
            return;
        }
    }

    // Run initial checks
    syncAllTrackingStatuses();
    checkHoldOrderReminders();

    // Schedule intervals
    setInterval(syncAllTrackingStatuses, 5 * 60 * 1000); // 5 min
    setInterval(checkHoldOrderReminders, 60 * 60 * 1000); // 1 hour

    console.log('⏰ Tracking Service active (5m sync, 1h reminders)');
}

// Support running as standalone script
if (require.main === module) {
    startTracking();
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Stopping Background Service...');
    process.exit(0);
});

module.exports = { startTracking };
