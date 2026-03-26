const mongoose = require('mongoose');
const { Order } = require('../models');
const shiprocketAPI = require('../shiprocket');

async function fetchMissingAWB() {
    // Connect to MongoDB (if not already connected)
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    }
    const orders = await Order.find({ 'shiprocket.awb': { $exists: false } });
    console.log(`Found ${orders.length} orders missing AWB`);
    for (const order of orders) {
        try {
            const result = await shiprocketAPI.getOrderByChannelId(order.orderId, order.mobile, order.customerName, {
                city: order.city,
                pincode: order.pin
            });
            if (result && result.success && result.awb) {
                order.shiprocket.awb = result.awb;
                order.shiprocket.courierName = result.courierName || result.courier_name || '';
                await order.save();
                console.log(`Updated order ${order.orderId} with AWB ${result.awb}`);
            } else {
                console.warn(`No AWB found for order ${order.orderId}`);
            }
        } catch (err) {
            console.error(`Error processing order ${order.orderId}:`, err.message);
        }
    }
    // Do not disconnect to allow reuse in server context
}

module.exports = fetchMissingAWB;
