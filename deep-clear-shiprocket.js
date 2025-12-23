const { connectDatabase } = require('./database');
const dataAccess = require('./dataAccess');

async function deepClear() {
    await connectDatabase();
    const orders = await dataAccess.getAllOrders();
    const dispatched = orders.filter(o => o.status === 'Dispatched');

    console.log(`\n🧹 Deep clearing Shiprocket data for ${dispatched.length} dispatched orders...`);

    let count = 0;
    for (const order of dispatched) {
        await dataAccess.updateOrder(order.orderId, {
            'shiprocket': null,
            'tracking': null
        });
        count++;
    }

    console.log(`\n✨ Successfully cleared data for ${count} orders.`);
    console.log('🚀 Now restart the server and try "Sync AWB" again.');
    process.exit();
}

deepClear().catch(err => {
    console.error(err);
    process.exit(1);
});
