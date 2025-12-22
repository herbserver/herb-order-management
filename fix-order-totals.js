// Fix Orders with Total = 0
require('dotenv').config();
const dataAccess = require('./dataAccess');

async function fixOrderTotals() {
    console.log('🔧 Fixing Orders with Total = 0...\n');

    try {
        const orders = await dataAccess.getAllOrders();

        if (!orders || orders.length === 0) {
            console.log('❌ No orders found');
            return;
        }

        let fixed = 0;

        for (const order of orders) {
            // Check if total is 0 or missing
            if (!order.total || order.total === 0) {
                // Try to calculate from codAmount
                const newTotal = order.codAmount || 0;

                if (newTotal > 0) {
                    await dataAccess.updateOrder(order.orderId, { total: newTotal });
                    console.log(`✅ Fixed ${order.orderId}: total = ${newTotal}`);
                    fixed++;
                } else {
                    console.log(`⚠️  ${order.orderId}: Cannot fix - codAmount also 0`);
                }
            }
        }

        console.log(`\n✅ Fixed ${fixed} orders!`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixOrderTotals();
