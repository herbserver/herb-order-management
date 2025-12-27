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
 * Show Dispatch Modal
 * @param {string} orderId - Order ID
 * @param {Object} order - Order object (optional)
 */
function openDispatchModal(orderId, order = null) {
    document.getElementById('dispatchOrderId').value = orderId;
    document.getElementById('dispatchCourier').value = '';
    document.getElementById('dispatchTracking').value = '';
    openModal('dispatchModal');
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
