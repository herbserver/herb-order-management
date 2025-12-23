// Check Shiprocket AWB availability - Save to file
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

async function check() {
    let report = '';

    const loginRes = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
        email: process.env.SHIPROCKET_API_EMAIL,
        password: process.env.SHIPROCKET_API_PASSWORD
    });
    const token = loginRes.data.token;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    let totalOrders = 0;
    let ordersWithAWB = 0;
    let ordersWithoutAWB = 0;
    let statusCounts = {};

    for (let page = 1; page <= 10; page++) {
        const res = await axios.get(`${SHIPROCKET_BASE}/orders`, {
            headers,
            params: { per_page: 100, page: page }
        });

        const orders = res.data?.data || [];
        if (orders.length === 0) break;

        for (const o of orders) {
            totalOrders++;
            const shipment = o.shipments?.[0] || {};
            const awb = o.awb_code || shipment.awb || '';
            const status = o.status || 'UNKNOWN';

            statusCounts[status] = (statusCounts[status] || 0) + 1;

            if (awb && awb.trim() !== '' && !awb.includes('x')) {
                ordersWithAWB++;
            } else {
                ordersWithoutAWB++;
            }
        }

        await new Promise(r => setTimeout(r, 200));
    }

    report += '═══════════════════════════════════════════════════════\n';
    report += '         📊 SHIPROCKET AWB AVAILABILITY REPORT\n';
    report += '═══════════════════════════════════════════════════════\n';
    report += `Total Orders Checked:  ${totalOrders}\n`;
    report += `✅ With AWB:           ${ordersWithAWB}\n`;
    report += `❌ Without AWB:        ${ordersWithoutAWB}\n`;
    report += '\n📊 Status Breakdown:\n';
    for (const [status, count] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
        report += `   ${status}: ${count}\n`;
    }
    report += '═══════════════════════════════════════════════════════\n';

    fs.writeFileSync('shiprocket-report.txt', report);
    console.log('Report saved to shiprocket-report.txt');
    console.log(`\n✅ With AWB: ${ordersWithAWB}`);
    console.log(`❌ Without AWB: ${ordersWithoutAWB}`);
}

check().catch(console.error);
