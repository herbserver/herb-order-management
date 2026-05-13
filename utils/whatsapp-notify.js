/**
 * WhatsApp Automatic Order Notification Utility
 * -----------------------------------------------
 * Sends automatic WhatsApp messages to customers
 * when their order status changes.
 *
 * Templates (Meta approved):
 *  1. order_confirm      → Order placed / booked        (6 params)
 *  2. address_verify     → Address verified              (6 params)
 *  3. order_dispatch     → Order dispatched with AWB     (7 params)
 *  4. out_for_delivery   → Out For Delivery              (4 params)
 *  5. delivered          → Order delivered               (3 params)
 */

const axios = require('axios');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Format phone number to WhatsApp-compatible format (91XXXXXXXXXX)
 */
function formatPhone(phone) {
    if (!phone) return null;
    let p = String(phone).replace(/\D/g, ''); // remove non-digits
    if (p.length === 10) p = '91' + p;
    if (p.length === 11 && p.startsWith('0')) p = '91' + p.slice(1);
    if (p.length < 10) return null;
    return p;
}

/**
 * Build a product/items summary string from order items array
 * e.g. "Spray Oil x2, PainOver Capsule x1"
 */
function buildItemsList(items) {
    try {
        if (!items || !Array.isArray(items) || items.length === 0) return 'N/A';
        const counts = {};
        items.forEach(item => {
            const name = (typeof item === 'string')
                ? item.trim()
                : (item.product || item.description || item.name || 'Item').trim();
            const qty = (typeof item === 'object') ? (parseInt(item.quantity || item.qty) || 1) : 1;
            counts[name] = (counts[name] || 0) + qty;
        });
        const summary = Object.entries(counts)
            .map(([name, qty]) => `${name} x${qty}`)
            .join(', ');
        // WhatsApp template param max ~1024 chars, keep it safe
        return summary.length > 200 ? summary.slice(0, 197) + '...' : summary;
    } catch (e) {
        return 'N/A';
    }
}

// ─── Core Send Function ──────────────────────────────────────────────────────

/**
 * Sends a WhatsApp template message via Meta Cloud API.
 * @param {string} to           - Customer phone number (10 or 12 digit)
 * @param {string} templateName - Approved Meta template name
 * @param {string[]} parameters - Array of text parameter values
 * @param {string} [lang='en']  - Template language code (en = English)
 */
async function sendWhatsAppTemplate(to, templateName, parameters, lang = 'en') {
    const token   = process.env.META_WA_ACCESS_TOKEN;
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
        console.warn('⚠️ [WA Notify] WhatsApp credentials not set. Skipping.');
        return { success: false, reason: 'credentials_missing' };
    }

    const formattedPhone = formatPhone(to);
    if (!formattedPhone) {
        console.warn(`⚠️ [WA Notify] Invalid phone number: "${to}". Skipping.`);
        return { success: false, reason: 'invalid_phone' };
    }

    try {
        const url  = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
        const body = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
                name: templateName,
                language: { code: lang },
                components: [
                    {
                        type: 'body',
                        parameters: parameters.map(p => ({ type: 'text', text: String(p || '') }))
                    },
                    // "Visit Website" button (index 0) requires a URL suffix parameter
                    {
                        type: 'button',
                        sub_type: 'url',
                        index: '0',
                        parameters: [{ type: 'text', text: '' }]
                    }
                ]
            }
        };

        const response = await axios.post(url, body, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 12000
        });

        console.log(`✅ [WA Notify] Sent "${templateName}" → ${formattedPhone}`);
        return { success: true, data: response.data };

    } catch (error) {
        const errData = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`❌ [WA Notify] Failed "${templateName}" → ${formattedPhone} | Error: ${errData}`);
        return { success: false, error: errData };
    }
}

// ─── 5 Notification Functions ─────────────────────────────────────────────────

/**
 * 1. ORDER BOOKED — Template: order_confirm
 *    Params: {{1}} Name, {{2}} Order ID, {{3}} Total, {{4}} Advance, {{5}} COD, {{6}} Items
 */
