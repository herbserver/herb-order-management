require('dotenv').config();
const mongoose = require('mongoose');
const { checkDeliveryFollowUps } = require('../delivery-followup');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected.');

        console.log('Starting follow-up execution...');
        await checkDeliveryFollowUps();
        console.log('Follow-up execution completed.');
    } catch (e) {
        console.error('Error running follow-ups:', e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
