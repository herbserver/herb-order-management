const { connectDatabase, Order } = require('./database');
const shiprocket = require('./shiprocket');
const dataAccess = require('./dataAccess');

async function pushFinal() {
    try {
        await connectDatabase();
        console.log('🚀 FINAL PUSH ATTEMPT FOR ORDER ID-0059\n');

        const order = await dataAccess.getOrderById('Order ID-0059');
        if (!order) {
            console.error('Order not found');
            process.exit(1);
        }

        console.log('📦 Order:', order.orderId);
        console.log('Customer:', order.customerName);
        console.log('Phone:', order.telNo || order.mobile);
        console.log('Pin:', order.pincode || order.pin);

        // Build payload
        const payload = {
            order_id: order.orderId,
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: "Primary",
            billing_customer_name: order.customerName.split(' ')[0],
            billing_last_name: order.customerName.split(' ').slice(1).join(' ') || '.',
            billing_address: order.address,
            billing_city: order.district || order.city || 'City',
            billing_pincode: order.pincode || order.pin,
            billing_state: order.state,
            billing_country: "India",
            billing_email: order.email || "customer@example.com",
            billing_phone: order.telNo || order.mobile,
            shipping_is_billing: true,
            order_items: order.items.map(item => ({
                name: item.description || "Product",
                sku: (item.description || "Product").substring(0, 10).replace(/ /g, '-'),
                units: item.quantity || 1,
                selling_price: order.items.length === 1 ? order.total : 0,
                discount: 0,
                tax: 0,
                hsn: 0
            })),
            payment_method: "COD",
            sub_total: order.total,
            length: 16,
            breadth: 16,
            height: 5,
            weight: 0.5
        };

        console.log('\n📤 Calling Shiprocket...');
        const result = await shiprocket.createOrder(payload);

        if (result.success) {
            console.log('\n✅ SUCCESS!');
            console.log('Shiprocket Order ID:', result.orderId);
            console.log('Shipment ID:', result.shipmentId);
            console.log('AWB:', result.awb || 'Pending');

            // Update with correct schema fields
            const updated = await Order.updateOne(
                { orderId: 'Order ID-0059' },
                {
                    $set: {
                        'shiprocket.shiprocketOrderId': String(result.orderId),
                        'shiprocket.awb': result.awb || null,
                        'shiprocket.courierName': null
                    }
                }
            );

            console.log('\n💾 Database Update:', updated);

            // Verify
            const check = await Order.findOne({ orderId: 'Order ID-0059' });
            console.log('\n✔️ Saved Shiprocket Order ID:', check.shiprocket?.shiprocketOrderId);
            console.log('✔️ Saved AWB:', check.shiprocket?.awb || 'null');

        } else {
            console.error('\n❌ FAILED');
            console.error('Message:', result.message);
            console.error('Details:', result.details);
        }

        process.exit(result.success ? 0 : 1);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

pushFinal();