async function notifyOrderBooked(order) {
    try {
        const phone  = order.telNo || order.mobileNumber;
        const name   = order.customerName || 'Customer';
        const oid    = order.orderId || 'N/A';
        const total  = String(order.total || '0');
        const adv    = String(order.advance || '0');
        const cod    = String(order.codAmount || order.cod || order.total || '0');
        const items  = buildItemsList(order.items);

        console.log(`📲 [WA] ORDER BOOKED → ${phone} | ${oid}`);
        return await sendWhatsAppTemplate(phone, 'order_confirm', [name, oid, total, adv, cod, items]);
    } catch (e) {
        console.error('❌ [WA] notifyOrderBooked:', e.message);
        return { success: false };
    }
}

/**
 * 2. ADDRESS VERIFIED — Template: address_verify
 *    Params: {{1}} Name, {{2}} Order ID, {{3}} Total, {{4}} Advance, {{5}} COD, {{6}} Items
 */
async function notifyOrderVerified(order) {
    try {
        const phone  = order.telNo || order.mobileNumber;
        const name   = order.customerName || 'Customer';
        const oid    = order.orderId || 'N/A';
        const total  = String(order.total || '0');
        const adv    = String(order.advance || '0');
        const cod    = String(order.codAmount || order.cod || order.total || '0');
        const items  = buildItemsList(order.items);

        console.log(`📲 [WA] ADDRESS VERIFIED → ${phone} | ${oid}`);
        return await sendWhatsAppTemplate(phone, 'address_verify', [name, oid, total, adv, cod, items]);
    } catch (e) {
        console.error('❌ [WA] notifyOrderVerified:', e.message);
        return { success: false };
    }
}

/**
 * 3. ORDER DISPATCHED — Template: order_dispatch
 *    Params: {{1}} Name, {{2}} Order ID, {{3}} AWB, {{4}} Courier, {{5}} Total, {{6}} COD, {{7}} Items
 */
async function notifyOrderDispatched(order) {
    try {
        const phone   = order.telNo || order.mobileNumber;
        const name    = order.customerName || 'Customer';
        const oid     = order.orderId || 'N/A';
        const awb     = order.tracking?.trackingId || order.shiprocket?.awb || 'N/A';
        const courier = order.tracking?.courier || order.shiprocket?.courierName || 'Courier';
        const total   = String(order.total || '0');
        const cod     = String(order.codAmount || order.cod || order.total || '0');
        const items   = buildItemsList(order.items);

        console.log(`📲 [WA] DISPATCHED → ${phone} | ${oid} | AWB: ${awb}`);
        return await sendWhatsAppTemplate(phone, 'order_dispatch', [name, oid, awb, courier, total, cod, items]);
    } catch (e) {
        console.error('❌ [WA] notifyOrderDispatched:', e.message);
        return { success: false };
    }
}

/**
 * 4. OUT FOR DELIVERY — Template: out_for_delivery
 *    Params: {{1}} Name, {{2}} Order ID, {{3}} COD Amount, {{4}} Items
 */
async function notifyOrderOFD(order) {
    try {
        const phone  = order.telNo || order.mobileNumber;
        const name   = order.customerName || 'Customer';
        const oid    = order.orderId || 'N/A';
        const cod    = String(order.codAmount || order.cod || order.total || '0');
        const items  = buildItemsList(order.items);

        console.log(`📲 [WA] OUT FOR DELIVERY → ${phone} | ${oid}`);
        return await sendWhatsAppTemplate(phone, 'out_for_delivery', [name, oid, cod, items]);
    } catch (e) {
        console.error('❌ [WA] notifyOrderOFD:', e.message);
        return { success: false };
    }
}

/**
 * 5. ORDER DELIVERED — Template: delivered
 *    Params: {{1}} Name, {{2}} Order ID, {{3}} Items
 */
async function notifyOrderDelivered(order) {
    try {
        const phone  = order.telNo || order.mobileNumber;
        const name   = order.customerName || 'Customer';
        const oid    = order.orderId || 'N/A';
        const items  = buildItemsList(order.items);

        console.log(`📲 [WA] DELIVERED → ${phone} | ${oid}`);
        return await sendWhatsAppTemplate(phone, 'delivered', [name, oid, items]);
    } catch (e) {
        console.error('❌ [WA] notifyOrderDelivered:', e.message);
        return { success: false };
    }
}

// ─── Export ──────────────────────────────────────────────────────────────────

module.exports = {
    notifyOrderBooked,
    notifyOrderVerified,
    notifyOrderDispatched,
    notifyOrderOFD,
    notifyOrderDelivered,
    sendWhatsAppTemplate // exported for custom use if needed
};
