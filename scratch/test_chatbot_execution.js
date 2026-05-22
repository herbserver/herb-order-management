require('dotenv').config();
const mongoose = require('mongoose');
const { handleChatbotReply } = require('../routes/whatsapp');

async function testExecution() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected.');
        
        const phone = "919354841822";
        const text = "मुफ्त सलाह चाहिए";
        const customerName = "hardeep pal";
        
        console.log(`\n--- TRACING CHATBOT EXECUTION FOR ${phone} ---`);
        await handleChatbotReply(phone, text, customerName);
        console.log('--- EXECUTION COMPLETE ---');
    } catch (e) {
        console.error('Test script crashed:', e);
    } finally {
        await mongoose.disconnect();
    }
}

testExecution();
