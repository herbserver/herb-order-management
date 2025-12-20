const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api/analytics';

async function testAnalytics() {
    console.log('📊 Testing Analytics Endpoints...\n');

    const tests = [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Range Filter', url: '/range?startDate=2025-12-01&endDate=2025-12-31' },
        { name: 'Stuck Orders', url: '/missing-orders' }
    ];

    for (const test of tests) {
        try {
            const res = await fetch(`${API_URL}${test.url}`);
            const data = await res.json();
            console.log(`📡 ${test.name} (${test.url})`);
            console.log(`   Status: ${res.status}`);
            console.log(`   Success: ${data.success}`);
            if (test.name === 'Dashboard' && data.charts) {
                console.log(`   Charts: ${Object.keys(data.charts).join(', ')}`);
            }
            if (test.name === 'Range Filter' && data.stats) {
                console.log(`   Stats: ${JSON.stringify(data.stats)}`);
            }
            if (test.name === 'Stuck Orders') {
                console.log(`   Total Stuck: ${data.totalStuck}`);
            }
            console.log('-'.repeat(50));
        } catch (error) {
            console.error(`❌ Error testing ${test.name}:`, error.message);
        }
    }
}

testAnalytics();
