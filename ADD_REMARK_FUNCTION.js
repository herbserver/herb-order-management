// ADD THIS FUNCTION TO index.html (in the <script> section)

// Save Order Remark
async function saveOrderRemark(orderId) {
    const textarea = document.getElementById(`remark-${orderId}`);
    const remark = textarea.value.trim();

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/remark`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                remark,
                remarkBy: currentUser.id
            })
        });

        const data = await res.json();

        if (data.success) {
            showMessage('💾 Remark saved successfully!', 'success', 'deptMessage');
            loadDeptOrders(); // Refresh the list
        } else {
            showMessage('❌ ' + data.message, 'error', 'deptMessage');
        }
    } catch (e) {
        console.error('Error saving remark:', e);
        showMessage('❌ Failed to save remark', 'error', 'deptMessage');
    }
}
