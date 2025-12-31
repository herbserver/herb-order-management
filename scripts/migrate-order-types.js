/**
 * Migration Script: Auto-detect Fresh vs Reorder for existing orders
 * 
 * Logic:
 * - Sort all orders by timestamp (oldest first)
 * - Track unique mobile numbers
 * - If mobile seen for first time → Fresh
 * - If mobile already seen → Reorder
 * 
 * Run: node scripts/migrate-order-types.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/herbserver';

// Order Schema (minimal for migration)
const orderSchema = new mongoose.Schema({
    orderId: String,
    telNo: String,
    timestamp: Date,
    orderType: String
}, { strict: false });

const Order = mongoose.model('Order', orderSchema);

async function migrate() {
    console.log('🔄 Starting Order Type Migration...');
    console.log('📡 Connecting to MongoDB...');

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all orders sorted by timestamp (oldest first)
    const orders = await Order.find({}).sort({ timestamp: 1 });
    console.log(`📊 Found ${orders.length} total orders`);

    const seenMobiles = new Set();
    let freshCount = 0;
    let reorderCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    for (const order of orders) {
        const mobile = order.telNo?.trim();

        // Skip orders without mobile number
        if (!mobile) {
            skippedCount++;
            continue;
        }

        // Determine order type
        let newOrderType;
        if (seenMobiles.has(mobile)) {
            newOrderType = 'Reorder';
            reorderCount++;
        } else {
            newOrderType = 'Fresh';
            freshCount++;
            seenMobiles.add(mobile);
        }

        // Only update if orderType is different or not set
        if (order.orderType !== newOrderType) {
            await Order.updateOne(
                { _id: order._id },
                { $set: { orderType: newOrderType } }
            );
            updatedCount++;

            // Log progress every 50 updates
            if (updatedCount % 50 === 0) {
                console.log(`  ...updated ${updatedCount} orders`);
            }
        }
    }

    console.log('\n========================================');
    console.log('✅ Migration Complete!');
    console.log('========================================');
    console.log(`📊 Total Orders: ${orders.length}`);
    console.log(`🆕 Fresh Orders: ${freshCount}`);
    console.log(`🔄 Reorders: ${reorderCount}`);
    console.log(`⏭️ Skipped (no mobile): ${skippedCount}`);
    console.log(`📝 Actually Updated: ${updatedCount}`);
    console.log('========================================\n');

    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Migration Error:', err);
    process.exit(1);
});
