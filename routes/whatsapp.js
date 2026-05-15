const express = require('express');
const router = express.Router();
const axios = require('axios');
const { WhatsAppMessage } = require('../models');
const dataAccess = require('../dataAccess');

// ─── All approved templates with display info ────────────────────────────────
const TEMPLATES = [
    {
        name: 'order_confirm',
        label: '✅ Order Confirmed',
        desc: 'Order book hone pe',
        color: 'emerald',
        params: ['Customer Name', 'Order ID', 'Total Amount', 'Product', 'Payment Mode', 'Address']
    },
    {
        name: 'address_verify',
        label: '📍 Address Verified',
        desc: 'Address verify hone pe',
        color: 'blue',
        params: ['Customer Name', 'Order ID', 'Address', 'City', 'State', 'Pincode']
    },
    {
        name: 'order_dispatch',
        label: '🚚 Order Dispatched',
        desc: 'Dispatch hone pe AWB ke saath',
        color: 'purple',
        params: ['Customer Name', 'Order ID', 'AWB Number', 'Courier', 'City', 'Estimated Date', 'Tracking Link']
    },
    {
        name: 'out_for_delivery',
        label: '🛵 Out For Delivery',
        desc: 'Delivery ke din',
        color: 'orange',
        params: ['Customer Name', 'Order ID', 'City', 'Date']
    },
    {
        name: 'delivered',
        label: '🎉 Order Delivered',
        desc: 'Deliver hone ke baad',
        color: 'teal',
        params: ['Customer Name', 'Order ID', 'Date']
    },
    {
        name: 'order_on_hold',
        label: '⏸ Order On Hold',
        desc: 'Hold pe daalne pe',
        color: 'amber',
        params: ['Customer Name', 'Order ID', 'Hold Reason', 'Callback Date']
    },
    {
        name: 'order_cancelled',
        label: '❌ Order Cancelled',
        desc: 'Cancel hone pe',
        color: 'red',
        params: ['Customer Name', 'Order ID', 'Reason']
    },
    {
        name: 'order_remark',
        label: '📞 Callback Request',
        desc: 'Remark / call back ke liye',
        color: 'indigo',
        params: ['Customer Name', 'Order ID', 'Remark Message']
    }
];

// ─── Helper: Format phone ─────────────────────────────────────────────────────
function formatPhone(phone) {
    if (!phone) return null;
    let p = String(phone).replace(/\D/g, '');
    if (p.length === 10) p = '91' + p;
    if (p.length === 11 && p.startsWith('0')) p = '91' + p.slice(1);
    if (p.length < 10) return null;
    return p;
}

// ─── GET /whatsapp/templates ──────────────────────────────────────────────────
router.get('/templates', (req, res) => {
    res.json({ success: true, templates: TEMPLATES });
});

// ─── GET /whatsapp/conversations ──────────────────────────────────────────────
// Returns all unique conversations from message history + recent orders
router.get('/conversations', async (req, res) => {
    try {
        // Get all unique phones from message history
        const msgConvs = await WhatsAppMessage.aggregate([
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$phone',
                    name: { $first: '$name' },
                    lastMsg: { $first: '$body' },
                    lastTime: { $first: '$timestamp' },
                    lastMsgDirection: { $first: '$direction' },
                    lastMsgStatus: { $first: '$status' },
                    unread: { $sum: { $cond: [{ $and: [{ $eq: ['$direction', 'in'] }, { $ne: ['$isRead', true] }] }, 1, 0] } }
                }
            },
            { $sort: { lastTime: -1 } }
        ]);

        // Also pull from recent orders (for phones with no chat history yet)
        const orders = await dataAccess.getAllOrders(1, 50);
        const list = Array.isArray(orders) ? orders : (orders.orders || []);

        const chatPhones = new Set(msgConvs.map(c => c._id));
        const orderConvs = [];
        const seen = new Set(chatPhones);

        for (const o of list) {
            const phone = formatPhone(o.telNo || o.mobileNumber);
            if (!phone || seen.has(phone)) continue;
            seen.add(phone);
            orderConvs.push({
                id: phone,
                phone: phone,
                name: o.customerName || 'Customer',
                lastMsg: `Order: ${o.orderId} • ${o.status}`,
                time: o.timestamp,
                orderId: o.orderId,
                unread: 0,
                fromOrders: true
            });
        }

        const conversations = [
            ...msgConvs.map(c => ({
                id: c._id,
                phone: c._id,
                name: c.name || 'Customer',
                lastMsg: c.lastMsg || '',
                time: c.lastTime,
                unread: c.unread || 0,
                lastMsgDirection: c.lastMsgDirection || 'out',
                lastMsgStatus: c.lastMsgStatus || 'sent'
            })),
            ...orderConvs
        ];

        res.json({ success: true, conversations });
    } catch (e) {
        console.error('WA conversations error:', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
});

