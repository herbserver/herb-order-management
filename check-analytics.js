// Quick check for duplicates and analytics
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://chandanawasthi6:zqoJWdqOZsj28K9g@herb-main.6jqpg.mongodb.net/?retryWrites=true&w=majority&appName=Herb-main';

async function checkOrders() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db('herb-orders');
        const ordersCollection = db.collection('orders');

        const orders = await ordersCollection.find({}).toArray();

        console.log('=== ORDER ANALYSIS ===\n');
        console.log(`Total Orders in DB: ${orders.length}\n`);

        // Check duplicates
        const idMap = new Map();
        const duplicates = [];

        orders.forEach(order => {
            const oid = order.orderId;
            if (idMap.has(oid)) {
                duplicates.push(oid);
                idMap.set(oid, idMap.get(oid) + 1);
            } else {
                idMap.set(oid, 1);
            }
        });

        if (duplicates.length > 0) {
            console.log('⚠️  DUPLICATE ORDER IDs:');
            const uniq = [...new Set(duplicates)];
            uniq.forEach(id => {
                console.log(`   ${id} appears ${idMap.get(id)} times`);
            });
            console.log('');
        } else {
            console.log('✅ No duplicates found\n');
        }

        // Date range
        const timestamps = orders.map(o => new Date(o.timestamp)).filter(d => !isNaN(d));
        if (timestamps.length > 0) {
            timestamps.sort((a, b) => a - b);
            console.log('📅 Date Range:');
            console.log(`   First: ${timestamps[0].toLocaleDateString('en-IN')}`);
            console.log(`   Last: ${timestamps[timestamps.length - 1].toLocaleDateString('en-IN')}`);
            console.log('');
        }

        // Today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(o => {
            const d = new Date(o.timestamp);
            return !isNaN(d) && d >= today;
        });

        console.log('📊 Today\'s Stats:');
        console.log(`   Orders: ${todayOrders.length}`);
        console.log(`   Revenue: ₹${todayOrders.reduce((s, o) => s + (o.total || 0), 0)}`);
        console.log('');

        // Status breakdown
        const statuses = {};
        orders.forEach(o => {
            const s = o.status || 'Unknown';
            statuses[s] = (statuses[s] || 0) + 1;
        });

        console.log('📈 Status Breakdown (All Time):');
        Object.entries(statuses).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
            const pct = ((count / orders.length) * 100).toFixed(1);
            console.log(`   ${status}: ${count} (${pct}%)`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

checkOrders();
