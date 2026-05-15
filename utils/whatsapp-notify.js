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
 *  6. order_on_hold      → Order on hold / call missed   (4 params)
 *  7. order_cancelled    → Order cancelled               (3 params)
 *  8. order_remark       → Callback request (remark)     (3 params)  ← NEW
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
 * @param {string} to               - Customer phone number (10 or 12 digit)
 * @param {string} templateName     - Approved Meta template name
 * @param {string[]} parameters     - Array of text parameter values
 * @param {string} [lang='en']      - Template language code
 * @param {boolean} [hasDynamicButton=false] - true if template has dynamic URL button {{1}}
 */
async function sendWhatsAppTemplate(to, templateName, parameters, lang = 'en', hasDynamicButton = false) {
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

        // Build components — only add button component if template has a dynamic URL button
        const components = [
            {
                type: 'body',
                parameters: parameters.map(p => ({ type: 'text', text: String(p || '') }))
            }
        ];
        if (hasDynamicButton) {
            components.push({
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [{ type: 'text', text: 'home' }]
            });
        }

        const body = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
                name: templateName,
                language: { code: lang },
                components
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
        // order_dispatch has DYNAMIC URL button → hasDynamicButton = true
        return await sendWhatsAppTemplate(phone, 'order_dispatch', [name, oid, awb, courier, total, cod, items], 'en', true);
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
        // delivered has DYNAMIC URL button → hasDynamicButton = true
        return await sendWhatsAppTemplate(phone, 'delivered', [name, oid, items], 'en', true);
    } catch (e) {
        console.error('❌ [WA] notifyOrderDelivered:', e.message);
        return { success: false };
    }
}

/**
 * 6. ORDER ON HOLD — Template: order_on_hold
 *    Triggered when verification dept puts order on hold (e.g., call not picked)
 *    Params: {{1}} Customer Name, {{2}} Order ID, {{3}} Hold Reason, {{4}} Callback Date
 */
async function notifyOrderHold(order) {
    try {
        const phone  = order.telNo || order.mobileNumber;
        const name   = order.customerName || 'Customer';
        const oid    = order.orderId || 'N/A';
        const reason = order.holdDetails?.holdReason || 'Call not answered';
        const date   = order.holdDetails?.expectedDispatchDate
            ? new Date(order.holdDetails.expectedDispatchDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
            : 'Jaldi';

        console.log(`📲 [WA] ORDER ON HOLD → ${phone} | ${oid} | Reason: ${reason}`);

        // Try Meta template first
        const result = await sendWhatsAppTemplate(
            phone,
            'order_on_hold',
            [name, oid, reason, date]
        );

        // Fallback: free-form text (works if customer messaged in last 24h)
        if (!result.success) {
            console.warn(`⚠️ [WA] Template failed, trying free-form for ${oid}`);
            return await sendWhatsAppFreeText(phone,
                `🌿 *Herb On Naturals*\n\nNamaste *${name}* ji! 🙏\n\n` +
                `Aapka Order *${oid}* ke liye hamne call kiya tha, lekin connect nahi hua.\n\n` +
                `📋 *Note:* ${reason}\n\n` +
                `Ham aapko *${date}* ko wapas call karenge.\n\n` +
                `Agar aap khud call karna chahein:\n📞 *+91-9911799660*\n\n` +
                `_Team Herb On Naturals_ 💚`
            );
        }
        return result;
    } catch (e) {
        console.error('❌ [WA] notifyOrderHold:', e.message);
        return { success: false };
    }
}

/**
 * 7. ORDER CANCELLED — Template: order_cancelled
 *    Triggered when verification dept cancels an order
 *    Params: {{1}} Customer Name, {{2}} Order ID, {{3}} Cancellation Reason
 */
async function notifyOrderCancelled(order) {
    try {
        const phone  = order.telNo || order.mobileNumber;
        const name   = order.customerName || 'Customer';
        const oid    = order.orderId || 'N/A';
        const reason = order.cancellationInfo?.cancellationReason || 'Order cancelled';

        console.log(`📲 [WA] ORDER CANCELLED → ${phone} | ${oid} | Reason: ${reason}`);

        // Try Meta template first
        const result = await sendWhatsAppTemplate(
            phone,
            'order_cancelled',
            [name, oid, reason]
        );

        // Fallback: free-form text (works if customer messaged in last 24h)
        if (!result.success) {
            console.warn(`⚠️ [WA] Template failed, trying free-form for ${oid}`);
            return await sendWhatsAppFreeText(phone,
                `🌿 *Herb On Naturals*\n\nNamaste *${name}* ji! 🙏\n\n` +
                `Aapka Order *${oid}* cancel ho gaya hai.\n\n` +
                `📋 *Kaaran:* ${reason}\n\n` +
                `Koi bhi sawaal ho toh humse contact karein.\n` +
                `Dobara shopping karein: herbonnaturals.in 🛒\n\n` +
                `_Team Herb On Naturals_ 💚`
            );
        }
        return result;
    } catch (e) {
        console.error('❌ [WA] notifyOrderCancelled:', e.message);
        return { success: false };
    }
}

// ─── Free-form Text Sender (fallback, works within 24h window) ───────────────
/**
 * Sends a plain WhatsApp text message (NOT a template).
 * Works only if the customer has messaged the business in the last 24 hours.
 */
async function sendWhatsAppFreeText(to, text) {
    const token   = process.env.META_WA_ACCESS_TOKEN;
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;

    if (!token || !phoneId) return { success: false, reason: 'credentials_missing' };

    const formattedPhone = formatPhone(to);
    if (!formattedPhone) return { success: false, reason: 'invalid_phone' };

    try {
        const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
        const body = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: { body: text, preview_url: false }
        };
        const response = await axios.post(url, body, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 12000
        });
        console.log(`✅ [WA Free-form] Sent → ${formattedPhone}`);
        return { success: true, data: response.data };
    } catch (error) {
        const errData = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`❌ [WA Free-form] Failed → ${formattedPhone} | ${errData}`);
        return { success: false, error: errData };
    }
}

