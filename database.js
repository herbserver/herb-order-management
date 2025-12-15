// MongoDB Database Helper Functions
require('dotenv').config();
const mongoose = require('mongoose');
const { Order, Department, ShiprocketConfig } = require('./models');
const dataAccess = require('./dataAccess');

// Connect to MongoDB
async function connectDatabase() {
    try {
        const mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            console.error('❌ MONGODB_URI environment variable not set!');
            dataAccess.setMongoStatus(false);
            return false;
        }

        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected Successfully!');
        console.log('📊 Database:', mongoose.connection.name);
        dataAccess.setMongoStatus(true);
        return true;
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        dataAccess.setMongoStatus(false);
        return false;
    }
}

// Initialize default data if database is empty
async function initializeDefaultData() {
    try {
        // Check if any data exists
        const orderCount = await Order.countDocuments();
        const deptCount = await Department.countDocuments();
        const configCount = await ShiprocketConfig.countDocuments();

        // Create default Shiprocket config if not exists
        if (configCount === 0) {
            console.log('📦 Creating default Shiprocket configuration...');

            await ShiprocketConfig.create({
                configId: 'main',
                enabled: true,
                apiEmail: process.env.SHIPROCKET_API_EMAIL || '',
                apiPassword: process.env.SHIPROCKET_API_PASSWORD || '',
                pickupAddress: {
                    name: 'PRIMARY',
                    phone: '9876543210',
                    address: 'Sample Address',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001'
                },
                defaultDimensions: {
                    length: 20,
                    breadth: 16,
                    height: 8,
                    weight: 0.5
                },
                shiprocketOrderCounter: 7417
            });

            console.log('✅ Default Shiprocket config created');
        }

        console.log(`📊 Database Status: ${orderCount} orders, ${deptCount} departments`);

    } catch (error) {
        console.error('❌ Error initializing default data:', error.message);
    }
}

module.exports = {
    connectDatabase,
    initializeDefaultData,
    Order,
    Department,
    ShiprocketConfig
};
