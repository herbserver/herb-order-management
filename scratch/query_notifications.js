require('dotenv').config();
const mongoose = require('mongoose');
const { Notification } = require('../models');

async function getRecentNotifications() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected.');
        const notifications = await Notification.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        console.log('Recent Notifications:');
        console.log(JSON.stringify(notifications, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

getRecentNotifications();
