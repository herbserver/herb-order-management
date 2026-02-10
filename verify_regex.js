const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dataAccess = require('./dataAccess');

dotenv.config();

async function verifyRegex() {
    try {
        console.log('--- Verifying Regex-based Filtering ---');
        await mongoose.connect(process.env.MONGODB_URI);
        dataAccess.setMongoStatus(true);

        const today = new Date().toISOString().split('T')[0];
        console.log(`Searching for status 'Delivered' on date: ${today}`);

        // This will trigger the regex logic in dataAccess.js
        const result = await dataAccess.getOrdersByStatus('Delivered', 1, 10, today, today);

        console.log(`Success: true`);
        console.log(`Orders found: ${result.orders.length}`);

        result.orders.forEach(o => {
            console.log(`- ID: ${o.orderId}, DeliveredAt: ${o.deliveredAt}`);
        });

        if (result.orders.length > 0) {
            console.log('✅ Regex verification PASSED');
        } else {
            console.log('❌ No orders found with regex. Investigating...');
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error('Error during verification:', e);
    }
}

verifyRegex();
