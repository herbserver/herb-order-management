// Debug Order Total Amount
require('dotenv').config();
const dataAccess = require('./dataAccess');

async function checkOrderTotal() {
    console.log('🔍 Checking Order Total...\n');

    try {
        const orders = await dataAccess.getAllOrders();

        if (!orders || orders.length === 0) {
            console.log('❌ No orders found');
            return;
        }

        // Get latest order
        const sortedOrders = orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const latestOrder = sortedOrders[0];

        console.log('📦 Latest Order:', latestOrder.orderId);
        console.log('   Total:', latestOrder.total);
        console.log('   COD Amount:', latestOrder.codAmount);
        console.log('   Advance:', latestOrder.advance);
        console.log('   Items:', latestOrder.items?.length || 0);
        console.log('');

        if (latestOrder.items) {
            console.log('📋 Items:');
            latestOrder.items.forEach((item, i) => {
                console.log(`   ${i + 1}. ${item.description}`);
                console.log(`      Qty: ${item.quantity}, Amount: ${item.amount || 'N/A'}, Rate: ${item.rate || 'N/A'}`);
            });
        }

        console.log('');

        if (!latestOrder.total || latestOrder.total === 0) {
            console.log('❌ PROBLEM: Order total is 0 or missing!');
        } else {
            console.log('✅ Order total is valid:', latestOrder.total);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkOrderTotal();
