// ==================== DEPARTMENT PANEL LOGIC ====================

document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth('department');
    if (!user) return;

    // Set Dept Title
    const type = loadSession().deptType || 'verification';
    document.getElementById('deptTitle').innerText =
        type === 'verification' ? 'Verification Panel' :
            type === 'dispatch' ? 'Dispatch Manager' : 'Delivery Manager';

    // Initial Load
    // We reuse switch func but we might need to hide irrelevant tabs based on type
    setupDeptUI(type);
    loadDeptOrders();
});

let currentDeptType = 'verification';

function setupDeptUI(type) {
    currentDeptType = type;
    // Hide tabs not relevant to this dept type?
    // In original app, it seems all tabs were visible but content differed? 
    // Or maybe different sets of tabs.
    // For now, we load default tab.
    if (type === 'verification') {
        document.getElementById('deptTabVerification').click();
    } else if (type === 'dispatch') {
        // Find dispatch tab
        // In original app, layout might have been shared.
        // We will just default to loadDeptOrders which handles logic.
        loadDeptOrders();
    }
}

// ==================== TABS (Shared concept) ====================
// In original app, Department uses `switchDispatchTab` or `switchDeliveryTab`
// We need to implement these.

// ==================== TABS SWITCHING ====================

function switchDispatchTab(tab) {
    ['deptPendingTab', 'deptDispatchedTab', 'deptDispatchHistoryTab', 'deptDeliveryRequestsTab'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    ['deptTabPending', 'deptTabDispatched', 'deptTabHistory', 'deptTabRequests'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('bg-blue-600', 'text-white');
            el.classList.add('bg-white', 'text-gray-600');
        }
    });

    const activeBtn = document.getElementById(
        tab === 'pending' ? 'deptTabPending' :
            tab === 'requests' ? 'deptTabRequests' :
                tab === 'dispatched' ? 'deptTabDispatched' : 'deptTabHistory'
    );
    if (activeBtn) {
        activeBtn.classList.remove('bg-white', 'text-gray-600');
        activeBtn.classList.add('bg-blue-600', 'text-white');
    }

    if (tab === 'pending') {
        document.getElementById('deptPendingTab').classList.remove('hidden');
        loadDeptOrders();
    } else if (tab === 'requests') {
        if (document.getElementById('deptDeliveryRequestsTab')) document.getElementById('deptDeliveryRequestsTab').classList.remove('hidden');
        loadDeliveryRequests();
    } else if (tab === 'dispatched') {
        document.getElementById('deptDispatchedTab').classList.remove('hidden');
        loadDispatchedOrders();
    } else {
        document.getElementById('deptDispatchHistoryTab').classList.remove('hidden');
        loadDispatchHistory();
    }
}

function switchDeliveryTab(tab) {
    ['deptOutForDeliveryTab', 'deptDeliveredTab', 'deptFailedTab', 'deptPerformanceTab'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    ['deptTabOut', 'deptTabDelivered', 'deptTabFailed', 'deptTabPerformance'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('bg-blue-600', 'text-white');
            el.classList.add('bg-white', 'text-gray-600');
        }
    });

    const activeBtn = document.getElementById(
        tab === 'out' ? 'deptTabOut' :
            tab === 'delivered' ? 'deptTabDelivered' :
                tab === 'failed' ? 'deptTabFailed' : 'deptTabPerformance'
    );
    if (activeBtn) {
        activeBtn.classList.remove('bg-white', 'text-gray-600');
        activeBtn.classList.add('bg-blue-600', 'text-white');
    }

    if (tab === 'out') {
        document.getElementById('deptOutForDeliveryTab').classList.remove('hidden');
        loadDeliveryOrders();
    } else if (tab === 'delivered') {
        document.getElementById('deptDeliveredTab').classList.remove('hidden');
        loadDeliveredOrders();
    } else if (tab === 'failed') {
        document.getElementById('deptFailedTab').classList.remove('hidden');
        loadFailedDeliveries();
    } else {
        document.getElementById('deptPerformanceTab').classList.remove('hidden');
        loadDeliveryPerformance();
    }
}

