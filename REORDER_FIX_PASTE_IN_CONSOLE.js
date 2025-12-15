// PASTE THIS IN BROWSER CONSOLE - INSTANT REORDER FIX

console.log('🚀 Loading Simple Reorder Fix...');

// Remove any existing buttons first
document.querySelectorAll('.simple-reorder-btn').forEach(b => b.remove());

// Add buttons to all delivered orders
const cards = document.querySelectorAll('#myHistoryList > div, #myOrdersList > div');
let added = 0;

cards.forEach(card => {
    // Check if delivered
    if (!card.textContent.toLowerCase().includes('delivered')) return;

    // Get data
    const nameEl = card.querySelector('[class*="font-bold"]');
    const name = nameEl ? nameEl.textContent.trim() : '';
    const mobileMatch = card.textContent.match(/(\d{10})/);
    const mobile = mobileMatch ? mobileMatch[1] : '';

    if (!name || !mobile) return;

    // Create button
    const btn = document.createElement('button');
    btn.className = 'simple-reorder-btn w-full mt-3 px-4 py-3 rounded-xl font-bold text-white';
    btn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    btn.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
    btn.innerHTML = '🔄 Reorder';

    btn.onclick = function () {
        const form = document.getElementById('orderForm');
        if (!form) return alert('❌ Form not found!');

        // Fill form
        form.customerName.value = name;
        form.mobile.value = mobile;

        // Clear address fields
        ['village', 'landmark', 'po', 'pin', 'tahTaluka', 'distt', 'state'].forEach(f => {
            if (form[f]) form[f].value = '';
        });

        // Clear items
        const itemsDiv = document.getElementById('itemsContainer');
        if (itemsDiv) itemsDiv.innerHTML = '';

        // Switch to order tab
        const tabs = ['order', 'tracking', 'history', 'progress'];
        tabs.forEach(t => {
            const tab = document.getElementById('empTab' + t.charAt(0).toUpperCase() + t.slice(1));
            const content = document.getElementById('emp' + t.charAt(0).toUpperCase() + t.slice(1) + 'Tab');
            if (tab && content) {
                if (t === 'order') {
                    tab.classList.add('tab-active');
                    content.classList.remove('hidden');
                } else {
                    tab.classList.remove('tab-active');
                    content.classList.add('hidden');
                }
            }
        });

        // Success message
        alert('✅ Reorder Started!\n\nName: ' + name + '\nMobile: ' + mobile + '\n\nℹ️ Please fill address and add items.');
    };

    card.appendChild(btn);
    added++;
});

console.log('✅ Added ' + added + ' reorder buttons!');
console.log('📍 Go to History tab and check delivered orders');
