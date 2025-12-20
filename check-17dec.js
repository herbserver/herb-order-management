// Check local JSON file for 17 Dec orders
const fs = require('fs');
const path = require('path');

const ordersPath = path.join(__dirname, 'data', 'orders.json');

try {
    if (!fs.existsSync(ordersPath)) {
        console.log('❌ orders.json file not found!');
        console.log('Server MongoDB se data le rahi hai.\n');
        console.log('Solution: Server start karo aur browser console mein check karo.');
        process.exit(0);
    }

    const data = fs.readFileSync(ordersPath, 'utf8');
    const orders = JSON.parse(data);

    // Filter 17 Dec orders
    const dec17Orders = orders.filter(o => {
        const date = new Date(o.timestamp);
        return date.getDate() === 17 && date.getMonth() === 11 && date.getFullYear() === 2025;
    });

    console.log('=== 17 DECEMBER 2025 ORDERS (LOCAL JSON) ===\n');
    console.log(`Total Orders: ${dec17Orders.length}\n`);

    // Group by status
    const byStatus = {};
    dec17Orders.forEach(o => {
        const status = o.status || 'Unknown';
        byStatus[status] = (byStatus[status] || 0) + 1;
    });

    console.log('Status Breakdown:\n');
    Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
        console.log(`${status}: ${count}`);
    });

    console.log(`\n✅ Dispatched: ${byStatus['Dispatched'] || 0}`);
    console.log(`❌ Missing/Other: ${dec17Orders.length - (byStatus['Dispatched'] || 0)}\n`);

    // Show all order IDs by status
    const grouped = {};
    dec17Orders.forEach(o => {
        const status = o.status || 'Unknown';
        if (!grouped[status]) grouped[status] = [];
        grouped[status].push(o.orderId);
    });

    console.log('Order IDs by Status:\n');
    Object.entries(grouped).forEach(([status, ids]) => {
        console.log(`\n${status} (${ids.length}):`);
        ids.forEach(id => console.log(`  - ${id}`));
    });

} catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nServer se data check karo.');
}