// ==================== PAGINATED LOADER FUNCTIONS ====================

// 1. Delivery Requests (Dispatch Panel)
async function loadDeliveryRequests(page = null) {
    try {
        const res = await fetch(`${API_URL}/orders/delivery-requests`);
        const data = await res.json();
        const requests = data.requests || [];

        if (document.getElementById('requestsCount')) document.getElementById('requestsCount').textContent = requests.length;

        // Pagination
        if (page !== null) deptPagination.dispatchRequests = page;
        const currentPage = deptPagination.dispatchRequests || 1;
        const totalPages = Math.ceil(requests.length / DEPT_ITEMS_PER_PAGE) || 1;
        const paginated = requests.slice((currentPage - 1) * DEPT_ITEMS_PER_PAGE, currentPage * DEPT_ITEMS_PER_PAGE);

        const container = document.getElementById('deliveryRequestsList');
        if (!container) return;

        if (requests.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">Koi delivery requests nahi hain</p>';
            return;
        }

        let html = '';
        paginated.forEach(req => {
            html += ` <div class="order-card bg-white border rounded-xl p-4 border-l-4 border-l-pink-500 mb-3"> 
                        <div class="flex justify-between items-start"> 
                            <div> 
                                <p class="font-bold text-blue-600">${req.orderId}</p> 
                                <p class="text-gray-800">${req.customerName}</p> 
                                <p class="text-sm text-gray-500">Requested by: <strong>${req.employeeName}</strong> (${req.employeeId})</p> 
                                <p class="text-xs text-gray-400">${new Date(req.requestedAt).toLocaleString()}</p> 
                            </div> 
                            <div class="flex gap-2"> 
                                <button type="button" onclick="approveDelivery('${req.orderId}')" class="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600">✅ Approve</button> 
                            </div> 
                        </div> 
                    </div> `;
        });
        container.innerHTML = html;
        renderPaginationControls(container, currentPage, totalPages, 'loadDeliveryRequests');

    } catch (e) { console.error(e); }
}

// 2. Dispatched Orders (Dispatch Panel)
async function loadDispatchedOrders(page = null) {
    try {
        const res = await fetch(`${API_URL}/orders/dispatched`);
        const data = await res.json();
        let orders = data.orders || [];

        // Filter Logic (Search/Date) - simplified for department
        const search = document.getElementById('dispatchedSearch')?.value.toLowerCase();
        if (search) {
            orders = orders.filter(o =>
                (o.customerName && o.customerName.toLowerCase().includes(search)) ||
                (o.telNo && o.telNo.includes(search)) ||
                (o.orderId && o.orderId.toLowerCase().includes(search))
            );
        }

        orders.sort((a, b) => new Date(b.dispatchedAt || b.timestamp) - new Date(a.dispatchedAt || a.timestamp));

        // Pagination
        if (page !== null) deptPagination.dispatchDispatched = page;
        const currentPage = deptPagination.dispatchDispatched || 1;
        const totalPages = Math.ceil(orders.length / DEPT_ITEMS_PER_PAGE) || 1;
        const paginated = orders.slice((currentPage - 1) * DEPT_ITEMS_PER_PAGE, currentPage * DEPT_ITEMS_PER_PAGE);

        const container = document.getElementById('dispatchedOrdersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">No dispatched orders found</div>';
            return;
        }

        let html = '';
        paginated.forEach(order => {
            html += generateOrderCardHTML(order);
        });
        container.innerHTML = html;
        renderPaginationControls(container, currentPage, totalPages, 'loadDispatchedOrders');

    } catch (e) { console.error('Load Dispatched Orders Error:', e); }
}

