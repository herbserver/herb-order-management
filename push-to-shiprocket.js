const { connectDatabase } = require('./database');
const dataAccess = require('./dataAccess');
const shiprocket = require('./shiprocket');

async function pushOrderToShiprocket(orderId) {
    try {
        await connectDatabase();
        console.log('============================================');
        console.log('  PUSHING ORDER TO SHIPROCKET');
        console.log('============================================\n');

        // Get order
        const order = await dataAccess.getOrderById(orderId);
        if (!order) {
            console.error('❌ Order not found:', orderId);
            process.exit(1);
        }

        console.log('📦 Order Found:');
        console.log('  ID:', order.orderId);
        console.log('  Customer:', order.customerName);
        console.log('  Phone:', order.telNo || order.mobile);
        console.log('  Pin:', order.pincode || order.pin);
        console.log('  Total:', order.total);

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
            order_items: [{
                name: "Medicine",
                sku: "MEDICINE",
                units: order.items && order.items.length > 0
                    ? order.items.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0)
                    : 1,
                selling_price: order.codAmount || order.total,  // Direct COD amount
                discount: 0,
                tax: 0,
                hsn: 0
            }],
            payment_method: "COD",
            sub_total: order.total,
            length: 16,
            breadth: 16,
            height: 5,
            weight: 0.5
        };

        console.log('\n🚀 Calling Shiprocket API...\n');

        const result = await shiprocket.createOrder(payload);

        console.log('============================================');
        if (result.success) {
            console.log('✅ SUCCESS! Order created in Shiprocket');
            console.log('============================================\n');
            console.log('Shiprocket Order ID:', result.orderId);
            console.log('Shipment ID:', result.shipmentId);
            console.log('AWB:', result.awb || 'Will generate later');

            // Update database using correct schema field names
            const { Order } = require('./database');
            const updated = await Order.findOneAndUpdate(
                { orderId: orderId },
                {
                    $set: {
                        'shiprocket.shiprocketOrderId': result.orderId.toString(),
                        'shiprocket.awb': result.awb || null,
                        'shiprocket.courierName': result.response?.courier_name || null,
                        'status': 'Dispatched',
                        'dispatchedAt': new Date().toISOString()
                    }
                },
                { new: true }
            );

            console.log('\n💾 Database Updated');
            console.log('Verification:', {
                shiprocketOrderId: updated.shiprocket?.shiprocketOrderId,
                awb: updated.shiprocket?.awb
            });

            console.log('\n🎯 Next Steps:');
            console.log('1. Go to app.shiprocket.in/orders');
            console.log(`2. Search for: ${orderId} or ${result.orderId}`);
            console.log('3. Order will be in "New Orders" section');

        } else {
            console.log('❌ FAILED! Shiprocket returned error');
            console.log('============================================\n');
            console.log('Error:', result.message);
            if (result.details) {
                console.log('Details:', JSON.stringify(result.details, null, 2));
            }
        }

        process.exit(result.success ? 0 : 1);

    } catch (error) {
        console.error('\n❌ Exception:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

const orderId = process.argv[2] || 'Order ID-0059';
pushOrderToShiprocket(orderId);
