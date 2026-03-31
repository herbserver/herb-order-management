// ==================== EMPLOYEE PANEL LOGIC ====================

function readStoredSession() {
    try {
        return JSON.parse(localStorage.getItem('herb_session'));
    } catch (e) {
        return null;
    }
}

function normalizeEmployeeUser(user) {
    if (!user) return null;

    const id = String(user.id || user.employeeId || user.empId || '').trim().toUpperCase();
    if (!id) return null;

    return {
        ...user,
        id,
        employeeId: user.employeeId || id,
        name: user.name || user.employeeName || ''
    };
}

function syncEmployeeSessionUser(user) {
    const normalizedUser = normalizeEmployeeUser(user);
    if (!normalizedUser) return null;

    currentUser = normalizedUser;
    window.currentUser = normalizedUser;

    const session = readStoredSession();
    if (session && session.type === 'employee') {
        session.user = normalizedUser;
        localStorage.setItem('herb_session', JSON.stringify(session));
    }

    return normalizedUser;
}

function getCurrentEmployeeId() {
    return normalizeEmployeeUser(currentUser)?.id || '';
}

function getCurrentEmployeeName() {
    return normalizeEmployeeUser(currentUser)?.name || '';
}

const EMPLOYEE_PRODUCT_FALLBACK = [
    'Amlex', 'Black pills', 'Blue & White capsule', 'Blue&White Cap',
    'Ess Oil', 'Ess. Cap', 'Ess. capsule', 'Gaumutra', 'H.O.S.',
    'Herb On Naturals Herbal Tea', 'Herb On Vedic Plus Capsule',
    'Herbon Daibayog Cap', 'Herbon Tulsi Paawan', 'Herbon Urja Rasayan Capsule',
    'HOS Powder', 'KamGold capsule', 'kamGold Oil', 'KamGold Prash',
    'Mind Fresh Tea', 'Nadi Yog Capsule', 'Nadiyog', 'Naskhol',
    'Naskhol Capsule', 'Oil', 'Ostrich-Cap', 'Ostrich-Red Oil',
    'Pain Over Capsule', 'Pain Snap Prash', 'Painover', 'Pangasic Oil',
    'Same Medicine', 'Slim fit kit', 'Spray Oil', 'Tea-1500',
    'Tea-1800', 'Tea-400', "Vedic Vain's Liquid", 'Vedic-Cap',
    'Vedic-Tab', 'Vena-V', 'Yellow capsule', 'Yellow Cpasule'
].map((name) => ({ name, price: 0 }));

