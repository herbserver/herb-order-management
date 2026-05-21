// ==================== EMPLOYEE PANEL LOGIC ====================

document.addEventListener('DOMContentLoaded', () => {
    // Only run employee init if user is actually an employee
    // (Prevents redirect when admin/department loads this script)
    const session = typeof loadSession === 'function' ? loadSession() : null;
    if (!session || session.type !== 'employee') return;

    const user = checkAuth('employee');
    if (!user) return;

    // Initialize UI
    initOrderForm();
    loadMyOrders();

    // Set Name
    const nameEl = document.getElementById('empNameDisplay');
    if (nameEl) nameEl.textContent = user.name;

    // Initial Tab
    if (window.switchEmpTab) switchEmpTab('order');
});

// ==================== TAB SWITCHING ====================
function switchEmpTab(tab) {
    // Hide all contents
    ['empOrderTab', 'empTrackingTab', 'empHistoryTab', 'empProgressTab', 'empCancelledTab'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Reset buttons
    const btns = ['empTabOrder', 'empTabTracking', 'empTabHistory', 'empTabProgress', 'empTabCancelled'];
    btns.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('tab-active');
            el.querySelector('span')?.classList.remove('scale-110');
            el.classList.add('text-gray-500');
            el.classList.remove('bg-white', 'text-gray-800');
        }
    });

    let contentId = 'empOrderTab';
    let btnId = 'empTabOrder';

    if (tab === 'tracking') { contentId = 'empTrackingTab'; btnId = 'empTabTracking'; loadMyOrders(); }
    else if (tab === 'history') { contentId = 'empHistoryTab'; btnId = 'empTabHistory'; loadMyHistory(); }
    else if (tab === 'progress') { contentId = 'empProgressTab'; btnId = 'empTabProgress'; loadEmpProgress(); }
    else if (tab === 'cancelled') { contentId = 'empCancelledTab'; btnId = 'empTabCancelled'; loadCancelledOrders(); }

    const content = document.getElementById(contentId);
    const btn = document.getElementById(btnId);

    if (content) content.classList.remove('hidden');
    if (btn) {
        btn.classList.add('tab-active');
        btn.classList.remove('text-gray-500');
        btn.querySelector('span')?.classList.add('scale-110');
    }

    // Auto-close sidebar on mobile after tab selection
    if (window.innerWidth < 1024) {
        const sidebar = document.getElementById('empSidebar');
        const backdrop = document.getElementById('empSidebarBackdrop');
        if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.add('-translate-x-full');
            if (backdrop) {
                backdrop.classList.add('opacity-0', 'pointer-events-none');
                backdrop.classList.remove('opacity-100', 'pointer-events-auto');
            }
        }
    }
}

