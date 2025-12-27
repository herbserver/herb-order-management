/**
 * ============================================
 * FEATURES: EDIT ORDER
 * ============================================
 * All order editing functionality in one place.
 * 
 * If edit modal not opening → Check openEditOrderModal()
 * If save not working → Check saveEditOrder()
 * If items not calculating → Check updateEditTotal()
 */

/**
 * Open Edit Order Modal (Dynamic creation)
 * Creates modal on the fly and appends to body
 * @param {string} orderId - Order ID to edit
 */
async function openEditOrderModal(orderId) {
    try {
        console.log('Opening edit modal for order:', orderId);

        // Fetch order data first
        const res = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}`);
        const data = await res.json();

        if (!data.success || !data.order) {
            console.error('Failed to fetch order:', data);
            alert('❌ Order data load nahi hua! Order: ' + orderId);
            return;
        }

        const order = data.order;
        console.log('Order data loaded:', order.orderId);

        // Remove existing modal if any
        const existingModal = document.getElementById('dynamicEditModal');
        if (existingModal) existingModal.remove();

        // Create modal dynamically with inline styles
        const modal = document.createElement('div');
        modal.id = 'dynamicEditModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';

        let itemsHtml = '';
        (order.items || []).forEach((item, idx) => {
            const qty = item.quantity || item.qty || 1;
            const rate = item.rate || item.price || item.mrp || 0;
            const amount = item.amount || (rate * qty) || 0;
            itemsHtml += `
                <div class="grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 edit-item-row">
                    <input type="text" value="${item.description || item.name || ''}" placeholder="Product" class="col-span-12 md:col-span-5 border rounded-lg px-3 py-2 text-sm edit-item-desc outline-none focus:border-emerald-500">
                    <input type="number" value="${qty}" min="1" placeholder="Qty" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-qty outline-none focus:border-emerald-500 text-center font-bold" oninput="updateEditItemAmount(this)">
                    <input type="number" value="${rate}" placeholder="Rate" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-rate outline-none focus:border-emerald-500" oninput="updateEditItemAmount(this)">
                    <input type="number" value="${amount}" placeholder="Amt" class="col-span-4 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-amount outline-none focus:border-emerald-500 bg-gray-50 font-bold" oninput="updateEditTotal()">
                    <button type="button" onclick="this.parentElement.remove(); updateEditTotal();" class="col-span-2 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors">×</button>
                </div>
            `;
        });

        modal.innerHTML = `
            <div style="background:white;border-radius:20px;max-width:800px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,0.3);">
                <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:20px;border-radius:20px 20px 0 0;display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="color:white;font-size:20px;font-weight:bold;margin:0;">✏️ Edit Order - ${orderId}</h3>
                    <button onclick="document.getElementById('dynamicEditModal').remove();" style="background:rgba(255,255,255,0.2);border:none;color:white;font-size:24px;width:40px;height:40px;border-radius:50%;cursor:pointer;">×</button>
                </div>
                <div style="padding:24px;">
                    <form id="editOrderForm" class="space-y-4">
                        <input type="hidden" id="editOrderId" value="${orderId}">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Customer Name *</label>
                                <input type="text" id="editCustomerName" value="${order.customerName || ''}" required class="w-full border-2 rounded-xl px-4 py-2">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Tel No. *</label>
                                <input type="tel" id="editTelNo" value="${order.telNo || ''}" required class="w-full border-2 rounded-xl px-4 py-2">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div><label class="block text-xs font-medium mb-1">H.NO.</label><input type="text" id="editHNo" value="${order.hNo || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">BLOCK/GALI</label><input type="text" id="editBlockGaliNo" value="${order.blockGaliNo || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">VILL/COLONY</label><input type="text" id="editVillColony" value="${order.villColony || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">P.O.</label><input type="text" id="editPo" value="${order.po || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div><label class="block text-xs font-medium mb-1">TAH/TALUKA</label><input type="text" id="editTahTaluka" value="${order.tahTaluka || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">DISTT.</label><input type="text" id="editDistt" value="${order.distt || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">STATE</label><input type="text" id="editState" value="${order.state || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">PIN</label><input type="text" id="editPin" value="${order.pin || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div><label class="block text-xs font-medium mb-1">LANDMARK</label><input type="text" id="editLandMark" value="${order.landMark || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">ALT NO.</label><input type="tel" id="editAltNo" value="${order.altNo || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                        </div>
                        <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                            <div class="flex justify-between items-center mb-3">
                                <label class="font-bold text-emerald-700">🛒 ITEMS</label>
                                <button type="button" onclick="addEditItem()" class="bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm">+ Add Item</button>
                            </div>
                            <div class="mb-2 grid grid-cols-12 gap-2 text-xs font-bold text-emerald-800 px-2">
                                <span class="col-span-12 md:col-span-5">Product</span>
                                <span class="col-span-3 md:col-span-2 text-center">Qty</span>
                                <span class="col-span-3 md:col-span-2 text-center">Rate</span>
                                <span class="col-span-4 md:col-span-2 text-center">Amount</span>
                                <span class="col-span-2 md:col-span-1"></span>
                            </div>
                            <div id="editItemsContainer" class="space-y-2">${itemsHtml}</div>
                            <div class="mt-3 pt-3 border-t border-emerald-300 flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span id="editTotalAmount" class="text-red-600">₹${order.total || 0}</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div><label class="block text-sm font-medium mb-1">Advance</label><input type="number" id="editAdvance" value="${order.advance || 0}" oninput="updateEditCOD()" class="w-full border-2 rounded-xl px-4 py-2"></div>
                            <div><label class="block text-sm font-medium mb-1">COD Amount</label><input type="number" id="editCodAmount" value="${order.codAmount || 0}" readonly class="w-full border-2 rounded-xl px-4 py-2 bg-red-50 text-red-700 font-bold"></div>
                        </div>
                        <div class="flex gap-3">
                            <button type="button" onclick="document.getElementById('dynamicEditModal').remove();" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium">Cancel</button>
                            <button type="button" onclick="saveEditOrder()" class="flex-1 bg-orange-600 text-white py-3 rounded-xl font-medium hover:bg-orange-700">💾 Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        console.log('Dynamic edit modal created and appended to body');

    } catch (e) {
        console.error('Error in openEditOrderModal:', e);
        alert('Order load nahi hua! Error: ' + e.message);
    }
}

/**
 * Add new item row to edit form
 */
function addEditItem() {
    const container = document.getElementById('editItemsContainer');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 mb-2 edit-item-row';
    div.innerHTML = ` 
        <input type="text" placeholder="Product" class="col-span-12 md:col-span-5 border rounded-lg px-3 py-2 text-sm edit-item-desc outline-none focus:border-emerald-500"> 
        <input type="number" placeholder="Qty" value="1" min="1" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-qty outline-none focus:border-emerald-500 text-center font-bold" oninput="updateEditItemAmount(this)"> 
        <input type="number" placeholder="Rate" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-rate outline-none focus:border-emerald-500" oninput="updateEditItemAmount(this)"> 
        <input type="number" placeholder="Amt" class="col-span-4 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-amount outline-none focus:border-emerald-500 bg-gray-50 font-bold" oninput="updateEditTotal()"> 
        <button type="button" onclick="this.parentElement.remove(); updateEditTotal();" class="col-span-2 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors">×</button>
    `;
    container.appendChild(div);
}

/**
 * Auto-calculate amount when Qty or Rate changes
 * @param {HTMLElement} input - The input element that changed
 */
function updateEditItemAmount(input) {
    const row = input.closest('.edit-item-row');
    if (!row) return;

    const qty = parseFloat(row.querySelector('.edit-item-qty').value) || 1;
    const rate = parseFloat(row.querySelector('.edit-item-rate').value) || 0;
    const amountInput = row.querySelector('.edit-item-amount');
    if (amountInput) {
        amountInput.value = (qty * rate).toFixed(0);
    }
    updateEditTotal();
}

/**
 * Update total amount from all items
 */
function updateEditTotal() {
    let total = 0;

    document.querySelectorAll('.edit-item-amount').forEach(input => {
        total += parseFloat(input.value) || 0;
    });

    const totalEl = document.getElementById('editTotalAmount');
    if (totalEl) {
        totalEl.textContent = '₹' + total.toFixed(2);
    }
    updateEditCOD();
}

/**
 * Update COD amount (Total - Advance)
 */
function updateEditCOD() {
    const totalEl = document.getElementById('editTotalAmount');
    const advanceEl = document.getElementById('editAdvance');
    const codEl = document.getElementById('editCodAmount');

    if (!totalEl || !advanceEl || !codEl) return;

    const total = parseFloat(totalEl.textContent.replace('₹', '')) || 0;
    const advance = parseFloat(advanceEl.value) || 0;
    codEl.value = Math.max(0, total - advance).toFixed(2);
}

/**
 * Save edited order to server
 */
async function saveEditOrder() {
    // Try to find editOrderId from dynamic modal first
    const dynamicModal = document.getElementById('dynamicEditModal');
    let orderId = '';

    if (dynamicModal) {
        const orderIdInput = dynamicModal.querySelector('#editOrderId');
        if (orderIdInput) {
            orderId = orderIdInput.value;
        }
    }

    // Fallback to global search
    if (!orderId) {
        const globalOrderIdEl = document.getElementById('editOrderId');
        if (globalOrderIdEl) {
            orderId = globalOrderIdEl.value;
        }
    }

    console.log('🆔 Order ID found:', orderId);

    if (!orderId) {
        alert('❌ Order ID not found! Cannot save.');
        return;
    }

    const items = [];

    document.querySelectorAll('.edit-item-row').forEach(row => {
        const desc = row.querySelector('.edit-item-desc').value.trim();
        const qtyInput = row.querySelector('.edit-item-qty');
        const qty = qtyInput ? (parseFloat(qtyInput.value) || 1) : 1;
        const rate = row.querySelector('.edit-item-rate').value;
        const amount = row.querySelector('.edit-item-amount').value;

        if (desc) items.push({
            description: desc,
            name: desc,
            quantity: qty,
            rate: parseFloat(rate) || 0,
            price: parseFloat(rate) || 0,
            amount: parseFloat(amount) || 0
        });
    });

    const total = items.reduce((sum, item) => sum + item.amount, 0);

    // Build address
    const addressParts = [
        document.getElementById('editHNo').value,
        document.getElementById('editBlockGaliNo').value,
        document.getElementById('editVillColony').value,
        document.getElementById('editPo').value,
        document.getElementById('editTahTaluka').value,
        document.getElementById('editDistt').value,
        document.getElementById('editState').value,
        document.getElementById('editPin').value
    ].filter(v => v && v.trim());

    const updateData = {
        customerName: toTitleCase(document.getElementById('editCustomerName').value.trim()),
        telNo: document.getElementById('editTelNo').value.trim(),
        altNo: document.getElementById('editAltNo').value.trim(),
        hNo: document.getElementById('editHNo').value.trim(),
        blockGaliNo: toTitleCase(document.getElementById('editBlockGaliNo').value.trim()),
        villColony: toTitleCase(document.getElementById('editVillColony').value.trim()),
        po: toTitleCase(document.getElementById('editPo').value.trim()),
        tahTaluka: toTitleCase(document.getElementById('editTahTaluka').value.trim()),
        distt: toTitleCase(document.getElementById('editDistt').value.trim()),
        state: toTitleCase(document.getElementById('editState').value.trim()),
        pin: document.getElementById('editPin').value.trim(),
        landMark: toTitleCase(document.getElementById('editLandMark').value.trim()),
        address: addressParts.map(p => toTitleCase(p.trim())).join(', '),
        items,
        total,
        advance: parseFloat(document.getElementById('editAdvance').value) || 0,
        codAmount: parseFloat(document.getElementById('editCodAmount').value) || 0,
        editedBy: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : 'Department',
        editedAt: new Date().toISOString()
    };

    try {
        const apiUrl = `${API_URL}/orders/${encodeURIComponent(orderId)}`;
        console.log('📤 Saving order to:', apiUrl);

        const res = await fetch(apiUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        console.log('📥 Response status:', res.status, res.statusText);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ Server response (not JSON):', errorText.substring(0, 200));
            throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        if (data.success) {
            // Close dynamic modal
            if (dynamicModal) dynamicModal.remove();

            // Also try closing static modal if it exists
            const staticModal = document.getElementById('editOrderModal');
            if (staticModal) staticModal.classList.add('hidden');

            showSuccessPopup(
                'Order Updated! ✏️',
                `Order ${orderId} successfully update ho gaya!`,
                '✏️',
                '#3b82f6'
            );

            // Reload appropriate list
            if (typeof loadDeptOrders === 'function') {
                setTimeout(() => loadDeptOrders(), 1000);
            } else if (typeof loadAdminPending === 'function') {
                setTimeout(() => location.reload(), 1000);
            }
        } else {
            alert(data.message || 'Update failed!');
        }
    } catch (e) {
        console.error('Error saving order:', e);
        alert('Server error! ' + e.message);
    }
}

/**
 * Edit order from dispatch panel
 * @param {string} orderId - Order ID
 * @param {Object} order - Order object
 */
function editDispatchOrder(orderId, order) {
    openEditOrderModal(orderId);
}

/**
 * Edit dispatched order (alias)
 */
function editDispatchedOrder(orderId, order) {
    openEditOrderModal(orderId);
}
