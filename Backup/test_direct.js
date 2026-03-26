const dataAccess = require('./dataAccess');
const path = require('path');
require('dotenv').config();

async function testDirectly() {
    console.log('Testing dataAccess.getOrdersByStatus directly...');

    // Set status manually if needed for JSON mode
    dataAccess.setMongoStatus(false);

    const status = 'Delivered';
    const today = new Date().toISOString().split('T')[0];

    try {
        // Test with date filter
        const result = await dataAccess.getOrdersByStatus(status, 1, 0, today, today);
        const orders = Array.isArray(result) ? result : result.orders;

        console.log(`Results for ${status} on ${today}:`, orders.length);

        if (orders.length > 0) {
            console.log('Success: Found filtered orders.');
            console.log('Sample Order Date:', orders[0].timestamp);
        } else {
            console.log('No orders found for today. This is valid if the data file is empty or has no matches.');
        }

        // Test with wide range to ensure it finds something
        const oldDate = '2020-01-01';
        const wideResult = await dataAccess.getOrdersByStatus(status, 1, 0, oldDate, today);
        const wideOrders = Array.isArray(wideResult) ? wideResult : wideResult.orders;
        console.log(`Results for ${status} from ${oldDate} to ${today}:`, wideOrders.length);

    } catch (error) {
        console.error('Error during direct test:', error);
    }
}

testDirectly();
