// ==================== ADMIN PANEL LOGIC ====================

// Cache for admin stats to prevent redundant API calls
let adminStatsCache = {
    data: null,
    timestamp: 0,
    TTL: 2000 // 2 seconds cache - faster refresh
};

document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth('admin');
    if (!user) return; // Redirects handled

    loadAdminStats();
    loadAllEmployees();
});

async function loadAdminStats(forceRefresh = false) {
    try {
        // Check cache first
        const now = Date.now();
        if (!forceRefresh && adminStatsCache.data && (now - adminStatsCache.timestamp) < adminStatsCache.TTL) {
            console.log('📊 Using cached admin stats');
            const data = adminStatsCache.data;
            updateAdminStatsUI(data);
            return;
        }

        // Fetch fresh data
        const res = await fetch(`${API_URL}/admin/stats`);
        const data = await res.json();

        if (data.success) {
            // Update cache
            adminStatsCache.data = data;
            adminStatsCache.timestamp = now;

            updateAdminStatsUI(data);
        }
    } catch (e) { console.error('Stats error', e); }
}

// Extracted UI update logic for reusability
function updateAdminStatsUI(data) {
    updateCardStats('totalOrdersCount', data.stats.totalOrders, data.stats.totalFresh, data.stats.totalReorder);

    // Update Total Revenue with Fresh/Reorder breakdown
    const totalRevenue = (data.stats.freshRevenue || 0) + (data.stats.reorderRevenue || 0);
    const revenueEl = document.getElementById('totalRevenueCount');
    if (revenueEl) {
        revenueEl.innerText = '₹' + totalRevenue.toLocaleString();

        // Add revenue breakdown below total
        let revenueBreakdown = revenueEl.parentElement.querySelector('.revenue-breakdown');
        if (!revenueBreakdown) {
            const breakdownHtml = `<div class="revenue-breakdown text-[10px] font-bold mt-1 tracking-wide flex gap-2">
                <span class="text-emerald-600">🆕 ₹${(data.stats.freshRevenue || 0).toLocaleString()}</span> 
                <span class="text-gray-300">|</span> 
                <span class="text-blue-600">🔄 ₹${(data.stats.reorderRevenue || 0).toLocaleString()}</span>
            </div>`;
            revenueEl.insertAdjacentHTML('afterend', breakdownHtml);
        } else {
            revenueBreakdown.innerHTML = `
                <span class="text-emerald-600">🆕 ₹${(data.stats.freshRevenue || 0).toLocaleString()}</span> 
                <span class="text-gray-300">|</span> 
                <span class="text-blue-600">🔄 ₹${(data.stats.reorderRevenue || 0).toLocaleString()}</span>
            `;
        }
    }

    updateCardStats('pendingCount', data.stats.pendingOrders, data.stats.pendingFresh, data.stats.pendingReorder);
    document.getElementById('dispatchedCount').innerText = data.stats.dispatchedOrders || 0;

    // Update Pending Tab Revenue Stats
    updateRevenueStats('Pending',
        data.stats.pendingFreshRevenue || 0,
        data.stats.pendingReorderRevenue || 0
    );

    // Update Verified Tab Revenue Stats
    updateRevenueStats('Verified',
        data.stats.verifiedFreshRevenue || 0,
        data.stats.verifiedReorderRevenue || 0
    );

    // Update Dispatched Tab Revenue Stats
    updateRevenueStats('Dispatched',
        data.stats.dispatchedFreshRevenue || 0,
        data.stats.dispatchedReorderRevenue || 0
    );

    // Update Delivered Tab Revenue Stats
    updateRevenueStats('Delivered',
        data.stats.deliveredFreshRevenue || 0,
        data.stats.deliveredReorderRevenue || 0
    );
}

// Helper function to update revenue breakdown stats for each tab
function updateRevenueStats(status, freshRev, reorderRev) {
    const totalRev = freshRev + reorderRev;

    // Update total revenue
    const totalEl = document.getElementById(`statsAdmin${status}Revenue`);
    if (totalEl) totalEl.innerText = '₹' + totalRev.toLocaleString();

    // Update fresh revenue
    const freshEl = document.getElementById(`statsAdmin${status}FreshRev`);
    if (freshEl) freshEl.innerText = '₹' + freshRev.toLocaleString();

    // Update reorder revenue
    const reorderEl = document.getElementById(`statsAdmin${status}ReorderRev`);
    if (reorderEl) reorderEl.innerText = '₹' + reorderRev.toLocaleString();
}

