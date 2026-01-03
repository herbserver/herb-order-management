const express = require('express');
const router = express.Router();
const shiprocket = require('../shiprocket');
const dataAccess = require('../dataAccess');

// Helper for Title Case
function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Track shipment by AWB
router.get('/track/:awb', async (req, res) => {
    try {
        const awb = req.params.awb;
        const trackingInfo = await shiprocket.trackShipment(awb);
        if (trackingInfo.success) res.json({ success: true, tracking: trackingInfo });
        else res.status(404).json({ success: false, message: trackingInfo.message });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Tracking failed' });
    }
});

// Check Serviceability
router.post('/check-serviceability', async (req, res) => {
    try {
        const { orderId, dimensions } = req.body;
        const order = await dataAccess.getOrderById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const pickupPostcode = process.env.PICKUP_POSTCODE || '110006';
        const deliveryPostcode = order.pincode || order.pin;
        const result = await shiprocket.checkServiceability(pickupPostcode, deliveryPostcode, dimensions.weight || 0.5, order.codAmount || 0);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Check failed' });
    }
});

router.post('/create-order', async (req, res) => {
    try {
        const { orderId, dimensions } = req.body;
        const order = await dataAccess.getOrderById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // CRITICAL VALIDATION: Check if order has valid total amount
        if (!order.total || order.total <= 0) {
            console.error(`❌ Order ${orderId} has invalid total: ${order.total}`);
            return res.status(400).json({
                success: false,
                message: 'Order total is 0 or missing! Please edit order and add total amount.',
                error: 'INVALID_TOTAL'
            });
        }

        // ==================== SIMPLIFIED COD FORMAT ====================
        // Final amount to collect (COD amount)
        const finalAmount = order.codAmount || order.total || 0;

        // Total quantity (for reference only)
        const totalQuantity = order.items && order.items.length > 0
            ? order.items.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0)
            : 1;

        console.log(`💊 Medicine Order for ${order.orderId}:`);
        console.log(`   Quantity: ${totalQuantity}`);
        console.log(`   COD Amount: ₹${finalAmount}`);

        // Single item: "Medicine" with full COD amount as selling price
        // units=1 ensures Shiprocket calculation: 1 × COD = correct total
        const orderItems = [{
            name: "Medicine",
            sku: "MEDICINE",
            units: 1,  // Fixed to 1 so selling_price = total COD
            selling_price: finalAmount,  // Full COD amount
            discount: 0,
            tax: 0,
            hsn: 0
        }];

        console.log(`   ✅ Shiprocket COD Total: ₹${finalAmount}`);


        const payload = {
            order_id: order.orderId,
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: "warehouse",
            billing_customer_name: toTitleCase(order.customerName.split(' ')[0]),
            billing_last_name: toTitleCase(order.customerName.split(' ').slice(1).join(' ')) || '.',
            billing_address: toTitleCase(order.address),
            billing_address_2: (order.landMark || order.landmark) ? `{Near- ${toTitleCase(order.landMark || order.landmark)}}` : '',  // Landmark format: {Near- Landmark}
            billing_city: toTitleCase(order.distt || order.district || 'Delhi'),
            billing_pincode: order.pin || order.pincode,
            billing_state: toTitleCase(order.state || 'Delhi'),
            billing_country: "India",
            billing_phone: order.telNo,
            billing_alternate_phone: order.altNo || '',  // Alternate number
            shipping_is_billing: true,
            order_items: orderItems,
            payment_method: "COD",
            sub_total: finalAmount,
            length: dimensions.length,
            breadth: dimensions.breadth,
            height: dimensions.height,
            weight: dimensions.weight
        };

        console.log('📦 Shiprocket Payload:', JSON.stringify(payload, null, 2));

        const result = await shiprocket.createOrder(payload);

        console.log('📡 Shiprocket Response:', JSON.stringify(result, null, 2));

        // STRICT CHECK: Only mark as dispatched if Shiprocket order was created
        if (result.success) {
            const shiprocketData = {
                orderId: result.orderId,
                shipmentId: result.shipmentId
            };

            // AWB might not be available immediately
            if (result.awb) {
                shiprocketData.awb = result.awb;
                console.log(`✅ Order ${orderId} dispatched with AWB: ${result.awb}`);
            } else {
                console.log(`✅ Order ${orderId} dispatched - AWB pending`);
            }

            await dataAccess.updateOrder(orderId, {
                status: 'Dispatched',
                dispatchedAt: new Date().toISOString(),
                shiprocket: shiprocketData
            });

            res.json({
                success: true,
                message: result.awb ? `Order pushed to Shiprocket! AWB: ${result.awb}` : 'Order pushed to Shiprocket! AWB will be generated soon.',
                data: result
            });
        } else {
            // Shiprocket failed - DO NOT mark as dispatched
            console.error('❌ Shiprocket Failed:', result.message);
            console.error('   Details:', result.details);

            res.status(400).json({
                success: false,
                message: result.message || 'Shiprocket order creation failed',
                details: result.details,
                error: 'ORDER NOT DISPATCHED - Fix errors and try again'
            });
        }
    } catch (error) {
        console.error('❌ Shiprocket Route Error:', error);
        res.status(500).json({
            success: false,
            message: 'Dispatch failed - Server error',
            error: error.message
        });
    }
});

