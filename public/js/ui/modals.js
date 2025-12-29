/**
 * ============================================
 * UI MODALS - Modal Open/Close Functions
 * ============================================
 * All modal-related functions in one place.
 * 
 * If modal not opening → Check this file
 * If modal not closing → Check closeModal()
 */

/**
 * Close any modal by ID
 * @param {string} id - Modal element ID
 */
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    // Also try closing dynamic modal
    const dynamicModal = document.getElementById('dynamicEditModal');
    if (dynamicModal && id === 'editOrderModal') {
        dynamicModal.remove();
    }
}

/**
 * Open a modal by ID
 * @param {string} id - Modal element ID
 */
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

/**
 * Show Order View Modal
 * @param {string} orderId - Order ID to view
 */
async function showOrderModal(orderId) {
    try {
        const res = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}`);
        const data = await res.json();

        if (!data.success || !data.order) {
            alert('Order not found!');
            return;
        }

        const order = data.order;

        // Populate modal content
        const modal = document.getElementById('orderModal');
        const content = document.getElementById('orderModalContent');

        if (content) {
            content.innerHTML = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div><strong>Order ID:</strong> ${order.orderId}</div>
                        <div><strong>Status:</strong> ${order.status}</div>
                        <div><strong>Customer:</strong> ${order.customerName}</div>
                        <div><strong>Mobile:</strong> ${order.telNo}</div>
                    </div>
                    <div><strong>Address:</strong> ${order.address || '-'}</div>
                    <div><strong>Total:</strong> ₹${order.total || 0}</div>
                </div>
            `;
        }

        openModal('orderModal');
    } catch (e) {
        console.error('Error showing order modal:', e);
        alert('Error loading order details');
    }
}

/**
 * Show Dispatch Modal (Manual AWB Entry)
 * @param {string} orderId - Order ID
 * @param {Object} order - Order object (optional)
 */
function openDispatchModal(orderId, order = null) {
    // Create dynamic modal for manual dispatch
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
    modal.id = 'manualDispatchModalDynamic';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 class="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                <span class="text-2xl">📝</span>
                Manual Dispatch
            </h3>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">📦 Courier Name *</label>
                    <select id="modalCourierSelect" class="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none font-medium">
                        <option value="">-- Select Courier --</option>
                        <option value="Delhivery">🚛 Delhivery</option>
                        <option value="Delhivery Air">✈️ Delhivery Air</option>
                        <option value="Blue Dart">🔵 Blue Dart</option>
                        <option value="Blue Dart Air">🔵 Blue Dart Air</option>
                        <option value="DTDC">📦 DTDC</option>
                        <option value="DTDC Air">📦 DTDC Air</option>
                        <option value="Xpressbees">⚡ Xpressbees</option>
                        <option value="Ekart">🛒 Ekart</option>
                        <option value="India Post">📮 India Post</option>
                        <option value="Other">📫 Other</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">🔢 AWB / Tracking Number *</label>
                    <input type="text" id="modalAWBInput" placeholder="Enter AWB number..." 
                        class="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none font-mono font-bold">
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">📝 Notes (Optional)</label>
                    <textarea id="modalDispatchNotes" placeholder="Any additional notes..." rows="2"
                        class="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none resize-none"></textarea>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3 mt-6">
                <button onclick="document.getElementById('manualDispatchModalDynamic').remove()" 
                    class="bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all">
                    Cancel
                </button>
                <button onclick="submitModalManualDispatch('${orderId}')" 
                    class="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    <span>✅</span> Dispatch
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Focus on courier select
    setTimeout(() => document.getElementById('modalCourierSelect')?.focus(), 100);
}

// Submit function for modal
window.submitModalManualDispatch = async (orderId) => {
    const courier = document.getElementById('modalCourierSelect')?.value;
    const awb = document.getElementById('modalAWBInput')?.value?.trim();
    const notes = document.getElementById('modalDispatchNotes')?.value?.trim();

    if (!courier) {
        alert('❌ Please select a courier!');
        return;
    }

    if (!awb) {
        alert('❌ Please enter AWB/Tracking number!');
        return;
    }

    // Close modal
    document.getElementById('manualDispatchModalDynamic')?.remove();

    // Show loading
    const loading = document.createElement('div');
    loading.innerHTML = '<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div class="bg-white p-6 rounded-2xl text-center"><p class="text-4xl mb-2">📦</p><p class="font-bold">Processing Manual Dispatch...</p></div></div>';
    loading.id = 'loadingDispatch';
    document.body.appendChild(loading);

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/dispatch`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courier: courier,
                trackingId: awb,
                dispatchedBy: currentUser?.id || 'Dispatch Dept',
                notes: notes || ''
            })
        });

        const data = await res.json();
        document.getElementById('loadingDispatch')?.remove();

        if (data.success) {
            showSuccessPopup('Dispatched!', `Manual dispatch successful\\nCourier: ${courier}\\nAWB: ${awb}`, '✅', '#10b981');
            // Reload orders
            if (typeof loadDeptOrders === 'function') loadDeptOrders();
            if (typeof loadDispatchedOrders === 'function') loadDispatchedOrders();
        } else {
            alert('❌ Error: ' + (data.message || 'Dispatch failed'));
        }
    } catch (e) {
        document.getElementById('loadingDispatch')?.remove();
        alert('❌ Error: ' + e.message);
    }
}


/**
 * Show Register Department Modal
 */
function showRegisterDeptModal() {
    openModal('registerDeptModal');
}

/**
 * Show Shiprocket Modal
 */
function showShiprocketModal() {
    openModal('shiprocketModal');
    loadShiprocketStatus();
}

/**
 * Show Edit Employee Modal
 * @param {string} empId - Employee ID
 * @param {string} name - Employee Name
 */
function showEditEmployeeModal(empId, name) {
    document.getElementById('editEmpId').value = empId;
    document.getElementById('editEmpName').value = name;
    document.getElementById('editEmpNewPassword').value = '';
    openModal('editEmployeeModal');
}

/**
 * Show Edit Department Modal
 * @param {string} deptId - Department ID
 * @param {string} deptName - Department Name
 */
function openEditDeptModal(deptId, deptName) {
    document.getElementById('editDeptId').value = deptId;
    document.getElementById('editDeptName').value = deptName;
    document.getElementById('editDeptNewPassword').value = '';
    openModal('editDeptModal');
}

// Global keyboard shortcut for ESC to close modals
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        const modals = [
            'orderModal',
            'trackingModal',
            'editOrderModal',
            'dispatchModal',
            'shiprocketModal',
            'editEmployeeModal',
            'editDeptModal',
            'registerDeptModal',
            'dynamicEditModal'
        ];

        modals.forEach(id => {
            const modal = document.getElementById(id);
            if (modal && !modal.classList.contains('hidden')) {
                closeModal(id);
            }
        });
    }
});
