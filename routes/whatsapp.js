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
    },
    {
        name: 'varicose_veins_wellness',
        label: '🩸 Varicose Veins Follow-up',
        desc: 'Varicose Veins (नसों की सूजन/blockage) ke purane customers ke liye',
        color: 'red',
        lang: 'hi',
        headerType: 'image',
        defaultImageUrl: '/wellness_banner.png',
        params: ['Customer Name']
    },
    {
        name: 'joint_pain_wellness',
        label: '🦴 Joint Pain Follow-up',
        desc: 'Joint Pain (जोड़ों और घुटनों के दर्द) ke purane customers ke liye',
        color: 'amber',
        lang: 'hi',
        headerType: 'image',
        defaultImageUrl: '/wellness_banner.png',
        params: ['Customer Name']
    },
    {
        name: 'diabetes_care_followup',
        label: '🩸 Diabetes Sugar Care',
        desc: 'Sugar/Diabetes (मधुमेह) ke purane customers ke liye',
        color: 'blue',
        lang: 'hi',
        params: ['Customer Name']
    },
    {
        name: 'weight_loss_followup',
        label: '⚖️ Weight Management',
        desc: 'Weight Loss (वजन नियंत्रण) aur diet routine share karne ke liye',
        color: 'teal',
        lang: 'hi',
        params: ['Customer Name', 'Discount %']
    },
    {
        name: 'vitality_strength_stamina',
        label: '💪 Strength & Vitality Care',
        desc: 'Energy, Stamina (शारीरिक कमजोरी) ke wellness consultation ke liye',
        color: 'emerald',
        lang: 'hi',
        params: ['Customer Name']
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
async function sendMetaMessageInternal({ to, type, text, templateName, parameters, lang, customerName, orderId, imageUrl, baseUrl }) {
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

        const tpl = TEMPLATES.find(t => t.name === templateName);
        const resolvedLang = tpl?.lang || lang || 'en';

        const components = [];

        // Support templates with IMAGE headers
        if (tpl?.headerType === 'image') {
            let finalImageUrl = imageUrl || tpl.defaultImageUrl || '/wellness_banner.png';
            if (finalImageUrl && finalImageUrl.startsWith('/')) {
                finalImageUrl = (baseUrl || '') + finalImageUrl;
            }
            components.push({
                type: 'header',
                parameters: [
                    {
                        type: 'image',
                        image: {
                            link: finalImageUrl
                        }
                    }
                ]
            });
        }

        components.push({
            type: 'body',
            parameters: parameters.map(p => ({ type: 'text', text: p }))
        });

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
                language: { code: resolvedLang },
                components
            }
        };
        msgBody = tpl ? `[Template: ${tpl.label}]\n${parameters.join(' | ')}` : `[Template: ${templateName}]`;
    }

    const response = await axios.post(url, data, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    const metaMsgId = response.data?.messages?.[0]?.id || null;
    const saved = await WhatsAppMessage.create({
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

    // Broadcast SSE to instantly show sent message on admin UI
    broadcastSSE('newMessage', { phone: formattedPhone, name, message: saved.toObject() });

    return response.data;
}

// ─── POST /whatsapp/send ──────────────────────────────────────────────────────
router.post('/send', async (req, res) => {
    try {
        const baseUrl = req.protocol + '://' + req.get('host');
        const data = await sendMetaMessageInternal({ ...req.body, baseUrl });
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
        customerName = customerName || 'जी';

        // 1. Detect Wellness Quick Reply Buttons (Hinglish/Latin and Devnagari options)
        
        // Varicose Veins Wellness Template (`varicose_veins_wellness`) Buttons:
        // - Button 1: "Doctor se Free Call 📞"
        // - Button 2: "Dawa Repeat Karein 🔁"
        const isVVCall = cleanText.includes('doctor se free call') || cleanText.includes('doctor se call');
        const isVVRepeat = cleanText.includes('dawa repeat karein') || cleanText.includes('dawa repeat');

        // Joint Pain Wellness Template (`joint_pain_wellness`) Buttons:
        // - Button 1: "Free Consultation Call 📞"
        // - Button 2: "Main ab thik hoon! 😊"
        const isJPCall = cleanText.includes('free consultation call') || cleanText.includes('consultation call');
        const isJPCured = cleanText.includes('main ab thik hoon') || cleanText.includes('ab thik hoon');

        // Diabetes Sugar Care Template (`diabetes_care_followup`) Buttons:
        // - Button 1: "Sugar Report Checkup 📊"
        // - Button 2: "Repeat Dawa Bhejein 🔁"
        const isDBClose = cleanText.includes('sugar report checkup') || cleanText.includes('sugar report');
        const isDBRepeat = cleanText.includes('repeat dawa bhejein') || cleanText.includes('repeat dawa');

        // Weight Management Template (`weight_loss_followup`) Buttons:
        // - Button 1: "Diet Chart Claim Karein 📋"
        // - Button 2: "Doctor se Salah Lein 🩺"
        const isWLDiet = cleanText.includes('diet chart claim') || cleanText.includes('claim karein');
        const isWLCall = cleanText.includes('doctor se salah') || cleanText.includes('salah lein');

        // Strength & Vitality Care Template (`vitality_strength_stamina`) Buttons:
        // - Button 1: "Private Doctor Consult 📞"
        // - Button 2: "Abhi repeat order karein 🔁"
        const isVCCall = cleanText.includes('private doctor consult') || cleanText.includes('private doctor');
        const isVCRepeat = cleanText.includes('abhi repeat order') || cleanText.includes('repeat order');

        // Legacy Devnagari Wellness Buttons (for backward compatibility / older versions)
        const isPositiveButton = cleanText.includes('काफी आराम है') || 
                                 cleanText.includes('चलने में आराम है') || 
                                 cleanText.includes('शुगर कंट्रोल में है') || 
                                 cleanText.includes('वजन कम हुआ है') || 
                                 cleanText.includes('एनर्जी अच्छी है');

        const isNegativeButton = cleanText.includes('दर्द अभी भी है') || 
                                 cleanText.includes('दर्द अभी होता है') || 
                                 cleanText.includes('शुगर बढ़ी हुई है') || 
                                 cleanText.includes('वजन नहीं घटा') || 
                                 cleanText.includes('अभी भी कमजोरी है');

        const isConsultationButton = cleanText.includes('मुफ्त सलाह चाहिए') || 
                                     cleanText.includes('फ्री डाइट प्लान चाहिए') || 
                                     cleanText.includes('vip डिस्काउंट') || 
                                     cleanText.includes('हेल्थ एक्सपर्ट से बात करें') ||
                                     cleanText.includes('कॉल कराएं') ||
                                     cleanText.includes('सलाह चाहिए');

        const isWellnessButton = isVVCall || isVVRepeat || isJPCall || isJPCured || 
                                 isDBClose || isDBRepeat || isWLDiet || isWLCall || 
                                 isVCCall || isVCRepeat || isPositiveButton || 
                                 isNegativeButton || isConsultationButton;

        // Find most recent order for this phone (optional context)
        const order = await Order.findOne({
            $or: [
                { telNo: phone },
                { mobile: phone },
                { altNo: phone }
            ]
        }).sort({ createdAt: -1 });

        const orderId = order ? order.orderId : 'N/A';
        const employeeId = order ? (order.employeeId || 'System') : 'System';
        const nameToUse = order ? (order.customerName || customerName) : customerName;

        // If it's a general reply (not a wellness button click), we handle it in the router below

        let replyText = '';
        let triggerAlert = false;
        let alertTitle = '📞 Consultant Call Required';
        let alertMsg = '';
        let alertPriority = 'high';

        // 2. Button-wise custom response router
        if (isVVCall) {
            replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nआपकी सेहत हमारे लिए सबसे महत्वपूर्ण है। 🩺\n\nहमारे **सीनियर हेल्थ एक्सपर्ट** को आपकी कॉल रिक्वेस्ट मिल चुकी है और वे अगले 15 मिनट के अंदर आपको इस नंबर पर सीधे संपर्क करेंगे। 📞\n\nकृपया अपना फोन चालू रखें और थोड़ा धैर्य रखें। आयुर्वेद के नियम और सही परामर्श से ही पैरों के दर्द व ब्लॉकेज का संपूर्ण निदान संभव है! 🌿\n\n🙏 Herbonnaturals`;
            triggerAlert = true;
            alertTitle = '🚨 High Priority: Varicose Veins Call Request';
            alertMsg = `Customer ${nameToUse} (#${orderId}) requested a callback from a Senior Health Expert regarding Varicose Veins. Phone: ${phone}.`;
        }
        else if (isVVRepeat) {
            replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nदवा रिपीट करने की आपकी रिक्वेस्ट हमारे सिस्टम में दर्ज कर ली गई है। 📦\n\nहमारे **सीनियर हेल्थ एक्सपर्ट** अगले 15 मिनट में आपको सीधे कॉल करेंगे 📞 ताकि आपके पते (Address) की पुष्टि की जा सके और दवा बिना किसी देरी के जल्द से जल्द रवाना की जा सके।\n\nआयुर्वेदिक कोर्स को पूरा करना ही बीमारी को जड़ से खत्म करने का एकमात्र मार्ग है! 🌿\n\n🙏 Herbonnaturals`;
            triggerAlert = true;
            alertTitle = '📦 Urgent: Varicose Veins Dawa Repeat';
            alertMsg = `Customer ${nameToUse} (#${orderId}) requested medicine repeat (Dawa Repeat) for Varicose Veins. Phone: ${phone}.`;
        }
        else if (isJPCall) {
            replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nआपकी सेहत हमारे लिए सबसे महत्वपूर्ण है। 🩺\n\nहमारे **सीनियर हेल्थ एक्सपर्ट** को आपकी कॉल रिक्वेस्ट मिल चुकी है और वे अगले 15 मिनट के अंदर आपको इस नंबर पर सीधे संपर्क करेंगे। 📞\n\nकृपया अपना फोन चालू रखें और थोड़ा धैर्य रखें। आयुर्वेद के नियम और सही परामर्श से ही जोड़ों व घुटनों के दर्द का संपूर्ण निदान संभव है! 🌿\n\n🙏 Herbonnaturals`;
            triggerAlert = true;
            alertTitle = '🚨 High Priority: Joint Pain Call Request';
            alertMsg = `Customer ${nameToUse} (#${orderId}) requested a callback from a Senior Health Expert regarding Joint Pain. Phone: ${phone}.`;
        }
        else if (isJPCured) {
            replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nयह जानकर हमारा मन अत्यंत प्रसन्नता और संतोष से भर गया! 😍🌿\n\nआयुर्वेद की औषधियों और आपके अनुशासन ने मिलकर यह चमत्कार कर दिखाया है। अब आप पूरी तरह स्वस्थ हैं, यह जानकर हमें बेहद खुशी हुई।\n\nभविष्य में भी अपनी दिनचर्या और खान-पान का विशेष ध्यान रखें। यदि कभी भी आपको कोई स्वास्थ्य संबंधी सलाह या मार्गदर्शन चाहिए हो, तो आप यहाँ बेझिझक मैसेज कर सकते हैं।\n\nआपके सुखी, समृद्ध और दीर्घायु जीवन की मंगल कामना करते हैं! 😇✨\n\n🙏 Herbonnaturals`;
            triggerAlert = true;
            alertPriority = 'medium';
            alertTitle = 'ℹ️ Info: Joint Pain Cured Report';
            alertMsg = `Customer ${nameToUse} (#${orderId}) reports they are now completely fine/cured of Joint Pain. Phone: ${phone}.`;
        }
        else if (isDBClose) {
            replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nआपकी शुगर रिपोर्ट की जांच के लिए रिक्वेस्ट दर्ज हो गई है। 📊\n\nआप अपनी खाली पेट (Fasting) और खाने के बाद (PP) की शुगर रिपोर्ट की फोटो या रीडिंग यहाँ व्हाट्सएप पर सहेजें।\n\nहमारे **सीनियर हेल्थ एक्सपर्ट** आपकी रिपोर्ट का गहन अध्ययन करके अगले 15 मिनट में आपको सीधे कॉल करेंगे 📞 और सही मार्गदर्शन प्रदान करेंगे।\n\n🙏 Herbonnaturals`;
            triggerAlert = true;
            alertTitle = '📊 Urgent: Diabetes Report Verification';
            alertMsg = `Customer ${nameToUse} (#${orderId}) requested sugar report verification. Callback required. Phone: ${phone}.`;
        }
        else if (isDBRepeat) {
            replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nदवा रिपीट करने की आपकी रिक्वेस्ट हमारे सिस्टम में दर्ज कर ली गई है। 📦\n\nहमारे **सीनियर हेल्थ एक्सपर्ट** अगले 15 मिनट में आपको सीधे कॉल करेंगे 📞 ताकि आपके पते (Address) की पुष्टि की जा सके और दवा बिना किसी देरी के जल्द से जल्द रवाना की जा सके।\n\nआयुर्वेदिक कोर्स को पूरा करना ही बीमारी को जड़ से खत्म करने का एकमात्र मार्ग है! 🌿\n\n🙏 Herbonnaturals`;
            triggerAlert = true;
            alertTitle = '📦 Urgent: Diabetes Dawa Repeat';
            alertMsg = `Customer ${nameToUse} (#${orderId}) requested medicine repeat (Dawa Repeat) for Diabetes. Phone: ${phone}.`;
        }
        else if (isWLDiet) {
            replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nवजन नियंत्रण के लिए आपका कस्टमाइज्ड डाइट प्लान तैयार है! 📋🥗\n\nहमारे **सीनियर हेल्थ एक्सपर्ट** अगले 15 मिनट के अंदर आपको सीधे कॉल करेंगे 📞 और आपकी शारीरिक स्थिति के अनुसार सबसे बेस्ट डाइट चार्ट आपके व्हाट्सएप पर शेयर करेंगे।\n\nकृपया अपना फोन चालू रखें! 🍎\n\n🙏 Herbonnaturals`;
            triggerAlert = true;
            alertTitle = '📋 Urgent: Diet Plan Requested';
            alertMsg = `Customer ${nameToUse} (#${orderId}) requested weight management diet plan on WhatsApp. Phone: ${phone}.`;
        }
        else if (isWLCall) {
            replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nआपकी सेहत हमारे लिए सबसे महत्वपूर्ण है। 🩺\n\nहमारे **सीनियर हेल्थ एक्सपर्ट** को आपकी सलाह रिक्वेस्ट मिल चुकी है और वे अगले 15 मिनट के अंदर आपको इस नंबर पर सीधे संपर्क करेंगे। 📞\n\nकृपया अपना फोन चालू रखें। आयुर्वेद के नियम और सही परामर्श से ही वजन का प्राकृतिक संतुलन संभव है! 🌿\n\n🙏 Herbonnaturals`;
            triggerAlert = true;
            alertTitle = '🚨 High Priority: Weight Loss Consultation Request';
            alertMsg = `Customer ${nameToUse} (#${orderId}) requested weight loss consultation with a Senior Health Expert. Phone: ${phone}.`;
        }
        else if (isVCCall) {
            replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nआपकी सेहत हमारे लिए सबसे महत्वपूर्ण है। 🩺\n\nहमारे **सीनियर हेल्थ एक्सपर्ट** को आपकी सलाह रिक्वेस्ट मिल चुकी है और वे अगले 15 मिनट के अंदर आपको इस नंबर पर सीधे संपर्क करेंगे। 📞\n\nआपकी सभी जानकारी और बातचीत बिल्कुल 100% गोपनीय रखी जाएगी। कृपया अपना फोन चालू रखें। 🌿\n\n🙏 Herbonnaturals`;
            triggerAlert = true;
            alertTitle = '🚨 High Priority: Vitality Care Consultation Request';
            alertMsg = `Customer ${nameToUse} (#${orderId}) requested confidential strength/vitality consultation with a Senior Health Expert. Phone: ${phone}.`;
        }
        else if (isVCRepeat) {
            replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nदवा रिपीट करने की आपकी रिक्वेस्ट हमारे सिस्टम में दर्ज कर ली गई है। 📦\n\nहमारे **सीनियर हेल्थ एक्सपर्ट** अगले 15 मिनट में आपको सीधे कॉल करेंगे 📞 ताकि आपके पते (Address) की पुष्टि की जा सके और दवा बिना किसी देरी के जल्द से जल्द रवाना की जा सके।\n\nकृपया अपना फोन चालू रखें! 🌿\n\n🙏 Herbonnaturals`;
            triggerAlert = true;
            alertTitle = '📦 Urgent: Vitality Dawa Repeat';
            alertMsg = `Customer ${nameToUse} (#${orderId}) requested medicine repeat (Dawa Repeat) for Strength & Vitality. Phone: ${phone}.`;
        }
        // Legacy fallback button click detection
        else if (isPositiveButton) {
            replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nयह जानकर बहुत खुशी हुई! 😍 आयुर्वेद के प्राकृतिक उपचार से आपके शरीर में यह सकारात्मक सुधार आया है।\n\nअपनी दवा को नियम से लेते रहें और बताए गए परहेज का पालन करें। यदि आपको आगे भी कोई मार्गदर्शन या डाइट टिप्स चाहिए, तो आप यहाँ लिख सकते हैं।\n\nआपके सदैव स्वस्थ और दीर्घायु रहने की मंगल कामना करते हैं! 🌿\n\n🙏 Herbonnaturals`;
        } 
        else if (isNegativeButton) {
            replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nहम आपकी स्थिति को पूरी तरह समझते हैं। 🥺 पुरानी समस्या और नसों या जोड़ों की जकड़न को जड़ से ठीक होने में थोड़ा समय लगता है।\n\nहमारे **सीनियर हेल्थ एक्सपर्ट** अगले 15 मिनट के अंदर आपको सीधे कॉल करेंगे 📞 और दवा का सही तरीका व परहेज दोबारा समझाएंगे।\n\nकृपया अपना फोन चालू रखें और थोड़ा धैर्य रखें। धन्यवाद! 🩺\n\n🙏 Herbonnaturals`;
            triggerAlert = true;
            alertTitle = '🚨 High Priority: Customer Reporting Pain';
            alertMsg = `Customer ${nameToUse} (#${orderId}) reporting pain or high symptoms via WhatsApp. Immediate callback requested by Senior Health Expert. Phone: ${phone}.`;
        } 
        else if (isConsultationButton) {
            replyText = `जी बिल्कुल! आपकी कॉल रिक्वेस्ट हमारे **सीनियर हेल्थ एक्सपर्ट** टीम के पास दर्ज कर ली गई है। 📞\n\nअगले 15 मिनट के अंदर हमारे एक्सपर्ट आपको सीधे संपर्क करेंगे। कृपया अपना फोन चालू रखें। धन्यवाद! 🩺\n\n🙏 Herbonnaturals`;
            triggerAlert = true;
            alertTitle = '📞 Senior Health Expert Requested';
            alertMsg = `Customer ${nameToUse} (#${orderId}) requested a call with a Senior Health Expert on WhatsApp. Phone: ${phone}.`;
        } 
        else {
            // Check if there is a pending or shipped order to provide status details
            if (order && (order.status === 'Pending' || order.status === 'Shipped' || order.status === 'In-Transit')) {
                const statusHindi = order.status === 'Shipped' ? 'भेज दिया गया है (Shipped)' : 'प्रक्रिया में है (Pending)';
                replyText = `नमस्ते ${nameToUse} जी! 🙏✨\n\nआपके ऑर्डर (#${orderId}) का स्टेटस अभी **${statusHindi}** है। 📦\n\nहमारा प्रयास है कि आपकी आयुर्वेदिक औषधियाँ जल्द से जल्द आप तक सुरक्षित पहुँचें। जैसे ही डिलीवरी का नया अपडेट मिलेगा, हम आपके साथ साझा करेंगे। 🚚\n\nयदि आपका कोई अन्य प्रश्न है, तो हमारे सीनियर हेल्थ एक्सपर्ट अगले 15 मिनट में आपसे संपर्क करेंगे।\n\n🙏 Herbonnaturals`;
                triggerAlert = true;
                alertTitle = '📦 Order Status Inquiry';
                alertMsg = `Customer ${nameToUse} (#${orderId}) asked a question. Order status is ${order.status}. Callback recommended. Phone: ${phone}.`;
            } else {
                // General query: Fallback to existing keyword triggers or Google Gemini AI if configured
                const positiveKeywords = ['haan', 'han', 'yes', 'yup', 'ha', 'mil gayi', 'mil gyi', 'le li', 'shuru', 'started', 'khani'];
                const negativeKeywords = ['nahi', 'nhi', 'no', 'nope', 'na', 'not', 'nahi mili', 'nhi mili', 'call nahi', 'baat nahi'];

                let isPositiveKeyword = false;
                let isNegativeKeyword = false;

                for (const kw of negativeKeywords) {
                    if (cleanText.includes(kw)) {
                        isNegativeKeyword = true;
                        break;
                    }
                }

                if (!isNegativeKeyword) {
                    for (const kw of positiveKeywords) {
                        if (cleanText.includes(kw)) {
                            isPositiveKeyword = true;
                            break;
                        }
                    }
                }

                if (isNegativeKeyword) {
                    replyText = "चिंता न करें जी, हमने आपकी रिक्वेस्ट रजिस्टर कर ली है। हमारे सीनियर हेल्थ एक्सपर्ट आपको आने वाले 1-2 घंटे के अंदर कॉल करेंगे और पूरी मदद करेंगे। धन्यवाद! 🙏";
                    triggerAlert = true;
                    alertTitle = '📞 Consultant Call Required';
                    alertMsg = `Customer ${nameToUse} (#${orderId}) says medicine not started or not guided. Phone: ${phone}.`;
                } else if (isPositiveKeyword) {
                    replyText = "बहुत बढ़िया जी! दवा को नियमित रूप से और सही तरीके से लें। अगर कोई भी समस्या हो, तो आप यहाँ लिख सकते हैं। आपकी अच्छी सेहत की कामना करते हैं! 🙏";
                } else {
                    // Custom question: Use Google Gemini AI
                    if (process.env.GEMINI_API_KEY) {
                        try {
                            console.log('🧠 Querying Gemini API for smart chatbot reply...');
                            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
                            
                            const prompt = `Customer replied: "${text}"`;
                            const systemInstruction = `You are the automated WhatsApp Senior Health Expert chatbot for "Herbonnaturals" (an Ayurvedic wellness brand).
A customer has asked a question. Reply in a warm, extremely polite, caring manner in Hindi Devnagari script (शुद्ध हिंदी) or readable Hinglish if natural.

Customer Name: ${nameToUse}
Order ID: ${orderId}
Medicines Context: ${order && order.items && order.items.length > 0 ? order.items.map(i => i.description).join(', ') : 'Ayurvedic wellness treatment'}

Guidelines:
1. Address them respectfully (e.g., नमस्ते ${nameToUse} जी).
2. Answer their question about their Ayurvedic medicine or general usage in 2-3 short, clear sentences.
3. Keep it brief, friendly and clinical.
4. If they report pain, ask for a call, or have complex complaints, state: "मैंने आपकी रिक्वेस्ट दर्ज कर ली है। हमारे सीनियर हेल्थ एक्सपर्ट आपको जल्द ही कॉल करेंगे।"
5. End with "🙏 Herbonnaturals".`;

                            const geminiRes = await axios.post(geminiUrl, {
                                contents: [{ parts: [{ text: prompt }] }],
                                systemInstruction: { parts: [{ text: systemInstruction }] }
                            });

                            const candidateText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (candidateText) {
                                replyText = candidateText.trim();
                                console.log('🤖 Gemini reply generated successfully!');
                                
                                if (cleanText.includes('call') || cleanText.includes('phone') || cleanText.includes('baat') || replyText.includes('कॉल करेंगे') || replyText.includes('call karenge')) {
                                    triggerAlert = true;
                                    alertTitle = '📞 Senior Health Expert Requested';
                                    alertMsg = `Customer ${nameToUse} (#${orderId}) requested conversation review. Message: "${text}"`;
                                }
                            }
                        } catch (geminiErr) {
                            console.error('❌ Gemini API failed, using fallback:', geminiErr.message);
                            replyText = "नमस्ते जी! आपके संदेश के लिए धन्यवाद। हमने आपका मैसेज हमारे सीनियर हेल्थ एक्सपर्ट को भेज दिया है। वे जल्द ही आपसे संपर्क करेंगे। 🙏";
                        }
                    } else {
                        replyText = "नमस्ते जी! आपके संदेश के लिए धन्यवाद। हमने आपका मैसेज हमारे सीनियर हेल्थ एक्सपर्ट को भेज दिया है। वे जल्द ही आपसे संपर्क करेंगे। 🙏";
                    }
                }
            }
        }

        // 3. Trigger high-priority alert in DB for admin dashboard
        if (triggerAlert) {
            await Notification.create({
                orderId: orderId,
                employeeId: employeeId,
                type: 'system_alert',
                title: alertTitle,
                message: alertMsg,
                emoji: alertTitle.includes('Dawa') || alertTitle.includes('Repeat') ? '📦' : '📞',
                priority: alertPriority,
                data: {
                    customerName: nameToUse,
                    telNo: phone,
                    orderId: orderId
                }
            });
            console.log(`🔔 Admin notification alert triggered: "${alertTitle}" for Phone: ${phone}.`);
        }

        // 4. Send the automated reply back to the customer
        console.log(`🤖 Sending automated chatbot reply to ${phone}...`);
        await sendMetaMessageInternal({
            to: phone,
            type: 'text',
            text: replyText,
            customerName: nameToUse,
            orderId: orderId
        });

    } catch (e) {
        console.error('❌ Chatbot reply handler failed:', e.message);
    }
}

module.exports = router;
module.exports.TEMPLATES = TEMPLATES;
module.exports.sendMetaMessageInternal = sendMetaMessageInternal;
module.exports.handleChatbotReply = handleChatbotReply;
