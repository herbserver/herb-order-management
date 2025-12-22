// Quick MongoDB Check
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkMongoDB() {
    console.log('🔍 Checking MongoDB...\n');

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.log('❌ MONGODB_URI not set in .env');
        return;
    }

    console.log('✅ MongoDB URI found');

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db();

        // Check orders collection
        const ordersCount = await db.collection('orders').countDocuments();
        console.log(`📦 Orders in database: ${ordersCount}`);

        if (ordersCount > 0) {
            const latestOrder = await db.collection('orders').findOne({}, { sort: { timestamp: -1 } });
            console.log('\n📋 Latest Order:');
            console.log('   Order ID:', latestOrder.orderId);
            console.log('   Customer:', latestOrder.customerName);
            console.log('   Status:', latestOrder.status);
            console.log('   Phone:', latestOrder.telNo);
            console.log('   Pincode:', latestOrder.pin || latestOrder.pincode);
            console.log('   District:', latestOrder.distt);
            console.log('   State:', latestOrder.state);
        }

    } catch (error) {
        console.error('❌ MongoDB Error:', error.message);
    } finally {
        await client.close();
    }
}

checkMongoDB();
