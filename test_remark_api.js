// TEST SCRIPT - Run this to test remark API
const API_URL = 'http://localhost:3000/api';

async function testRemarkAPI() {
    const testOrderId = 'ORD-00001'; // Change to real order ID
    const testRemark = 'Test remark - debugging';

    console.log('Testing PUT /api/orders/' + testOrderId + '/remark');

    try {
        const response = await fetch(`${API_URL}/orders/${testOrderId}/remark`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                remark: testRemark,
                remarkBy: 'DEPT-001'
            })
        });

        const data = await response.json();
        console.log('Response:', data);

        if (data.success) {
            console.log('✅ API Working!');
            console.log('Order:', data.order);
        } else {
            console.log('❌ API Error:', data.message);
        }
    } catch (error) {
        console.error('❌ Network Error:', error);
    }
}

// Run test
testRemarkAPI();
