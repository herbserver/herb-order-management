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
        }).limit(20); // Limit to 20 orders per batch

        if (orders.length === 0) {
            console.log('ℹ️ No active shipments to track.');
            return;
        }

        console.log(`📦 Found ${orders.length} orders to synchronize (max 20 per batch).`);

        let processedCount = 0;
        for (const order of orders) {
            // Stop if we hit rate limit
            if (processedCount >= 15) {
                console.log('⏸️ Batch limit reached (15 requests). Stopping to avoid rate limit.');
                break;
            }
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
                            tracking: {
                                trackingId: order.tracking?.trackingId || awb,
                                courier: order.tracking?.courier || 'Shiprocket',
                                currentStatus: 'Delivered',
                                lastUpdate: tracking.lastUpdate,
                                lastUpdatedAt: new Date().toISOString()
                            }
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
                            tracking: {
                                trackingId: order.tracking?.trackingId || awb,
                                courier: order.tracking?.courier || 'Shiprocket',
                                currentStatus: currentStatus,
                                lastUpdate: tracking.lastUpdate,
                                lastUpdatedAt: new Date().toISOString()
                            },
                            'cancellationInfo.cancelledAt': new Date(),
                            'cancellationInfo.cancelledBy': 'Shiprocket Auto-Sync',
                            'cancellationInfo.cancellationReason': `Shiprocket Status: ${currentStatus}`
                        }
                    );
                    continue;
                }

                // 3. Handle "Out for Delivery" Alert
                if (currentStatus.toLowerCase().includes('out for delivery')) {
                    console.log(`🚚 OUT FOR DELIVERY: ${order.orderId} - Updating status...`);

                    if (order.status !== 'Out For Delivery') {
                        await Order.findOneAndUpdate(
                            { orderId: order.orderId },
                            {
                                status: 'Out For Delivery',
                                tracking: {
                                    trackingId: order.tracking?.trackingId || awb,
                                    courier: order.tracking?.courier || 'Shiprocket',
                                    currentStatus: currentStatus,
                                    lastUpdate: tracking.lastUpdate,
                                    lastUpdatedAt: new Date().toISOString()
                                }
                            }
                        );
                        notifiedOrders.add(order.orderId);
                        continue; // Status updated, move to next
                    }
                }

                // Generic Tracking Info Update (keeps it fresh)
                await Order.findOneAndUpdate(
                    { orderId: order.orderId },
                    {
                        tracking: {
                            trackingId: order.tracking?.trackingId || awb,
                            courier: order.tracking?.courier || 'Shiprocket',
                            currentStatus: currentStatus,
                            lastUpdate: tracking.lastUpdate,
                            lastUpdatedAt: new Date().toISOString()
                        }
                    }
                );

                // Longer delay to avoid Shiprocket rate limiting (5 seconds)
                await new Promise(resolve => setTimeout(resolve, 5000));
                processedCount++;

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
 * Check for Stuck Orders (In Transit > 5 days without update)
 */
async function checkStuckOrders() {
    try {
        console.log('🕵️‍♂️ [AI Watchdog] Scanning for stuck orders...');
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const stuckOrders = await Order.find({
            status: { $in: ['Dispatched', 'In Transit', 'Shipped', 'Out For Delivery'] },
            'tracking.lastUpdatedAt': { $lt: fiveDaysAgo.toISOString() },
            'riskMetadata.stuckAlert': { $ne: true } // Don't alert twice
        });

        if (stuckOrders.length > 0) {
            console.log(`🚨 [AI Alert] Found ${stuckOrders.length} stuck orders!`);

            for (const order of stuckOrders) {
                // Mark as stuck in DB
                await Order.updateOne(
                    { _id: order._id },
                    {
                        $set: {
                            'riskMetadata.stuckAlert': true,
                            'riskMetadata.lastAiCheck': new Date()
                        }
                    }
                );
                console.log(`   - Marked Order #${order.orderId} as STUCK`);
            }
        } else {
            console.log('✅ [AI Watchdog] No stuck orders found.');
        }

    } catch (error) {
        console.error('❌ [AI Watchdog] Error checking stuck orders:', error.message);
    }
}

/**
 * AI Risk Guard - Check RTO Probability based on customer history
 */
async function checkRiskFactors() {
    console.log('🛡️ [AI Risk Guard] Scanning for high-risk orders...');
    try {
        // Find recent orders that haven't been risk-checked yet
        // We check Pending and Verified orders (pre-dispatch)
        const activeOrders = await Order.find({
            status: { $in: ['Pending', 'Address Verified'] },
            'riskMetadata.lastAiCheck': { $exists: false }
        }).limit(50);

        if (activeOrders.length === 0) {
            console.log('✅ [AI Risk Guard] No new orders to analyze.');
            return;
        }

        console.log(`🕵️‍♂️ Analyzing ${activeOrders.length} orders for risk factors...`);

        for (const order of activeOrders) {
            const mobile = order.mobile || order.telNo;
            if (!mobile) {
                await Order.updateOne({ _id: order._id }, { $set: { 'riskMetadata.lastAiCheck': new Date() } });
                continue;
            }

            // Find all other orders for this customer (excluding current)
            const history = await Order.find({
                $or: [{ mobile: mobile }, { telNo: mobile }],
                _id: { $ne: order._id }
            });

            if (history.length >= 2) { // Lowered to 2 for more proactive alerting in MVP
                const total = history.length;
                const badOrders = history.filter(o =>
                    o.status === 'RTO' || o.status === 'Cancelled'
                ).length;

                const rtoRate = badOrders / total;

                // If RTO rate is over 30% and they have at least 1 failed order
                if (rtoRate >= 0.33 && badOrders > 0) {
                    await Order.updateOne({ _id: order._id }, {
                        $set: {
                            'riskMetadata.isHighRisk': true,
                            'riskMetadata.riskReason': `Customer RTO Rate: ${(rtoRate * 100).toFixed(0)}% (${badOrders}/${total} failed)`,
                            'riskMetadata.lastAiCheck': new Date()
                        }
                    });
                    console.log(`🚨 [AI Risk] Flagged Order #${order.orderId} - Risk Rate: ${(rtoRate * 100).toFixed(0)}%`);
                } else {
                    await Order.updateOne({ _id: order._id }, { $set: { 'riskMetadata.lastAiCheck': new Date() } });
                }
            } else {
                // Not enough history, just mark as checked
                await Order.updateOne({ _id: order._id }, { $set: { 'riskMetadata.lastAiCheck': new Date() } });
            }
        }
        console.log('✅ [AI Risk Guard] Scan complete.');
    } catch (error) {
        console.error('❌ [AI Risk Guard] Error:', error.message);
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
    // syncAllTrackingStatuses(); // Disabled auto-run on start
    // checkHoldOrderReminders();

    // AI Checks (Safe to run on start)
    checkStuckOrders();
    checkRiskFactors();

    // Schedule intervals - DISABLED as per user request (Manual Mode only)
    // setInterval(syncAllTrackingStatuses, 30 * 60 * 1000); // 30 min (webhook is primary)
    // setInterval(checkHoldOrderReminders, 60 * 60 * 1000); // 1 hour

    // Schedule AI Watchdog & Risk Guard every 6 hours
    setInterval(checkStuckOrders, 6 * 60 * 60 * 1000);
    setInterval(checkRiskFactors, 6 * 60 * 60 * 1000);

    console.log('⏰ Tracking Service & AI Watchdog started');
    console.log('📡 Primary tracking via Manual Sync or Webhook');
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

module.exports = { startTracking, checkStuckOrders, checkRiskFactors };