// 3. Dispatch History (Dispatch Panel)
async function loadDispatchHistory(page = null) {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        let orders = (data.orders || []).filter(o => o.status === 'Dispatched' || o.status === 'Delivered');

        orders.sort((a, b) => new Date(b.dispatchedAt || b.timestamp) - new Date(a.dispatchedAt || a.timestamp));

        // Pagination
        if (page !== null) deptPagination.dispatchHistory = page;
        const currentPage = deptPagination.dispatchHistory || 1;
        const totalPages = Math.ceil(orders.length / DEPT_ITEMS_PER_PAGE) || 1;
        const paginated = orders.slice((currentPage - 1) * DEPT_ITEMS_PER_PAGE, currentPage * DEPT_ITEMS_PER_PAGE);

        const container = document.getElementById('dispatchHistoryList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">No history found</div>';
            return;
        }

        let html = '';
        paginated.forEach(order => {
            html += generateOrderCardHTML(order);
        });
        container.innerHTML = html;
        renderPaginationControls(container, currentPage, totalPages, 'loadDispatchHistory');

    } catch (e) { console.error(e); }
}

// 4. Out For Delivery (Delivery Panel)
async function loadDeliveryOrders(page = null) {
    try {
        const res = await fetch(`${API_URL}/orders/dispatched`);
        const data = await res.json();
        let orders = data.orders || [];

        // Pagination
        if (page !== null) deptPagination.deliveryOut = page;
        const currentPage = deptPagination.deliveryOut || 1;
        const totalPages = Math.ceil(orders.length / DEPT_ITEMS_PER_PAGE) || 1;
        const paginated = orders.slice((currentPage - 1) * DEPT_ITEMS_PER_PAGE, currentPage * DEPT_ITEMS_PER_PAGE);

        const container = document.getElementById('outForDeliveryList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">Koi order out for delivery nahi hai</p>';
            return;
        }

        let html = '';
        paginated.forEach(order => {
            const hasShiprocket = order.shiprocket && order.shiprocket.awb;
            let statusBadge = '';
            // Basic logic for badges...
            if (order.tracking && order.tracking.currentStatus) {
                const status = order.tracking.currentStatus;
                statusBadge = `<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">${status}</span>`;
            }

            html += `
                <div class="glass-card p-4 hover:shadow-lg transition-all border rounded-xl bg-white mb-3" data-order-id="${order.orderId}">
                    ${hasShiprocket ? `
                    <div class="bg-orange-100 border-l-4 border-orange-500 p-3 rounded-lg mb-3">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-orange-600 font-bold text-xs">🚀 via Shiprocket</span>
                            ${statusBadge}
                        </div>
                        <p class="font-mono font-black text-orange-700 text-xs">${order.shiprocket.awb}</p>
                    </div>` : ''}
                    
                    <div class="mb-3">
                         <h4 class="font-bold text-lg text-gray-800">${order.customerName}</h4>
                         <p class="text-xl font-black text-gray-800">₹${order.total}</p>
                         <p class="text-sm text-gray-600">📞 ${order.telNo}</p>
                         <p class="text-xs text-gray-500 mt-1">📍 ${order.address}</p>
                    </div>

                    <div class="grid grid-cols-1 gap-2">
                        <button onclick="approveDelivery('${order.orderId}')" 
                            class="bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2">
                            ✅ Delivered
                        </button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        renderPaginationControls(container, currentPage, totalPages, 'loadDeliveryOrders');

    } catch (e) { console.error(e); }
}

// 5. Delivered Orders (Delivery Panel)
async function loadDeliveredOrders(page = null) {
    try {
        const res = await fetch(`${API_URL}/orders/delivered`);
        const data = await res.json();
        let orders = data.orders || [];

        // Pagination
        if (page !== null) deptPagination.deliveryDelivered = page;
        const currentPage = deptPagination.deliveryDelivered || 1;
        const totalPages = Math.ceil(orders.length / DEPT_ITEMS_PER_PAGE) || 1;
        const paginated = orders.slice((currentPage - 1) * DEPT_ITEMS_PER_PAGE, currentPage * DEPT_ITEMS_PER_PAGE);

        const container = document.getElementById('deliveredOrdersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">Koi delivered order nahi hai</p>';
            return;
        }

        let html = '';
        paginated.forEach(order => {
            html += renderOrderCard(order, 'green');
        });
        container.innerHTML = html;
        renderPaginationControls(container, currentPage, totalPages, 'loadDeliveredOrders');

    } catch (e) { console.error(e); }
}

// 6. Failed Deliveries
async function loadFailedDeliveries(page = null) {
    const container = document.getElementById('failedDeliveriesList');
    if (container) container.innerHTML = '<p class="text-center text-gray-500 py-8">No failed deliveries recorded</p>';
}

// 7. Delivery Performance (No pagination needed for stats, but keeping structure)
async function loadDeliveryPerformance() {
    // ... logic from app.js ...
    // Using simple version
    try {
        const res = await fetch(`${API_URL}/orders/delivered`);
        const data = await res.json();
        let orders = data.orders || [];
        document.getElementById('deliveryPerformanceData').innerHTML = `
            <div class="glass-card p-6 bg-white border rounded-xl">
                <h4 class="font-bold text-lg mb-4">📊 Performance Overview</h4>
                <p class="text-gray-600">Total Deliveries: <span class="font-bold text-green-600">${orders.length}</span></p>
            </div>`;
    } catch (e) { }
}


// ==================== HELPERS ====================

function toTitleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function renderOrderCard(order, borderColor = 'gray') {
    return `
            <div class="glass-card p-4 border-2 border-${borderColor}-200 rounded-xl bg-white hover:shadow-lg transition-all mb-3">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="bg-${borderColor}-100 text-${borderColor}-700 text-xs font-bold px-2 py-0.5 rounded-md uppercase">${order.orderId}</span>
                        ${order.orderType === 'REORDER' ? '<span class="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-md ml-2">REORDER</span>' : ''}
                        <h3 class="font-bold text-gray-800 text-lg mt-1">${order.customerName}</h3>
                    </div>
                </div>
                 <div class="p-2 space-y-2">
                    <p class="text-sm text-gray-600">📞 ${order.telNo}</p>
                    <p class="text-sm text-gray-600">📍 ${order.address || 'N/A'}</p>
                    <p class="text-xs text-gray-400">📅 ${order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A'}</p>
                 </div>
                 <div class="bg-gray-50 p-2 rounded-lg mt-2 flex justify-between">
                     <span class="font-bold text-${borderColor}-600">Total: ₹${order.total}</span>
                     <span class="text-xs text-gray-500 font-bold">${order.status}</span>
                 </div>
            </div>`;
}

function generateOrderCardHTML(order) {
    const isVerification = currentDeptType === 'verification';
    const statusColor = isVerification ? 'blue' : 'emerald';

    return `
    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all p-4 mb-4">
        <div class="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
            <div class="flex items-center gap-2">
                <span class="bg-${statusColor}-100 text-${statusColor}-700 px-3 py-1 rounded-lg font-bold text-xs">${order.orderId}</span>
                ${order.orderType === 'REORDER' ? `<span class="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-bold">REORDER</span>` : ''}
                 <button onclick="sendWhatsAppDirect('${isVerification ? 'booked' : 'dispatched'}', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                    class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:scale-110" title="WhatsApp">${WHATSAPP_ICON}</button>
            </div>
            <div class="text-right">
                <div class="font-black text-gray-900">₹${order.total}</div>
                <div class="text-xs text-emerald-600 font-bold">COD: ₹${order.codAmount || 0}</div>
            </div>
        </div>
        
        <div class="space-y-2 mb-4">
            <h3 class="font-bold text-lg text-gray-800">${order.customerName}</h3>
            <p class="text-sm text-gray-600">📞 ${order.telNo}</p>
            <p class="text-sm text-gray-600">📍 ${order.address || 'N/A'}, ${order.pin || ''}</p>
            <p class="text-xs text-gray-400">📅 ${order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A'} • By: ${order.employeeId || order.employee || 'N/A'}</p>
        </div>

        ${order.status === 'Dispatched' ? `
        <div class="grid grid-cols-2 gap-2">
            <button onclick="revertDispatch('${order.orderId}')" class="bg-red-50 text-red-600 py-2 rounded-lg font-bold text-xs hover:bg-red-100">BACK TO READY</button>
            <button onclick="approveDelivery('${order.orderId}')" class="bg-blue-50 text-blue-600 py-2 rounded-lg font-bold text-xs hover:bg-blue-100">MARK DELIVERED</button>
        </div>` : ''}
    </div>`;
}

async function approveDelivery(orderId) {
    if (!confirm('Order ko Delivered mark karna hai?')) return;
    try {
        const res = await fetch(`${API_URL}/orders/deliver`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, deliveredBy: currentUser?.id || 'department' })
        });
        const data = await res.json();
        if (data.success) {
            alert('Delivery Confirmed! 🎊');
            loadDeliveryRequests();
            loadDispatchedOrders();
            loadDeliveryOrders();
        }
    } catch (e) { console.error(e); }
}

async function revertDispatch(orderId) {
    const reason = prompt('Revert reason (e.g., Wrong dispatch):');
    if (!reason) return;
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/revert-dispatch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        const data = await res.json();
        if (data.success) {
            alert('Order Reverted!');
            loadDispatchedOrders();
        }
    } catch (e) { console.error(e); }
}

// Attach globals
window.switchDispatchTab = switchDispatchTab;
window.switchDeliveryTab = switchDeliveryTab;
window.loadDeptOrders = loadDeptOrders;
window.loadDeliveryRequests = loadDeliveryRequests;
window.loadDispatchedOrders = loadDispatchedOrders;
window.loadDispatchHistory = loadDispatchHistory;
window.loadDeliveryOrders = loadDeliveryOrders;
window.loadDeliveredOrders = loadDeliveredOrders;
window.loadFailedDeliveries = loadFailedDeliveries;
window.loadDeliveryPerformance = loadDeliveryPerformance;
window.revertDispatch = revertDispatch;
window.approveDelivery = approveDelivery;
window.generateOrderCardHTML = generateOrderCardHTML;
window.renderOrderCard = renderOrderCard;

// ==================== DATA LOADING ====================
const DEPT_ITEMS_PER_PAGE = 10;
let deptPagination = {
    verification: 1,
    dispatchReady: 1,
    dispatchRequests: 1,
    dispatchDispatched: 1,
    dispatchHistory: 1,
    deliveryOut: 1,
    deliveryDelivered: 1,
    deliveryFailed: 1,
    deliveryPerf: 1
};

async function loadDeptOrders(page = null) {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();

        let orders = data.orders || [];
        const container = document.getElementById('deptOrdersList');
        // Clear container first
        if (container) container.innerHTML = '<div class="col-span-full text-center py-8">Loading...</div>';

        let filteredOrders = [];
        let pageKey = 'verification';

        // Filter based on Dept Type
        if (currentDeptType === 'verification') {
            filteredOrders = orders.filter(o => o.status === 'Verification Pending');
            filteredOrders.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            pageKey = 'verification';
        }
        else if (currentDeptType === 'dispatch') {
            filteredOrders = orders.filter(o => o.status === 'Verified');
            pageKey = 'dispatchReady';
        }
        else if (currentDeptType === 'delivery') {
            filteredOrders = orders.filter(o => o.status === 'Dispatched');
            pageKey = 'deliveryOut';
        }

        // Pagination Logic
        if (page !== null) deptPagination[pageKey] = page;
        const currentPage = deptPagination[pageKey] || 1;
        const totalItems = filteredOrders.length;
        const totalPages = Math.ceil(totalItems / DEPT_ITEMS_PER_PAGE) || 1;

        const start = (currentPage - 1) * DEPT_ITEMS_PER_PAGE;
        const width = DEPT_ITEMS_PER_PAGE;
        const paginatedOrders = filteredOrders.slice(start, start + width);

        // Render
        if (container) {
            if (paginatedOrders.length === 0) {
                container.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400">No orders found</div>`;
            } else {
                if (currentDeptType === 'verification') {
                    container.innerHTML = paginatedOrders.map(o => renderVerificationCard(o)).join('');
                } else if (currentDeptType === 'dispatch') {
                    container.innerHTML = paginatedOrders.map(o => renderDispatchCard(o)).join('');
                } else if (currentDeptType === 'delivery') {
                    container.innerHTML = paginatedOrders.map(o => renderDeliveryCard(o)).join('');
                }

                // Append Pagination Controls
                renderPaginationControls(container, currentPage, totalPages, 'loadDeptOrders');
            }
        }

    } catch (e) { console.error(e); }
}

function renderPaginationControls(container, currentPage, totalPages, fetchFuncName) {
    if (totalPages <= 1) return;

    const controls = document.createElement('div');
    controls.className = 'col-span-full flex justify-center items-center gap-4 mt-6';
    controls.innerHTML = `
        <button onclick="${fetchFuncName}(${currentPage - 1})" 
            class="px-4 py-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
            ${currentPage === 1 ? 'disabled' : ''}>
            Previous
        </button>
        <span class="text-sm font-bold text-gray-600">Page ${currentPage} of ${totalPages}</span>
        <button onclick="${fetchFuncName}(${currentPage + 1})" 
            class="px-4 py-2 rounded-lg border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
            ${currentPage === totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;
    container.appendChild(controls);
}

// ==================== VERIFICATION FUNCTIONS ====================
function renderVerificationCard(o) {
    return `
    <div class="bg-white border rounded-xl p-4 hover:shadow-lg transition-all">
        <div class="flex justify-between items-start mb-3">
            <div>
                <div class="flex items-center gap-2">
                    <span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">New</span>
                    <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(o).replace(/"/g, '&quot;')})" 
                        class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-sm transition-all" title="Send WhatsApp">
                        ${WHATSAPP_ICON}
                    </button>
                </div>
                <h4 class="font-bold text-lg text-gray-800 mt-1">${o.customerName}</h4>
                <p class="text-xs text-gray-500">${new Date(o.timestamp).toLocaleString()}</p>
            </div>
            <div class="text-right">
                <p class="font-bold text-xl text-emerald-600">₹${o.total}</p>
            </div>
        </div>
        
        <div class="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-3 space-y-1">
            <p>📍 ${o.address}</p>
            <p>📞 ${o.telNo}</p>
        </div>
        
        <div class="mb-3">
            <textarea id="remark-${o.orderId}" placeholder="Add remark..." class="w-full text-sm p-2 border rounded-lg h-16">${o.remark || ''}</textarea>
        </div>
        
        <!-- Courier Suggestion Dropdown -->
        <div class="mb-3">
            <label class="text-sm font-bold text-gray-600 block mb-1">🚚 Suggest Courier:</label>
            <select id="courier-${o.orderId}" class="w-full p-2 border rounded-lg text-sm">
                <option value="">-- No Suggestion --</option>
                <option value="Delhivery">Delhivery</option>
                <option value="Delhivery Air">Delhivery Air</option>
                <option value="Blue Dart Air">Blue Dart Air</option>
                <option value="DTDC Air 500gm">DTDC Air 500gm</option>
                <option value="Xpressbees">Xpressbees</option>
                <option value="Ekart">Ekart</option>
                <option value="Shiprocket Auto">Shiprocket Auto (Let Shiprocket Decide)</option>
            </select>
        </div>
        
        <div class="grid grid-cols-2 gap-2">
            <button onclick="saveOrderRemark('${o.orderId}')" class="bg-gray-100 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-200">Save Remark</button>
            <button onclick="viewOrder('${o.orderId}')" class="bg-blue-50 text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-100">View Details</button>
        </div>
        <div class="grid grid-cols-2 gap-2 mt-2">
            <button onclick="verifyAddress('${o.orderId}')" class="bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600">✅ Approve</button>
            <button onclick="cancelOrder('${o.orderId}')" class="bg-red-50 text-red-500 font-bold py-2 rounded-lg hover:bg-red-100">❌ Cancel</button>
        </div>
    </div>`;
}

async function verifyAddress(orderId) {
    if (!confirm('Mark this order as Verified?')) return;

    // Get suggested courier from dropdown
    const courierSelect = document.getElementById(`courier-${orderId}`);
    const suggestedCourier = courierSelect ? courierSelect.value : '';

    // Get remark
    const remarkEl = document.getElementById(`remark-${orderId}`);
    const remark = remarkEl ? remarkEl.value : '';

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/verify`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                verifiedBy: currentUser?.id || 'Verification',
                suggestedCourier: suggestedCourier
            })
        });
        const data = await res.json();
        if (data.success) {
            // Also save courier suggestion separately if selected
            if (suggestedCourier) {
                await fetch(`${API_URL}/orders/${orderId}/suggest-courier`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        courier: suggestedCourier,
                        note: remark,
                        suggestedBy: currentUser?.name || 'Verification Dept'
                    })
                });
            }
            showSuccessPopup('Verified', `Order verified${suggestedCourier ? ' | Courier: ' + suggestedCourier : ''}`, '✅', '#10b981');
            loadDeptOrders();
        } else alert(data.message);
    } catch (e) { alert(e.message); }
}

