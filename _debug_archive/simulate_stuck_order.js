const mongoose = require('mongoose');
const { Order } = require('../models');
const { checkStuckOrders } = require('../background-tracking');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // 1. Create a dummy "Stuck" Order (7 days old last update)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const stuckOrder = new Order({
            orderId: 'DEMO-STUCK-' + Date.now(),
            customerName: 'Demo Stuck Customer',
            telNo: '9999999999',
            address: '123 Test Lane, Nowhere',
            items: [{ description: 'Test Item', quantity: 1, price: 100, amount: 100 }],
            total: 100,
            status: 'Dispatched', // Crucial status (Valid Enum)
            timestamp: sevenDaysAgo.toISOString(),
            tracking: {
                courier: 'TestCourier',
                trackingId: 'TRK123456789',
                currentStatus: 'In Transit',
                lastUpdatedAt: sevenDaysAgo.toISOString() // This triggers the alert (> 5 days)
            },
            riskMetadata: {
                stuckAlert: false // Start clean
            },
            state: 'Delhi'
        });

        await stuckOrder.save();
        console.log(`📦 Created Demo Stuck Order: ${stuckOrder.orderId}`);

        // 2. Run the AI Watchdog Check immediately
        console.log('🕵️‍♂️ Running AI Watchdog Check...');
        await checkStuckOrders();

        console.log('\n🎉 Done! Go to ADMIN PANEL -> DASHBOARD to see the alert.');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