// Sync AWB for a specific order
router.post('/sync-order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await dataAccess.getOrderById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        let shipmentData = null;

        // 1. Try with Shipment ID if we have it
        if (order.shiprocket?.shipmentId) {
            shipmentData = await shiprocket.getShipmentDetails(order.shiprocket.shipmentId);
        }

        // 2. Fallback to Order ID search + Mobile + Name + Location
        if (!shipmentData || !shipmentData.awb) {
            shipmentData = await shiprocket.getOrderByChannelId(
                orderId,
                order.telNo || order.mobile,
                order.customerName,
                { city: order.city, pincode: order.pin || order.pincode }
            );
        }

        if (shipmentData && shipmentData.awb) {
            await dataAccess.updateOrder(orderId, {
                'shiprocket.awb': shipmentData.awb,
                'shiprocket.shipmentId': shipmentData.shipmentId || order.shiprocket?.shipmentId,
                tracking: {
                    trackingId: shipmentData.awb,
                    courier: shipmentData.courierName || 'Shiprocket'
                }
            });

            console.log(`✅ Synced AWB for ${orderId}: ${shipmentData.awb}`);

            res.json({
                success: true,
                message: 'AWB synced successfully',
                awb: shipmentData.awb,
                courier: shipmentData.courierName
            });
        } else {
            res.json({
                success: false,
                message: 'AWB not yet generated or order not found in Shiprocket'
            });
        }

    } catch (error) {
        console.error('❌ Sync order error:', error);
        res.status(500).json({
            success: false,
            message: 'Sync failed',
            error: error.message
        });
    }
});

// Track specific order shipment
router.post('/track-order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await dataAccess.getOrderById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const awb = order.shiprocket?.awb || order.tracking?.trackingId;

        if (!awb) {
            return res.json({ success: false, message: 'No AWB found for tracking' });
        }

        console.log(`🔍 Tracking order ${orderId} with AWB: ${awb}`);

        const trackingData = await shiprocket.trackShipment(awb);

        if (trackingData && trackingData.success) {
            const updates = {
                tracking: {
                    trackingId: awb,
                    courier: order.tracking?.courier || 'Shiprocket',
                    currentStatus: trackingData.currentStatus,
                    lastUpdate: trackingData.lastUpdate,
                    location: trackingData.location
                }
            };

            // If delivered, update order status
            if (trackingData.delivered && order.status !== 'Delivered') {
                updates.status = 'Delivered';
                updates.deliveredAt = new Date().toISOString();
                console.log(`✅ Order ${orderId} marked as DELIVERED`);
            }

            await dataAccess.updateOrder(orderId, updates);

            res.json({
                success: true,
                currentStatus: trackingData.currentStatus,
                lastUpdate: trackingData.lastUpdate,
                delivered: trackingData.delivered
            });
        } else {
            res.json({
                success: false,
                message: 'Tracking data not available'
            });
        }

    } catch (error) {
        console.error('❌ Track order error:', error);
        res.status(500).json({
            success: false,
            message: 'Tracking failed',
            error: error.message
        });
    }
});