function escapeEmployeeProductValue(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getEmployeeProductList() {
    const source = Array.isArray(window.PRODUCT_LIST) && window.PRODUCT_LIST.length > 0
        ? window.PRODUCT_LIST
        : EMPLOYEE_PRODUCT_FALLBACK;

    return source
        .map((product) => {
            if (typeof product === 'string') {
                return { name: product, price: 0 };
            }

            const name = String(product?.name || '').trim();
            if (!name) return null;

            return {
                ...product,
                name,
                price: Number(product?.price || 0)
            };
        })
        .filter(Boolean);
}

function buildEmployeeProductOptions(selectedValue = '') {
    const normalizedSelectedValue = String(selectedValue || '').trim();
    const products = getEmployeeProductList();
    let options = products.map((product) => {
        const name = escapeEmployeeProductValue(product.name);
        const isSelected = product.name === normalizedSelectedValue ? ' selected' : '';
        return `<option value="${name}" data-price="${Number(product.price || 0)}"${isSelected}>${name}</option>`;
    }).join('');

    if (normalizedSelectedValue && !products.some((product) => product.name === normalizedSelectedValue)) {
        const escapedSelectedValue = escapeEmployeeProductValue(normalizedSelectedValue);
        options += `<option value="${escapedSelectedValue}" selected>${escapedSelectedValue}</option>`;
    }

    return options;
}

function refreshEmployeeProductRows() {
    document.querySelectorAll('#itemsContainer .item-row select').forEach((select) => {
        const currentValue = select.value;
        select.innerHTML = `
            <option value="">Select Product...</option>
            ${buildEmployeeProductOptions(currentValue)}
        `;
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

window.addEventListener('productsLoaded', refreshEmployeeProductRows);

document.addEventListener('DOMContentLoaded', () => {
    // Only run employee init if user is actually an employee
    // (Prevents redirect when admin/department loads this script)
    if (typeof loadSession === 'function') {
        loadSession();
    }

    const session = readStoredSession();
    if (!session || session.type !== 'employee') return;

    const isAuthorized = checkAuth('employee');
    if (!isAuthorized) return;

    const employeeUser = syncEmployeeSessionUser(session.user || currentUser);
    if (!employeeUser) return;

    // Initialize UI
    initOrderForm();
    loadMyOrders();

    // Set Name
    const nameEl = document.getElementById('empNameDisplay');
    if (nameEl) nameEl.textContent = employeeUser.name;

    // Initial Tab
    if (window.switchEmpTab) switchEmpTab('order');
});

// ==================== TAB SWITCHING ====================
function switchEmpTab(tab) {
    // Hide all contents
    ['empOrderTab', 'empTrackingTab', 'empHistoryTab', 'empProgressTab', 'empOfdTab', 'empCancelledTab'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Reset buttons
    ['empTabOrder', 'empTabTracking', 'empTabHistory', 'empTabProgress', 'empTabOfd', 'empTabCancelled'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Remove old styling classes
            el.classList.remove('sidebar-active', 'bg-emerald-50', 'text-emerald-600', 'tab-active', 'bg-white', 'text-gray-800');
            el.classList.add('text-slate-600', 'text-gray-500');
            el.querySelector('span')?.classList.remove('scale-110');
        }
    });

    let contentId = 'empOrderTab';
    let buttonId = 'empTabOrder';

    if (tab === 'tracking') { contentId = 'empTrackingTab'; buttonId = 'empTabTracking'; loadMyOrders(); }
    else if (tab === 'history') { contentId = 'empHistoryTab'; buttonId = 'empTabHistory'; loadMyHistory(); }
    else if (tab === 'progress') { contentId = 'empProgressTab'; buttonId = 'empTabProgress'; loadEmpProgress(); }
    else if (tab === 'ofd') { contentId = 'empOfdTab'; buttonId = 'empTabOfd'; if (typeof loadMyOfdOrders === 'function') loadMyOfdOrders(); }
    else if (tab === 'cancelled') { contentId = 'empCancelledTab'; buttonId = 'empTabCancelled'; loadCancelledOrders(); }

    const content = document.getElementById(contentId);
    const btn = document.getElementById(buttonId);

    if (content) content.classList.remove('hidden');
    if (btn) {
        btn.classList.add('sidebar-active', 'bg-emerald-50', 'text-emerald-600');
        btn.classList.remove('text-slate-600', 'text-gray-500');
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

/**
 * Handle Search Bar Commands (e.g., #orders, #history)
 * @param {string} cmd Command starting with #
 * @returns {boolean} True if command was handled
 */
function handleEmployeeCommand(cmd) {
    const command = cmd.toLowerCase().replace('#', '').trim();
    
    const mapping = {
        'new': 'order',
        'order': 'order',
        'entry': 'order',
        'tracking': 'tracking',
        'orders': 'tracking',
        'myorders': 'tracking',
        'myorder': 'tracking',
        'history': 'history',
        'past': 'history',
        'progress': 'progress',
        'stats': 'progress',
        'report': 'progress',
        'analytics': 'progress',
        'ofd': 'ofd',
        'delivery': 'ofd',
        'outfordelivery': 'ofd',
        'cancelled': 'cancelled',
        'cancel': 'cancelled'
    };

    if (mapping[command]) {
        if (typeof window.openEmployeeTab === 'function') {
            window.openEmployeeTab(mapping[command]);
        } else {
            switchEmpTab(mapping[command]);
        }
        // Hide global search bar after switching
        const bar = document.getElementById('globalSearchBar');
        if (bar) bar.classList.add('hidden');
        return true;
    }

    return false;
}

window.handleEmployeeCommand = handleEmployeeCommand;

// ==================== ORDER FORM LOGIC ====================
function initOrderForm() {
    document.getElementById('itemsContainer').innerHTML = '';
    addItem();

    const addressFields = ['hNo', 'blockGaliNo', 'villColony', 'po', 'tahTaluka', 'distt', 'state', 'pin', 'landMark'];
    addressFields.forEach(field => {
        const input = document.querySelector(`[name="${field}"]`);
        if (input) input.addEventListener('input', updateAddress);
    });

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

    const options = buildEmployeeProductOptions();

    div.innerHTML = `
        <div class="col-span-6">
            <select class="item-desc w-full p-2 border rounded" onchange="updateTotal(this)">
                <option value="">Select Product...</option>
                ${options}
            </select>
        </div>
        <div class="col-span-2">
            <input type="number" class="item-qty w-full p-2 border rounded text-center" value="1" min="1" oninput="updateTotal(this)">
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
    // Automatic calculation disabled as per user request
    calculateTotal();
}

function calculateTotal() {
    let sum = 0;
    document.querySelectorAll('.item-row .item-row-total').forEach(i => sum += Number(i.value || 0));
    const totalInput = document.getElementById('totalAmountInput');
    if (totalInput) {
        totalInput.value = sum;
    }
    calculateCOD();
}

function calculateCOD() {
    const total = Number(document.getElementById('totalAmountInput').value) || 0;
    const advance = Number(document.querySelector('input[name="advance"]').value) || 0;
    document.querySelector('input[name="codAmount"]').value = total - advance;
}

async function saveOrder() {
    const form = document.getElementById('orderForm');
    const employeeId = getCurrentEmployeeId();
    const employeeName = getCurrentEmployeeName();

    if (!employeeId) {
        return showMessage('Employee session missing hai. Dobara login karein.', 'error', 'empMessage');
    }

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const select = row.querySelector('select');
        const qty = row.querySelector('input[type="number"]');
        if (select.value) {
            items.push({
                product: select.value,
                quantity: Number(qty.value),
                price: Number(select.options[select.selectedIndex].dataset.price)
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
        employeeId,
        employee: employeeName,
        employeeName, // Ensure this is sent
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
        advance: Number(form.advance.value),
        cod: Number(form.codAmount.value),
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
let empMyOrdersLastDate = '';

function getEmployeeItemsPerPage() {
    if (typeof paginationConfig !== 'undefined' && typeof paginationConfig.getItemsPerPage === 'function') {
        return paginationConfig.getItemsPerPage();
    }
    if (typeof window.EMP_ITEMS_PER_PAGE === 'number') {
        return window.EMP_ITEMS_PER_PAGE;
    }
    return EMP_ITEMS_PER_PAGE;
}

function getMyOrdersDateValue() {
    const input = document.getElementById('myOrdersDate');
    if (!input) return '';
    return input.value || '';
}

function renderMyOrdersStats(stats, options = {}) {
    const container = document.getElementById('myOrdersStats');
    if (!container) return;
    const showDateSummary = Boolean(options.showDateSummary);

    const safeStats = {
        total: 0,
        pending: 0,
        verified: 0,
        dispatched: 0,
        ofd: 0,
        delivered: 0,
        cancelled: 0,
        hold: 0,
        ...(stats || {})
    };

    const cards = showDateSummary
        ? [
            { label: 'Total', value: safeStats.total, border: 'blue' },
            { label: 'Pending', value: safeStats.pending, border: 'yellow' },
            { label: 'Verified', value: safeStats.verified, border: 'emerald' },
            { label: 'Dispatch', value: safeStats.dispatched, border: 'indigo' },
            { label: 'Done', value: safeStats.delivered, border: 'green' },
            { label: 'Cancel', value: safeStats.cancelled, border: 'red' }
        ]
        : [
            { label: 'Total', value: safeStats.total, border: 'blue' },
            { label: 'Pending', value: safeStats.pending, border: 'yellow' },
            { label: 'Verified', value: safeStats.verified, border: 'emerald' },
            { label: 'Dispatch', value: safeStats.dispatched, border: 'indigo' },
            { label: 'OFD', value: safeStats.ofd, border: 'orange' },
            { label: 'Hold', value: safeStats.hold, border: 'amber' }
        ];

    container.innerHTML = cards.map(card => `
        <div class="glass-card p-2 flex flex-col items-center justify-center text-center border-b-2 border-${card.border}-500 bg-white shadow-sm">
            <span class="text-[7px] font-black text-gray-400 uppercase tracking-tighter">${card.label}</span>
            <span class="text-sm font-black text-slate-800">${card.value}</span>
        </div>
    `).join('');
}

async function loadMyOrders(page = null) {
    if (!currentUser) return;
    try {
        const employeeId = getCurrentEmployeeId();
        const selectedDate = getMyOrdersDateValue();
        const itemsPerPage = getEmployeeItemsPerPage();
        const activeStatuses = 'Pending,Address Verified,Dispatched,Out For Delivery,On Hold,Hold';
        const showDateSummary = Boolean(selectedDate);

        if (!employeeId) {
            const list = document.getElementById('myOrdersList');
            if (list) {
                list.innerHTML = '<div class="col-span-full text-center text-red-500">Employee session missing. Please login again.</div>';
            }
            return;
        }

        // Reset pagination when date filter changes
        if (page !== null) {
            empMyOrdersPage = page;
        } else if (selectedDate !== empMyOrdersLastDate) {
            empMyOrdersPage = 1;
        }
        empMyOrdersLastDate = selectedDate;

        const currentPage = empMyOrdersPage;

        const params = new URLSearchParams({
            page: String(currentPage),
            limit: String(itemsPerPage)
        });
        if (selectedDate) {
            params.set('startDate', selectedDate);
            params.set('endDate', selectedDate);
            params.set('dateField', 'date');
        } else {
            params.set('status', activeStatuses);
        }
        const res = await fetch(`${API_URL}/employees/${employeeId}?${params.toString()}`);
        const data = await res.json();

        if (!data.success) {
            console.error('Failed to load orders');
            const list = document.getElementById('myOrdersList');
            if (list) {
                list.innerHTML = '<div class="col-span-full text-center text-red-500">Orders load nahi ho paye.</div>';
            }
            return;
        }

        const orders = data.orders || [];
        const totalItems = data.pagination ? data.pagination.total : orders.length;
        const totalPages = itemsPerPage > 0 ? (Math.ceil(totalItems / itemsPerPage) || 1) : 1;

        renderMyOrdersStats(data.stats, { showDateSummary });

        // Update today count if element exists
        const todayCountEl = document.getElementById('todayCount');
        if (todayCountEl) {
            const todayOrders = orders.filter(o => new Date(o.timestamp).toDateString() === new Date().toDateString());
            todayCountEl.innerText = todayOrders.length;
        }

        const list = document.getElementById('myOrdersList');
        if (!list) return;

        if (orders.length === 0) {
            list.innerHTML = `<div class="col-span-full text-center text-gray-400">${selectedDate ? `No orders found for ${selectedDate}` : 'No active orders'}</div>`;
            return;
        }

        list.innerHTML = orders.map(o => renderEmpOrderCard(o)).join('');

        // Add pagination controls
        if (itemsPerPage > 0 && totalPages > 1) {
            renderPaginationControls(list, currentPage, totalPages, 'loadMyOrders');
        }
    } catch (e) {
        console.error('Error loading my orders:', e);
    }
}

async function loadCancelledOrders() {
    if (!currentUser) return;
    try {
        const employeeId = getCurrentEmployeeId();
        if (!employeeId) return;

        const res = await fetch(`${API_URL}/employees/${employeeId}`);
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

async function loadMyOfdOrders(page = 1) {
    if (!currentUser) return;
    try {
        const employeeId = getCurrentEmployeeId();
        if (!employeeId) return;

        const statuses = 'Out For Delivery';
        const res = await fetch(`${API_URL}/orders/employee/${employeeId}?status=${encodeURIComponent(statuses)}&page=${page}&limit=${EMP_ITEMS_PER_PAGE}`);
        const data = await res.json();

        const list = document.getElementById('empOfdList');
        if (!list) return;

        if (!data.success || !data.orders || data.orders.length === 0) {
            list.innerHTML = '<div class="col-span-full text-center py-12 bg-indigo-50 rounded-2xl border-dashed border-2 border-indigo-100"><p class="text-4xl mb-3">🚚</p><p class="text-gray-500">No orders out for delivery</p></div>';
            return;
        }

        list.innerHTML = data.orders.map(o => renderEmpOrderCard(o)).join('');
        
        const totalItems = data.pagination ? data.pagination.total : data.orders.length;
        const totalPages = Math.ceil(totalItems / EMP_ITEMS_PER_PAGE) || 1;
        renderPaginationControls(list, page, totalPages, 'loadMyOfdOrders');
    } catch (e) {
        console.error('Error loading OFD orders:', e);
    }
}

window.loadMyOfdOrders = loadMyOfdOrders;
window.handleEmpItemsChange = handleEmpItemsChange;
window.generatePageNumbers = generatePageNumbers;

let historyPage = 1;
let historyLastDate = '';
async function loadMyHistory(page = 1) {
    if (!currentUser) return;
    try {
        const employeeId = getCurrentEmployeeId();
        if (!employeeId) return;

        const selectedDate = document.getElementById('empHistoryDate')?.value || '';
        if (selectedDate !== historyLastDate && page === 1) {
            historyPage = 1;
        } else {
            historyPage = page;
        }
        historyLastDate = selectedDate;

        // Optimized: Fetch history with pagination
        const statuses = 'Delivered,Returned,Cancelled';
        const limit = 10;
        const params = new URLSearchParams({
            status: statuses,
            page: String(historyPage),
            limit: String(limit)
        });
        if (selectedDate) {
            params.set('startDate', selectedDate);
            params.set('endDate', selectedDate);
            params.set('dateField', 'date');
        }

        const res = await fetch(`${API_URL}/employees/${employeeId}?${params.toString()}`);
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
            list.innerHTML = `<div class="text-center text-gray-400 col-span-full">${selectedDate ? `No history found for ${selectedDate}` : 'No history yet'}</div>`;
            return;
        }

        list.innerHTML = orders.map(o => renderEmpOrderCard(o, true)).join('');

        // Render Pagination
        const totalPages = Math.ceil(total / limit) || 1;
        if (totalPages > 1) {
            renderPaginationControls(list, historyPage, totalPages, 'loadMyHistory');
        }

        // Add Reorder listeners if needed
    } catch (e) { console.error('History load error:', e); }
}

async function loadEmpProgress() {
    if (!currentUser) return;
    const employeeId = getCurrentEmployeeId();
    if (!employeeId) return;

    const startDate = document.getElementById('empProgressStartDate')?.value || '';
    const endDate = document.getElementById('empProgressEndDate')?.value || '';

    const list = document.getElementById('empProgressStats');
    if (!list) return;

    list.innerHTML = '<div class="col-span-full text-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div><p class="mt-2 text-gray-500">Loading stats...</p></div>';

    try {
        // Fetch stats from employee detail API
        // Passing limit=0 to get ALL orders for correct stats calculation
        let url = `${API_URL}/employees/${employeeId}?limit=0`;
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
    const statusColor = o.status === 'Pending' ? 'text-orange-500 bg-orange-50' :
        o.status === 'Dispatched' ? 'text-blue-500 bg-blue-50' :
            o.status === 'Out For Delivery' ? 'text-purple-500 bg-purple-50' :
                o.status === 'Delivered' ? 'text-green-500 bg-green-50' : 'text-gray-500 bg-gray-50';
    const savedDate = String(o.date || '').trim();
    const displayDate = /^\d{4}-\d{2}-\d{2}$/.test(savedDate)
        ? savedDate
        : new Date(o.timestamp).toLocaleDateString();

    const hasTracking = (o.shiprocket && o.shiprocket.awb) || (o.tracking && o.tracking.trackingId);
    const trackingId = (o.shiprocket && o.shiprocket.awb) || (o.tracking && o.tracking.trackingId) || '';

    let actionBtn = `<button onclick="viewOrder('${o.orderId}')" class="text-blue-500 text-xs font-bold hover:bg-blue-50 px-3 py-2 rounded-lg">View</button>`;

    if (hasTracking) {
        actionBtn = `
            <button onclick="trackShiprocketOrder('${o.orderId}', '${trackingId}')" class="text-orange-600 text-xs font-bold hover:bg-orange-50 px-3 py-2 rounded-lg mr-1">
                🔍 Track
            </button>
            ${actionBtn}
        `;
    }

    if (isHistory) {
        actionBtn += `<button onclick='reorderFromHistory(${JSON.stringify(o).replace(/'/g, "&#39;")})' class="text-green-600 text-xs font-bold hover:bg-green-50 px-3 py-2 rounded-lg ml-2">🔄 Reorder</button>`;
    }

    return `
    <div class="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow" data-mobile="${o.telNo}">
        <div class="flex justify-between items-start mb-2">
            <div>
                <span class="text-xs font-bold ${statusColor} px-2 py-1 rounded rounded-lg mb-1 inline-block">${o.status}</span>
                <h4 class="font-bold text-gray-800">${o.customerName}</h4>
            </div>
            <div class="text-right">
                <p class="font-bold text-sm">₹${o.total}</p>
                <p class="text-xs text-gray-400">${displayDate}</p>
            </div>
        </div>
        ${o.remark ? `<div class="bg-yellow-50 border border-yellow-100 p-2 rounded-lg mb-3 text-xs text-yellow-800"><strong>📝 Remark:</strong> ${o.remark}</div>` : ''}
        <p class="text-xs text-gray-500 mb-3 truncate">📍 ${o.address}</p>
        <div class="flex justify-between items-center border-t border-gray-100 pt-3">
            <div class="flex items-center gap-2">
                <span class="text-xs font-mono text-gray-400">#${o.orderId}</span>
                <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(o).replace(/"/g, '&quot;')})" 
                    class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-sm transition-all" title="Send WhatsApp">
                    ${WHATSAPP_ICON}
                </button>
            </div>
            <div>${actionBtn}</div>
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
    f.customerName.value = order.customerName;
    f.telNo.value = order.telNo;
    // Attempt parsing address if possible, or just raw fill if fields match
    // Simplified: Just clear fields then user fills. 
    // For now, let's just alert

    // Better: parse if we have stored detailed address in 'order' object (we do in backend usually)
    // If not, we rely on user.
    // Let's at least switch tab
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
window.loadMyOfdOrders = loadMyOfdOrders;

