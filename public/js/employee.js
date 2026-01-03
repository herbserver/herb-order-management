// ==================== EMPLOYEE PANEL LOGIC ====================

document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth('employee');
    if (!user) return; // checkAuth handles redirect

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

    // Set Date/Time
    const now = new Date();
    const dateInput = document.querySelector('[name="date"]');
    if (dateInput) dateInput.value = now.toISOString().split('T')[0];

    const timeInput = document.querySelector('[name="time"]');
    if (timeInput) timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

const PRODUCT_LIST = [
    { name: "Amlex", price: 0 },
    { name: "Black pills", price: 0 },
    { name: "Blue & White capsule", price: 0 },
    { name: "Ess Oil", price: 0 },
    { name: "Ess. capsule", price: 0 },
    { name: "Gaumutra", price: 0 },
    { name: "H.O.S.", price: 0 },
    { name: "Herb On Naturals Herbal Tea", price: 0 },
    { name: "Herb On Vedic Plus Capsule", price: 1199 },
    { name: "HOS Powder", price: 0 },
    { name: "KamGold capsule", price: 0 },
    { name: "kamGold Oil", price: 0 },
    { name: "KamGold Prash", price: 0 },
    { name: "Mind Fresh Tea", price: 0 },
    { name: "Nadi Yog Capsule", price: 1499 },
    { name: "Nadiyog", price: 0 },
    { name: "Naskhol", price: 0 },
    { name: "Naskhol Capsule", price: 1190 },
    { name: "Oil", price: 0 },
    { name: "Ostrich-Cap", price: 0 },
    { name: "Ostrich-Red Oil", price: 0 },
    { name: "Pain Over Capsule", price: 996 },
    { name: "Pain Snap Prash", price: 0 },
    { name: "Painover", price: 0 },
    { name: "Pangasic Oil", price: 800 },
    { name: "Same Medicine", price: 0 },
    { name: "Slim fit kit", price: 0 },
    { name: "Spray Oil", price: 0 },
    { name: "Tea-1500", price: 0 },
    { name: "Tea-1800", price: 0 },
    { name: "Tea-400", price: 0 },
    { name: "Vedic Vain's Liquid", price: 0 },
    { name: "Vedic-Cap", price: 0 },
    { name: "Vedic-Tab", price: 0 },
    { name: "Vena-V", price: 0 },
    { name: "Yellow capsule", price: 0 }
];

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
    // Automatic calculation disabled as per user request
    calculateTotal();
}

function calculateTotal() {
    let sum = 0;
    document.querySelectorAll('.item-row .item-row-total').forEach(i => sum += Number(i.value || 0));
    document.getElementById('total').value = sum;
    calculateCOD();
}

function calculateCOD() {
    const total = Number(document.getElementById('total').value);
    const advance = Number(document.getElementById('advancePaid').value || 0);
    document.getElementById('codAmount').value = total - advance;
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
        total: Number(form.total.value),
        advance: Number(form.advancePaid.value),
        cod: Number(form.codAmount.value),
        remark: form.remark.value,
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
async function loadMyOrders() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_URL}/employees/${currentUser.id}`);
        const data = await res.json();

        // Filter: Pending or Verification
        const orders = (data.orders || []).filter(o => !['Delivered', 'Cancelled', 'Returned'].includes(o.status));
        // Sort: newest first
        orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        document.getElementById('todayCount').innerText = orders.filter(o => new Date(o.timestamp).toDateString() === new Date().toDateString()).length;

        const list = document.getElementById('myOrdersList');
        if (orders.length === 0) { list.innerHTML = '<div class="col-span-full text-center text-gray-400">No active orders</div>'; return; }

        list.innerHTML = orders.map(o => renderEmpOrderCard(o)).join('');
    } catch (e) { console.error(e); }
}

async function loadCancelledOrders() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_URL}/employees/${currentUser.id}`);
        const data = await res.json();
        const orders = (data.orders || []).filter(o => o.status === 'Cancelled');

        const list = document.getElementById('cancelledOrdersList');
        if (orders.length === 0) {
            list.innerHTML = '<div class="col-span-full text-center py-12 bg-red-50 rounded-2xl border-dashed border-2 border-red-100"><p class="text-4xl mb-3">✅</p><p class="text-gray-500">No cancelled orders found</p></div>';
            return;
        }

        list.innerHTML = orders.map(o => `
             <div class="bg-white border border-red-100 rounded-xl overflow-hidden hover:shadow-lg transition-all group">
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

async function loadMyHistory() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_URL}/employees/${currentUser.id}`);
        const data = await res.json();
        // Filter: Delivered or Returned
        const orders = (data.orders || []).filter(o => ['Delivered', 'Returned'].includes(o.status));
        orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const list = document.getElementById('myHistoryList');
        if (orders.length === 0) list.innerHTML = '<div class="text-center text-gray-400 col-span-full">No history yet</div>';
        else list.innerHTML = orders.map(o => renderEmpOrderCard(o, true)).join('');

        // Add Reorder listeners if needed
    } catch (e) { }
}

async function loadEmpProgress() {
    // Similar to loadMyOrders but maybe aggregated stats? 
    // For now, reuse same logic or placeholder
    const list = document.getElementById('empProgressList');
    list.innerHTML = '<div class="text-center text-gray-500">Progress Visualization Coming Soon (Use History Tab for now)</div>';
}

function renderEmpOrderCard(o, isHistory = false) {
    const statusColor = o.status === 'Verification Pending' ? 'text-orange-500 bg-orange-50' :
        o.status === 'Dispatched' ? 'text-blue-500 bg-blue-50' :
            o.status === 'Delivered' ? 'text-green-500 bg-green-50' : 'text-gray-500 bg-gray-50';

    let actionBtn = `<button onclick="viewOrder('${o.orderId}')" class="text-blue-500 text-xs font-bold hover:bg-blue-50 px-3 py-2 rounded-lg">View</button>`;
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
                <p class="text-xs text-gray-400">${new Date(o.timestamp).toLocaleDateString()}</p>
            </div>
        </div>
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

// Search utility
function filterMyOrders(q) {
    document.querySelectorAll('#myOrdersList > div').forEach(c => {
        const m = c.dataset.mobile || '';
        if (m.includes(q) || c.innerText.toLowerCase().includes(q.toLowerCase())) c.style.display = '';
        else c.style.display = 'none';
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
window.reorderFromHistory = reorderFromHistory;
