const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { updateOrder } = require('../dataAccess');

// Shiprocket Webhook Secret (set in environment or config)
const WEBHOOK_SECRET = process.env.SHIPROCKET_WEBHOOK_SECRET || 'your-webhook-secret';

/**
 * Shiprocket Webhook Endpoint
 * Receives real-time shipment status updates
 */
router.post('/webhook', async (req, res) => {
    try {
        console.log('📦 Shiprocket Webhook Received:', JSON.stringify(req.body, null, 2));

        // Validate webhook signature (if Shiprocket provides one)
        // const signature = req.headers['x-shiprocket-signature'];
        // if (!validateSignature(req.body, signature)) {
        //     return res.status(401).json({ error: 'Invalid signature' });
        // }

        const webhookData = req.body;

        // Extract tracking information
        const {
            awb,
            order_id,
            shipment_id,
            status,
            current_status,
            scans = []
        } = webhookData;

        if (!awb && !order_id) {
            console.warn('⚠️ Webhook missing AWB/Order ID');
            return res.status(400).json({ error: 'Missing AWB or Order ID' });
        }

        // Find order by AWB or Shiprocket order ID
        const Order = require('../models').Order;
        let order = null;

        if (awb) {
            order = await Order.findOne({
                $or: [
                    { 'shiprocket.awb': awb },
                    { 'tracking.trackingId': awb }
                ]
            });
        }

        if (!order && order_id) {
            order = await Order.findOne({ 'shiprocket.order_id': order_id });
        }

        if (!order) {
            console.warn(`⚠️ Order not found for AWB: ${awb}, Order ID: ${order_id}`);
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log(`✅ Found order: ${order.orderId}`);

        // Get latest scan/status
        const latestScan = scans.length > 0 ? scans[scans.length - 1] : null;
        const statusText = current_status || status || latestScan?.status || 'Unknown';
        const location = latestScan?.location || '';
        const timestamp = latestScan?.date || new Date().toISOString();

        // Update tracking information
        const trackingUpdate = {
            currentStatus: statusText,
            location: location,
            lastUpdate: timestamp,
            scans: scans.map(scan => ({
                status: scan.status,
                location: scan.location,
                date: scan.date,
                activity: scan.activity
            }))
        };

        // Update order
        await updateOrder(order.orderId, {
            tracking: trackingUpdate,
            lastTracked: new Date()
        });

        console.log(`✅ Updated tracking for ${order.orderId}: ${statusText}`);

        // Trigger notifications based on status
        await handleStatusNotification(order, statusText, trackingUpdate);

        res.json({
            success: true,
            message: 'Webhook processed',
            orderId: order.orderId,
            status: statusText
        });

    } catch (error) {
        console.error('❌ Webhook Error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * Handle notifications based on shipment status
 */
async function handleStatusNotification(order, status, tracking) {
    const statusLower = status.toLowerCase();

    // Critical statuses that need immediate notification
    const criticalStatuses = {
        'out for delivery': {
            emoji: '🚚',
            title: 'Out for Delivery!',
            message: `Order ${order.orderId} is out for delivery. Call customer now!`,
            priority: 'high'
        },
        'delivered': {
            emoji: '✅',
            title: 'Delivered Successfully',
            message: `Order ${order.orderId} has been delivered.`,
            priority: 'medium'
        },
        'rto': {
            emoji: '↩️',
            title: 'Return to Origin',
            message: `Order ${order.orderId} is being returned.`,
            priority: 'high'
        },
        'failed delivery': {
            emoji: '⚠️',
            title: 'Delivery Failed',
            message: `Order ${order.orderId} delivery failed. Contact customer!`,
            priority: 'high'
        },
        'picked up': {
            emoji: '📦',
            title: 'Picked Up',
            message: `Order ${order.orderId} has been picked up by courier.`,
            priority: 'low'
        }
    };

    // Check if status matches any critical status
    for (const [key, notification] of Object.entries(criticalStatuses)) {
        if (statusLower.includes(key)) {
            console.log(`🔔 Triggering notification: ${notification.title} for ${order.orderId}`);

            // Store notification in database for real-time push
            await storeNotification(order, notification, tracking);

            // If "Out for Delivery", mark for special handling
            if (key === 'out for delivery') {
                await updateOrder(order.orderId, {
                    outForDelivery: true,
                    outForDeliveryAt: new Date()
                });
            }

            break;
        }
    }
}

/**
 * Store notification for real-time delivery to clients
 */
async function storeNotification(order, notification, tracking) {
    const Notification = require('../models').Notification;

    await Notification.create({
        orderId: order.orderId,
        employeeId: order.employeeId,
        type: 'tracking_update',
        title: notification.title,
        message: notification.message,
        emoji: notification.emoji,
        priority: notification.priority,
        data: {
            status: tracking.currentStatus,
            location: tracking.location,
            customerName: order.customerName,
            telNo: order.telNo
        },
        read: false,
        timestamp: new Date()
    });
}

/**
 * Validate webhook signature (if Shiprocket provides one)
 */
function validateSignature(payload, signature) {
    if (!signature) return true; // Skip validation if no signature

    const hash = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

    return hash === signature;
}

/**
 * Manual sync endpoint (backup)
 */
router.post('/sync-tracking/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const Order = require('../models').Order;

        const order = await Order.findOne({ orderId });
        if (!order || !order.shiprocket?.awb) {
            return res.status(404).json({ error: 'Order or AWB not found' });
        }

        // Call Shiprocket tracking API
        const shiprocket = require('../shiprocket');
        const trackingData = await shiprocket.trackShipment(order.shiprocket.awb);

        if (trackingData && trackingData.tracking_data) {
            const tracking = trackingData.tracking_data;
            await updateOrder(orderId, {
                tracking: {
                    currentStatus: tracking.shipment_status_activities?.[0]?.activity || 'Unknown',
                    location: tracking.shipment_status_activities?.[0]?.location || '',
                    lastUpdate: new Date(),
                    scans: tracking.shipment_status_activities || []
                },
                lastTracked: new Date()
            });

            res.json({ success: true, tracking });
        } else {
            res.status(404).json({ error: 'Tracking data not available' });
        }

    } catch (error) {
        console.error('Sync tracking error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