// Sync AWB for all dispatched orders
router.post('/sync-all', async (req, res) => {
    try {
        console.log('🔄 Syncing Shiprocket AWBs...');

        const orders = await dataAccess.getAllOrders();
        const dispatchedOrders = orders.filter(o =>
            // Broaden sync to include verified orders that might have been shipped manually
            (o.status === 'Dispatched' || o.status === 'Verified' || o.status === 'Address Verified' || o.status === 'Ready for Dispatch') &&
            (!o.shiprocket?.awb) // Only sync if AWB is missing
        );

        if (dispatchedOrders.length === 0) {
            return res.json({
                success: true,
                message: 'No dispatched orders found',
                synced: 0,
                total: 0
            });
        }

        console.log(`📦 Found ${dispatchedOrders.length} Shiprocket orders to sync`);

        let synced = 0;

        for (const order of dispatchedOrders) {
            try {
                let shiprocketData = null;

                // 1. Try with Shipment ID if we have it (Most reliable)
                if (order.shiprocket?.shipmentId) {
                    console.log(`🔍 Fetching details for ${order.orderId} using Shipment ID: ${order.shiprocket.shipmentId}`);
                    shiprocketData = await shiprocket.getShipmentDetails(order.shiprocket.shipmentId);
                }

                // 2. Fallback to searching by our Order ID + Mobile + Name + Location
                if (!shiprocketData || !shiprocketData.awb) {
                    console.log(`🔍 Searching for ${order.orderId} with location verification...`);
                    shiprocketData = await shiprocket.getOrderByChannelId(
                        order.orderId,
                        order.telNo || order.mobile,
                        order.customerName,
                        { city: order.city, pincode: order.pin || order.pincode }
                    );
                }

                if (shiprocketData && shiprocketData.awb) {
                    await dataAccess.updateOrder(order.orderId, {
                        'shiprocket.awb': shiprocketData.awb,
                        'shiprocket.shipmentId': shiprocketData.shipmentId || order.shiprocket?.shipmentId,
                        tracking: {
                            trackingId: shiprocketData.awb,
                            courier: shiprocketData.courierName || 'Shiprocket'
                        }
                    });

                    console.log(`✅ Synced AWB for ${order.orderId}: ${shiprocketData.awb} (${shiprocketData.courierName || 'Shiprocket'})`);
                    synced++;
                } else {
                    console.log(`⚠️ No AWB yet for ${order.orderId}`);
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (err) {
                console.error(`❌ Failed to sync ${order.orderId}:`, err.message);
            }
        }

        res.json({
            success: true,
            message: `Synced ${synced} out of ${dispatchedOrders.length} orders`,
            synced,
            total: dispatchedOrders.length
        });

    } catch (error) {
        console.error('❌ Sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Sync failed',
            error: error.message
        });
    }
});

// Auto-track all dispatched orders
router.post('/auto-track', async (req, res) => {
    try {
        console.log('🔍 Auto-tracking dispatched orders...');

        const orders = await dataAccess.getAllOrders();
        const dispatchedOrders = orders.filter(o =>
            o.status === 'Dispatched' &&
            (o.shiprocket?.awb || o.tracking?.trackingId)
        );

        if (dispatchedOrders.length === 0) {
            return res.json({
                success: true,
                message: 'No orders to track',
                tracked: 0
            });
        }

        console.log(`📦 Tracking ${dispatchedOrders.length} orders`);

        let tracked = 0;
        let delivered = 0;

        for (const order of dispatchedOrders) {
            try {
                const awb = order.shiprocket?.awb || order.tracking?.trackingId;

                // Get tracking status from Shiprocket
                const trackingData = await shiprocket.trackShipment(awb);

                if (trackingData && trackingData.success) {
                    const updates = {
                        'tracking.currentStatus': trackingData.currentStatus,
                        'tracking.lastUpdate': trackingData.lastUpdate,
                        'tracking.location': trackingData.location
                    };

                    // If delivered, update order status
                    if (trackingData.delivered && order.status !== 'Delivered') {
                        updates.status = 'Delivered';
                        updates.deliveredAt = new Date().toISOString();
                        delivered++;
                        console.log(`✅ Order ${order.orderId} marked as DELIVERED`);
                    }

                    await dataAccess.updateOrder(order.orderId, updates);
                    tracked++;

                    console.log(`📍 Tracked ${order.orderId}: ${trackingData.currentStatus}`);
                }
            } catch (err) {
                console.error(`❌ Failed to track ${order.orderId}:`, err.message);
            }
        }

        res.json({
            success: true,
            message: `Tracked ${tracked} orders, ${delivered} delivered`,
            tracked,
            delivered,
            total: dispatchedOrders.length
        });

    } catch (error) {
        console.error('❌ Auto-track error:', error);
        res.status(500).json({
            success: false,
            message: 'Auto-track failed',
            error: error.message
        });
    }
});

module.exports = router;
