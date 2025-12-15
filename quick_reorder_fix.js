// SIMPLE REORDER FIX - Console mein paste karo
// Ye script directly browser console mein run karna hai

console.log('🔧 Installing Simple Reorder Fix...');

// Find all delivered order cards and add reorder button
function addSimpleReorderButtons() {
    const cards = document.querySelectorAll('#myHistoryList > div');
    console.log(`Found ${cards.length} order cards`);

    cards.forEach(card => {
        // Skip if already has button
        if (card.querySelector('.simple-reorder-btn')) return;

        // Check if delivered
        const text = card.textContent.toLowerCase();
        if (!text.includes('delivered')) return;

        // Extract data
        const nameEl = card.querySelector('[class*="font-bold"]');
        const name = nameEl ? nameEl.textContent.trim() : '';
        const mobileMatch = card.textContent.match(/(\d{10})/);
        const mobile = mobileMatch ? mobileMatch[1] : '';

        if (!name || !mobile) {
            console.warn('Could not extract name/mobile from card');
            return;
        }

        // Create button
        const btn = document.createElement('button');
        btn.className = 'simple-reorder-btn w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold';
        btn.innerHTML = '🔄 Reorder';
        btn.onclick = () => {
            const form = document.getElementById('orderForm');
            if (!form) {
                alert('Form not found!');
                return;
            }

            // Fill form
            form.customerName.value = name;
            form.mobile.value = mobile;

            // Clear other fields
            form.village.value = '';
            form.landmark.value = '';
            form.po.value = '';
            form.pin.value = '';
            form.tahTaluka.value = '';
            form.distt.value = '';
            form.state.value = '';

            // Clear items
            const items = document.getElementById('itemsContainer');
            if (items) items.innerHTML = '';

            // Switch tab
            if (window.switchEmpTab) {
                window.switchEmpTab('order');
            }

            alert(`✅ Reorder Started!\n\nName: ${name}\nMobile: ${mobile}\n\nPlease fill address & add items.`);
        };

        card.appendChild(btn);
        console.log(`✅ Added button for: ${name}`);
    });
}

// Run it
addSimpleReorderButtons();

console.log('✅ Simple Reorder Fix Installed!');
console.log('👉 Go to History tab and check delivered orders');