// ==================== ORDER FORM LOGIC ====================
function initOrderForm() {
    document.getElementById('itemsContainer').innerHTML = '';
    addItem();

    const addressFields = ['hNo', 'blockGaliNo', 'villColony', 'po', 'tahTaluka', 'distt', 'state', 'pin', 'landMark'];
    addressFields.forEach(field => {
        const input = document.querySelector(`[name="${field}"]`);
        if (input) input.addEventListener('input', updateAddress);
    });

    // Reset Father/Husband label to default
    const lbl = document.getElementById('fatherHusbandLabel');
    if (lbl) lbl.textContent = 'Father Name (S/O)';

    // Set Date/Time
    const now = new Date();
    const dateInput = document.querySelector('[name="date"]');
    if (dateInput) dateInput.value = now.toISOString().split('T')[0];

    const timeInput = document.querySelector('[name="time"]');
    if (timeInput) timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// PRODUCT_LIST comes from js/core/config.js (source of truth - 42 products)
// No duplicate list here — uses window.PRODUCT_LIST

function addItem() {
    const div = document.createElement('div');
    div.className = 'item-row grid grid-cols-12 gap-2 mb-2 items-center';

    let options = PRODUCT_LIST.map(p => `<option value="${p.name}" data-price="${p.price}">${p.name}</option>`).join('');

    div.innerHTML = `
        <div class="col-span-6">
            <select class="w-full p-2 border rounded" onchange="updateTotal(this)">
                <option value="">Select Product...</option>
                ${options}
            </select>
        </div>
        <div class="col-span-2">
            <input type="number" class="w-full p-2 border rounded text-center" value="1" min="1" oninput="updateTotal(this)">
        </div>
        <div class="col-span-3">
            <input type="number" class="w-full p-2 border rounded text-right item-row-total" value="0" oninput="calculateTotal()">
        </div>
        <div class="col-span-1 text-center">
            <button type="button" onclick="this.closest('.item-row').remove(); calculateTotal();" class="text-red-500 font-bold text-xl">×</button>
        </div>
    `;
    document.getElementById('itemsContainer').appendChild(div);
}

function updateTotal(el) {
    const row = el.closest('.item-row');
    if (row) {
        const select = row.querySelector('select');
        const qtyInput = row.querySelector('input[type="number"]:not(.item-row-total)');
        const totalInput = row.querySelector('.item-row-total');
        
        if (select && qtyInput && totalInput) {
            const selectedOption = select.options[select.selectedIndex];
            const price = selectedOption ? Number(selectedOption.dataset.price || 0) : 0;
            const qty = Number(qtyInput.value || 0);
            totalInput.value = price * qty;
        }
    }
    calculateTotal();
}

function calculateTotal() {
    let subtotal = 0;
    document.querySelectorAll('.item-row .item-row-total').forEach(i => subtotal += Number(i.value || 0));
    
    const subtotalDisplay = document.getElementById('subtotalDisplay');
    if (subtotalDisplay) {
        subtotalDisplay.innerText = subtotal;
    }

    const discountInput = document.getElementById('discountInput');
    const discount = discountInput ? Number(discountInput.value || 0) : 0;
    
    const grossTotal = Math.max(0, subtotal - discount);
    const totalInput = document.getElementById('totalAmountInput') || document.getElementById('total');
    if (totalInput) {
        totalInput.value = grossTotal;
    }

    calculateCOD();
}

function calculateDiscountFromTotal() {
    let subtotal = 0;
    document.querySelectorAll('.item-row .item-row-total').forEach(i => subtotal += Number(i.value || 0));
    
    const subtotalDisplay = document.getElementById('subtotalDisplay');
    if (subtotalDisplay) {
        subtotalDisplay.innerText = subtotal;
    }

    const totalInput = document.getElementById('totalAmountInput') || document.getElementById('total');
    const enteredGrossTotal = totalInput ? Number(totalInput.value || 0) : 0;

    const calculatedDiscount = Math.max(0, subtotal - enteredGrossTotal);
    const discountInput = document.getElementById('discountInput');
    if (discountInput) {
        discountInput.value = calculatedDiscount;
    }

    calculateCOD();
}

function calculateCOD() {
    const totalInput = document.getElementById('totalAmountInput') || document.getElementById('total');
    const total = totalInput ? Number(totalInput.value || 0) : 0;
    
    const advanceInput = document.querySelector('input[name="advance"]');
    const advance = advanceInput ? Number(advanceInput.value || 0) : 0;
    
    const codInput = document.querySelector('input[name="codAmount"]');
    if (codInput) {
        codInput.value = Math.max(0, total - advance);
    }
}

async function saveOrder() {
    const form = document.getElementById('orderForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const select = row.querySelector('select');
        const qtyInput = row.querySelector('input[type="number"]:not(.item-row-total)');
        const totalInput = row.querySelector('.item-row-total');
        if (select && select.value) {
            const price = Number(select.options[select.selectedIndex].dataset.price || 0);
            const qty = Number(qtyInput ? qtyInput.value : 1);
            const amount = Number(totalInput ? totalInput.value : (price * qty));
            items.push({
                product: select.value,
                description: select.value,
                name: select.value,
                quantity: qty,
                price: price,
                rate: price,
                amount: amount
            });
        }
    });

    // --- ENHANCED VALIDATION ---
    const requiredFields = [
        { field: form.customerName, label: 'Customer Name' },
        { field: form.telNo, label: 'Mobile Number' },
        { field: form.villColony, label: 'Village/Colony' },
        { field: form.distt, label: 'District' },
        { field: form.state, label: 'State' },
        { field: form.pin, label: 'Pincode' }
    ];

    const missingFields = requiredFields
        .filter(item => !item.field.value.trim())
        .map(item => item.label);

    if (missingFields.length > 0) {
        return showWarningPopup(
            'Zaroori Details Gayab Hain!',
            `Kripya ye fields bharlein:\n• ${missingFields.join('\n• ')}`
        );
    }

    if (form.telNo.value.length !== 10) {
        return showWarningPopup('Mobile Number Galat Hai', 'Mobile number poore 10 digit ka hona chahiye.');
    }

    if (items.length === 0) {
        return showWarningPopup('Item Add Karein', 'Kam se kam ek product select karna zaroori hai.');
    }
    // ----------------------------

    const orderData = {
        employeeId: currentUser.id,
        employeeName: currentUser.name, // Ensure this is sent
        customerName: form.customerName.value,
        telNo: form.telNo.value,
        address: form.address.value, // Full address string
        // Individual fields for better data
        hNo: form.hNo.value,
        blockGaliNo: form.blockGaliNo.value,
        villColony: form.villColony.value,
        po: form.po.value,
        tahTaluka: form.tahTaluka.value,
        distt: form.distt.value,
        state: form.state.value,
        pin: form.pin.value,
        landMark: form.landMark.value,

        items: items,
        total: Number(document.getElementById('totalAmountInput').value),
        subtotal: Number(document.getElementById('subtotalDisplay')?.innerText || 0),
        discount: Number(document.getElementById('discountInput')?.value || 0),
        advance: Number(form.advance.value),
        cod: Number(form.codAmount.value),
        codAmount: Number(form.codAmount.value),
        remark: document.getElementById('employeeRemark').value,
        // Capture Manual Order Type
        orderType: document.querySelector('input[name="orderType"]:checked')?.value === 'NEW' ? 'Fresh' : 'Reorder'
    };

    try {
        const btn = document.querySelector('button[onclick="saveOrder()"]');
        const originalText = btn.innerText;
        btn.innerText = 'Checking...';
        btn.disabled = true;

        // ========== DUPLICATE CHECK ==========
        console.log('🔍 Checking duplicate for:', orderData.telNo);
        const dupRes = await fetch(`${API_URL}/orders/check-duplicate`, {
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

    } catch (e) {
        console.error(e);
        showWarningPopup('Connection Error', 'Server se connection nahi ho paya. Please retry karein.');
        const btn = document.querySelector('button[onclick="saveOrder()"]');
        if (btn) { btn.innerText = '💾 SAVE ORDER'; btn.disabled = false; }
    }
}

// Helper function to actually create the order
async function createOrderRequest(orderData, btn, originalText, form) {
    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await res.json();

        if (data.success) {
            const bookedOrder = {
                orderId: data.orderId,
                customerName: orderData.customerName,
                total: orderData.total,
                telNo: orderData.telNo
            };

            showSuccessPopup(
                'Order Saved!',
                `Order #${data.orderId} created successfully.`,
                '🎉',
                '#10b981',
                { type: 'booked', order: bookedOrder }
            );
            form.reset();
            initOrderForm(); // Reset date/time/items
            updateAddress(); // Clear preview
            loadMyOrders(); // Refresh list
        } else {
            showWarningPopup('Error!', data.message || 'Order save nahi ho paya.');
        }

        btn.innerText = originalText;
        btn.disabled = false;
    } catch (e) {
        console.error(e);
        showWarningPopup('Connection Error', 'Server se connection nahi ho paya.');
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Show duplicate order warning popup
function showDuplicateWarning(existingOrder, newOrderData) {
    // Remove existing popup if any
    document.getElementById('duplicateWarningModal')?.remove();

    const createdDate = new Date(existingOrder.createdAt).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const modal = document.createElement('div');
    modal.id = 'duplicateWarningModal';
    modal.className = 'fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleIn">
            <!-- Header -->
            <div class="bg-gradient-to-r from-orange-500 to-red-500 p-5 text-white">
                <div class="flex items-center gap-3">
                    <span class="text-4xl">⚠️</span>
                    <div>
                        <h3 class="text-xl font-bold">Duplicate Order Warning!</h3>
                        <p class="text-white/80 text-sm">Same mobile number ka order already hai</p>
                    </div>
                </div>
            </div>
            
            <!-- Existing Order Details -->
            <div class="p-5 bg-orange-50 border-b border-orange-100">
                <p class="text-xs font-bold text-orange-600 uppercase mb-3">Existing Order Details:</p>
                <div class="bg-white rounded-xl p-4 border border-orange-200 space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Order ID:</span>
                        <span class="font-bold text-gray-800">${existingOrder.orderId}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Customer:</span>
                        <span class="font-bold text-gray-800">${existingOrder.customerName}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Mobile:</span>
                        <span class="font-mono text-gray-800">${existingOrder.telNo}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Status:</span>
                        <span class="font-bold text-blue-600">${existingOrder.status}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Amount:</span>
                        <span class="font-bold text-green-600">₹${existingOrder.total}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Created:</span>
                        <span class="text-gray-600 text-sm">${createdDate}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Created By:</span>
                        <span class="text-gray-600">${existingOrder.employeeName || existingOrder.createdBy}</span>
                    </div>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="p-5 space-y-3">
                <p class="text-sm text-gray-600 text-center mb-4">Kya aap phir bhi naya order create karna chahte ho?</p>
                <div class="grid grid-cols-2 gap-3">
                    <button onclick="document.getElementById('duplicateWarningModal').remove()" 
                        class="bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all">
                        ❌ Cancel
                    </button>
                    <button onclick="forceCreateOrder()" 
                        class="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all">
                        ✅ Create Anyway
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Store order data for force create
    window._pendingOrderData = newOrderData;
}

// Force create order (after user confirms duplicate)
async function forceCreateOrder() {
    const orderData = window._pendingOrderData;
    if (!orderData) return;

    document.getElementById('duplicateWarningModal')?.remove();

    const form = document.getElementById('orderForm');
    const btn = document.querySelector('button[onclick="saveOrder()"]');
    const originalText = btn?.innerText || '💾 SAVE ORDER';

    if (btn) {
        btn.innerText = 'Saving...';
        btn.disabled = true;
    }

    await createOrderRequest(orderData, btn, originalText, form);
    window._pendingOrderData = null;
}

window.forceCreateOrder = forceCreateOrder;

// ==================== AUTOCOMPLETE LOGIC (Condensed) ====================
let districtTimeout;
async function handleDistrictInput(query) {
    const box = document.getElementById('districtSuggestions');
    clearTimeout(districtTimeout);
    if (query.length < 2) { box.classList.add('hidden'); return; }

    districtTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`${API_URL}/locations/search-district?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.success && data.districts.length > 0) {
                // Use Map for unique districts
                const unique = new Map();
                data.districts.forEach(d => unique.set(d.district, d.state));

                box.innerHTML = Array.from(unique.entries()).map(([d, s]) => `
                    <li class="px-4 py-2 hover:bg-emerald-50 cursor-pointer border-b" onclick="selectDistrict('${d.replace(/'/g, "\\'")}', '${s.replace(/'/g, "\\'")}')">
                        <div class="font-bold">${d}</div><div class="text-xs text-gray-500">${s}</div>
                    </li>
                 `).join('');
                box.classList.remove('hidden');
            } else box.classList.add('hidden');
        } catch (e) { }
    }, 300);
}

function selectDistrict(d, s) {
    const f = document.getElementById('orderForm');
    f.distt.value = d; f.state.value = s;
    document.getElementById('districtSuggestions').classList.add('hidden');
    updateAddress();
}

let poTimeout;
async function handlePostOfficeInput(query) {
    const box = document.getElementById('postOfficeSuggestions');
    clearTimeout(poTimeout);
    if (query.length < 2) { box.classList.add('hidden'); return; }

    poTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`${API_URL}/locations/search-po?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.success && data.offices.length > 0) {
                box.innerHTML = data.offices.map(o => `
                    <li class="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b" 
                        onclick="selectPO('${o.office.replace(/'/g, "\\'")}', '${o.pincode}', '${o.taluk.replace(/'/g, "\\'")}', '${o.district.replace(/'/g, "\\'")}', '${o.state.replace(/'/g, "\\'")}')">
                        <div class="flex justify-between font-bold"><span>${o.office}</span><span class="text-xs bg-blue-100 text-blue-800 px-1 rounded">${o.pincode}</span></div>
                        <div class="text-xs text-gray-500">${o.taluk}, ${o.district}</div>
                    </li>
                 `).join('');
                box.classList.remove('hidden');
            } else box.classList.add('hidden');
        } catch (e) { }
    }, 300);
}

