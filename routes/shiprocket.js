const express = require('express');
const router = express.Router();
const shiprocket = require('../shiprocket');
const dataAccess = require('../dataAccess');

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

        const payload = {
            order_id: order.orderId,
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: "warehouse",
            billing_customer_name: order.customerName.split(' ')[0],
            billing_last_name: order.customerName.split(' ').slice(1).join(' ') || '.',
            billing_address: order.address,
            billing_city: order.distt || order.district || 'Delhi',
            billing_pincode: order.pin || order.pincode,
            billing_state: order.state || 'Delhi',
            billing_country: "India",
            billing_phone: order.telNo,
            shipping_is_billing: true,
            order_items: order.items.map(item => ({
                name: "Medicine",
                sku: "MEDICINE",
                units: item.quantity || 1,
                selling_price: item.amount || Math.round(order.total / order.items.length),
                discount: 0,
                tax: 0,
                hsn: 0
            })),
            payment_method: "COD",
            sub_total: order.total,
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

module.exports = router;
