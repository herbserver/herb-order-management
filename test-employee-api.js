// Quick test: Check if /api/employees endpoint works
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';

async function testEmployeeAPI() {
    try {
        console.log('Testing /api/employees endpoint...\n');

        const res = await fetch(`${API_URL}/api/employees`);
        const data = await res.json();

        console.log('Response Status:', res.status);
        console.log('Success:', data.success);
        console.log('Employees Count:', data.employees?.length || 0);

        if (data.employees && data.employees.length > 0) {
            console.log('\n📊 Employee Stats:');
            console.log('='.repeat(70));
            data.employees.forEach((emp, idx) => {
                console.log(`${idx + 1}. ${emp.id} - ${emp.name}`);
                console.log(`   Total Orders: ${emp.totalOrders}`);
                console.log(`   Pending: ${emp.pendingOrders} | Verified: ${emp.verifiedOrders}`);
                console.log(`   Dispatched: ${emp.dispatchedOrders} | Delivered: ${emp.deliveredOrders}`);
                console.log('-'.repeat(70));
            });
        } else {
            console.log('\n⚠️ No employees found or stats are zero!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testEmployeeAPI();
