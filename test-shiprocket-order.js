// Test Shiprocket Order Creation with Real Data
require('dotenv').config();
const shiprocket = require('./shiprocket');
const dataAccess = require('./dataAccess');

async function testShiprocketOrderCreation() {
    console.log('🧪 Testing Shiprocket Order Creation...\n');

    try {
        // Get the most recent order (any status)
        const orders = await dataAccess.getAllOrders();

        if (!orders || orders.length === 0) {
            console.log('❌ No orders found in database');
            return;
        }

        // Sort by timestamp and get the latest
        const sortedOrders = orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const testOrder = sortedOrders[0];

        console.log('📦 Test Order:', testOrder.orderId);
        console.log('   Status:', testOrder.status);
        console.log('   Customer:', testOrder.customerName);
        console.log('   Phone:', testOrder.telNo);
        console.log('   Pincode:', testOrder.pin || testOrder.pincode);
        console.log('   District:', testOrder.distt);
        console.log('   State:', testOrder.state);
        console.log('');

        // Create Shiprocket payload
        const payload = {
            order_id: testOrder.orderId,
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: "Primary",
            billing_customer_name: testOrder.customerName.split(' ')[0],
            billing_last_name: testOrder.customerName.split(' ').slice(1).join(' ') || '.',
            billing_address: testOrder.address,
            billing_city: testOrder.distt || 'City',
            billing_pincode: testOrder.pin || testOrder.pincode,
            billing_state: testOrder.state || 'State',
            billing_country: "India",
            billing_phone: testOrder.telNo,
            shipping_is_billing: true,
            order_items: testOrder.items.map(item => ({
                name: item.description || "Product",
                sku: (item.description || "Product").substring(0, 10).replace(/ /g, '-'),
                units: item.quantity || 1,
                selling_price: testOrder.items.length === 1 ? testOrder.total : 0,
                discount: 0,
                tax: 0,
                hsn: 0
            })),
            payment_method: "COD",
            sub_total: testOrder.total,
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5
        };

        console.log('📤 Sending to Shiprocket...');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('');

        const result = await shiprocket.createOrder(payload);

        console.log('📡 Shiprocket Response:');
        console.log(JSON.stringify(result, null, 2));
        console.log('');

        if (result.success) {
            console.log('✅ Order Created Successfully!');
            console.log('   Order ID:', result.orderId);
            console.log('   Shipment ID:', result.shipmentId);
            console.log('   AWB:', result.awb);
        } else {
            console.log('❌ Order Creation Failed!');
            console.log('   Message:', result.message);
            if (result.details) {
                console.log('   Details:', JSON.stringify(result.details, null, 2));
            }
        }

    } catch (error) {
        console.error('❌ Test Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testShiprocketOrderCreation();