function selectPO(office, pin, taluk, district, state) {
    const f = document.getElementById('orderForm');
    f.po.value = office; f.pin.value = pin; f.tahTaluka.value = taluk; f.distt.value = district; f.state.value = state;
    document.getElementById('postOfficeSuggestions').classList.add('hidden');
    updateAddress();
}

function updateAddress() {
    const f = document.getElementById('orderForm');
    const properCase = (str) => str ? str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : '';

    let hNo = f.hNo.value.trim();
    if (hNo && !isNaN(hNo)) hNo = 'H.No ' + hNo;

    let village = f.villColony.value.trim();
    let addrStart = '';
    if (hNo && village) addrStart = `${hNo}, Village ${properCase(village)}`;
    else if (hNo) addrStart = hNo;
    else if (village) addrStart = `Village ${properCase(village)}`;

    const parts = [
        addrStart,
        f.blockGaliNo.value.trim() ? properCase(f.blockGaliNo.value.trim()) : '',
        f.landMark.value.trim() ? 'Landmark: ' + properCase(f.landMark.value.trim()) : '',
        f.po.value.trim() ? 'PO: ' + properCase(f.po.value.trim()) : '',
        properCase(f.tahTaluka.value.trim()),
        properCase(f.distt.value.trim()),
        properCase(f.state.value.trim()),
        f.pin.value.trim() ? 'PIN: ' + f.pin.value.trim() : ''
    ].filter(Boolean);

    f.address.value = parts.join(', ');
}

