require('dotenv').config();
const mongoose = require('mongoose');

// Try to load config
let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/oms';
console.log('Connecting to:', mongoUri.substring(0, 50) + '...');

mongoose.connect(mongoUri).then(async () => {
    const db = mongoose.connection.db;
    const orders = await db.collection('orders').find(
        { status: { $in: ['Address Verified', 'Dispatched'] } }
    ).limit(10).toArray();
    
    console.log('\n=== MEDICINE ITEMS FOUND IN ORDERS ===\n');
    orders.forEach(o => {
        console.log('OrderId:', o.orderId);
        console.log('Items type:', typeof o.items, Array.isArray(o.items) ? '[Array]' : '');
        console.log('Items raw:', JSON.stringify(o.items));
        console.log('---');
    });
    
    // Also collect all unique item names
    const allNames = new Set();
    orders.forEach(o => {
        if (Array.isArray(o.items)) {
            o.items.forEach(item => {
                if (typeof item === 'string') allNames.add(item);
                else if (item && item.name) allNames.add(item.name);
                else if (item && item.productName) allNames.add(item.productName);
                else allNames.add(JSON.stringify(item));
            });
        }
    });
    
    console.log('\n=== ALL UNIQUE ITEM NAMES ===');
    allNames.forEach(n => console.log(' -', n));
    
    await mongoose.disconnect();
}).catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
