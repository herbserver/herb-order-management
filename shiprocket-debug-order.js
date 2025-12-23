const shiprocket = require('./shiprocket');
require('dotenv').config();

async function debugOrder(orderId) {
    try {
        console.log(`🔍 Debugging Order: ${orderId}`);
        const token = await shiprocket.getToken();
        const axios = require('axios');

        const response = await axios.get(`https://apiv2.shiprocket.in/v1/external/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            params: {
                channel_order_id: orderId
            }
        });

        const fs = require('fs');
        fs.writeFileSync('sr-response.json', JSON.stringify(response.data, null, 2));
        console.log('✅ Full response saved to sr-response.json');

        if (response.data.data && response.data.data.length > 0) {
            const order = response.data.data[0];
            console.log('\n⭐ First Order Match Details:');
            console.log(`   - ID: ${order.id}`);
            console.log(`   - Channel Order ID: ${order.channel_order_id}`);
            console.log(`   - Customer: ${order.customer_name}`);
            console.log(`   - Phone: ${order.customer_phone}`);
            console.log(`   - AWB: ${order.awb_code}`);
            if (order.shipments && order.shipments.length > 0) {
                console.log(`   - Shipment Courier: ${order.shipments[0].courier_name}`);
                console.log(`   - Shipment ID: ${order.shipments[0].id}`);
            }
        } else {
            console.log('\n❌ No orders found for this ID.');
        }

    } catch (error) {
        console.error('❌ Debug Error:', error.response?.data || error.message);
    }
}

// Get order ID from command line or use a default from user's screenshot
const targetId = process.argv[2] || 'Order ID-0188';
debugOrder(targetId);
