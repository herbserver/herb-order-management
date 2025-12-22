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

// Create Order in Shiprocket
router.post('/create-order', async (req, res) => {
    try {
        const { orderId, dimensions } = req.body;
        const order = await dataAccess.getOrderById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const payload = {
            order_id: order.orderId,
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: "Primary",
            billing_customer_name: order.customerName.split(' ')[0],
            billing_last_name: order.customerName.split(' ').slice(1).join(' ') || '.',
            billing_address: order.address,
            billing_city: order.district || 'City',
            billing_pincode: order.pin || order.pincode,
            billing_state: order.state || 'State',
            billing_country: "India",
            billing_phone: order.telNo,
            shipping_is_billing: true,
            order_items: order.items.map(item => ({
                name: item.description || "Product",
                sku: (item.description || "Product").substring(0, 10).replace(/ /g, '-'),
                units: item.quantity || 1,
                selling_price: order.items.length === 1 ? order.total : 0,
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

        const result = await shiprocket.createOrder(payload);
        if (result.success) {
            await dataAccess.updateOrder(orderId, {
                status: 'Dispatched',
                dispatchedAt: new Date().toISOString(),
                shiprocket: { orderId: result.orderId, shipmentId: result.shipmentId, awb: result.awb }
            });
            res.json({ success: true, message: 'Order pushed to Shiprocket!' });
        } else res.status(400).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Dispatch failed' });
    }
});

module.exports = router;
