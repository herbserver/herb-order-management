// Detailed AWB Status Check - Save to file
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const { Order } = require('./models');

async function detailedCheck() {
    await mongoose.connect(process.env.MONGODB_URI);

    let report = '';

    // Counts
    const total = await Order.countDocuments({});
    const dispatched = await Order.countDocuments({ status: 'Dispatched' });
    const withAWB = await Order.countDocuments({
        status: 'Dispatched',
        'shiprocket.awb': { $exists: true, $ne: null, $ne: '' }
    });
    const withoutAWB = await Order.countDocuments({
        status: 'Dispatched',
        $or: [
            { 'shiprocket.awb': { $exists: false } },
            { 'shiprocket.awb': null },
            { 'shiprocket.awb': '' }
        ]
    });

    report += '\n═══════════════════════════════════════════════════════\n';
    report += '                    📊 AWB STATUS REPORT\n';
    report += '═══════════════════════════════════════════════════════\n';
    report += `Total Orders:          ${total}\n`;
    report += `Dispatched Orders:     ${dispatched}\n`;
    report += `✅ With AWB:           ${withAWB}\n`;
    report += `❌ Without AWB:        ${withoutAWB}\n`;
    report += '═══════════════════════════════════════════════════════\n\n';

    // Sample orders WITHOUT AWB (to debug)
    report += '📋 ORDERS WITHOUT AWB:\n';
    report += '─────────────────────────────────────────────────────────\n';

    const missingOrders = await Order.find({
        status: 'Dispatched',
        $or: [
            { 'shiprocket.awb': { $exists: false } },
            { 'shiprocket.awb': null },
            { 'shiprocket.awb': '' }
        ]
    }).select('orderId mobile telNo customerName dispatchedAt');

    for (const o of missingOrders) {
        const mobile = o.mobile || o.telNo || 'NO MOBILE';
        report += `${o.orderId} | ${o.customerName} | Mobile: ${mobile}\n`;
    }

    // Save to file
    fs.writeFileSync('awb-report.txt', report);
    console.log('Report saved to awb-report.txt');
    console.log(`\n✅ With AWB: ${withAWB}`);
    console.log(`❌ Without AWB: ${withoutAWB}`);

    await mongoose.disconnect();
}

detailedCheck().catch(console.error);
