const mongoose = require('mongoose');
const { Order } = require('../models');
const { connectDatabase } = require('../database');
const { checkRiskFactors } = require('../background-tracking');

async function runTest() {
    console.log('--- STARTING RISK ANALYSIS TEST ---');

    const connected = await connectDatabase();
    if (!connected) {
        console.error('Failed to connect to DB');
        return;
    }

    const testMobile = '9999999999';

    try {
        // 1. Cleanup old test data
        await Order.deleteMany({ mobile: testMobile });
        console.log('🧹 Cleaned up old test data.');

        // 2. Create History: 2 RTO, 1 Delivered
        const history = [
            {
                orderId: 'TEST-H1',
                timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
                customerName: 'Test Risk User',
                mobile: testMobile,
                address: 'Test Address',
                state: 'Delhi',
                total: 500,
                status: 'RTO'
            },
            {
                orderId: 'TEST-H2',
                timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
                customerName: 'Test Risk User',
                mobile: testMobile,
                address: 'Test Address',
                state: 'Delhi',
                total: 1000,
                status: 'Delivered'
            },
            {
                orderId: 'TEST-H3',
                timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
                customerName: 'Test Risk User',
                mobile: testMobile,
                address: 'Test Address',
                state: 'Delhi',
                total: 800,
                status: 'Cancelled'
            }
        ];
        await Order.insertMany(history);
        console.log('📦 Created history (2/3 failed).');

        // 3. Create NEW Pending Order
        const newOrder = await Order.create({
            orderId: 'TEST-NEW-001',
            timestamp: new Date().toISOString(),
            customerName: 'Test Risk User',
            mobile: testMobile,
            address: 'Test Address',
            state: 'Delhi',
            total: 1200,
            status: 'Pending'
        });
        console.log('✨ Created NEW Pending order.');

        // 4. Run Risk Analysis
        console.log('🔍 Running checkRiskFactors()...');
        await checkRiskFactors();

        // 5. Verify Results
        const flaggedOrder = await Order.findOne({ orderId: 'TEST-NEW-001' });

        console.log('\n--- VERIFICATION ---');
        console.log('Order ID:', flaggedOrder.orderId);
        console.log('Is High Risk:', flaggedOrder.riskMetadata.isHighRisk);
        console.log('Risk Reason:', flaggedOrder.riskMetadata.riskReason);

        if (flaggedOrder.riskMetadata.isHighRisk) {
            console.log('✅ PASS: Order correctly flagged as high risk.');
        } else {
            console.error('❌ FAIL: Order was NOT flagged.');
        }

        // Cleanup
        await Order.deleteMany({ mobile: testMobile });

    } catch (e) {
        console.error('Test Error:', e);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

runTest();
