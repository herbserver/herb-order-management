// Debug matching issue - save to file
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const { Order } = require('./models');

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);

    let report = '';

    // Get sample local orders
    const localOrders = await Order.find({ status: 'Dispatched' }).select('orderId mobile telNo').limit(10);

    report += '\n📋 LOCAL ORDERS (First 10):\n';
    report += '─────────────────────────────────────────────────────────\n';
    for (const o of localOrders) {
        report += `orderId: "${o.orderId}" | Mobile: "${o.mobile || o.telNo}"\n`;
    }

    // Login to Shiprocket
    const loginRes = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
        email: process.env.SHIPROCKET_API_EMAIL,
        password: process.env.SHIPROCKET_API_PASSWORD
    });
    const token = loginRes.data.token;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Get some Shiprocket orders with AWB
    const res = await axios.get(`${SHIPROCKET_BASE}/orders`, {
        headers,
        params: { per_page: 20, page: 1 }
    });

    report += '\n📦 SHIPROCKET ORDERS (First 20 with AWB):\n';
    report += '─────────────────────────────────────────────────────────\n';
    for (const o of res.data?.data || []) {
        const shipment = o.shipments?.[0] || {};
        const awb = o.awb_code || shipment.awb || '';
        if (awb && awb.trim() !== '') {
            report += `channel_order_id: "${o.channel_order_id}" | AWB: ${awb}\n`;
        }
    }

    fs.writeFileSync('debug-report.txt', report);
    console.log('Debug report saved to debug-report.txt');

    await mongoose.disconnect();
}

debug().catch(console.error);
