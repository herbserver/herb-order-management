/**
 * BULK AWB SYNC - Name + Mobile + Order ID Based
 * Customer name se bhi match karega
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const { Order } = require('../models');

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';
let authToken = null;

async function getShiprocketToken() {
    if (authToken) return authToken;
    console.log('🔐 Shiprocket me login ho rahe hai...');
    const response = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
        email: process.env.SHIPROCKET_API_EMAIL,
        password: process.env.SHIPROCKET_API_PASSWORD
    });
    authToken = response.data.token;
    console.log('✅ Shiprocket login successful!');
    return authToken;
}

async function fetchAllShiprocketOrders() {
    const token = await getShiprocketToken();
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    let allOrders = [];
    const MAX_PAGES = 20;

    console.log('\n📦 Shiprocket se orders download ho rahe hai...');

    for (let page = 1; page <= MAX_PAGES; page++) {
        try {
            const response = await axios.get(`${SHIPROCKET_BASE}/orders`, {
                headers,
                params: { per_page: 100, page: page }
            });

            const orders = response.data?.data || [];
            if (orders.length === 0) break;

            allOrders = allOrders.concat(orders);
            console.log(`📄 Page ${page}/${MAX_PAGES}: ${orders.length} orders (Total: ${allOrders.length})`);

            await new Promise(r => setTimeout(r, 300));
        } catch (err) {
            console.error(`❌ Page ${page} error:`, err.message);
            break;
        }
    }

    console.log(`\n✅ Total ${allOrders.length} orders downloaded!\n`);
    return allOrders;
}

// Normalize name for comparison
function normalizeName(name) {
    if (!name) return '';
    return String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric
        .trim();
}

// Normalize Order ID
function normalizeOrderId(orderId) {
    if (!orderId) return '';
    const cleaned = String(orderId).replace(/ORDER\s*ID[-\s]*/gi, '').trim();
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) return String(num);
    return cleaned.toUpperCase();
}

// Extract AWB from Shiprocket order
function extractAWB(srOrder) {
    const shipment = srOrder.shipments?.[0] || {};
    const awb = srOrder.awb_code || shipment.awb || shipment.awb_code || '';
    const courier = shipment.courier || shipment.sr_courier_name || shipment.courier_name ||
        srOrder.courier_name || srOrder.courier || 'Unknown';

    if (awb && awb.trim() !== '') {
        return { awb: awb.trim(), courierName: courier.trim(), shiprocketOrderId: srOrder.id };
    }
    return null;
}

// Build lookup maps
function buildShiprocketMaps(shiprocketOrders) {
    const byOrderId = new Map();
    const byMobile = new Map();
    const byName = new Map();  // NEW: Name based lookup

    for (const srOrder of shiprocketOrders) {
        const awbData = extractAWB(srOrder);
        if (!awbData) continue;

        // Index by Order ID
        const normalizedId = normalizeOrderId(srOrder.channel_order_id);
        if (normalizedId && !byOrderId.has(normalizedId)) {
            byOrderId.set(normalizedId, { ...awbData, channelOrderId: srOrder.channel_order_id });
        }

        // Index by Mobile
        const phone = String(srOrder.customer_phone || '').replace(/\D/g, '');
        const mobile10 = phone.slice(-10);
        if (mobile10.length === 10 && !mobile10.includes('x') && !byMobile.has(mobile10)) {
            byMobile.set(mobile10, { ...awbData, channelOrderId: srOrder.channel_order_id });
        }

        // Index by Name (NEW)
        const normalizedName = normalizeName(srOrder.customer_name);
        if (normalizedName.length >= 3) {  // Only names with at least 3 chars
            if (!byName.has(normalizedName)) {
                byName.set(normalizedName, []);
            }
            byName.get(normalizedName).push({
                ...awbData,
                channelOrderId: srOrder.channel_order_id,
                customerName: srOrder.customer_name,
                pincode: srOrder.customer_pincode
            });
        }
    }

    return { byOrderId, byMobile, byName };
}

