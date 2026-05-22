require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('../models');

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected.');

        const allDelivered = await Order.find({ status: 'Delivered' }).sort({ deliveredAt: -1 }).limit(20);
        console.log(`Total Delivered orders found (max 20): ${allDelivered.length}`);
        
        allDelivered.forEach(o => {
            console.log(`Order: #${o.orderId}, Name: ${o.customerName}, deliveredAt: ${o.deliveredAt}, followUpSent: ${o.followUpSent}`);
        });

        // Test the exact query used in delivery-followup
        const now = Date.now();
        const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
        const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);

        console.log('\n--- 24h-48h follow-up window ---');
        console.log(`Now: ${new Date(now).toISOString()}`);
        console.log(`24h Ago: ${twentyFourHoursAgo.toISOString()}`);
        console.log(`48h Ago: ${fortyEightHoursAgo.toISOString()}`);

        const matching = await Order.find({
            status: 'Delivered',
            deliveredAt: {
                $exists: true,
                $ne: '',
                $lte: twentyFourHoursAgo.toISOString(),
                $gte: fortyEightHoursAgo.toISOString()
            },
            followUpSent: { $ne: true }
        });

        console.log(`\nMatching orders in 24h-48h window: ${matching.length}`);
        matching.forEach(o => {
            console.log(`Order: #${o.orderId}, Name: ${o.customerName}, deliveredAt: ${o.deliveredAt}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
