// Test Shiprocket Authentication
require('dotenv').config();
const axios = require('axios');

async function testShiprocketAuth() {
    console.log('🧪 Testing Shiprocket Authentication...\n');

    const email = process.env.SHIPROCKET_API_EMAIL;
    const password = process.env.SHIPROCKET_API_PASSWORD;

    console.log('📧 Email:', email);
    console.log('🔑 Password:', password ? `Set (${password.length} characters)` : 'NOT SET');
    console.log('');

    if (!email || !password) {
        console.error('❌ Credentials not found in .env file!');
        return;
    }

    try {
        console.log('🔄 Calling Shiprocket API...');
        const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
            email: email,
            password: password
        });

        console.log('');
        console.log('✅ SUCCESS! Shiprocket authentication working!');
        console.log('📦 Token received:', response.data.token ? 'YES' : 'NO');
        console.log('👤 User:', response.data.first_name || 'N/A');
        console.log('');
        console.log('🎉 Shiprocket integration ready to use!');

    } catch (error) {
        console.log('');
        console.error('❌ AUTH FAILED!');
        console.error('');

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data?.message || 'Unknown error');
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
            console.error('');

            if (error.response.status === 401) {
                console.error('🔴 INVALID CREDENTIALS!');
                console.error('   Check email/password in .env file');
                console.error('   Make sure Shiprocket account is active');
            }
        } else {
            console.error('Error:', error.message);
        }
    }
}

testShiprocketAuth();
