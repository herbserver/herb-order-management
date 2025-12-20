const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api';

async function testOrderRoutes() {
    const endpoints = [
        '/orders/pending',
        '/orders/verified',
        '/orders/dispatched',
        '/orders/delivered',
        '/orders/employee/HON-E004'
    ];

    console.log('🚀 Testing New Order Routes...\n');

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(`${API_URL}${endpoint}`);
            const data = await res.json();
            console.log(`📡 GET ${endpoint}`);
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${data.success}`);
            console.log(`   Orders Found: ${data.orders ? data.orders.length : 0}`);
            console.log('-'.repeat(40));
        } catch (error) {
            console.error(`❌ Error testing ${endpoint}:`, error.message);
        }
    }
}

testOrderRoutes();
