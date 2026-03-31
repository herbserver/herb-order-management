/**
 * One-time sync script for copying data/shiprocket_config.json
 * into the MongoDB shiprocket_config collection.
 *
 * Run:
 *   npm run sync:shiprocket-config
 */

require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');

const dataAccess = require('../dataAccess');
const { connectDatabase } = require('../database');
const { readJSON } = require('../utils/fileHelpers');

const SHIPROCKET_CONFIG_FILE = path.join(__dirname, '../data/shiprocket_config.json');

async function syncShiprocketConfigToMongo() {
    console.log('Starting Shiprocket config sync to MongoDB...');

    const localConfig = readJSON(SHIPROCKET_CONFIG_FILE, {});
    if (!localConfig || Object.keys(localConfig).length === 0) {
        throw new Error('No Shiprocket config found in data/shiprocket_config.json');
    }

    const connected = await connectDatabase();
    if (!connected || !dataAccess.getMongoStatus()) {
        throw new Error('MongoDB connection failed. Check MONGODB_URI and database access.');
    }

    const mongoConfigBefore = await dataAccess.getShiprocketConfig();

    const payload = {
        configId: 'main',
        enabled: localConfig.enabled ?? true,
        apiEmail: localConfig.apiEmail || '',
        apiPassword: localConfig.apiPassword || '',
        authToken: localConfig.authToken || '',
        tokenExpiry: localConfig.tokenExpiry || '',
        pickupAddress: localConfig.pickupAddress || {},
        defaultDimensions: localConfig.defaultDimensions || {},
        shiprocketOrderCounter: Number(localConfig.shiprocketOrderCounter || 7417)
    };

    await dataAccess.updateShiprocketConfig(payload);
    const mongoConfigAfter = await dataAccess.getShiprocketConfig();

    console.log('----------------------------------------');
    console.log(`Mongo config existed before sync: ${!!mongoConfigBefore}`);
    console.log(`Enabled: ${mongoConfigAfter.enabled}`);
    console.log(`API email: ${mongoConfigAfter.apiEmail || 'N/A'}`);
    console.log(`Pickup address name: ${mongoConfigAfter.pickupAddress?.name || 'N/A'}`);
    console.log(`Shiprocket counter: ${mongoConfigAfter.shiprocketOrderCounter || 0}`);
    console.log('Shiprocket config synced successfully.');
    console.log('----------------------------------------');
}

syncShiprocketConfigToMongo()
    .then(async () => {
        await mongoose.connection.close();
        process.exit(0);
    })
    .catch(async (error) => {
        console.error('Shiprocket config sync failed:', error.message);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(1);
    });