// ==================== LIST LOADING ====================

const EMP_ITEMS_PER_PAGE = 12; // Limit per page
let empMyOrdersPage = 1;

async function loadMyOrders(page = null) {
    if (!currentUser) return;
    try {
        // Update page if provided
        if (page !== null) empMyOrdersPage = page;
        const currentPage = empMyOrdersPage;

        // OPTIMIZED: Fetch with pagination limit
        const statuses = 'Pending,Dispatched,Out For Delivery,On Hold';
        const res = await fetch(`${API_URL}/orders/employee/${currentUser.id}?status=${encodeURIComponent(statuses)}&page=${currentPage}&limit=${EMP_ITEMS_PER_PAGE}`);
        const data = await res.json();

        if (!data.success) {
            console.error('Failed to load orders');
            return;
        }

        const orders = data.orders || [];
        const totalItems = data.pagination ? data.pagination.total : orders.length;
        const totalPages = Math.ceil(totalItems / EMP_ITEMS_PER_PAGE) || 1;

        // Update today count (from all orders, might need separate API call for accurate count)
        const todayOrders = orders.filter(o => new Date(o.timestamp).toDateString() === new Date().toDateString());
        document.getElementById('todayCount').innerText = todayOrders.length;

        const list = document.getElementById('myOrdersList');
        if (!list) return;

        if (orders.length === 0) {
            list.innerHTML = '<div class="col-span-full text-center text-gray-400">No active orders</div>';
            return;
        }

        list.innerHTML = orders.map(o => renderEmpOrderCard(o)).join('');

        // Add pagination controls
        renderPaginationControls(list, currentPage, totalPages, 'loadMyOrders');
    } catch (e) {
        console.error('Error loading my orders:', e);
    }
}

async function loadCancelledOrders() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_URL}/employees/${currentUser.id}`);
        const data = await res.json();
        const orders = (data.orders || []).filter(o => o.status === 'Cancelled');

        const list = document.getElementById('empCancelledList');
        if (orders.length === 0) {
            list.innerHTML = '<div class="col-span-full text-center py-12 bg-red-50 rounded-2xl border-dashed border-2 border-red-100"><p class="text-4xl mb-3">✅</p><p class="text-gray-500">No cancelled orders found</p></div>';
            return;
        }

        list.innerHTML = orders.map(o => `
             <div class="bg-white border border-red-100 rounded-xl overflow-hidden hover:shadow-lg transition-all group" data-mobile="${o.telNo}">
                <div class="h-1 bg-red-500 w-full"></div>
                <div class="p-5">
                    <div class="flex justify-between items-start mb-4">
                        <div><span class="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md mb-2 inline-block">Order #${o.orderId}</span><h3 class="font-bold text-gray-800 text-lg">${o.customerName}</h3></div>
                        <div class="text-right"><p class="font-bold text-gray-900">₹${o.total}</p><p class="text-xs text-gray-400">${new Date(o.timestamp).toLocaleDateString()}</p></div>
                    </div>
                    <div class="bg-red-50 p-4 rounded-xl border border-red-100">
                        <div class="flex items-start gap-3"><span class="text-xl">⚠️</span><div><p class="text-xs font-bold text-red-800 uppercase mb-1">Cancellation Reason</p><p class="text-sm text-red-700 italic">"${o.cancellationReason || 'Reason not specified'}"</p></div></div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                        <button onclick="viewOrder('${o.orderId}')" class="text-red-500 text-xs font-bold hover:bg-red-50 px-3 py-2 rounded-lg">View Details</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) { }
}

