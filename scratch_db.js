require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('./models');

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const order = await Order.findOne({ mobile: { $exists: true, $ne: '' } });
        if (order) {
            console.log('TEST_ORDER:', JSON.stringify({
                mobile: order.mobile,
                telNo: order.telNo,
                customerName: order.customerName
            }));
        } else {
            const fallbackOrder = await Order.findOne({ telNo: { $exists: true, $ne: '' } });
            if (fallbackOrder) {
                console.log('TEST_ORDER_FALLBACK:', JSON.stringify({
                    mobile: fallbackOrder.mobile,
                    telNo: fallbackOrder.telNo,
                    customerName: fallbackOrder.customerName
                }));
            } else {
                console.log('No order found with mobile or telNo.');
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
main();
