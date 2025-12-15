// Verify Status Values and Show Sample Orders
require('dotenv').config();
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({}, { strict: false, collection: 'orders' });
const Order = mongoose.model('Order', orderSchema);

async function verifyStatusValues() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Show status distribution
        console.log('📊 Current status distribution:');
        const stats = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        stats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count} orders`);
        });

        // Show sample pending orders
        console.log('\n📝 Sample Pending Orders (first 3):');
        const pendingOrders = await Order.find({ status: 'Pending' }).limit(3);
        pendingOrders.forEach(order => {
            console.log(`   ID: ${order.orderId}, Customer: ${order.customerName}, Status: "${order.status}"`);
        });

        // Show sample verified orders
        console.log('\n✅ Sample Address Verified Orders (first 3):');
        const verifiedOrders = await Order.find({ status: 'Address Verified' }).limit(3);
        verifiedOrders.forEach(order => {
            console.log(`   ID: ${order.orderId}, Customer: ${order.customerName}, Status: "${order.status}"`);
        });

        // Check for any unusual status values
        console.log('\n🔍 Checking for unusual status values...');
        const allStatuses = await Order.distinct('status');
        console.log('All unique statuses in database:');
        allStatuses.forEach(status => {
            console.log(`   - "${status}" (length: ${status ? status.length : 0})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

verifyStatusValues();
