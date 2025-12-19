const { connectDatabase, Order } = require('./database');

async function manualFix() {
    await connectDatabase();

    console.log('🔧 MANUAL FIX FOR ORDER ID-0059\n');

    // First, let's see current state
    let order = await Order.findOne({ orderId: 'Order ID-0059' });
    console.log('BEFORE UPDATE:');
    console.log('Shiprocket:', order.shiprocket);
    console.log('');

    // Try updating with explicit object
    const result = await Order.updateOne(
        { orderId: 'Order ID-0059' },
        {
            $set: {
                shiprocket: {
                    orderId: 3775758,
                    shipmentId: 4271929,
                    awb: null
                }
            }
        }
    );

    console.log('Update Result:', result);
    console.log('');

    // Verify
    order = await Order.findOne({ orderId: 'Order ID-0059' });
    console.log('AFTER UPDATE:');
    console.log('Shiprocket:', order.shiprocket);
    console.log('Order ID:', order.shiprocket?.orderId);
    console.log('Shipment ID:', order.shiprocket?.shipmentId);

    process.exit(0);
}

manualFix().catch(console.error);
