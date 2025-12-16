// Quick Deployment Verification Script
// Run after deploying to Render: node verify-deployment.js

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🔍 DEPLOYMENT VERIFICATION\n');
console.log('This will help you verify your Render deployment\n');

let renderURL = '';

rl.question('Enter your Render URL (e.g., https://your-app.onrender.com): ', async (url) => {
    renderURL = url.trim();

    if (!renderURL.startsWith('http')) {
        renderURL = 'https://' + renderURL;
    }

    console.log('\n📋 Testing deployment at:', renderURL);
    console.log('================================\n');

    // Test 1: Health Check
    console.log('1️⃣ Testing server connection...');
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${renderURL}/api/health`);
        const data = await response.json();

        if (data.success) {
            console.log('   ✅ Server is running!\n');
        } else {
            console.log('   ❌ Server responded but health check failed\n');
        }
    } catch (error) {
        console.log('   ❌ Cannot connect to server');
        console.log('   Error:', error.message);
        console.log('\n   Possible issues:');
        console.log('   - Server is still deploying (wait 2-3 minutes)');
        console.log('   - Wrong URL entered');
        console.log('   - Server crashed - check Render logs\n');
    }

    // Test 2: CORS Check
    console.log('2️⃣ Testing CORS configuration...');
    console.log('   Open browser and go to:', renderURL);
    console.log('   If you see "Server se connect nahi ho paya" error:');
    console.log('   ❌ CORS not configured properly');
    console.log('   Fix: Add ALLOWED_ORIGINS in Render environment variables\n');
    console.log('   If login page loads without error:');
    console.log('   ✅ CORS is working!\n');

    // Instructions
    console.log('3️⃣ Manual Tests Required:\n');
    console.log('   Test Employee Registration:');
    console.log('   - Go to:', renderURL);
    console.log('   - Click "New Account"');
    console.log('   - Register: Name=TestUser, ID=TEST001, Pass=Test@123');
    console.log('   - ✅ Should show success message\n');

    console.log('   Test Employee Login:');
    console.log('   - Login with TEST001 / Test@123');
    console.log('   - ✅ Should login successfully\n');

    console.log('   Test Order Creation:');
    console.log('   - Fill order form');
    console.log('   - Click Save Order');
    console.log('   - ✅ Should save successfully\n');

    console.log('   Test Data Persistence:');
    console.log('   - Render Dashboard → Manual Deploy');
    console.log('   - Wait for restart');
    console.log('   - Login again with TEST001');
    console.log('   - ✅ Employee and orders should still exist\n');

    console.log('   Test Admin Panel:');
    console.log('   - Go to:', `${renderURL}/admin.html`);
    console.log('   - ✅ TEST001 should be visible with order count\n');

    console.log('================================');
    console.log('✅ All tests passed? → Ready for boss demo!');
    console.log('❌ Any test failed? → Check FINAL-DEPLOYMENT.md');
    console.log('================================\n');

    rl.close();
});
