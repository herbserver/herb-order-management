const express = require('express');
const router = express.Router();
const axios = require('axios');
const { WhatsAppMessage, Order, Notification } = require('../models');
const dataAccess = require('../dataAccess');

// ─── SSE: Real-time push to admin panel ──────────────────────────────────────
const sseClients = [];

function broadcastSSE(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach((res, i) => {
        try { res.write(payload); } catch(e) { sseClients.splice(i, 1); }
    });
}

// SSE endpoint - admin connects here for instant updates
router.get('/events', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    res.write('event: connected\ndata: {}\n\n');
    sseClients.push(res);
    req.on('close', () => {
        const idx = sseClients.indexOf(res);
        if (idx !== -1) sseClients.splice(idx, 1);
    });
});

// ─── All approved templates with display info ────────────────────────────────
const TEMPLATES = [
    {
        name: 'delivery_followup',
        label: '💊 Delivery Follow-up (24h)',
        desc: 'Delivery ke 24 ghante baad medicine follow-up ke liye',
        color: 'rose',
        params: ['Customer Name', 'Order ID']
    },
    {
        name: 'order_confirm',
        label: '✅ Order Confirmed',
        desc: 'Order book hone pe',
        color: 'emerald',
        params: ['Customer Name', 'Order ID', 'Total', 'Advance', 'COD Amount', 'Products']
    },
    {
        name: 'address_verify',
        label: '📍 Address Verified',
        desc: 'Address verify hone pe',
        color: 'blue',
        params: ['Customer Name', 'Order ID', 'Total', 'Advance', 'COD Amount', 'Products']
    },
    {
        name: 'order_dispatch',
        label: '🚚 Order Dispatched',
        desc: 'Dispatch hone pe AWB ke saath',
        color: 'purple',
        params: ['Customer Name', 'Order ID', 'AWB Number', 'Courier', 'Total', 'COD Amount', 'Products']
    },
    {
        name: 'out_for_delivery',
        label: '🛵 Out For Delivery',
        desc: 'Delivery ke din',
        color: 'orange',
        params: ['Customer Name', 'Order ID', 'COD Amount', 'Products']
    },
    {
        name: 'delivered',
        label: '🎉 Order Delivered',
        desc: 'Deliver hone ke baad',
        color: 'teal',
        params: ['Customer Name', 'Order ID', 'Products']
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

// Helper function to send WhatsApp messages using Meta Cloud API
async function sendMetaMessageInternal({ to, type, text, templateName, parameters, lang, customerName, orderId }) {
    const token = process.env.META_WA_ACCESS_TOKEN;
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
        throw new Error('WhatsApp API credentials missing.');
    }

    const formattedPhone = formatPhone(to);
    if (!formattedPhone) {
        throw new Error('Invalid phone number.');
    }

    const name = customerName || 'Customer';
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    let data;
    let msgBody = '';

    if (type === 'text') {
        data = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: { body: text }
        };
        msgBody = text;
    } else {
        if (!templateName || !parameters) {
            throw new Error('templateName and parameters required.');
        }
        // Sanitize parameters to avoid empty strings which Meta API strictly rejects with 400 Bad Request
        parameters = parameters.map(p => {
            const txt = String(p ?? '').trim();
            return txt === '' ? '-' : txt;
        });

        const components = [{
            type: 'body',
            parameters: parameters.map(p => ({ type: 'text', text: p }))
        }];

        if (templateName === 'order_dispatch' || templateName === 'delivered') {
            components.push({
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [{ type: 'text', text: 'home' }]
            });
        }

        data = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
                name: templateName,
                language: { code: lang || 'en' },
                components
            }
        };
        const tpl = TEMPLATES.find(t => t.name === templateName);
        msgBody = tpl ? `[Template: ${tpl.label}]\n${parameters.join(' | ')}` : `[Template: ${templateName}]`;
    }

    const response = await axios.post(url, data, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

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

    return response.data;
}

