// Quick test to verify MongoDB connection and order creation
require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('./models');

async function testOrderCreation() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test creating a simple order
        const testOrder = {
            orderId: 'TEST-001',
            customerName: 'Test Customer',
            mobileNumber: '9999999999',
            address: 'Test Address',
            status: 'Pending',
            total: 1000,
            timestamp: new Date().toISOString()
        };

        console.log('📝 Creating test order...');
        const order = new Order(testOrder);
        const saved = await order.save();

        console.log('✅ Order created successfully!');
        console.log('Order ID:', saved.orderId);
        console.log('Status:', saved.status);

        // Now try to find it
        console.log('\n🔍 Finding order by status...');
        const found = await Order.find({ status: 'Pending' }).limit(3);
        console.log(`Found ${found.length} pending orders`);
        found.forEach(o => {
            console.log(`  - ${o.orderId}: ${o.customerName} (${o.status})`);
        });

        // Clean up test order
        await Order.deleteOne({ orderId: 'TEST-001' });
        console.log('\n🗑️ Test order deleted');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

testOrderCreation();
