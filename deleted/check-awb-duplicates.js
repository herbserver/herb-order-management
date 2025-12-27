const { connectDatabase } = require('./database');
const dataAccess = require('./dataAccess');

async function checkDuplicates() {
    await connectDatabase();
    const orders = await dataAccess.getAllOrders();
    const awbMap = {};
    const duplicates = [];

    orders.forEach(order => {
        const awb = order.shiprocket?.awb || order.tracking?.trackingId;
        if (awb && awb !== 'Coming Soon' && awb !== 'In process') {
            if (!awbMap[awb]) {
                awbMap[awb] = [];
            }
            awbMap[awb].push(order.orderId);
        }
    });

    console.log('\n📊 AWB Distribution:');
    for (const [awb, orderIds] of Object.entries(awbMap)) {
        if (orderIds.length > 1) {
            console.log(`❌ AWB ${awb} is shared by ${orderIds.length} orders: ${orderIds.join(', ')}`);
            duplicates.push(awb);
        }
    }

    if (duplicates.length === 0) {
        console.log('✅ No duplicate AWBs found.');
    } else {
        console.log(`\n⚠️ Found ${duplicates.length} duplicate AWBs.`);
    }

    process.exit();
}

checkDuplicates();
