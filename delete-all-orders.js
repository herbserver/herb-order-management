// Delete ALL Orders - Fresh Start
require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('./models');

async function deleteAllOrders() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        // Count current orders
        const count = await Order.countDocuments();
        console.log(`📊 Current orders in database: ${count}`);

        if (count === 0) {
            console.log('✅ Database already empty!');
        } else {
            console.log('\n🗑️  Deleting all orders...');
            const result = await Order.deleteMany({});
            console.log(`✅ Deleted ${result.deletedCount} orders successfully!`);
        }

        console.log('\n✨ Database is now clean and ready for fresh start!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

deleteAllOrders();
