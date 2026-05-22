require('dotenv').config();
const mongoose = require('mongoose');
const { WhatsAppMessage } = require('../models');

async function getOutgoingMessages() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected.');
        const messages = await WhatsAppMessage.find({ phone: "919354841822" })
            .sort({ timestamp: -1 })
            .limit(10)
            .lean();
        console.log('Messages for 919354841822:');
        console.log(JSON.stringify(messages, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

getOutgoingMessages();