async function cancelOrder(orderId) {
    const reason = prompt("Enter cancellation reason:");
    if (!reason) return;

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason, cancelledBy: currentUser.id })
        });
        const data = await res.json();
        if (data.success) {
            showSuccessPopup('Cancelled', 'Order cancelled successfully', '🛑', '#ef4444');
            loadDeptOrders();
        }
    } catch (e) { }
}

async function saveOrderRemark(orderId) {
    const val = document.getElementById(`remark-${orderId}`).value;
    try {
        await fetch(`${API_URL}/orders/${orderId}/remark`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remark: val, remarkBy: currentUser.id })
        });
        showSuccessPopup('Saved', 'Remark updated', '📝', '#F59E0B');
    } catch (e) { }
}

// ==================== DISPATCH FUNCTIONS ====================
function renderDispatchCard(o) {
    // Courier suggestion from verification
    const suggestion = o.courierSuggestion || {};
    const suggestedCourier = suggestion.suggestedCourier || o.suggestedCourier || '';
    const suggestionNote = suggestion.suggestionNote || '';
    const suggestedBy = suggestion.suggestedBy || '';

    // Remark from verification
    const remark = o.verificationRemark?.text || o.remark || '';

    return `
    <div class="bg-white border rounded-xl p-4">
        <div class="flex justify-between items-center mb-3">
           <div class="flex items-center gap-3">
               <h4 class="font-bold">${o.customerName}</h4>
               <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(o).replace(/"/g, '&quot;')})" 
                   class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-sm transition-all" title="Send WhatsApp">
                   ${WHATSAPP_ICON}
               </button>
           </div>
           <span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Verified</span>
        </div>
        
        <p class="text-sm text-gray-600 mb-2">📍 ${o.address}</p>
        <p class="text-sm text-gray-600 mb-2">📞 ${o.telNo || o.mobile || ''}</p>
        <p class="text-sm font-bold text-gray-800 mb-3">💰 ₹${o.codAmount || o.total || 0} COD</p>
        
        ${suggestedCourier ? `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-lg">🚚</span>
                <span class="font-bold text-blue-800">Suggested Courier: ${suggestedCourier}</span>
            </div>
            ${suggestionNote ? `<p class="text-sm text-blue-600 ml-6">📝 ${suggestionNote}</p>` : ''}
            ${suggestedBy ? `<p class="text-xs text-blue-500 ml-6">By: ${suggestedBy}</p>` : ''}
        </div>
        ` : ''}
        
        ${remark ? `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 text-sm text-yellow-800">
            📝 <b>Remark:</b> ${remark}
        </div>
        ` : ''}
        
        <button onclick="dispatchWithShiprocket('${o.orderId}')" class="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200">
            🚀 Dispatch via Shiprocket
        </button>
    </div>`;
}