function updateCardStats(elementId, total, fresh, reorder) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Check if Stats Container already exists to avoid duplication if re-run
    let container = el.parentElement.querySelector('.stats-breakdown');
    if (container) {
        container.innerHTML = `<span class="text-emerald-600">🆕 ${fresh}</span> <span class="text-gray-300">|</span> <span class="text-blue-600">🔄 ${reorder}</span>`;
        // Update main count just in case
        el.innerText = total;
    } else {
        el.innerText = total;
        // Inject breakdown
        const breakdownHtml = `<div class="stats-breakdown text-[10px] font-bold mt-1 tracking-wide flex gap-2">
            <span class="text-emerald-600">🆕 ${fresh || 0}</span> 
            <span class="text-gray-300">|</span> 
            <span class="text-blue-600">🔄 ${reorder || 0}</span>
        </div>`;
        el.insertAdjacentHTML('afterend', breakdownHtml);
    }
}

async function loadAllEmployees() {
    try {
        const res = await fetch(`${API_URL}/employees`);
        const data = await res.json();

        const list = document.getElementById('employeeList'); // Ensure this ID exists in admin.ejs
        if (!list) return;

        if (data.employees && data.employees.length > 0) {
            list.innerHTML = data.employees.map(e => `
                <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border mb-2">
                    <div>
                        <p class="font-bold text-gray-800">${e.name}</p>
                        <p class="text-xs text-gray-500">${e.employeeId}</p>
                    </div>
                    <div class="text-right">
                         <button onclick="removeEmployee('${e._id}')" class="text-red-500 text-xs font-bold hover:bg-red-50 px-3 py-1 rounded">Remove</button>
                    </div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p class="text-gray-400 text-center">No employees found</p>';
        }
    } catch (e) { console.error(e); }
}

async function removeEmployee(id) {
    if (!confirm('Are you sure you want to remove this employee?')) return;
    try {
        const res = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showSuccessPopup('Removed', 'Employee removed successfully', '🗑️', '#ef4444');
            loadAllEmployees();
        } else {
            alert(data.message);
        }
    } catch (e) { alert(e.message); }
}

// Global
window.removeEmployee = removeEmployee;

// ==================== PAGINATION CONTROLS ====================
function renderPaginationControls(container, currentPage, totalPages, fetchFuncName) {
    if (!container) return;
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

// ==================== ADMIN ORDER LOADERS ====================

const ADMIN_ITEMS_PER_PAGE = 6; // Reduced for faster loading
let adminPagination = {
    pending: 1,
    verified: 1,
    dispatched: 1,
    delivered: 1
};

function generateAdminOrderCard(o) {
    const statusColors = {
        'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Address Verified': 'bg-blue-100 text-blue-800 border-blue-200',
        'Dispatched': 'bg-purple-100 text-purple-800 border-purple-200',
        'Out For Delivery': 'bg-orange-100 text-orange-800 border-orange-200',
        'Delivered': 'bg-green-100 text-green-800 border-green-200',
        'Cancelled': 'bg-red-100 text-red-800 border-red-200',
        'RTO': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'On Hold': 'bg-amber-100 text-amber-800 border-amber-200'
    };
    const badgeClass = statusColors[o.status] || 'bg-gray-100 text-gray-800';

    return `
    <div class="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all group relative">
        <div class="flex justify-between items-start mb-2">
            <div>
                <span class="text-[10px] font-bold px-2 py-1 rounded-full ${badgeClass} uppercase tracking-wide">${o.status}</span>
                <h4 class="font-bold text-gray-800 mt-2">${o.customerName}</h4>
                <p class="text-xs text-gray-500 font-mono">${o.orderId}</p>
            </div>
            <div class="text-right">
                <p class="font-bold text-emerald-600">₹${o.total}</p>
                <p class="text-[10px] text-gray-400">${new Date(o.timestamp).toLocaleDateString()}</p>
            </div>
        </div>
        
        <div class="my-3 border-t border-slate-100 pt-2 space-y-1">
             <div class="flex items-center gap-2 text-xs text-gray-600">
                <span>📞</span> <span>${o.telNo}</span>
            </div>
            <div class="flex items-start gap-2 text-xs text-gray-600">
                <span>📍</span> <span class="truncate line-clamp-1">${o.address}, ${o.city}</span>
            </div>
        </div>

        <div class="flex gap-2 mt-3">
            <button onclick="openEditModal('${o.orderId}')" class="flex-1 bg-indigo-50 text-indigo-600 text-sm font-bold py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                Edit
            </button>
            <button onclick="viewOrder('${o.orderId}')" class="flex-1 bg-white border border-slate-200 text-slate-600 text-sm font-bold py-2 rounded-lg hover:bg-slate-50 transition-colors">
                View
            </button>
        </div>
    </div>
    `;
}

// Expose to window for use in app.js loadAdminOFD
window.generateAdminOrderCard = generateAdminOrderCard;

async function loadAdminOrdersGeneric(status, containerId, pageKey, page) {
    try {
        if (page !== null) adminPagination[pageKey] = page;
        const currentPage = adminPagination[pageKey] || 1;

        // Note: Admin also has search/filter inputs. 
        // Ideally pass these to backend. For now, we implement basic pagination.
        // If search is active, we might need to handle it. 
        // Currently, index.html has oninput="loadAdminPending()", so it calls this function.
        // We should read values.

        const searchInput = document.getElementById(`admin${status.replace('Address ', '')}Search`) || document.getElementById(`admin${status}Search`);
        const searchQuery = searchInput ? searchInput.value : '';

        // Construct query
        let url = `${API_URL}/orders?status=${encodeURIComponent(status)}&page=${currentPage}&limit=${ADMIN_ITEMS_PER_PAGE}`;
        // Note: Our backend /orders currently doesn't support 'search' query param for filtering.
        // It supports 'status'.
        // If we want search, we need backend support OR fetch all (bad perf).
        // Given 'Performance Optimization' goal, we stick to pagination.
        // We will pass 'search' param anyway, hoping backend ignores it or we implement it later.

        const res = await fetch(url);
        const data = await res.json();

        const container = document.getElementById(containerId);
        if (!container) return;

        let orders = data.orders || [];
        const totalItems = data.pagination ? data.pagination.total : orders.length;
        const totalPages = Math.ceil(totalItems / ADMIN_ITEMS_PER_PAGE) || 1;

        if (orders.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">No orders found</div>';
            return;
        }

        container.innerHTML = orders.map(generateAdminOrderCard).join('');
        renderPaginationControls(container, currentPage, totalPages, `loadAdmin${status.replace('Address ', '')}`); // Handle 'Verified' name mapping

    } catch (e) {
        console.error(`Error loading admin ${status}:`, e);
    }
}

// Wrapper functions matching HTML calls
window.loadAdminPending = (page = null) => loadAdminOrdersGeneric('Pending', 'adminPendingList', 'pending', page);
// Note: 'Verified' tab removed as status doesn't exist in MongoDB
window.loadAdminDispatched = (page = null) => loadAdminOrdersGeneric('Dispatched', 'adminDispatchedList', 'dispatched', page);
// OFD needs special handling because of space in status name
window.loadAdminOFD = async (page = null) => {
    try {
        if (page !== null) adminPagination['ofd'] = page;
        const currentPage = adminPagination['ofd'] || 1;

        let url = `${API_URL}/orders?status=${encodeURIComponent('Out For Delivery')}&page=${currentPage}&limit=${ADMIN_ITEMS_PER_PAGE}`;

        const res = await fetch(url);
        const data = await res.json();

        const container = document.getElementById('adminOfdList');
        if (!container) {
            console.error('adminOfdList container not found');
            return;
        }

        let orders = data.orders || [];
        const totalItems = data.pagination ? data.pagination.total : orders.length;
        const totalPages = Math.ceil(totalItems / ADMIN_ITEMS_PER_PAGE) || 1;

        if (orders.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">No Out For Delivery orders found</div>';
            return;
        }

        container.innerHTML = orders.map(generateAdminOrderCard).join('');
        renderPaginationControls(container, currentPage, totalPages, 'loadAdminOFD');

    } catch (e) {
        console.error('Error loading OFD orders:', e);
    }
};
window.loadAdminDelivered = (page = null) => loadAdminOrdersGeneric('Delivered', 'adminDeliveredList', 'delivered', page);

// ==================== FILTERS & EXPORT ====================

window.resetAdminFilters = function (tab) {
    // Clear inputs
    const ids = [`admin${capitalize(tab)}Search`, `admin${capitalize(tab)}StartDate`, `admin${capitalize(tab)}EndDate`];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    // Reload
    if (tab === 'pending') loadAdminPending(1);
    if (tab === 'verified') loadAdminVerified(1);
    if (tab === 'dispatched') loadAdminDispatched(1);
    if (tab === 'ofd') loadAdminOFD(1);
    if (tab === 'delivered') loadAdminDelivered(1);
};

window.applyQuickDateFilter = function (tabName, range) {
    // Implement if needed, or just console log for now as backend needs date support
    console.log('Quick date filter:', tabName, range);
    // Ideally set start/end date inputs and trigger load
};

window.exportOrdersByStatus = function (status) {
    if (!confirm(`Export all ${status} orders?`)) return;
    window.location.href = `${API_URL}/orders/export/excel?status=${encodeURIComponent(status)}`;
};

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

