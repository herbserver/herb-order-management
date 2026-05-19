const fs = require('fs');

let content = fs.readFileSync('public/js/panels/employee.js', 'utf-8');
content = content.replace(/\r\n/g, '\n');

const target = `    try {
        const btn = document.querySelector('button[onclick="saveOrder()"]');
        const originalText = btn.innerText;
        btn.innerText = 'Checking...';
        btn.disabled = true;

        // ========== DUPLICATE CHECK ==========
        console.log('🔍 Checking duplicate for:', orderData.telNo);
        const dupRes = await fetch(\`\${API_URL}/orders/check-duplicate\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telNo: orderData.telNo, customerName: orderData.customerName })
        });
        const dupData = await dupRes.json();
        console.log('🔍 Duplicate check response:', dupData);

        if (dupData.success && dupData.isDuplicate) {
            console.log('⚠️ DUPLICATE FOUND:', dupData.existingOrder);
            btn.innerText = originalText;
            btn.disabled = false;

            // Show duplicate warning popup
            showDuplicateWarning(dupData.existingOrder, orderData);
            return;
        }
        // =====================================

        btn.innerText = 'Saving...';

        // Proceed to create order
        await createOrderRequest(orderData, btn, originalText, form);

    } catch (e) {`;

const replacement = `    try {
        const btn = document.querySelector('button[onclick="saveOrder()"]');
        const originalText = btn.innerText;
        btn.innerText = (typeof currentEditingOrderId !== 'undefined' && currentEditingOrderId) ? 'Updating...' : 'Checking...';
        btn.disabled = true;

        if (typeof currentEditingOrderId !== 'undefined' && currentEditingOrderId) {
            // Update mode - skip duplicate check and update directly
            try {
                const res = await fetch(\`\${API_URL}/orders/\${encodeURIComponent(currentEditingOrderId)}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });
                const data = await res.json();
                
                if (data.success) {
                    showSuccessPopup('Order Updated!', \`Order #\${currentEditingOrderId} updated successfully.\`, '🎉', '#10b981');
                    form.reset();
                    initOrderForm();
                    updateAddress();
                    currentEditingOrderId = null; // Clear edit mode
                    btn.innerText = '💾 SAVE ORDER';
                    btn.classList.remove('bg-amber-600', 'hover:bg-amber-700');
                    btn.classList.add('btn-primary');
                    loadMyOrders();
                } else {
                    showWarningPopup('Error!', data.message || 'Order update failed.');
                    btn.innerText = originalText;
                }
            } catch (err) {
                console.error(err);
                showWarningPopup('Connection Error', 'Update failed.');
                btn.innerText = originalText;
            }
            btn.disabled = false;
            return;
        }

        // ========== DUPLICATE CHECK ==========
        console.log('🔍 Checking duplicate for:', orderData.telNo);
        const dupRes = await fetch(\`\${API_URL}/orders/check-duplicate\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telNo: orderData.telNo, customerName: orderData.customerName })
        });
        const dupData = await dupRes.json();
        console.log('🔍 Duplicate check response:', dupData);

        if (dupData.success && dupData.isDuplicate) {
            console.log('⚠️ DUPLICATE FOUND:', dupData.existingOrder);
            btn.innerText = originalText;
            btn.disabled = false;

            // Show duplicate warning popup
            showDuplicateWarning(dupData.existingOrder, orderData);
            return;
        }
        // =====================================

        btn.innerText = 'Saving...';

        // Proceed to create order
        await createOrderRequest(orderData, btn, originalText, form);

    } catch (e) {`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("SUCCESS employee.js saveOrder");
    fs.writeFileSync('public/js/panels/employee.js', content, 'utf-8');
} else {
    console.log("TARGET NOT FOUND employee.js saveOrder");
}
