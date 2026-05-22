require('dotenv').config();
const mongoose = require('mongoose');
const { WhatsAppMessage, Notification } = require('../models');

async function inspect() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    console.log('\n--- 10 Recent WhatsApp Messages ---');
    const msgs = await WhatsAppMessage.find().sort({ timestamp: -1 }).limit(10);
    msgs.forEach(m => {
        console.log(`[${m.timestamp.toISOString()}] ${m.direction === 'in' ? 'IN' : 'OUT'} | ${m.phone} (${m.name}): "${m.body}" | Type: ${m.type} | MsgID: ${m.metaMsgId}`);
    });

    console.log('\n--- 5 Recent Notifications ---');
    const alerts = await Notification.find().sort({ createdAt: -1 }).limit(5);
    alerts.forEach(a => {
        console.log(`[${a.createdAt.toISOString()}] Priority: ${a.priority} | Title: "${a.title}" | Msg: "${a.message}"`);
    });

    await mongoose.disconnect();
}

inspect();