// Pagination Helper with Items Per Page Selector (Clean Style)
function renderPaginationControls(container, currentPage, totalPages, fetchFuncName) {
    if (!container) return;

    // Get current items per page from config
    const currentLimit = typeof paginationConfig !== 'undefined' ? paginationConfig.getItemsPerPage() : EMP_ITEMS_PER_PAGE;

    const div = document.createElement('div');
    div.className = 'col-span-full mt-8';

    div.innerHTML = `
        <!-- Dropdown for items per page -->
        <div class="flex justify-center mb-4">
            <div class="flex items-center gap-2 text-sm">
                <label class="text-gray-600 font-medium">Items per page:</label>
                <select 
                    onchange="handleEmpItemsChange('${fetchFuncName}')"
                    class="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none bg-white cursor-pointer">
                    <option value="10" ${currentLimit === 10 ? 'selected' : ''}>10</option>
                    <option value="25" ${currentLimit === 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${currentLimit === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${currentLimit === 100 ? 'selected' : ''}>100</option>
                    <option value="0" ${currentLimit === 0 ? 'selected' : ''}>All</option>
                </select>
            </div>
        </div>
        
        <!-- Pagination buttons -->
        <div class="flex justify-center items-center gap-2">
            <button 
                onclick="${fetchFuncName}(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}
                class="px-4 py-2 text-sm font-medium rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}">
                ← Previous
            </button>
            
            ${generatePageNumbers(currentPage, totalPages, fetchFuncName)}
            
            <button 
                onclick="${fetchFuncName}(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}
                class="px-4 py-2 text-sm font-medium rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}">
                Next →
            </button>
        </div>
        
        <!-- Info text -->
        <div class="text-center text-sm text-gray-500 mt-3">
            Showing ${((currentPage - 1) * currentLimit) + 1}-${Math.min(currentPage * currentLimit, currentLimit > 0 ? currentLimit * totalPages : 999)} orders
        </div>
    `;

    container.appendChild(div);
}

// Generate page number buttons
function generatePageNumbers(currentPage, totalPages, fetchFuncName) {
    let pages = [];
    const maxVisible = 3; // Show max 3 page numbers

    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Adjust if at the end
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        pages.push(`
            <button 
                onclick="${fetchFuncName}(${i})" 
                class="w-10 h-10 text-sm font-medium rounded-md ${isActive ? 'bg-emerald-500 text-white' : 'text-gray-700 hover:bg-gray-50'}">
                ${i}
            </button>
        `);
    }

    return pages.join('');
}

// Handle items per page change for employee
function handleEmpItemsChange(fetchFuncName) {
    const select = event.target;
    const newLimit = parseInt(select.value);

    // Update global constant
    window.EMP_ITEMS_PER_PAGE = newLimit;

    // Save to localStorage
    if (typeof paginationConfig !== 'undefined') {
        paginationConfig.setItemsPerPage(newLimit);
    } else {
        localStorage.setItem('emp_items_per_page', newLimit.toString());
    }

    console.log(`📊 Employee items per page: ${newLimit === 0 ? 'ALL' : newLimit}`);

    // Reload with page 1
    if (typeof window[fetchFuncName] === 'function') {
        window[fetchFuncName](1);
    }
}

window.handleEmpItemsChange = handleEmpItemsChange;
window.generatePageNumbers = generatePageNumbers;

let historyPage = 1;
async function loadMyHistory(page = 1) {
    if (!currentUser) return;
    historyPage = page;
    try {
        // Optimized: Fetch history with pagination
        const statuses = 'Delivered,Returned,Cancelled';
        const limit = 10;

        const res = await fetch(`${API_URL}/employees/${currentUser.id}?status=${encodeURIComponent(statuses)}&page=${page}&limit=${limit}`);
        const data = await res.json();

        let orders = data.orders || [];
        let total = 0;

        if (data.pagination) {
            total = data.pagination.total;
        } else {
            total = orders.length; // Fallback
        }

        const list = document.getElementById('myHistoryList');
        if (orders.length === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 col-span-full">No history yet</div>';
            return;
        }

        list.innerHTML = orders.map(o => renderEmpOrderCard(o, true)).join('');

        // Render Pagination
        const totalPages = Math.ceil(total / limit) || 1;
        renderPaginationControls(list, page, totalPages, 'loadMyHistory');

        // Add Reorder listeners if needed
    } catch (e) { console.error('History load error:', e); }
}

async function loadEmpProgress() {
    if (!currentUser) return;

    const startDate = document.getElementById('empProgressStartDate')?.value || '';
    const endDate = document.getElementById('empProgressEndDate')?.value || '';

    const list = document.getElementById('empProgressStats');
    if (!list) return;

    list.innerHTML = '<div class="col-span-full text-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div><p class="mt-2 text-gray-500">Loading stats...</p></div>';

    try {
        // Fetch stats from employee detail API
        // Passing limit=0 to get ALL orders for correct stats calculation
        let url = `${API_URL}/employees/${currentUser.id}?limit=0`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.stats) {
            renderProgressCards(data.stats);
            // Hide chart/table for now as requested only cards
            document.getElementById('empProgressChart').innerHTML = '';
            document.getElementById('empProgressTable').innerHTML = '';
        } else {
            list.innerHTML = '<div class="col-span-full text-center text-red-500">Failed to load statistics</div>';
        }
    } catch (e) {
        console.error('Stats error:', e);
        list.innerHTML = '<div class="col-span-full text-center text-red-500">Connection error</div>';
    }
}

function renderProgressCards(stats) {
    const list = document.getElementById('empProgressStats');
    if (!list) return;

    const cards = [
        { label: 'Total Orders', value: stats.total || 0, color: 'blue', icon: '📝' },
        { label: 'On Hold', value: stats.hold || 0, color: 'yellow', icon: 'qh' }, // custom icon code or emoj
        { label: 'Cancelled', value: stats.cancelled || 0, color: 'red', icon: '❌' },
        { label: 'Dispatched', value: stats.dispatched || 0, color: 'purple', icon: '📦' },
        { label: 'Delivered', value: stats.delivered || 0, color: 'green', icon: '✅' },
        { label: 'RTO', value: stats.rto || 0, color: 'rose', icon: '↩️' } // rose/pink for RTO
    ];

    // Map colors to tailwind classes
    const colorMap = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100'
    };

    list.innerHTML = cards.map(c => `
        <div class="glass-card p-4 border ${colorMap[c.color] || 'bg-gray-50'} flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
            <div class="text-3xl mb-2">${c.icon === 'qh' ? '⏸️' : c.icon}</div>
            <div class="text-2xl font-bold mb-1">${c.value}</div>
            <div class="text-xs font-bold uppercase tracking-wider opacity-80">${c.label}</div>
        </div>
    `).join('');
}

