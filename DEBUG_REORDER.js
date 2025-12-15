// PASTE IN CONSOLE TO DEBUG REORDER ISSUE

console.log('🔍 REORDER DEBUG TEST');
console.log('====================');

// Test 1: Check if button exists
const btn = document.querySelector('.simple-reorder-btn');
console.log('1. Button found:', btn ? 'YES ✅' : 'NO ❌');

// Test 2: Check if order card exists
const card = document.querySelector('#myHistoryList > div');
console.log('2. Order card found:', card ? 'YES ✅' : 'NO ❌');

// Test 3: Extract Order ID
if (card) {
    const orderIdMatch = card.textContent.match(/ORD-\d+/i);
    const orderId = orderIdMatch ? orderIdMatch[0] : null;
    console.log('3. Order ID extracted:', orderId || 'FAILED ❌');

    // Test 4: Try API call manually
    if (orderId) {
        console.log('4. Testing API call:', '/api/orders/' + orderId);
        fetch('/api/orders/' + orderId)
            .then(r => r.json())
            .then(data => {
                console.log('5. API Response:', data);
                if (data && data.order) {
                    console.log('✅ ORDER DATA FOUND!');
                    console.log('Name:', data.order.customerName);
                    console.log('Mobile:', data.order.telNo);
                    console.log('Address:', data.order.villColony);
                } else {
                    console.log('❌ NO ORDER IN RESPONSE');
                }
            })
            .catch(err => {
                console.error('❌ API ERROR:', err);
            });
    }
}

// Test 5: Check form
const form = document.getElementById('orderForm');
console.log('6. Form found:', form ? 'YES ✅' : 'NO ❌');

if (form) {
    console.log('7. Form field names:');
    console.log('   - customerName:', form.customerName ? 'EXISTS ✅' : 'MISSING ❌');
    console.log('   - telNo:', form.telNo ? 'EXISTS ✅' : 'MISSING ❌');
    console.log('   - villColony:', form.villColony ? 'EXISTS ✅' : 'MISSING ❌');
}

console.log('====================');
console.log('📋 Copy these results and send to me!');