// ─── POST /whatsapp/send ──────────────────────────────────────────────────────
router.post('/send', async (req, res) => {
    try {
        const data = await sendMetaMessageInternal(req.body);
        res.json({ success: true, data });
    } catch (error) {
        const errData = error.response ? error.response.data : error.message;
        console.error('WhatsApp API Error:', errData);
        res.status(500).json({ success: false, message: error.message, error: errData });
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

                // Get message text and media info
                let text = '[media]';
                let mediaId = null;
                let msgType = 'text';

                if (msg.type === 'text') {
                    text = msg.text?.body || '';
                } else if (msg.type === 'image') {
                    text = msg.image?.caption || '[Image]';
                    mediaId = msg.image?.id;
                    msgType = 'image';
                } else if (msg.type === 'audio') {
                    text = '[Voice Message]';
                    mediaId = msg.audio?.id;
                    msgType = 'audio';
                } else if (msg.type === 'video') {
                    text = msg.video?.caption || '[Video]';
                    mediaId = msg.video?.id;
                    msgType = 'video';
                } else if (msg.type === 'document') {
                    text = msg.document?.filename || '[Document]';
                    mediaId = msg.document?.id;
                    msgType = 'document';
                } else if (msg.type === 'sticker') {
                    text = '[Sticker]';
                    mediaId = msg.sticker?.id;
                    msgType = 'image';
                } else if (msg.type === 'location') {
                    text = '[Location: ' + (msg.location?.latitude || '') + ', ' + (msg.location?.longitude || '') + ']';
                } else if (msg.type === 'button') {
                    text = msg.button?.text || '[Button Reply]';
                }

                // Avoid duplicate saves
                const existing = await WhatsAppMessage.findOne({ metaMsgId: msg.id });
                if (!existing) {
                    const saved = await WhatsAppMessage.create({
                        phone, name,
                        direction: 'in',
                        type: msgType,
                        body: text,
                        mediaId: mediaId || undefined,
                        status: 'read',
                        metaMsgId: msg.id
                    });
                    // Instant push to admin
                    broadcastSSE('newMessage', { phone, name, message: saved.toObject() });
                    
                    // Trigger chatbot automatic reply in background
                    handleChatbotReply(phone, text, name).catch(err => {
                        console.error('Chatbot trigger error:', err.message);
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
                const updated = await WhatsAppMessage.findOneAndUpdate(
                    { metaMsgId },
                    { status: newStatus },
                    { new: true }
                );
                // Instant push status change to admin
                if (updated) broadcastSSE('statusUpdate', { phone: updated.phone, metaMsgId, status: newStatus });
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

// ─── GET /whatsapp/media/:mediaId - Proxy media from Meta ─────────────────────
router.get('/media/:mediaId', async (req, res) => {
    try {
        const token = process.env.META_WA_ACCESS_TOKEN;
        if (!token) return res.status(500).json({ error: 'No token' });

        // Step 1: Get the download URL from Meta
        const metaRes = await axios.get('https://graph.facebook.com/v20.0/' + req.params.mediaId, {
            headers: { 'Authorization': 'Bearer ' + token },
            timeout: 10000
        });

        const mediaUrl = metaRes.data && metaRes.data.url;
        if (!mediaUrl) return res.status(404).json({ error: 'Media not found' });

        // Step 2: Download and stream the actual media
        const mediaStream = await axios.get(mediaUrl, {
            headers: { 'Authorization': 'Bearer ' + token },
            responseType: 'stream',
            timeout: 30000
        });

        const contentType = mediaStream.headers['content-type'] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        mediaStream.data.pipe(res);

    } catch (e) {
        console.error('Media proxy error:', e.message);
        res.status(500).json({ error: 'Failed to fetch media' });
    }
});


// ─── Automated Chatbot Reply Handler ──────────────────────────────────────────
async function handleChatbotReply(phone, text, customerName) {
    try {
        const cleanText = text.toLowerCase().trim();
        
        // Find most recent order for this phone
        const order = await Order.findOne({
            $or: [
                { telNo: phone },
                { mobile: phone },
                { altNo: phone }
            ]
        }).sort({ createdAt: -1 });

        if (!order) {
            console.log(`ℹ️ No order context found for ${phone}, ignoring chatbot reply.`);
            return;
        }

        // Only handle follow-up replies for Delivered orders
        if (order.status !== 'Delivered') {
            console.log(`ℹ️ Order status for ${phone} is ${order.status}, skipping chatbot reply.`);
            return;
        }

        // Standard positive and negative keywords in Hindi/Hinglish
        const positiveKeywords = ['haan', 'han', 'yes', 'yup', 'ha', 'mil gayi', 'mil gyi', 'le li', 'shuru', 'started', 'khani'];
        const negativeKeywords = ['nahi', 'nhi', 'no', 'nope', 'na', 'not', 'nahi mili', 'nhi mili', 'call nahi', 'baat nahi'];

        let isPositive = false;
        let isNegative = false;

        for (const kw of negativeKeywords) {
            if (cleanText.includes(kw)) {
                isNegative = true;
                break;
            }
        }

        if (!isNegative) {
            for (const kw of positiveKeywords) {
                if (cleanText.includes(kw)) {
                    isPositive = true;
                    break;
                }
            }
        }

        let replyText = '';

        if (isNegative) {
            replyText = "Chinta na karein, humne aapki request register kar li hai. Humare Senior Health Consultant aapko aane wale 2-3 ghante ke andar call karenge aur dawa lene ka sahi tarika samjhayenge. Thank you! 🙏";
            
            // Create a high-priority system alert for the Admin
            await Notification.create({
                orderId: order.orderId,
                employeeId: order.employeeId || 'System',
                type: 'system_alert',
                title: '📞 Consultant Call Required',
                message: `Customer ${order.customerName} (#${order.orderId}) ne dawa shuru nahi ki ya consultant ne guide nahi kiya. Phone: ${phone}.`,
                emoji: '📞',
                priority: 'high',
                data: {
                    customerName: order.customerName,
                    telNo: phone,
                    orderId: order.orderId
                }
            });
            console.log(`🔔 Admin alert created for Order ${order.orderId} (Negative Follow-up reply).`);
        } else if (isPositive) {
            replyText = "Bohot badhiya ji! Dawa ko niyamit (regularly) aur sahi tarike se lein. Agar koi bhi samasya ho, toh aap yahan likh sakte hain. Aapki acchi sehat ki kaamna karte hain! 🙏";
        } else {
            // General query: Use Google Gemini AI if configured
            if (process.env.GEMINI_API_KEY) {
                try {
                    console.log('🧠 Querying Gemini API for smart chatbot reply...');
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
                    
                    const prompt = `Customer replied: "${text}"`;
                    const systemInstruction = `You are the automated WhatsApp Health Consultant for "Herbonnaturals" (an ayurved Ayurvedic medicine brand).
A customer who recently ordered has sent a reply to our 24h follow-up. Reply in a warm, polite, caring manner in Hinglish (Hindi written in English alphabets) or Hindi script.

Customer Name: ${customerName}
Order ID: ${order.orderId}
Medicines Ordered: ${order.items && order.items.length > 0 ? order.items.map(i => i.description).join(', ') : 'Ayurvedic medicines'}

Guidelines:
1. Address them respectfully (e.g., Namaste ${customerName} ji).
2. Answer their question about their herbal medicine or general usage instructions in 2-3 short sentences.
3. Keep it brief and friendly.
4. If they report pain, side effects, request a call, or have complex complaints, state: "Maine aapki request register kar li hai. Humare Senior Health Consultant aapko jald hi call karenge."
5. End with "🙏 Herbonnaturals".`;

                    const geminiRes = await axios.post(geminiUrl, {
                        contents: [{ parts: [{ text: prompt }] }],
                        systemInstruction: { parts: [{ text: systemInstruction }] }
                    });

                    const candidateText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (candidateText) {
                        replyText = candidateText.trim();
                        console.log('🤖 Gemini reply generated successfully!');
                        
                        // If Gemini mentioned calling them or if the customer asked to talk, alert admin
                        if (cleanText.includes('call') || cleanText.includes('phone') || cleanText.includes('baat') || replyText.includes('call karenge')) {
                            await Notification.create({
                                orderId: order.orderId,
                                employeeId: order.employeeId || 'System',
                                type: 'system_alert',
                                title: '📞 Consultant Call Requested',
                                message: `Customer ${order.customerName} (#${order.orderId}) wants to discuss medicine/health. Message: "${text}"`,
                                emoji: '📞',
                                priority: 'high',
                                data: {
                                    customerName: order.customerName,
                                    telNo: phone,
                                    orderId: order.orderId
                                }
                            });
                        }
                    }
                } catch (geminiErr) {
                    console.error('❌ Gemini API failed, using fallback:', geminiErr.message);
                    replyText = "Dhanyawad aapke reply ke liye. Humne aapka message support team ko forward kar diya hai. Wo aapko jald hi reply karenge. 🙏";
                }
            } else {
                replyText = "Dhanyawad aapke reply ke liye. Humne aapka message support team ko forward kar diya hai. Wo aapko jald hi reply karenge. 🙏";
            }
        }

        // Send the reply back to the customer
        console.log(`🤖 Sending automated chatbot reply to ${phone}...`);
        await sendMetaMessageInternal({
            to: phone,
            type: 'text',
            text: replyText,
            customerName: order.customerName,
            orderId: order.orderId
        });

    } catch (e) {
        console.error('❌ Chatbot reply handler failed:', e.message);
    }
}

module.exports = router;
module.exports.TEMPLATES = TEMPLATES;
module.exports.sendMetaMessageInternal = sendMetaMessageInternal;
