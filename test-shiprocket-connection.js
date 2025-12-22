// Test Shiprocket API Connection
require('dotenv').config();
const shiprocket = require('./shiprocket');

async function testShiprocketConnection() {
    console.log('🧪 Testing Shiprocket API Connection...\n');

    // Test 1: Check environment variables
    console.log('1️⃣ Checking Environment Variables:');
    console.log('   Email:', process.env.SHIPROCKET_API_EMAIL ? '✅ Set' : '❌ Missing');
    console.log('   Password:', process.env.SHIPROCKET_API_PASSWORD ? '✅ Set' : '❌ Missing');
    console.log('');

    // Test 2: Try to get authentication token
    console.log('2️⃣ Testing Authentication:');
    try {
        const token = await shiprocket.getToken();
        if (token) {
            console.log('   ✅ Authentication successful!');
            console.log('   Token:', token.substring(0, 20) + '...');
        } else {
            console.log('   ❌ Authentication failed - No token received');
        }
    } catch (error) {
        console.log('   ❌ Authentication Error:', error.message);
        console.log('   Details:', error);
    }

    console.log('\n✅ Test Complete!');
}

testShiprocketConnection();
