// Fix Status Values in MongoDB
// This script updates all order statuses from UPPERCASE to Proper Case

require('dotenv').config();
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({}, { strict: false, collection: 'orders' });
const Order = mongoose.model('Order', orderSchema);

async function fixStatusValues() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Status mapping: UPPERCASE -> Proper Case
        const statusMapping = {
            'PENDING': 'Pending',
            'ADDRESS VERIFIED': 'Address Verified',
            'DISPATCHED': 'Dispatched',
            'DELIVERED': 'Delivered',
            'CANCELLED': 'Cancelled',
            'UNVERIFIED': 'Unverified',
            'ON HOLD': 'On Hold'
        };

        let totalUpdated = 0;

        for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
            console.log(`📝 Updating "${oldStatus}" → "${newStatus}"...`);

            const result = await Order.updateMany(
                { status: oldStatus },
                { $set: { status: newStatus } }
            );

            if (result.modifiedCount > 0) {
                console.log(`   ✅ Updated ${result.modifiedCount} orders`);
                totalUpdated += result.modifiedCount;
            } else {
                console.log(`   ℹ️  No orders found with status "${oldStatus}"`);
            }
        }

        console.log(`\n🎉 Total orders updated: ${totalUpdated}`);

        // Show current status distribution
        console.log('\n📊 Current status distribution:');
        const stats = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        stats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count} orders`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

fixStatusValues();