// Main sync function
async function bulkAWBSync() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('      🚀 BULK AWB SYNC - Name + Mobile + Order ID');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📦 MongoDB se connect ho rahe hai...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected!\n');

    const shiprocketOrders = await fetchAllShiprocketOrders();

    console.log('🗂️ Building lookup maps...');
    const { byOrderId, byMobile, byName } = buildShiprocketMaps(shiprocketOrders);
    console.log(`   📌 ${byOrderId.size} orders by Order ID`);
    console.log(`   📌 ${byMobile.size} orders by Mobile`);
    console.log(`   📌 ${byName.size} unique names indexed\n`);

    const localOrders = await Order.find({
        status: 'Dispatched',
        $or: [
            { 'shiprocket.awb': { $exists: false } },
            { 'shiprocket.awb': null },
            { 'shiprocket.awb': '' }
        ]
    });
    console.log(`📋 ${localOrders.length} orders me AWB missing hai\n`);

    if (localOrders.length === 0) {
        console.log('✅ Sabhi orders me AWB hai!');
        await mongoose.disconnect();
        return;
    }

    let updatedByOrderId = 0;
    let updatedByMobile = 0;
    let updatedByName = 0;
    let notFoundCount = 0;

    console.log('🔄 AWB matching shuru...\n');

    for (const order of localOrders) {
        let match = null;
        let matchType = '';

        // 1. Try Order ID match
        const normalizedId = normalizeOrderId(order.orderId);
        if (normalizedId && byOrderId.has(normalizedId)) {
            match = byOrderId.get(normalizedId);
            matchType = 'ORDER_ID';
        }

        // 2. Try Mobile match
        if (!match) {
            const mobile = String(order.mobile || order.telNo || '').replace(/\D/g, '').slice(-10);
            if (mobile.length === 10 && byMobile.has(mobile)) {
                match = byMobile.get(mobile);
                matchType = 'MOBILE';
            }
        }

        // 3. Try Name match (NEW)
        if (!match) {
            const localName = normalizeName(order.customerName);
            const localPin = String(order.pin || order.pincode || '').replace(/\D/g, '');

            if (localName.length >= 3 && byName.has(localName)) {
                const candidates = byName.get(localName);

                // If only one match with this name, use it
                if (candidates.length === 1) {
                    match = candidates[0];
                    matchType = 'NAME_EXACT';
                } else {
                    // Multiple matches - try to narrow down by pincode
                    const pincodeMatch = candidates.find(c => c.pincode === localPin);
                    if (pincodeMatch) {
                        match = pincodeMatch;
                        matchType = 'NAME+PIN';
                    } else {
                        // Just use first match (risky but better than nothing)
                        match = candidates[0];
                        matchType = 'NAME_FIRST';
                    }
                }
            }
        }

        if (match) {
            await Order.updateOne(
                { _id: order._id },
                {
                    $set: {
                        'shiprocket.awb': match.awb,
                        'shiprocket.courierName': match.courierName,
                        'shiprocket.shiprocketOrderId': match.shiprocketOrderId,
                        'tracking.trackingId': match.awb,
                        'tracking.courier': match.courierName
                    }
                }
            );

            console.log(`✅ ${order.orderId} | ${order.customerName} → AWB: ${match.awb} [${matchType}]`);

            if (matchType === 'ORDER_ID') updatedByOrderId++;
            else if (matchType === 'MOBILE') updatedByMobile++;
            else updatedByName++;
        } else {
            console.log(`⚠️ ${order.orderId} | ${order.customerName} - NOT FOUND`);
            notFoundCount++;
        }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                    📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ By Order ID: ${updatedByOrderId}`);
    console.log(`✅ By Mobile:   ${updatedByMobile}`);
    console.log(`✅ By Name:     ${updatedByName}`);
    console.log(`❌ Not Found:   ${notFoundCount}`);
    console.log(`📊 Total:       ${localOrders.length}`);
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    console.log('✅ Done!\n');
}

bulkAWBSync().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
