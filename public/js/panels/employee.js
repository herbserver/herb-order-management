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
        name: user.name || user.employeeName || '',
        phone: user.phone || ''
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

const EMPLOYEE_PRODUCT_FALLBACK = Array.isArray(window.DEFAULT_PRODUCT_LIST)
    ? window.DEFAULT_PRODUCT_LIST.slice()
    : [];

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
                price: Number(product?.price !== undefined ? product.price : (product?.rate || 0))
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
    if (typeof initializeOrderNotifications === 'function') {
        initializeOrderNotifications();
    }

    // Set Name
    const nameEl = document.getElementById('empNameDisplay');
    if (nameEl) nameEl.textContent = employeeUser.name;

    // Initial Tab
    if (window.switchEmpTab) switchEmpTab('order');

    // Parse URL prefill parameters if booking new order from WhatsApp profile panel
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('prefill') === 'true') {
            const name = urlParams.get('customerName') || '';
            const phone = urlParams.get('telNo') || '';
            const fatherOrHusbandName = urlParams.get('fatherOrHusbandName') || '';
            const gender = urlParams.get('gender') || '';
            const age = urlParams.get('age') || '';
            const problem = urlParams.get('problem') || '';

            const hNo = urlParams.get('hNo') || '';
            const blockGaliNo = urlParams.get('blockGaliNo') || '';
            const villColony = urlParams.get('villColony') || '';
            const landmark = urlParams.get('landmark') || '';
            const city = urlParams.get('city') || '';
            const state = urlParams.get('state') || '';
            const pin = urlParams.get('pincode') || '';

            const f = document.getElementById('orderForm');
            if (f) {
                if (f.customerName) f.customerName.value = name;
                if (f.telNo) f.telNo.value = phone.replace(/\D/g, '').slice(-10);
                if (f.fatherOrHusbandName) f.fatherOrHusbandName.value = fatherOrHusbandName;
                if (f.gender) {
                    f.gender.value = gender;
                    const lbl = document.getElementById('fatherHusbandLabel');
                    if (lbl) {
                        lbl.textContent = gender === 'Female' ? 'Husband Name (W/O)' : 'Father Name (S/O)';
                    }
                }
                if (f.age) f.age.value = age;
                if (f.problem) f.problem.value = problem;

                if (f.hNo) f.hNo.value = hNo;
                if (f.blockGaliNo) f.blockGaliNo.value = blockGaliNo;
                if (f.villColony) f.villColony.value = villColony;
                if (f.landMark) f.landMark.value = landmark;
                if (f.distt) f.distt.value = city;
                if (f.state) f.state.value = state;
                if (f.pin) f.pin.value = pin;

                // Set order type to Reorder (REORDER) since there's customer history
                const reorderRadio = document.querySelector('input[name="orderType"][value="REORDER"]');
                if (reorderRadio) {
                    reorderRadio.checked = true;
                } else {
                    const reorderRadioAlt = document.querySelector('input[name="orderType"][value="Reorder"]');
                    if (reorderRadioAlt) reorderRadioAlt.checked = true;
                }

                // Concatenate the complete address string
                if (typeof updateAddress === 'function') {
                    updateAddress();
                }
            }
        }
    } catch (e) {
        console.error('Error prefilling order form:', e);
    }
});

