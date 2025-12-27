const fs = require('fs');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDatabase, Order } = require('../database');
const dataAccess = require('../dataAccess');

const ORDERS_FILE = path.join(__dirname, '../data/orders.json');

async function migrate() {
    console.log('🚀 Starting Order Type SAFE Migration...');

    const connected = await connectDatabase();

    if (connected) {
        console.log('✅ Connected to MongoDB. Running Mongo migration...');
        await migrateMongo();
    } else {
        console.log('⚠️ MongoDB not connected. Running JSON file migration...');
        migrateJSON();
    }
}

async function migrateMongo() {
    const orders = await Order.find({}).sort({ timestamp: 1 });
    console.log(`found ${orders.length} orders in MongoDB.`);

    const seenMobiles = new Set();
    let freshCount = 0;
    let reorderCount = 0;
    let skippedCount = 0;

    const bulkOps = [];

    for (const order of orders) {
        const mobile = order.telNo || order.mobileNumber;
        let calculatedType = 'Fresh';

        if (mobile && seenMobiles.has(mobile)) {
            calculatedType = 'Reorder';
        } else {
            if (mobile) seenMobiles.add(mobile);
        }

        // SAFE CHECK: Only update if missing
        if (!order.orderType) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: order._id },
                    update: { $set: { orderType: calculatedType } }
                }
            });
            if (calculatedType === 'Fresh') freshCount++;
            else reorderCount++;
        } else {
            skippedCount++;
        }
    }

    if (bulkOps.length > 0) {
        console.log(`Writing ${bulkOps.length} updates to MongoDB...`);
        await Order.bulkWrite(bulkOps);
    }

    console.log(`✅ Safe Migration Complete. Updated: ${freshCount + reorderCount} (Fresh: ${freshCount}, Reorder: ${reorderCount}). Skipped (Already Set): ${skippedCount}`);
    process.exit(0);
}

function migrateJSON() {
    if (!fs.existsSync(ORDERS_FILE)) {
        console.error('❌ Orders file not found!');
        process.exit(1);
    }

    const rawData = fs.readFileSync(ORDERS_FILE, 'utf8');
    let orders = JSON.parse(rawData);
    console.log(`Found ${orders.length} orders in JSON file.`);

    orders.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const seenMobiles = new Set();
    let freshCount = 0;
    let reorderCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
        const mobile = order.telNo || order.mobileNumber;
        let calculatedType = 'Fresh';

        if (mobile && seenMobiles.has(mobile)) {
            calculatedType = 'Reorder';
        } else {
            if (mobile) seenMobiles.add(mobile);
        }

        if (!order.orderType) {
            order.orderType = calculatedType;
            if (calculatedType === 'Fresh') freshCount++;
            else reorderCount++;
        } else {
            skippedCount++;
        }
    }

    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    console.log(`✅ Safe Migration Complete. Updated: ${freshCount + reorderCount} (Fresh: ${freshCount}, Reorder: ${reorderCount}). Skipped (Already Set): ${skippedCount}`);
}

migrate().catch(console.error);
