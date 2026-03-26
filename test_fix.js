const axios = require('axios');

async function testFiltering() {
    const baseUrl = 'http://localhost:3000/api/orders';
    const status = 'Delivered';
    const today = new Date().toISOString().split('T')[0];

    console.log(`Testing filtering for status: ${status} and date: ${today}`);

    try {
        const response = await axios.get(`${baseUrl}?status=${status}&startDate=${today}&endDate=${today}`);
        console.log('API Response Status:', response.status);
        console.log('Orders Count:', response.data.orders.length);
        if (response.data.orders.length > 0) {
            console.log('First Order ID:', response.data.orders[0].orderId);
            console.log('First Order Timestamp:', response.data.orders[0].timestamp);
        } else {
            console.log('No orders found for today in Delivered status. This might be expected if no orders were delivered today yet.');
        }

        // Test without date filter to compare
        const responseAll = await axios.get(`${baseUrl}?status=${status}`);
        console.log('Total Delivered Orders (without date filter):', responseAll.data.orders.length);

    } catch (error) {
        console.error('Error during test:', error.message);
    }
}

testFiltering();