function renderEmpOrderCard(o, isHistory = false) {
    // Dynamic status map for premium visual design
    const statusMap = {
        'Pending': { color: 'amber', bg: 'from-amber-500 to-yellow-500', badge: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500', glow: 'shadow-amber-100' },
        'Address Verified': { color: 'emerald', bg: 'from-emerald-500 to-teal-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500', glow: 'shadow-emerald-100' },
        'Dispatched': { color: 'indigo', bg: 'from-indigo-500 to-blue-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100', dot: 'bg-indigo-500', glow: 'shadow-indigo-100' },
        'Delivered': { color: 'green', bg: 'from-green-500 to-emerald-500', badge: 'bg-green-50 text-green-700 border-green-100', dot: 'bg-green-500', glow: 'shadow-green-100' },
        'On Hold': { color: 'orange', bg: 'from-orange-500 to-amber-500', badge: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500', glow: 'shadow-orange-100' },
        'Cancelled': { color: 'rose', bg: 'from-rose-500 to-red-500', badge: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500', glow: 'shadow-rose-100' },
        'Returned': { color: 'slate', bg: 'from-slate-500 to-gray-500', badge: 'bg-slate-50 text-slate-700 border-slate-100', dot: 'bg-slate-500', glow: 'shadow-slate-100' },
        'RTO': { color: 'rose', bg: 'from-rose-500 to-red-500', badge: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500', glow: 'shadow-rose-100' }
    };
    const config = statusMap[o.status] || { color: 'slate', bg: 'from-slate-500 to-gray-500', badge: 'bg-slate-50 text-slate-700 border-slate-100', dot: 'bg-slate-500', glow: 'shadow-slate-100' };

    const hasRequestedDelivery = o.deliveryRequests && o.deliveryRequests.some(r => r.employeeId === (currentUser?.id || ''));

    const displayDate = o.timestamp ? new Date(o.timestamp).toLocaleDateString() : '';
    const displayTime = o.timestamp ? new Date(o.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

    const hasTracking = (o.shiprocket && o.shiprocket.awb) || (o.tracking && o.tracking.trackingId);
    const trackingId = (o.shiprocket && o.shiprocket.awb) || (o.tracking && o.tracking.trackingId) || '';

    // Initials avatar
    const initials = String(o.customerName || 'C').trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Icon SVGs
    const phoneIcon = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>`;
    const locationIcon = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

    return `
    <div class="premium-hover-card overflow-hidden hover:shadow-2xl flex flex-col h-full group" style="box-shadow: 0 10px 30px -10px rgba(148, 163, 184, 0.12), 0 1px 3px rgba(148, 163, 184, 0.04);" data-mobile="${o.telNo || o.mobile || ''}">
        <!-- Premium Left Active Tag & Gradient Glow -->
        <div class="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${config.bg} rounded-l-full"></div>
        
        <!-- Card Header -->
        <div class="px-5 pt-5 pb-4 flex justify-between items-center z-10 pl-6">
            <div class="flex items-center gap-2">
                <span class="bg-slate-50 border border-slate-100 text-slate-700 px-3 py-1 rounded-xl font-black text-[10px] tracking-widest shadow-sm font-mono uppercase">#${o.orderId}</span>
                <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(o).replace(/"/g, '&quot;')})" 
                    class="w-8 h-8 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white hover:scale-110 active:scale-95 shadow-sm transition-all duration-300" title="Send WhatsApp">
                    ${WHATSAPP_ICON}
                </button>
                ${(o.orderType === 'REORDER' || o.orderType === 'Reorder') ? `<span class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest shadow-sm uppercase">REORDER</span>` : ''}
            </div>
            <div class="flex flex-col items-end">
                <span class="text-[9px] text-slate-400 font-bold tracking-wide leading-none uppercase">Amount</span>
                <span class="text-base font-black text-slate-800 mt-1">₹${o.total}</span>
            </div>
        </div>

        <!-- Profile & Status Banner -->
        <div class="px-5 pb-4 flex items-center gap-3.5 pl-6">
            <!-- Avatar circle -->
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${config.bg} text-white font-black text-sm flex items-center justify-center shadow-md ${config.glow} shrink-0 relative group-hover:rotate-3 transition-transform duration-300">
                ${initials}
                <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 ${config.dot} border border-white rounded-full animate-pulse shadow-sm"></span>
            </div>
            <div class="min-w-0 flex-1">
                <h3 class="font-black text-slate-800 text-base leading-tight truncate capitalize" title="${o.customerName}">${o.customerName}</h3>
                ${o.fatherOrHusbandName ? `<p class="text-[10px] font-bold text-slate-400 mt-0.5 truncate uppercase tracking-tight">${o.gender === 'Female' ? 'W/O' : 'S/O'}: ${o.fatherOrHusbandName}</p>` : `<p class="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">Customer</p>`}
            </div>
            <div class="flex flex-col items-end shrink-0">
                <span class="${config.badge} px-2.5 py-1 rounded-lg text-[9px] font-extrabold border uppercase tracking-wider">${o.status}</span>
            </div>
        </div>

        <!-- Details list -->
        <div class="px-5 pb-4 space-y-3 pl-6 flex-grow">
            <!-- Relative time Row -->
            <div class="flex flex-wrap items-center gap-2">
                <div class="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl shadow-inner w-fit">
                    📅 <span class="text-slate-600 font-extrabold uppercase">${displayDate}</span>
                </div>
                <div class="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl shadow-inner w-fit">
                    ⏰ <span class="text-slate-600 font-extrabold uppercase">${displayTime}</span>
                </div>
            </div>

            <!-- Phone Strip -->
            <div class="flex items-center gap-2.5 bg-gradient-to-r from-blue-50/50 to-cyan-50/20 px-3.5 py-2.5 rounded-2xl border border-blue-100/50 shadow-inner group/phone hover:border-blue-200 transition-colors">
                <span class="text-blue-500 bg-white w-7 h-7 rounded-lg flex items-center justify-center shadow-sm border border-blue-100">${phoneIcon}</span>
                <span class="text-sm font-black font-mono tracking-wider text-blue-950">${o.telNo || o.mobile || ''}</span>
                ${o.altNo ? `<span class="text-[9px] text-slate-500 font-extrabold ml-auto bg-white px-2 py-1 rounded-lg border border-slate-100">ALT: ${o.altNo}</span>` : ''}
            </div>

            <!-- Minimal Shipping Box -->
            <div class="space-y-2 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 group-hover:bg-slate-50/80 transition-colors">
                <div class="flex items-center gap-1.5 text-indigo-500 font-black text-[9px] uppercase tracking-widest leading-none">
                    ${locationIcon} <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Delivery Address</span>
                </div>
                <p class="text-xs text-slate-700 font-bold leading-relaxed line-clamp-2 capitalize">
                    ${(o.villColony || o.address || '') ? (typeof toTitleCase === 'function' ? toTitleCase(`${o.villColony || ''}, ${o.distt || o.tahTaluka || o.district || ''}`.trim()) : `${o.villColony || ''}, ${o.distt || o.tahTaluka || o.district || ''}`.trim()) : 'No Address Provided'}
                </p>
                <div class="flex gap-1.5 items-center pt-1.5 border-t border-slate-200/50">
                    <span class="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg text-[9px] font-black font-mono">PIN: ${o.pin || 'N/A'}</span>
                    <span class="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg text-[9px] font-black capitalize">${o.state || 'N/A'}</span>
                    <button onclick="copyAddress('${(o.address || o.villColony || '').replace(/'/g, "\\'")}')" 
                        class="text-[9px] text-blue-600 hover:text-blue-700 font-black ml-auto flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 transition-all shadow-sm">📋 COPY</button>
                </div>
            </div>

            <!-- Tracking ID Box -->
            ${trackingId ? `
            <div class="flex items-center gap-2.5 bg-indigo-50/50 px-3.5 py-2.5 rounded-2xl border border-indigo-100 shadow-inner">
                <span class="text-indigo-500 bg-white w-7 h-7 rounded-lg flex items-center justify-center shadow-sm border border-indigo-100">🧾</span>
                <div class="flex-grow">
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tracking AWB</p>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-mono font-black text-indigo-950 tracking-wider">${trackingId}</span>
                        <button onclick="copyTracking('${trackingId}')" class="text-xs text-indigo-500 hover:text-indigo-700 font-bold">📋 COPY</button>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Notes/Remarks -->
            ${o.remark ? `
            <div class="bg-amber-50/60 border border-amber-100 p-3.5 rounded-2xl shadow-sm">
                <div class="flex items-center gap-1.5">
                    <span class="text-xs">💬</span>
                    <span class="text-[9px] text-amber-500 font-black uppercase tracking-widest leading-none">Your Remark</span>
                </div>
                <p class="text-xs text-amber-900 font-black italic mt-1.5 leading-relaxed">"${o.remark}"</p>
            </div>
            ` : ''}

            ${o.verificationRemark && o.verificationRemark.text ? `
            <div class="bg-rose-50/60 border border-rose-100 p-3.5 rounded-2xl shadow-sm">
                <div class="flex items-center gap-1.5">
                    <span class="text-xs">⚠️</span>
                    <span class="text-[9px] text-rose-500 font-black uppercase tracking-widest leading-none">Verification Remark</span>
                </div>
                <p class="text-xs text-rose-900 font-black italic mt-1.5 leading-relaxed">"${o.verificationRemark.text}"</p>
            </div>
            ` : ''}

            <!-- Delivery Request Section -->
            ${o.status === 'Dispatched' ? `
            <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                <span class="text-xs text-slate-400 font-bold">Delivery Status</span>
                ${!hasRequestedDelivery ? `
                    <button onclick="requestDelivery('${o.orderId}')" class="text-xs bg-pink-50 text-pink-600 px-3 py-1.5 rounded-xl font-black border border-pink-100 hover:bg-pink-100 transition-colors shadow-sm">
                        ✋ Request Delivery
                    </button>
                ` : `
                    <span class="text-[10px] bg-pink-100 text-pink-700 px-2.5 py-1.5 rounded-xl font-bold border border-pink-200">⏳ Req Pending</span>
                `}
            </div>
            ` : ''}
        </div>

        <!-- Tracking Badge if Dispatched/Delivered -->
        ${['Dispatched', 'Delivered', 'Out For Delivery'].includes(o.status) && typeof getTrackingStatusBadge === 'function' ? getTrackingStatusBadge(o) : ''}

        <!-- Actions Footer -->
        <div class="p-4 bg-slate-50/50 border-t border-slate-100/80 space-y-2 mt-auto rounded-b-3xl">
            <button type="button" onclick="viewOrder('${o.orderId}')" 
                class="w-full bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 py-3 rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center gap-2">
                👁️ View Details
            </button>
            ${['Pending', 'On Hold', 'Address Verified', 'Unverified'].includes(o.status) ? `
            <button type="button" onclick="editOrder('${o.orderId}')" 
                class="w-full bg-amber-500 border border-amber-500 text-white hover:bg-amber-600 py-3 rounded-xl text-xs font-black shadow-md shadow-amber-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                ✏️ Edit Order
            </button>
            ` : ''}
            ${((['Delivered', 'Returned', 'Cancelled', 'RTO'].includes(o.status)) || isHistory) ? `
            <button onclick='reorderFromHistory(${JSON.stringify(o).replace(/'/g, "&#39;")})' 
                class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg py-3 rounded-xl text-xs font-black shadow-md shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                🔄 Reorder
            </button>
            ` : ''}
            ${trackingId ? `
             <button type="button" onclick="trackShiprocketOrder('${o.orderId}', '${trackingId}')" 
                class="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3 rounded-xl text-xs font-black shadow-md shadow-indigo-200 hover:shadow-lg active:scale-95 transition-colors flex items-center justify-center gap-2">
                🛰️ Track Package
            </button>
            ` : ''}
        </div>
    </div>`;
}

// Search utility - searches by mobile, name, order ID, and address
function filterMyOrders(q) {
    const query = (q || '').toLowerCase().trim();
    const cards = document.querySelectorAll('#myOrdersList [data-mobile]');

    if (!query) {
        // Show all cards if search is empty
        cards.forEach(c => c.style.display = '');
        return;
    }

    cards.forEach(c => {
        const mobile = (c.dataset.mobile || '').toLowerCase();
        const text = (c.innerText || '').toLowerCase();

        // Search in mobile number or any text content (includes name, ID, address)
        if (mobile.includes(query) || text.includes(query)) {
            c.style.display = '';
        } else {
            c.style.display = 'none';
        }
    });
}

// Search function for History tab
function filterMyHistory(q) {
    const query = (q || '').toLowerCase().trim();
    const cards = document.querySelectorAll('#myHistoryList [data-mobile]');

    if (!query) {
        cards.forEach(c => c.style.display = '');
        return;
    }

    cards.forEach(c => {
        const mobile = (c.dataset.mobile || '').toLowerCase();
        const text = (c.innerText || '').toLowerCase();

        if (mobile.includes(query) || text.includes(query)) {
            c.style.display = '';
        } else {
            c.style.display = 'none';
        }
    });
}

// Search function for Cancelled Orders tab
function filterMyCancelledOrders(q) {
    const query = (q || '').toLowerCase().trim();
    const cards = document.querySelectorAll('#empCancelledList [data-mobile]');

    if (!query) {
        cards.forEach(c => c.style.display = '');
        return;
    }

    cards.forEach(c => {
        const mobile = (c.dataset.mobile || '').toLowerCase();
        const text = (c.innerText || '').toLowerCase();

        if (mobile.includes(query) || text.includes(query)) {
            c.style.display = '';
        } else {
            c.style.display = 'none';
        }
    });
}

function reorderFromHistory(order) {
    const f = document.getElementById('orderForm');
    if (!f) return;
    
    // Core Customer Info
    if (f.customerName) f.customerName.value = order.customerName || '';
    if (f.fatherOrHusbandName) f.fatherOrHusbandName.value = order.fatherOrHusbandName || '';
    if (f.telNo) f.telNo.value = order.telNo || '';
    if (f.altNo) f.altNo.value = order.altNo || '';
    if (f.age) f.age.value = order.age || '';
    if (f.problem) f.problem.value = order.problem || '';
    
    // Set Gender and trigger its onchange handler to update Father/Husband label
    if (f.gender && order.gender) {
        f.gender.value = order.gender;
        // Trigger manual label update
        var lbl = document.getElementById('fatherHusbandLabel');
        if (lbl) {
            lbl.textContent = order.gender === 'Female' ? 'Husband Name (W/O)' : 'Father Name (S/O)';
        }
    }

    // Address Info
    if (f.hNo) f.hNo.value = order.hNo || '';
    if (f.blockGaliNo) f.blockGaliNo.value = order.blockGaliNo || '';
    if (f.villColony) f.villColony.value = order.villColony || '';
    if (f.po) f.po.value = order.po || '';
    if (f.tahTaluka) f.tahTaluka.value = order.tahTaluka || '';
    if (f.distt) f.distt.value = order.distt || '';
    if (f.state) f.state.value = order.state || '';
    if (f.pin) f.pin.value = order.pin || '';
    if (f.landMark) f.landMark.value = order.landMark || '';
    
    // Update the concatenated Address field
    updateAddress();

    switchEmpTab('order');
    showSuccessPopup('Reorder Started', `Details for ${order.customerName} loaded. Please check address and add items.`, '🔄', '#3b82f6');
}

// Global functions for HTML access
window.updateAddress = updateAddress;
window.handleDistrictInput = handleDistrictInput;
window.handlePostOfficeInput = handlePostOfficeInput;
window.selectDistrict = selectDistrict;
window.selectPO = selectPO;
window.saveOrder = saveOrder;
window.switchEmpTab = switchEmpTab;
window.addItem = addItem;
window.updateTotal = updateTotal;
window.calculateTotal = calculateTotal;
window.calculateDiscountFromTotal = calculateDiscountFromTotal;
window.calculateCOD = calculateCOD;
window.filterMyOrders = filterMyOrders;
window.filterMyHistory = filterMyHistory;
window.filterMyCancelledOrders = filterMyCancelledOrders;
window.reorderFromHistory = reorderFromHistory;
window.loadMyHistory = loadMyHistory;

// Override slow legacy functions from app.js with optimized paginated versions
window.loadMyOrders = loadMyOrders;
window._empLoadMyOrders = loadMyOrders; // Used by app.js to delegate to fast version
window.loadCancelledOrders = loadCancelledOrders;
window.loadEmpProgress = loadEmpProgress;

