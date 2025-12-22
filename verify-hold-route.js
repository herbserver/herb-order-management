const fetch = require('node-fetch');

async function testHoldRoute() {
    const API_URL = 'http://localhost:3000/api'; // Adjust port if needed
    const orderId = 'Order ID-0005'; // Use a known order ID

    console.log(`🧪 Testing HOLD route for ${orderId}...`);

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/hold`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                holdReason: 'Test Hold Reason',
                expectedDispatchDate: '2025-12-25',
                holdBy: 'Test Agent'
            })
        });

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('✅ Success: Order is now on hold!');
        } else {
            console.log('❌ Failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Connection Error:', error.message);
        console.log('Note: Make sure the server is running locally on port 3000.');
    }
}

testHoldRoute();
