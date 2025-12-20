// Find Missing 17 Dec Orders via API
const http = require('http');

function fetchOrders() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3000/api/orders', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.orders || []);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function findMissing17DecOrders() {
    try {
        console.log('Fetching orders from server...\n');
        const allOrders = await fetchOrders();

        // Filter 17 Dec 2025 orders
        const dec17Orders = allOrders.filter(o => {
            const date = new Date(o.timestamp);
            return date.getDate() === 17 &&
                date.getMonth() === 11 &&
                date.getFullYear() === 2025;
        });

        console.log('=== 17 DECEMBER 2025 - DETAILED ANALYSIS ===\n');
        console.log(`📊 Total Orders: ${dec17Orders.length}\n`);

        // Group by status
        const byStatus = {};
        dec17Orders.forEach(o => {
            const status = o.status || 'NO STATUS';
            if (!byStatus[status]) byStatus[status] = [];
            byStatus[status].push(o);
        });

        // Show status breakdown
        console.log('STATUS BREAKDOWN:\n');
        Object.entries(byStatus).sort((a, b) => b[1].length - a[1].length).forEach(([status, orders]) => {
            console.log(`${status}: ${orders.length} orders`);
        });

        console.log(`\n${'='.repeat(60)}\n`);

        // Show dispatched orders
        const dispatched = byStatus['Dispatched'] || [];
        console.log(`✅ DISPATCHED (${dispatched.length}):\n`);
        dispatched.forEach(o => {
            console.log(`   ${o.orderId} - ${o.customerName} - ₹${o.total}`);
        });

        console.log(`\n${'='.repeat(60)}\n`);

        // Show NON-dispatched orders (MISSING ONES!)
        const nonDispatched = dec17Orders.filter(o => o.status !== 'Dispatched');
        console.log(`❌ NON-DISPATCHED / MISSING (${nonDispatched.length}):\n`);

        nonDispatched.forEach(o => {
            console.log(`   ${o.orderId}`);
            console.log(`      Customer: ${o.customerName}`);
            console.log(`      Amount: ₹${o.total}`);
            console.log(`      Status: ${o.status || 'NO STATUS'}`);
            if (o.verificationRemark?.text) {
                console.log(`      Remark: ${o.verificationRemark.text}`);
            }
            console.log('');
        });

        console.log(`\n${'='.repeat(60)}\n`);
        console.log('SUMMARY:');
        console.log(`Total: ${dec17Orders.length}`);
        console.log(`Dispatched: ${dispatched.length}`);
        console.log(`Missing/Other: ${nonDispatched.length}`);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.log('\nMake sure server is running on localhost:3000');
    }
}

findMissing17DecOrders();
