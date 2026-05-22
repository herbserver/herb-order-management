require('dotenv').config();
const mongoose = require('mongoose');
const { WhatsAppMessage } = require('../models');

async function getRecentMessages() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected.');
        const messages = await WhatsAppMessage.find({ direction: 'in' })
            .sort({ timestamp: -1 })
            .limit(10)
            .lean();
        console.log('Recent incoming messages:');
        console.log(JSON.stringify(messages, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

getRecentMessages();
