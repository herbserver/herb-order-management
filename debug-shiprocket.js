const { connectDatabase } = require('./database');
const dataAccess = require('./dataAccess');
const shiprocket = require('./shiprocket');

async function debugShiprocketPush(orderId) {
    try {
        await connectDatabase();
        console.log('='.repeat(60));
        console.log(`🔍 DEBUGGING SHIPROCKET PUSH FOR: ${orderId}`);
        console.log('='.repeat(60));

        // Get order from database
        const order = await dataAccess.getOrderById(orderId);
        if (!order) {
            console.error('\n❌ Order not found in database');
            process.exit(1);
        }

        console.log('\n📦 ORDER DETAILS:');
        console.log('  Order ID:', order.orderId);
        console.log('  Customer:', order.customerName);
        console.log('  Phone:', order.telNo || order.mobile || 'MISSING');
        console.log('  Pincode:', order.pincode || order.pin || 'MISSING');
        console.log('  State:', order.state || 'MISSING');
        console.log('  Address:', order.address || 'MISSING');
        console.log('  Total:', order.total);
        console.log('  Items:', order.items?.length || 0);

        // Validate required fields
        console.log('\n✅ VALIDATING REQUIRED FIELDS:');
        const validations = {
            'Customer Name': order.customerName,
            'Phone': order.telNo || order.mobile,
            'Address': order.address,
            'Pincode': order.pincode || order.pin,
            'State': order.state
        };

        let hasErrors = false;
        for (const [field, value] of Object.entries(validations)) {
            if (!value) {
                console.log(`  ❌ ${field}: MISSING`);
                hasErrors = true;
            } else {
                console.log(`  ✅ ${field}: ${value}`);
            }
        }

        if (hasErrors) {
            console.log('\n❌ Cannot proceed - missing required fields');
            process.exit(1);
        }

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

        console.log('\n📤 SHIPROCKET PAYLOAD:');
        console.log(JSON.stringify(payload, null, 2));

        console.log('\n🚀 CALLING SHIPROCKET API...');
        const result = await shiprocket.createOrder(payload);

        console.log('\n📥 SHIPROCKET API RESPONSE:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✅ SUCCESS! Order created in Shiprocket');
            console.log('  Shiprocket Order ID:', result.orderId);
            console.log('  Shipment ID:', result.shipmentId);
            console.log('  AWB:', result.awb || 'Not generated yet');

            // Update database
            const updateData = {
                shiprocket: {
                    orderId: result.orderId,
                    shipmentId: result.shipmentId,
                    awb: result.awb || null
                }
            };

            console.log('\n💾 Updating database...');
            await dataAccess.updateOrder(orderId, updateData);
            console.log('✅ Database updated successfully');

            // Verify update
            const updated = await dataAccess.getOrderById(orderId);
            console.log('\n🔍 VERIFICATION:');
            console.log('  Shiprocket in DB:', JSON.stringify(updated.shiprocket, null, 2));

        } else {
            console.log('\n❌ FAILED! Shiprocket API returned error');
            console.log('  Error Message:', result.message);
            if (result.details) {
                console.log('  Error Details:', JSON.stringify(result.details, null, 2));
            }
        }

        console.log('\n' + '='.repeat(60));
        process.exit(result.success ? 0 : 1);

    } catch (error) {
        console.error('\n❌ EXCEPTION:');
        console.error('  Message:', error.message);
        console.error('  Stack:', error.stack);
        process.exit(1);
    }
}

// Get order ID from command line
const orderId = process.argv[2];
if (!orderId) {
    console.log('Usage: node debug-shiprocket.js "Order ID-XXXX"');
    process.exit(1);
}

debugShiprocketPush(orderId);