// ==================== TAB SWITCHING ====================
function switchEmpTab(tab) {
    // Hide all contents
    ['empOrderTab', 'empTrackingTab', 'empOfdTab', 'empUndeliveredTab', 'empCancelledTab', 'empProfileTab'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Reset buttons
    ['empTabOrder', 'empTabTracking', 'empTabOfd', 'empTabUndelivered', 'empTabCancelled', 'empTabProfile'].forEach(id => {
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

    if (tab === 'tracking') { 
        contentId = 'empTrackingTab'; 
        buttonId = 'empTabTracking'; 
        const dateInput = document.getElementById('myOrdersDate');
        if (dateInput && !dateInput.value) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            dateInput.value = `${yyyy}-${mm}-${dd}`;
        }
        loadMyOrders(); 
    }
    else if (tab === 'ofd') { contentId = 'empOfdTab'; buttonId = 'empTabOfd'; if (typeof loadMyOfdOrders === 'function') loadMyOfdOrders(); }
    else if (tab === 'undelivered') { contentId = 'empUndeliveredTab'; buttonId = 'empTabUndelivered'; if (typeof loadMyUndeliveredOrders === 'function') loadMyUndeliveredOrders(); }
    else if (tab === 'cancelled') { contentId = 'empCancelledTab'; buttonId = 'empTabCancelled'; loadCancelledOrders(); }
    else if (tab === 'profile') { contentId = 'empProfileTab'; buttonId = 'empTabProfile'; loadMyProfile(); }

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
        'history': 'tracking',
        'past': 'tracking',
        'ofd': 'ofd',
        'delivery': 'ofd',
        'outfordelivery': 'ofd',
        'cancelled': 'cancelled',
        'cancel': 'cancelled',
        'profile': 'profile',
        'me': 'profile'
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

async function loadMyProfile() {
    const employeeId = getCurrentEmployeeId();
    const employeeName = getCurrentEmployeeName() || '-';

    const profileEmpIdDisplay = document.getElementById('profileEmpIdDisplay');
    const profileEmpNameDisplay = document.getElementById('profileEmpNameDisplay');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (profileEmpIdDisplay) profileEmpIdDisplay.textContent = employeeId || '-';
    if (profileEmpNameDisplay) profileEmpNameDisplay.textContent = employeeName;
    if (profileAvatar && employeeName) {
        profileAvatar.textContent = employeeName.trim().charAt(0).toUpperCase();
    }

    if (!employeeId) return;

    const statsList = document.getElementById('empProfileStats');
    const ordersList = document.getElementById('empProfileOrders');

    if (statsList) {
        statsList.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                <p class="mt-2 text-xs text-slate-400 font-bold">Loading performance metrics...</p>
            </div>
        `;
    }

    try {
        const res = await fetch(`${API_URL}/employees/${employeeId}`);
        const data = await res.json();

        if (data.success) {
            const stats = data.stats || { total: 0, pending: 0, verified: 0, dispatched: 0, delivered: 0, cancelled: 0, hold: 0, rto: 0 };
            const orders = data.orders || [];

            const revenue = {
                total: orders.reduce((sum, o) => sum + (o.total || 0), 0),
                hold: orders.filter(o => o.status === 'On Hold').reduce((sum, o) => sum + (o.total || 0), 0),
                cancelled: orders.filter(o => o.status === 'Cancelled').reduce((sum, o) => sum + (o.total || 0), 0),
                delivered: orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + (o.total || 0), 0),
                dispatched: orders.filter(o => o.status === 'Dispatched').reduce((sum, o) => sum + (o.total || 0), 0),
                rto: orders.filter(o => o.status === 'RTO').reduce((sum, o) => sum + (o.total || 0), 0)
            };

            const cards = [
                { label: 'Total booked', count: stats.total, amount: revenue.total, color: 'gray', icon: '📊' },
                { label: 'On Hold', count: stats.hold, amount: revenue.hold, color: 'yellow', icon: '⏳' },
                { label: 'Cancelled', count: stats.cancelled, amount: revenue.cancelled, color: 'red', icon: '❌' },
                { label: 'Delivered', count: stats.delivered, amount: revenue.delivered, color: 'green', icon: '✅' },
                { label: 'Dispatched', count: stats.dispatched, amount: revenue.dispatched, color: 'purple', icon: '🚚' },
                { label: 'RTO Returned', count: stats.rto, amount: revenue.rto, color: 'indigo', icon: '↩️' }
            ];

            const colorMap = {
                gray: { bg: 'bg-slate-50', border: 'border-slate-100', accent: 'border-l-4 border-l-slate-400', text600: 'text-slate-800', text400: 'text-slate-400', text700: 'text-slate-700' },
                yellow: { bg: 'bg-amber-50/50', border: 'border-amber-100', accent: 'border-l-4 border-l-amber-500', text600: 'text-amber-700', text400: 'text-amber-500', text700: 'text-amber-800' },
                red: { bg: 'bg-red-50/50', border: 'border-red-100', accent: 'border-l-4 border-l-red-500', text600: 'text-red-700', text400: 'text-red-500', text700: 'text-red-800' },
                green: { bg: 'bg-emerald-50/50', border: 'border-emerald-100', accent: 'border-l-4 border-l-emerald-500', text600: 'text-emerald-700', text400: 'text-emerald-500', text700: 'text-emerald-800' },
                purple: { bg: 'bg-purple-50/50', border: 'border-purple-100', accent: 'border-l-4 border-l-purple-500', text600: 'text-purple-700', text400: 'text-purple-500', text700: 'text-purple-800' },
                indigo: { bg: 'bg-indigo-50/50', border: 'border-indigo-100', accent: 'border-l-4 border-l-indigo-500', text600: 'text-indigo-700', text400: 'text-indigo-500', text700: 'text-indigo-800' }
            };

            if (statsList) {
                statsList.innerHTML = cards.map(c => {
                    const cls = colorMap[c.color] || colorMap.gray;
                    return `
                        <div class="${cls.bg} border ${cls.border} ${cls.accent} rounded-2xl p-4 transition-all hover:scale-[1.02] hover:shadow-md hover:shadow-slate-100/50 flex flex-col justify-between h-full relative overflow-hidden">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-2xl">${c.icon}</span>
                                <span class="bg-white px-2 py-0.5 rounded-lg border border-slate-100 text-[10px] font-mono font-bold ${cls.text700}">₹${(c.amount || 0).toLocaleString()}</span>
                            </div>
                            <div>
                                <p class="text-2xl font-black ${cls.text600} leading-tight">${c.count || 0}</p>
                                <p class="text-[10px] font-bold ${cls.text400} uppercase tracking-wider mt-0.5">${c.label}</p>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            if (ordersList) {
                if (orders.length === 0) {
                    ordersList.innerHTML = `
                        <tr>
                            <td colspan="5" class="px-4 py-8 text-center text-slate-400 font-bold">
                                No orders booked yet.
                            </td>
                        </tr>
                    `;
                } else {
                    ordersList.innerHTML = orders.slice(0, 30).map(o => {
                        let statusClass = 'bg-slate-100 text-slate-600';
                        if (o.status === 'Pending') statusClass = 'bg-rose-50 text-rose-700 border border-rose-100';
                        if (o.status === 'Address Verified') statusClass = 'bg-blue-50 text-blue-700 border border-blue-100';
                        if (o.status === 'Dispatched') statusClass = 'bg-purple-50 text-purple-700 border border-purple-100';
                        if (o.status === 'Delivered') statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                        if (o.status === 'Cancelled') statusClass = 'bg-red-50 text-red-700 border border-red-100';
                        if (o.status === 'On Hold') statusClass = 'bg-amber-50 text-amber-700 border border-amber-100';
                        if (o.status === 'RTO') statusClass = 'bg-indigo-50 text-indigo-700 border border-indigo-100';

                        const orderDate = o.timestamp ? new Date(o.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

                        return `
                            <tr class="hover:bg-slate-50 transition-colors border-b border-slate-50">
                                <td class="px-4 py-3 font-mono font-bold text-blue-600 text-xs">
                                    <span class="hover:underline cursor-pointer" onclick="viewOrder('${o.orderId}')">${o.orderId || '-'}</span>
                                </td>
                                <td class="px-4 py-3 font-medium text-slate-800 text-xs truncate max-w-[120px]" title="${o.customerName}">${o.customerName || 'Unknown'}</td>
                                <td class="px-4 py-3 text-right font-black text-slate-700 text-xs">₹${o.total || 0}</td>
                                <td class="px-4 py-3 text-center">
                                    <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusClass}">${o.status}</span>
                                </td>
                                <td class="px-4 py-3 text-right text-slate-400 text-xs font-mono font-bold">${orderDate}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }
        } else {
            if (statsList) statsList.innerHTML = '<div class="col-span-full text-center text-red-500 text-xs">Failed to load performance metrics</div>';
            if (ordersList) ordersList.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Failed to load order history</td></tr>';
        }
    } catch (e) {
        console.error('Profile metrics error:', e);
        if (statsList) statsList.innerHTML = '<div class="col-span-full text-center text-red-500 text-xs">Error loading data</div>';
        if (ordersList) ordersList.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Error loading order history</td></tr>';
    }
}

function copyProfileId() {
    const employeeId = getCurrentEmployeeId();
    if (!employeeId) return;
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(employeeId)
            .then(() => {
                if (typeof showToast === 'function') showToast('Employee Code copied to clipboard!', 'success');
            })
            .catch(err => console.error('Copy failed', err));
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = employeeId;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            if (typeof showToast === 'function') showToast('Employee Code copied to clipboard!', 'success');
        } catch (err) {
            prompt("Copy manually:", employeeId);
        }
        document.body.removeChild(textArea);
    }
}
window.copyProfileId = copyProfileId;

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

// PRODUCT_LIST comes from js/core/config.js (source of truth for employee products)
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
    const totalInput = document.getElementById('totalAmountInput');
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

    const totalInput = document.getElementById('totalAmountInput');
    const enteredGrossTotal = totalInput ? Number(totalInput.value || 0) : 0;

    const calculatedDiscount = Math.max(0, subtotal - enteredGrossTotal);
    const discountInput = document.getElementById('discountInput');
    if (discountInput) {
        discountInput.value = calculatedDiscount;
    }

    calculateCOD();
}

function calculateCOD() {
    const totalInput = document.getElementById('totalAmountInput');
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
        { field: form.gender, label: 'Gender' },
        { field: form.age, label: 'Age' },
        { field: form.problem, label: 'Problem' },
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
        fatherOrHusbandName: form.fatherOrHusbandName ? form.fatherOrHusbandName.value : '',
        gender: form.gender.value,
        age: Number(form.age.value),
        problem: form.problem.value,
        telNo: form.telNo.value,
        altNo: form.altNo ? form.altNo.value : '',
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
        treatment: form.treatment ? form.treatment.value : '',
        date: form.date ? form.date.value : '',
        time: form.time ? form.time.value : '',

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

        const isEditing = typeof currentEditingOrderId !== 'undefined' && currentEditingOrderId;

        if (!isEditing) {
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
        }

        btn.innerText = isEditing ? 'Updating...' : 'Saving...';

        if (isEditing) {
            await updateOrderRequest(currentEditingOrderId, orderData, btn, originalText, form);
        } else {
            await createOrderRequest(orderData, btn, originalText, form);
        }

    } catch (e) {
        console.error(e);
        showWarningPopup('Connection Error', 'Server se connection nahi ho paya. Please retry karein.');
        const btn = document.querySelector('button[onclick="saveOrder()"]');
        if (btn) { btn.innerHTML = '💾 SAVE ORDER'; btn.disabled = false; }
    }
}

// Helper function to actually update the order (Edit Mode)
async function updateOrderRequest(orderId, orderData, btn, originalText, form) {
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await res.json();

        if (data.success) {
            showSuccessPopup(
                'Order Updated!',
                'Order details successfully update ho gaye.',
                '✅',
                '#10b981'
            );
            form.reset();
            currentEditingOrderId = null; // Reset edit mode

            // Reset Button
            const saveBtn = document.querySelector('button[onclick="saveOrder()"]');
            if (saveBtn) {
                saveBtn.innerHTML = '💾 SAVE ORDER';
                saveBtn.classList.remove('bg-amber-600', 'hover:bg-amber-700', 'text-white');
                saveBtn.classList.add('btn-primary');
            }

            initOrderForm(); // Reset date/time/items
            updateAddress(); // Clear preview
            switchEmpTab('tracking');
            loadMyOrders(); // Refresh list
        } else {
            showWarningPopup('Error!', data.message || 'Order update nahi ho paya.');
        }

        const saveBtn = document.querySelector('button[onclick="saveOrder()"]');
        if (saveBtn) {
            saveBtn.innerHTML = '💾 SAVE ORDER';
            saveBtn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        showWarningPopup('Connection Error', 'Server se connection nahi ho paya.');
        const saveBtn = document.querySelector('button[onclick="saveOrder()"]');
        if (saveBtn) {
            saveBtn.innerHTML = '💾 SAVE ORDER';
            saveBtn.disabled = false;
        }
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
let empDistrictTimeout;
async function handleDistrictInput(query) {
    const box = document.getElementById('districtSuggestions');
    clearTimeout(empDistrictTimeout);
    if (query.length < 2) { box.classList.add('hidden'); return; }

    empDistrictTimeout = setTimeout(async () => {
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
    const box = document.getElementById('poSuggestions');
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
    document.getElementById('poSuggestions').classList.add('hidden');
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
    if (!input.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        input.value = `${yyyy}-${mm}-${dd}`;
    }
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
        const activeStatuses = 'Pending,Address Verified,Dispatched,On Hold,Hold';
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
        // Sort orders date-wise (newest first)
        orders.sort((a, b) => {
            const getOrderMillis = (o) => {
                if (o.date) {
                    const dateStr = o.time ? `${o.date}T${o.time}` : o.date;
                    const parsed = Date.parse(dateStr);
                    if (!isNaN(parsed)) return parsed;
                }
                return o.timestamp ? Date.parse(o.timestamp) : 0;
            };
            return getOrderMillis(b) - getOrderMillis(a);
        });
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
            renderPaginationControls(list, currentPage, totalPages, 'loadMyOrders', totalItems);
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
function renderPaginationControls(container, currentPage, totalPages, fetchFuncName, totalItems = null) {
    if (!container) return;

    // Get current items per page from config
    const currentLimit = typeof paginationConfig !== 'undefined' ? paginationConfig.getItemsPerPage() : EMP_ITEMS_PER_PAGE;

    const div = document.createElement('div');
    div.className = 'col-span-full mt-8';

    const startIdx = totalItems === 0 ? 0 : ((currentPage - 1) * currentLimit) + 1;
    const endIdx = totalItems !== null ? Math.min(currentPage * currentLimit, totalItems) : Math.min(currentPage * currentLimit, currentLimit > 0 ? currentLimit * totalPages : 999);
    const totalDisplay = totalItems !== null ? totalItems : (currentLimit > 0 ? currentLimit * totalPages : 'many');

    div.innerHTML = `
        <!-- Dropdown for items per page -->
        <div class="flex justify-center mb-4">
            <div class="flex items-center gap-2 text-sm">
                <label class="text-gray-600 font-medium">Items per page:</label>
                <select 
                    onchange="handleEmpItemsChange('${fetchFuncName}')"
                    class="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none bg-white cursor-pointer">
                    <option value="12" ${currentLimit === 12 ? 'selected' : ''}>12</option>
                    <option value="24" ${currentLimit === 24 ? 'selected' : ''}>24</option>
                    <option value="36" ${currentLimit === 36 ? 'selected' : ''}>36</option>
                    <option value="48" ${currentLimit === 48 ? 'selected' : ''}>48</option>
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
            Showing ${startIdx}-${endIdx} of ${totalDisplay} orders
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

async function loadMyOfdOrders() {
    if (!currentUser) return;
    try {
        const employeeId = getCurrentEmployeeId();
        if (!employeeId) return;

        const statuses = 'Out For Delivery';
        const res = await fetch(`${API_URL}/orders/employee/${employeeId}?status=${encodeURIComponent(statuses)}&limit=0`);
        const data = await res.json();

        const list = document.getElementById('empOfdList');
        if (!list) return;

        const orders = data.orders || [];

        if (!data.success || orders.length === 0) {
            list.innerHTML = '<div class="col-span-full text-center py-12 bg-indigo-50 rounded-2xl border-dashed border-2 border-indigo-100"><p class="text-4xl mb-3">🚚</p><p class="text-gray-500">No orders out for delivery</p></div>';
            return;
        }

        // Sort orders date-wise (newest first)
        orders.sort((a, b) => {
            const getOrderMillis = (o) => {
                if (o.date) {
                    const dateStr = o.time ? `${o.date}T${o.time}` : o.date;
                    const parsed = Date.parse(dateStr);
                    if (!isNaN(parsed)) return parsed;
                }
                return o.timestamp ? Date.parse(o.timestamp) : 0;
            };
            return getOrderMillis(b) - getOrderMillis(a);
        });

        list.innerHTML = orders.map(o => renderEmpOrderCard(o)).join('');
    } catch (e) {
        console.error('Error loading OFD orders:', e);
    }
}

window.loadMyOfdOrders = loadMyOfdOrders;
window.handleEmpItemsChange = handleEmpItemsChange;
window.generatePageNumbers = generatePageNumbers;

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
            ${(['Delivered', 'Returned', 'Cancelled', 'RTO'].includes(o.status) || isHistory) ? `
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
window.buildEmployeeProductOptions = buildEmployeeProductOptions;
window.updateTotal = updateTotal;
window.calculateTotal = calculateTotal;
window.calculateDiscountFromTotal = calculateDiscountFromTotal;
window.calculateCOD = calculateCOD;
window.filterMyOrders = filterMyOrders;
window.filterMyCancelledOrders = filterMyCancelledOrders;
window.reorderFromHistory = reorderFromHistory;

// Override slow legacy functions from app.js with optimized paginated versions
window.loadMyOrders = loadMyOrders;
window._empLoadMyOrders = loadMyOrders; // Used by app.js to delegate to fast version
window.loadCancelledOrders = loadCancelledOrders;
window.loadMyOfdOrders = loadMyOfdOrders;


async function loadMyUndeliveredOrders(page = 1) {
    if (!currentUser) return;
    try {
        const employeeId = getCurrentEmployeeId();
        if (!employeeId) return;

        const statuses = 'Undelivered';
        const res = await fetch(`${API_URL}/orders/employee/${employeeId}?status=${encodeURIComponent(statuses)}&page=${page}&limit=${EMP_ITEMS_PER_PAGE}`);
        const data = await res.json();

        const list = document.getElementById('empUndeliveredList');
        if (!list) return;

        if (!data.success || !data.orders || data.orders.length === 0) {
            list.innerHTML = '<div class="col-span-full text-center py-12 bg-orange-50 rounded-2xl border-dashed border-2 border-orange-100"><p class="text-4xl mb-3">⏳</p><p class="text-gray-500">No undelivered orders</p></div>';
            return;
        }

        list.innerHTML = data.orders.map(o => renderEmpOrderCard(o)).join('');
        
        const totalItems = data.pagination ? data.pagination.total : data.orders.length;
        const totalPages = Math.ceil(totalItems / EMP_ITEMS_PER_PAGE) || 1;
        renderPaginationControls(list, page, totalPages, 'loadMyUndeliveredOrders', totalItems);
    } catch (e) {
        console.error('Error loading Undelivered orders:', e);
    }
}

function filterMyUndeliveredOrders(q) {
    const query = (q || '').toLowerCase().trim();
    const cards = document.querySelectorAll('#empUndeliveredList [data-mobile]');

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

window.loadMyUndeliveredOrders = loadMyUndeliveredOrders;
window.filterMyUndeliveredOrders = filterMyUndeliveredOrders;