/**
 * 8. ORDER REMARK / CALLBACK REQUEST — Template: order_remark
 *    Triggered when verification employee adds a remark to an order.
 *    Use case: "Call kiya, nahi utha" → Customer ko full callback message jaye
 *
 *    Params: {{1}} Name, {{2}} Order ID, {{3}} Note/Remark
 */
async function notifyOrderRemark(order, remarkText) {
    try {
        const phone  = order.telNo || order.mobileNumber;
        const name   = order.customerName || 'Customer';
        const oid    = order.orderId || 'N/A';
        const remark = remarkText
            || order.verificationRemark?.text
            || order.remark
            || 'Aapke order ke baare mein jaankari leni thi';

        // ─── Helpline / Contact Numbers ────────────────────────
        const HELPLINE = '9911799660';
        const WEBSITE = 'herbonnaturals.in';
        // ───────────────────────────────────────────────────────
        // ───────────────────────────────────────────────────────

        console.log(`📲 [WA] REMARK NOTIFY → ${phone} | ${oid} | "${remark}"`);

        // Try Meta approved template
        const result = await sendWhatsAppTemplate(
            phone,
            'order_remark',
            [name, oid, remark]
        );

        // Fallback: detailed free-form message
        if (!result.success) {
            console.warn(`⚠️ [WA] Template "order_remark" failed, trying free-form for ${oid}`);
            const msg =
                `🌿 *Herb On Naturals* 🌿\n` +
                `_________________________\n\n` +
                `Namaste *${name}* ji! 🙏\n\n` +
                `Aapke Order *${oid}* ke liye hamne aapko call kiya tha, lekin aap connect nahi ho sake.\n\n` +
                `📋 *Note:* ${remark}\n\n` +
                `─────────────────────\n` +
                `📞 *Hamare saath connect karein:*\n\n` +
                `1️⃣ *Hamari Helpline pe call karein:*\n` +
                `   👉 *+91-${HELPLINE}*\n\n` +
                `2️⃣ *Apne Doctor / Consultant ko call karein:*\n` +
                `   _(Jo hamari team ke doctor/expert se aapki baat chal rahi hai, unhe seedha call karein)_\n\n` +
                `3️⃣ *Khud website pe order karein:*\n` +
                `   🌐 *${WEBSITE}*\n` +
                `   _(Apni pasand ke products khud select karke order kar sakte hain)_\n\n` +
                `─────────────────────\n` +
                `_Team Herb On Naturals_ 💚\n` +
                `_Aapki sehat hamare liye sabse zaroori hai!_ 🌿`;

            return await sendWhatsAppFreeText(phone, msg);
        }
        return result;
    } catch (e) {
        console.error('❌ [WA] notifyOrderRemark:', e.message);
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
    notifyOrderHold,
    notifyOrderCancelled,
    notifyOrderRemark,
    sendWhatsAppTemplate, // exported for custom use if needed
    sendWhatsAppFreeText  // exported for custom use if needed
};
