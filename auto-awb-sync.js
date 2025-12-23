/**
 * AUTO AWB SYNC - Background Job
 * Har 5 minute me Shiprocket se AWB fetch karke database update karega
 */
const axios = require('axios');
const { Order } = require('./models');

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';
let authToken = null;
let tokenExpiry = null;
let isRunning = false;
let syncInterval = null;

// Shiprocket Auth Token
async function getShiprocketToken() {
    if (authToken && tokenExpiry && new Date() < tokenExpiry) {
        return authToken;
    }

    const response = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
        email: process.env.SHIPROCKET_API_EMAIL,
        password: process.env.SHIPROCKET_API_PASSWORD
    });

    authToken = response.data.token;
    tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000); // 9 days
    return authToken;
}

// Shiprocket se recent orders fetch karo
async function fetchRecentShiprocketOrders() {
    const token = await getShiprocketToken();
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    let allOrders = [];

    // Sirf 3 pages (300 recent orders) - background job ke liye enough
    for (let page = 1; page <= 3; page++) {
        try {
            const response = await axios.get(`${SHIPROCKET_BASE}/orders`, {
                headers,
                params: { per_page: 100, page: page }
            });

            const orders = response.data?.data || [];
            if (orders.length === 0) break;

            allOrders = allOrders.concat(orders);

            // Rate limiting
            await new Promise(r => setTimeout(r, 200));
        } catch (err) {
            console.error(`❌ [Auto-Sync] Page ${page} fetch error:`, err.message);
            break;
        }
    }

    return allOrders;
}

// Mobile number se match karke AWB dhundo
function findAWBByMobile(mobile, shiprocketOrders) {
    if (!mobile) return null;

    const targetMobile = String(mobile).replace(/\D/g, '').slice(-10);
    if (targetMobile.length !== 10) return null;

    for (const srOrder of shiprocketOrders) {
        const srPhone = String(srOrder.customer_phone || srOrder.billing_phone || '').replace(/\D/g, '');
        const srMobile10 = srPhone.slice(-10);

        if (srMobile10 === targetMobile) {
            const shipment = srOrder.shipments?.[0] || {};
            const awb = srOrder.awb_code || shipment.awb || shipment.awb_code || '';
            const courier = shipment.courier || shipment.sr_courier_name || srOrder.courier_name || 'Unknown';

            if (awb && awb.trim() !== '') {
                return {
                    awb: awb.trim(),
                    courierName: courier.trim(),
                    shiprocketOrderId: srOrder.id
                };
            }
        }
    }
    return null;
}

// Main sync function
async function syncAWBs() {
    if (isRunning) {
        console.log('⏳ [Auto-Sync] Already running, skipping...');
        return;
    }

    isRunning = true;

    try {
        console.log('\n🔄 [Auto-Sync] Starting AWB sync...');

        // 1. Dispatched orders jinme AWB nahi hai
        const ordersWithoutAWB = await Order.find({
            status: 'Dispatched',
            $or: [
                { 'shiprocket.awb': { $exists: false } },
                { 'shiprocket.awb': null },
                { 'shiprocket.awb': '' }
            ]
        }).select('orderId mobile telNo customerName city pin pincode');

        if (ordersWithoutAWB.length === 0) {
            console.log('✅ [Auto-Sync] Sabhi orders me AWB hai!');
            isRunning = false;
            return;
        }

        console.log(`📦 [Auto-Sync] ${ordersWithoutAWB.length} orders me AWB missing hai`);

        // 2. Shiprocket se recent orders fetch karo
        const shiprocketOrders = await fetchRecentShiprocketOrders();
        console.log(`📡 [Auto-Sync] ${shiprocketOrders.length} orders Shiprocket se mile`);

        // 3. Match karke update karo
        let updated = 0;

        for (const order of ordersWithoutAWB) {
            const mobile = order.mobile || order.telNo;
            const match = findAWBByMobile(mobile, shiprocketOrders);

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
                console.log(`✅ [Auto-Sync] ${order.orderId} → AWB: ${match.awb} | ${match.courierName}`);
                updated++;
            }
        }

        console.log(`🎉 [Auto-Sync] Complete! ${updated}/${ordersWithoutAWB.length} orders updated\n`);

    } catch (error) {
        console.error('❌ [Auto-Sync] Error:', error.message);
    } finally {
        isRunning = false;
    }
}

// Start background sync (har 5 minute)
function startAutoSync(intervalMinutes = 5) {
    if (syncInterval) {
        console.log('⚠️ [Auto-Sync] Already started');
        return;
    }

    console.log(`🚀 [Auto-Sync] Started! Will sync every ${intervalMinutes} minutes`);

    // Pehli baar 30 second baad run karo (server startup ke baad)
    setTimeout(() => {
        syncAWBs();
    }, 30000);

    // Phir har X minutes me
    const intervalMs = intervalMinutes * 60 * 1000;
    syncInterval = setInterval(syncAWBs, intervalMs);
}

// Stop background sync
function stopAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('🛑 [Auto-Sync] Stopped');
    }
}

// Manual trigger
async function triggerSync() {
    await syncAWBs();
}

module.exports = {
    startAutoSync,
    stopAutoSync,
    triggerSync,
    syncAWBs
};
