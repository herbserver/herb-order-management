// Update all order IDs to simple format - Just "Order ID-####"
const mongoose = require('mongoose');
const { Order } = require('./models');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB\n');

        // Get all orders sorted by timestamp (oldest first)
        const orders = await Order.find({}).sort({ timestamp: 1 });
        console.log(`📦 Found ${orders.length} orders\n`);

        console.log('🔄 Updating Order IDs to simple format...\n');

        // Update each order with new simple ID
        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            const oldId = order.orderId;
            const newId = `Order ID-${String(i + 1).padStart(4, '0')}`;

            // Update the order ID
            await Order.updateOne(
                { _id: order._id },
                { $set: { orderId: newId } }
            );

            console.log(`${i + 1}. ${oldId} → ${newId}`);
        }

        console.log('\n✅ All order IDs updated to simple format!\n');

        // Verify update
        const updatedOrders = await Order.find({}).sort({ timestamp: 1 }).limit(5);
        console.log('📋 First 5 orders after update:');
        updatedOrders.forEach((o, idx) => {
            console.log(`  ${idx + 1}. ${o.orderId} - ${o.customerName}`);
        });

        console.log('\n🎉 Format: "Order ID-####" applied!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