// Re-implementing simplified Shiprocket logic from app.js
async function dispatchWithShiprocket(orderId) {
    // Show Box Selection directly (Hardcoded for simplicity or load modal)
    // We created a modal in app.js, let's reuse that logic if possible.
    // Constructing HTML for Modals dynamically or assuming they exist in 'modals.ejs'
    // Actually, app.js created them dynamically.

    const div = document.createElement('div');
    div.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    div.innerHTML = `
        <div class="bg-white p-6 rounded-2xl w-96">
            <h3 class="text-xl font-bold mb-4">Select Box Size</h3>
            <div class="space-y-2">
                ${['small', 'medium', 'large'].map(s => `
                    <button onclick="selectBoxAndFetch('${orderId}', '${s}', this.closest('.fixed'))" class="w-full p-3 border rounded-xl hover:bg-orange-50 font-bold capitalize text-left">
                        📦 ${s} Box
                    </button>
                `).join('')}
            </div>
            <button onclick="this.closest('.fixed').remove()" class="mt-4 w-full p-2 bg-gray-100 rounded-lg">Cancel</button>
        </div>
    `;
    document.body.appendChild(div);
}

// Global for inline onclick access
window.selectBoxAndFetch = async (orderId, size, modal) => {
    modal.remove(); // Close box modal

    // Show Loading
    const loading = document.createElement('div');
    loading.innerHTML = '<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div class="bg-white p-8 rounded-2xl">⏳ Fetching Couriers...</div></div>';
    document.body.appendChild(loading);

    try {
        const boxSizes = {
            small: { length: 16, breadth: 16, height: 5, weight: 0.5 },
            medium: { length: 20, breadth: 16, height: 8, weight: 1.0 },
            large: { length: 24, breadth: 18, height: 10, weight: 1.5 }
        };
        const dim = boxSizes[size];

        const res = await fetch(`${API_URL}/shiprocket/check-serviceability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, dimensions: dim })
        });
        const data = await res.json();

        loading.remove();

        if (data.success && data.couriers.length > 0) {
            showCourierList(orderId, dim, data.couriers);
        } else {
            if (confirm('No couriers found. Try Auto-Dispatch?')) {
                finalDispatch(orderId, dim, null);
            }
        }
    } catch (e) {
        loading.remove(); alert('Error: ' + e.message);
    }
}

function showCourierList(orderId, dim, couriers) {
    const div = document.createElement('div');
    div.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    div.innerHTML = `
        <div class="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto p-6">
            <h3 class="font-bold text-xl mb-4">Select Courier</h3>
            <button onclick="finalDispatch('${orderId}', ${JSON.stringify(dim).replace(/"/g, "&quot;")}, null, this.closest('.fixed'))" 
                class="w-full p-4 mb-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl">
                ⚡ Auto Select (Recommended)
            </button>
            <div class="space-y-2">
                ${couriers.map(c => `
                    <button onclick="finalDispatch('${orderId}', ${JSON.stringify(dim).replace(/"/g, "&quot;")}, ${c.id}, this.closest('.fixed'))"
                        class="w-full p-3 border rounded-xl hover:bg-gray-50 text-left">
                        <div class="flex justify-between font-bold"><span>${c.name}</span><span>₹${c.rate}</span></div>
                        <div class="text-xs text-gray-500">Rating: ${c.rating} | Est: ${c.edd} days</div>
                    </button>
                `).join('')}
            </div>
            <button onclick="this.closest('.fixed').remove()" class="w-full mt-4 p-3 bg-gray-100 rounded-xl font-bold">Cancel</button>
        </div>
    `;
    document.body.appendChild(div);
}

window.finalDispatch = async (orderId, dim, courierId, modal) => {
    if (modal) modal.remove();

    // Loading
    const loading = document.createElement('div');
    loading.innerHTML = '<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div class="bg-white p-6 rounded-2xl text-center"><p class="text-4xl mb-2">🚀</p><p>Generating AWB...</p></div></div>';
    document.body.appendChild(loading);

    try {
        const payload = { orderId, dimensions: dim };
        if (courierId) payload.courierId = courierId;

        const res = await fetch(`${API_URL}/shiprocket/create-order`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const data = await res.json();

        loading.remove();

        if (data.success) {
            showSuccessPopup('Dispatched!', `AWB: ${data.awb}\nCourier: ${data.courier}`, '🚚', '#3b82f6');
            loadDeptOrders(); // Refresh list
        } else {
            alert('Shiprocket Error: ' + data.message);
        }
    } catch (e) { loading.remove(); alert(e.message); }
}

// Global Exports
window.verifyAddress = verifyAddress;
window.cancelOrder = cancelOrder;
window.saveOrderRemark = saveOrderRemark;
window.dispatchWithShiprocket = dispatchWithShiprocket;
window.loadDeptOrders = loadDeptOrders;
window.switchDispatchTab = switchDispatchTab;
