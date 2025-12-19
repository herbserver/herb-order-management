const { connectDatabase } = require('./database');
const dataAccess = require('./dataAccess');
const shiprocket = require('./shiprocket');

async function retryShiprocketPush(orderId) {
    try {
        await connectDatabase();
        console.log(`🔄 Retrying Shiprocket push for: ${orderId}`);

        // Get order from database
        const order = await dataAccess.getOrderById(orderId);
        if (!order) {
            console.error('❌ Order not found in database');
            process.exit(1);
        }

        console.log('📦 Order found:', order.orderId);
        console.log('Customer:', order.customerName);
        console.log('Phone:', order.telNo || order.mobile);
        console.log('Pincode:', order.pincode || order.pin);

        // Prepare Shiprocket payload
        const currentDate = new Date().toISOString().split('T')[0];
        const payload = {
            order_id: order.orderId,
            order_date: currentDate,
            pickup_location: "Primary",
            billing_customer_name: order.customerName.split(' ')[0],
            billing_last_name: order.customerName.split(' ').slice(1).join(' ') || '.',
            billing_address: order.address,
            billing_city: order.district || order.city || 'City',
            billing_pincode: order.pincode || order.pin,
            billing_state: order.state || 'State',
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

        console.log('\n📤 Sending to Shiprocket...');
        console.log(JSON.stringify(payload, null, 2));

        const result = await shiprocket.createOrder(payload);

        if (result.success) {
            console.log('\n✅ Success! Shiprocket Order Created');
            console.log('Shiprocket Order ID:', result.orderId);
            console.log('Shipment ID:', result.shipmentId);
            console.log('AWB:', result.awb || 'Will be generated later');

            // Update database
            const updateData = {
                status: 'Dispatched',
                dispatchedAt: new Date().toISOString(),
                shiprocket: {
                    orderId: result.orderId,
                    shipmentId: result.shipmentId,
                    awb: result.awb
                }
            };

            await dataAccess.updateOrder(orderId, updateData);
            console.log('\n💾 Database updated successfully');

        } else {
            console.error('\n❌ Shiprocket API Error:');
            console.error('Message:', result.message);
            if (result.details) {
                console.error('Details:', JSON.stringify(result.details, null, 2));
            }
        }

        process.exit(result.success ? 0 : 1);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Get order ID from command line or use default
const orderId = process.argv[2] || 'Order ID-0059';
retryShiprocketPush(orderId);