// ─── GET /whatsapp/messages/:phone ───────────────────────────────────────────
// Returns all messages for a phone number
router.get('/messages/:phone', async (req, res) => {
    try {
        const phone = formatPhone(req.params.phone) || req.params.phone;
        const messages = await WhatsAppMessage.find({ phone })
            .sort({ timestamp: 1 })
            .lean();
        res.json({ success: true, messages });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ─── POST /whatsapp/messages/:phone/markread ──────────────────────────────────
// Mark all incoming messages as read when chat is opened
router.post('/messages/:phone/markread', async (req, res) => {
    try {
        const phone = formatPhone(req.params.phone) || req.params.phone;
        await WhatsAppMessage.updateMany(
            { phone, direction: 'in', isRead: { $ne: true } },
            { $set: { isRead: true } }
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ─── DELETE /whatsapp/conversations/:phone ──────────────────────────────────────
// Delete all messages for a phone (clear conversation)
router.delete('/conversations/:phone', async (req, res) => {
    try {
        const phone = formatPhone(req.params.phone) || req.params.phone;
        const result = await WhatsAppMessage.deleteMany({ phone });
        res.json({ success: true, deleted: result.deletedCount });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ─── POST /whatsapp/send ──────────────────────────────────────────────────────
router.post('/send', async (req, res) => {
    const { to, type, text, templateName, parameters, lang, customerName, orderId } = req.body;

    const token = process.env.META_WA_ACCESS_TOKEN;
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
        return res.status(500).json({ success: false, message: 'WhatsApp API credentials missing.' });
    }

    const formattedPhone = formatPhone(to);
    if (!formattedPhone) {
        return res.status(400).json({ success: false, message: 'Invalid phone number.' });
    }

    const name = customerName || 'Customer';

    try {
        const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
        let data;
        let msgBody = '';

        if (type === 'text') {
            // Free-form text
            data = {
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'text',
                text: { body: text }
            };
            msgBody = text;
        } else {
            // Template message
            if (!templateName || !parameters) {
                return res.status(400).json({ success: false, message: 'templateName and parameters required.' });
            }
            data = {
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: lang || 'en' },
                    components: [{
                        type: 'body',
                        parameters: parameters.map(p => ({ type: 'text', text: String(p) }))
                    }]
                }
            };
            // Build display body
            const tpl = TEMPLATES.find(t => t.name === templateName);
            msgBody = tpl ? `[Template: ${tpl.label}]\n${parameters.join(' | ')}` : `[Template: ${templateName}]`;
        }

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Save message to DB
        const metaMsgId = response.data?.messages?.[0]?.id || null;
        await WhatsAppMessage.create({
            phone: formattedPhone,
            name: name,
            direction: 'out',
            type: type === 'text' ? 'text' : 'template',
            body: msgBody,
            templateName: type !== 'text' ? templateName : undefined,
            status: 'sent',
            orderId: orderId || undefined,
            metaMsgId
        });

        res.json({ success: true, data: response.data });

    } catch (error) {
        const errData = error.response ? error.response.data : error.message;
        console.error('WhatsApp API Error:', errData);

        // Save failed message too
        try {
            await WhatsAppMessage.create({
                phone: formattedPhone,
                name,
                direction: 'out',
                type: type === 'text' ? 'text' : 'template',
                body: text || `[Template: ${templateName}]`,
                templateName: type !== 'text' ? templateName : undefined,
                status: 'failed',
                orderId: orderId || undefined
            });
        } catch(e2) {}

        res.status(500).json({ success: false, message: 'Failed to send', error: errData });
    }
});

// ─── POST /whatsapp/webhook - Receive incoming messages + delivery receipts ───
router.post('/webhook', async (req, res) => {
    res.sendStatus(200); // Acknowledge immediately to Meta

    try {
        const body = req.body;
        const value = body?.entry?.[0]?.changes?.[0]?.value;
        if (!value) return;

        // ── 1. Incoming messages (customer replied) ──────────────────────────
        if (value.messages && value.messages.length > 0) {
            const contacts = value.contacts || [];
            for (const msg of value.messages) {
                const phone = msg.from;
                const contact = contacts.find(c => c.wa_id === phone);
                const name = contact?.profile?.name || 'Customer';

                // Get message text based on type
                let text = '[media]';
                if (msg.type === 'text') text = msg.text?.body || '';
                else if (msg.type === 'image') text = '[Image]';
                else if (msg.type === 'audio') text = '[Voice Message]';
                else if (msg.type === 'video') text = '[Video]';
                else if (msg.type === 'document') text = '[Document]';
                else if (msg.type === 'sticker') text = '[Sticker]';
                else if (msg.type === 'location') text = '[Location]';
                else if (msg.type === 'button') text = msg.button?.text || '[Button Reply]';

                // Avoid duplicate saves
                const existing = await WhatsAppMessage.findOne({ metaMsgId: msg.id });
                if (!existing) {
                    await WhatsAppMessage.create({
                        phone, name,
                        direction: 'in',
                        type: 'text',
                        body: text,
                        status: 'read',
                        metaMsgId: msg.id
                    });
                }
            }
        }

        // ── 2. Delivery/Read status updates (our sent messages) ───────────────
        if (value.statuses && value.statuses.length > 0) {
            for (const statusUpdate of value.statuses) {
                const metaMsgId = statusUpdate.id;
                const newStatus = statusUpdate.status; // 'sent' | 'delivered' | 'read' | 'failed'

                if (!metaMsgId || !newStatus) continue;

                // Update our message status in DB
                await WhatsAppMessage.findOneAndUpdate(
                    { metaMsgId },
                    { status: newStatus },
                    { new: true }
                );
            }
        }

    } catch (e) {
        console.error('WA webhook error:', e.message);
    }
});


// ─── GET /whatsapp/webhook - Verification ─────────────────────────────────────
router.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.META_WA_VERIFY_TOKEN || 'herb_webhook_token';
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

module.exports = router;
module.exports.TEMPLATES = TEMPLATES;
