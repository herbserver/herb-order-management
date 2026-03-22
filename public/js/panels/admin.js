// ==================== ADMIN PANEL LOGIC ====================

// Cache for admin stats to prevent redundant API calls
let adminStatsCache = {
    data: null,
    timestamp: 0,
    TTL: 0 // Disable cache to force fresh data
};

document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth('admin');
    if (!user) return; // Redirects handled

    console.log('🚀 Admin Panel v2.1 Loaded - Refined Date Filtering Active');
    loadAdminStats();
    loadAllEmployees();

    // Initialize Socket.io for Real-time Updates
    // Initialize Socket.io for Real-time Updates
    if (typeof io !== 'undefined') {
        const socket = io();
        console.log('🔌 Socket.io Client Initialized');

        // Status UI Elements
        const statusDot = document.getElementById('serverStatusDot');
        const statusText = document.getElementById('serverStatusText');

        const setOnline = () => {
            if (statusDot) {
                statusDot.classList.remove('bg-red-500', 'bg-amber-500');
                statusDot.classList.add('bg-emerald-500');
            }
            if (statusText) statusText.innerText = 'Online';
        };

        const setOffline = () => {
            if (statusDot) {
                statusDot.classList.remove('bg-emerald-500', 'bg-amber-500');
                statusDot.classList.add('bg-red-500');
            }
            if (statusText) statusText.innerText = 'Offline';
        };

        socket.on('connect', () => {
            console.log('🟢 Connected to Real-time Server');
            setOnline();
        });

        socket.on('disconnect', () => {
            console.log('🔴 Disconnected from Server');
            setOffline();
        });

        socket.on('connect_error', () => {
            setOffline();
        });

        // Heartbeat Listener
        let heartbeatTimeout;
        socket.on('server-heartbeat', (data) => {
            // console.log('💓 Heartbeat received', data.timestamp);
            setOnline();

            // If we don't hear back for 45s, mark as offline/laggy
            clearTimeout(heartbeatTimeout);
            heartbeatTimeout = setTimeout(() => {
                if (statusDot) {
                    statusDot.classList.remove('bg-emerald-500');
                    statusDot.classList.add('bg-amber-500');
                }
                if (statusText) statusText.innerText = 'Slow Connection';
            }, 45000);
        });

        // Listen for Order Updates

        // Listen for Order Updates
        socket.on('order-updated', (data) => {
            console.log('🔔 Real-time Update Received:', data.orderId);

            // Refresh based on current view
            // activeTab is global from app.js (or we check UI state)
            const activeTab = document.querySelector('.sidebar-btn.active')?.dataset.tab;

            if (activeTab === 'orders' || activeTab === 'pending' || activeTab === 'dispatch') {
                debouncedRefresh();
            }
            
            debouncedStatsRefresh();
        });

        socket.on('order-created', (data) => {
            console.log('🔔 New Order Received:', data.orderId);
            showToast(`New Order Received: ${data.orderId}`);
            debouncedStatsRefresh();
            debouncedRefresh();
        });

        socket.on('dashboard-update', () => {
            if (document.getElementById('adminProgressTab').classList.contains('hidden') === false) {
                loadAdminProgress();
            }
        });
    } else {
        console.warn('⚠️ Socket.io not loaded');
    }
});

// Debounce helper for list refreshes
let refreshTimeout;
function debouncedRefresh() {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
        if (!document.getElementById('pendingOrdersTab').classList.contains('hidden')) loadPendingOrders();
        else if (!document.getElementById('verifiedOrdersTab').classList.contains('hidden')) loadVerifiedOrders();
        else if (!document.getElementById('dispatchedOrdersTab').classList.contains('hidden')) loadDispatchedOrders();
        else if (!document.getElementById('allOrdersTab').classList.contains('hidden')) loadAdminOrders();
    }, 500);
}

// Debounce helper for stats/analytics refreshes
let statsRefreshTimeout;
function debouncedStatsRefresh() {
    clearTimeout(statsRefreshTimeout);
    statsRefreshTimeout = setTimeout(() => {
        loadAdminStats(true);
        if (!document.getElementById('adminProgressTab').classList.contains('hidden')) {
            loadAdminProgress();
        }
    }, 2000); // 2 second delay for stats to settle
}

function showToast(message) {
    const div = document.createElement('div');
    div.className = 'fixed top-5 right-5 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce';
    div.innerText = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

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
        // Default to Today if no range active/provided
        // Actually, let's check if there's a global date filter?
        // For now, let's hardcode 'Today' as default for the main dashboard view to match user expectation.
        const today = new Date();
        const formatDate = d => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };
        const activeDate = formatDate(today); // Default Today

        // Check if analytic date range is set? Or just default to today.
        // Let's use Today.
        const res = await fetch(`${API_URL}/admin/stats?startDate=${activeDate}&endDate=${activeDate}&_t=${Date.now()}`);
        const data = await res.json();

        // Also fetch department stats for Today/Yesterday counters
        const depRes = await fetch(`${API_URL}/admin/department-stats?_t=${Date.now()}`);
        const depData = await depRes.json();

        if (data.success) {
            // Update cache
            adminStatsCache.data = { ...data, ...depData }; // Merge both
            adminStatsCache.timestamp = now;

            updateAdminStatsUI(data);
            if (depData.success) {
                updateAdminTodayStatsUI(depData.stats);
            }
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
    document.getElementById('deliveredCount').innerText = data.stats.deliveredOrders || 0;

    // Update other missing stats if elements exist
    if (document.getElementById('cancelledCount')) document.getElementById('cancelledCount').innerText = data.stats.cancelledOrders || 0;
    if (document.getElementById('onholdCount')) document.getElementById('onholdCount').innerText = data.stats.onHoldOrders || 0;

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

function updateAdminTodayStatsUI(stats) {
    if (!stats) return;

    // Mapping of tab status names to department-stats keys
    const mapping = {
        'Pending': 'verification', // Using verification today counts for pending
        'Dispatched': 'dispatch',
        'Delivered': 'delivery'
    };

    Object.entries(mapping).forEach(([tabStatus, depKey]) => {
        const depStats = stats[depKey];
        if (!depStats) return;

        // Today
        const todayCount = (depStats.today.fresh || 0) + (depStats.today.reorder || 0);
        const todayEl = document.getElementById(`statsAdmin${tabStatus}Today`);
        if (todayEl) todayEl.innerText = todayCount;

        // Yesterday
        const yesterdayCount = (depStats.yesterday.fresh || 0) + (depStats.yesterday.reorder || 0);
        const yesterdayEl = document.getElementById(`statsAdmin${tabStatus}Yesterday`);
        if (yesterdayEl) yesterdayEl.innerText = yesterdayCount;

        // Week
        const weekCount = (depStats.last7Days.fresh || 0) + (depStats.last7Days.reorder || 0);
        const weekEl = document.getElementById(`statsAdmin${tabStatus}Week`);
        if (weekEl) weekEl.innerText = weekCount;
    });
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
                    <div class="text-right flex items-center gap-2">
                         <button onclick="viewEmployeeProfile('${e.employeeId}', '', '')" class="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                            <span>📊</span> Stats
                         </button>
                         <button onclick="removeEmployee('${e._id}')" class="text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                            <span>🗑️</span> Remove
                         </button>
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

    // Determine relevant date for display
    const statusDateFieldMap = {
        'Pending': 'timestamp',
        'Address Verified': 'verifiedAt',
        'Dispatched': 'dispatchedAt',
        'Out For Delivery': 'ofdAt',
        'Delivered': 'deliveredAt',
        'Cancelled': 'cancellationInfo.cancelledAt',
        'On Hold': 'holdDetails.holdAt',
        'RTO': 'rtoAt'
    };
    const dateField = statusDateFieldMap[o.status] || 'timestamp';
    let displayDate = o.timestamp;

    if (dateField.includes('.')) {
        const parts = dateField.split('.');
        displayDate = o[parts[0]] ? o[parts[0]][parts[1]] : o.timestamp;
    } else {
        displayDate = o[dateField] || o.timestamp;
    }

    const formattedDate = displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A';

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
                <p class="text-[10px] text-gray-400">${formattedDate}</p>
            </div>
        </div>
        
        <div class="my-3 border-t border-slate-100 pt-2 space-y-1">
             <div class="flex items-center gap-2 text-xs text-gray-600">
                <span>📞</span> <span>${o.telNo}</span>
            </div>
            <div class="flex items-start gap-2 text-xs text-gray-600">
                <span>📍</span> <span class="truncate line-clamp-1">${o.address}, ${o.city}</span>
            </div>
             ${o.remark ? `<div class="mt-2 bg-rose-50 border border-rose-100 p-2 rounded-lg text-xs text-rose-800"><strong>💬 Employee Note:</strong> ${o.remark}</div>` : ''}
             ${o.verificationRemark?.text ? `<div class="mt-2 bg-blue-50 border border-blue-100 p-2 rounded-lg text-xs text-blue-800"><strong>📝 Verification:</strong> ${o.verificationRemark.text}</div>` : ''}
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

        const startDateInput = document.getElementById(`admin${status.replace('Address ', '')}StartDate`) || document.getElementById(`admin${status}StartDate`);
        const startDate = startDateInput ? startDateInput.value : '';

        const endDateInput = document.getElementById(`admin${status.replace('Address ', '')}EndDate`) || document.getElementById(`admin${status}EndDate`);
        const endDate = endDateInput ? endDateInput.value : '';

        // Construct query
        let url = `${API_URL}/orders?status=${encodeURIComponent(status)}&page=${currentPage}&limit=${ADMIN_ITEMS_PER_PAGE}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
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
        renderPaginationControls(container, currentPage, totalPages, `loadAdmin${status.replace('Address ', '').replace(' ', '')}`); // Handle 'Verified' and 'OnHold' name mapping

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

        const searchInput = document.getElementById('adminOfdSearch');
        const searchQuery = searchInput ? searchInput.value : '';

        const startDateInput = document.getElementById('adminOfdStartDate');
        const startDate = startDateInput ? startDateInput.value : '';

        const endDateInput = document.getElementById('adminOfdEndDate');
        const endDate = endDateInput ? endDateInput.value : '';

        let url = `${API_URL}/orders?status=${encodeURIComponent('Out For Delivery')}&page=${currentPage}&limit=${ADMIN_ITEMS_PER_PAGE}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

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
    const status = tabName.replace('admin', ''); // e.g., 'Delivered'
    const startDateInput = document.getElementById(`${tabName}StartDate`) || document.getElementById(`admin${status}StartDate`);
    const endDateInput = document.getElementById(`${tabName}EndDate`) || document.getElementById(`admin${status}EndDate`);

    if (!startDateInput || !endDateInput) return;

    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];

    let start, end;

    if (range === 'today') {
        start = today;
        end = today;
    } else if (range === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        start = yesterday;
        end = yesterday;
    } else if (range === 'week') {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        start = weekStart;
        end = today;
    }

    startDateInput.value = formatDate(start);
    endDateInput.value = formatDate(end);

    // Trigger load
    const loadFuncName = `loadAdmin${capitalize(status)}`;
    if (typeof window[loadFuncName] === 'function') {
        window[loadFuncName](1);
    } else if (status === 'OFD' && typeof window.loadAdminOFD === 'function') {
        window.loadAdminOFD(1);
    } else if (status === 'RTO' && typeof window.loadAdminRTO === 'function') {
        window.loadAdminRTO(1);
    }
};

window.exportOrdersByStatus = function (status) {
    if (!confirm(`Export all ${status} orders?`)) return;
    window.location.href = `${API_URL}/orders/export/excel?status=${encodeURIComponent(status)}`;
};

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ==================== MISSING LOADERS (ADDED BY AI) ====================
window.loadAdminVerified = (page = null) => loadAdminOrdersGeneric('Address Verified', 'adminVerifiedList', 'verified', page);
window.loadAdminCancelled = (page = null) => loadAdminOrdersGeneric('Cancelled', 'adminCancelledList', 'cancelled', page);
window.loadAdminOnHold = (page = null) => loadAdminOrdersGeneric('On Hold', 'adminOnholdList', 'onhold', page);
window.loadAdminRTO = (page = null) => loadAdminOrdersGeneric('RTO', 'adminRTOList', 'rto', page);

// Expose loadAllEmployees globally just in case
window.loadAllEmployees = loadAllEmployees;

// ==================== ADMIN TAB SWITCHING ====================
window.switchAdminTab = function (tabName) {
    // 1. Deactivate all sidebar items
    document.querySelectorAll('#adminSidebar .sidebar-nav-item').forEach(btn => {
        btn.classList.remove('bg-indigo-50', 'text-indigo-600', 'border-r-4', 'border-indigo-600');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100');
    });

    // 2. Activate clicked item
    // ID convention: adminTab<CapitalizedTabName>
    // Special handling for RTO and OFD capitalization
    let idSuffix = capitalize(tabName);
    if (tabName === 'rto') idSuffix = 'Rto'; // ID is adminTabRto
    if (tabName === 'ofd') idSuffix = 'Ofd'; // ID is adminTabOfd

    const btnId = `adminTab${idSuffix}`;
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
        btn.classList.add('bg-indigo-50', 'text-indigo-600', 'border-r-4', 'border-indigo-600');
    }

    // 3. Hide all tabs
    const allTabs = [
        'adminPendingTab', 'adminVerifiedTab', 'adminDispatchedTab', 'adminOfdTab',
        'adminDeliveredTab', 'adminCancelledTab', 'adminOnholdTab', 'adminRTOTab',
        'adminEmployeesTab', 'adminDepartmentsTab', 'adminHistoryTab', 'adminProgressTab'
    ];
    allTabs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // 4. Show selected tab
    // Map tabName to ID
    let tabId = '';
    if (tabName === 'rto') tabId = 'adminRTOTab';
    else if (tabName === 'ofd') tabId = 'adminOfdTab';
    else tabId = `admin${capitalize(tabName)}Tab`;

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.remove('hidden');
        targetTab.classList.add('animate-fadeIn');
    } else {
        console.warn(`Tab container with ID ${tabId} not found!`);
    }

    // 5. Load specific data for the tab
    if (tabName === 'pending') loadAdminPending();
    else if (tabName === 'verified') loadAdminVerified();
    else if (tabName === 'dispatched') loadAdminDispatched();
    else if (tabName === 'ofd') loadAdminOFD();
    else if (tabName === 'delivered') loadAdminDelivered();
    else if (tabName === 'cancelled') loadAdminCancelled();
    else if (tabName === 'onhold') loadAdminOnHold();
    else if (tabName === 'rto') loadAdminRTO();
    else if (tabName === 'employees') loadAllEmployees();
    else if (tabName === 'departments') {
        if (window.loadAllDepartments) window.loadAllDepartments();
    }
    else if (tabName === 'progress') {
        if (window.loadAdminProgress) window.loadAdminProgress();
    }
};

// ==================== ANALYTICS DASHBOARD LOGIC (Consolidated into Admin Panel) ====================

// Global state for analytics
let analyticsState = {
    dateRange: 'today', // today, yesterday, week, month
    charts: {} // Store chart instances to destroy/update
};

// Check if Chart.js is available
function checkChartJs() {
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => console.log('✅ Chart.js loaded');
        document.head.appendChild(script);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', checkChartJs);

// Main function called when tab is switched
window.loadAdminProgress = async function () {
    console.log('📊 Loading Analytics Dashboard...');

    // 1. Ensure Chart.js is loaded
    checkChartJs();

    // 2. Load Data based on selected range
    const rangeSelect = document.getElementById('analyticsDateRange');
    if (rangeSelect) analyticsState.dateRange = rangeSelect.value;

    await fetchAnalyticsData();
}

// Update dashboard when range changes
window.updateAnalyticsDashboard = function () {
    const rangeSelect = document.getElementById('analyticsDateRange');
    if (rangeSelect) {
        analyticsState.dateRange = rangeSelect.value;
        fetchAnalyticsData();
    }
}

// Fetch data from backend
async function fetchAnalyticsData() {
    try {
        const { dateRange } = analyticsState;

        // Calculate dates for filter
        let startDate, endDate;
        const today = new Date();
        const formatDate = d => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        if (dateRange === 'today') {
            startDate = formatDate(today);
            endDate = formatDate(today);
        } else if (dateRange === 'yesterday') {
            const y = new Date(today); y.setDate(y.getDate() - 1);
            startDate = formatDate(y);
            endDate = formatDate(y);
        } else if (dateRange === 'week') {
            const w = new Date(today); w.setDate(w.getDate() - 6);
            startDate = formatDate(w);
            endDate = formatDate(today);
        } else if (dateRange === 'month') {
            const m = new Date(today); m.setDate(1);
            startDate = formatDate(m);
            endDate = formatDate(today);
        }

        console.log(`📊 Fetching analytics for ${dateRange}: ${startDate} to ${endDate}`);

        const res = await fetch(`${API_URL}/analytics/dashboard?startDate=${startDate}&endDate=${endDate}&_t=${Date.now()}`);
        const data = await res.json();

        if (data.success) {
            updateAnalyticsUI(data);
        } else {
            console.error('Analytics load failed', data.message);
        }

        // Check for stuck orders
        checkStuckOrders();

    } catch (e) {
        console.error('Analytics Error:', e);
    }
}

// Update UI elements
function updateAnalyticsUI(data) {
    const { today, charts, quickStats } = data;

    // Update Stats
    animateValue('analyticsTotalOrders', quickStats.totalOrders);

    // Revenue
    document.getElementById('analyticsTotalRevenue').innerText = '₹' + (quickStats.totalRevenue || 0).toLocaleString();

    // Delivery Rate
    // Delivery Rate / Count
    // User wants to see "Delivered Count" matching the sidebar
    document.getElementById('analyticsDeliveryRate').innerText = (quickStats.deliveredOrders || 0) + ' / ' + (quickStats.deliverySuccessRate || 0) + '%';

    // Delivered Revenue (Instead of Unique Customers)
    const delRevEl = document.getElementById('analyticsDeliveredRevenue');
    if (delRevEl) delRevEl.innerText = '₹' + (quickStats.deliveredRevenue || 0).toLocaleString();

    // Render Charts
    renderOrdersTimeline(charts.ordersTimeline);
    renderStatusDistribution(charts.statusDistribution);

    // Top Employees
    renderTopEmployees(charts.employeePerformance);
}

// Render Timeline Chart
function renderOrdersTimeline(data) {
    const ctx = document.getElementById('ordersTimelineChart');
    if (!ctx) return;

    if (analyticsState.charts.timeline) analyticsState.charts.timeline.destroy();

    const labels = data.map(d => d.date);
    const totalData = data.map(d => d.total);
    const deliveredData = data.map(d => d.delivered);

    analyticsState.charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Orders',
                    data: totalData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Delivered',
                    data: deliveredData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

// Render Doughnut Chart
function renderStatusDistribution(data) {
    const ctx = document.getElementById('statusDistributionChart');
    if (!ctx) return;

    if (analyticsState.charts.distribution) analyticsState.charts.distribution.destroy();

    // Update Side Stats
    const total = data.total || 1;
    document.getElementById('analyticsStatDelivered').innerText = ((data.delivered / total * 100) || 0).toFixed(1) + '%';
    document.getElementById('analyticsStatDispatched').innerText = ((data.dispatched / total * 100) || 0).toFixed(1) + '%';
    document.getElementById('analyticsStatPending').innerText = ((data.pending / total * 100) || 0).toFixed(1) + '%';

    analyticsState.charts.distribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Delivered', 'Dispatched', 'Pending', 'Cancelled', 'RTO'],
            datasets: [{
                data: [data.delivered, data.dispatched, data.pending, data.cancelled, data.rto || 0],
                backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            cutout: '70%'
        }
    });
}

function renderTopEmployees(employees) {
    const list = document.getElementById('topEmployeesList');
    if (!list) return;

    if (employees.length === 0) {
        list.innerHTML = '<div class="text-center text-gray-400 py-4">No data available</div>';
        return;
    }

    list.innerHTML = employees.map((emp, i) => `
        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    #${i + 1}
                </div>
                <div>
                    <p class="text-sm font-bold text-slate-700">${emp.name}</p>
                    <p class="text-[10px] text-slate-500">${emp.totalOrders} Orders</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-xs font-bold text-emerald-600">₹${(emp.revenue || 0).toLocaleString()}</p>
            </div>
        </div>
    `).join('');
}

async function checkStuckOrders() {
    try {
        const res = await fetch(`${API_URL}/analytics/missing-orders`);
        const data = await res.json();

        const alertBox = document.getElementById('stuckOrdersAlert');
        if (data.alert && data.totalStuck > 0) {
            alertBox.classList.remove('hidden');
            const countEl = document.getElementById('stuckOrdersCount');
            if (countEl) countEl.innerText = data.totalStuck;

            // Populate recent alerts
            const alertsList = document.getElementById('analyticsRecentAlerts');
            if (alertsList) {
                // Determine top category
                const topStatus = Object.keys(data.byStatus).sort((a, b) => data.byStatus[b].length - data.byStatus[a].length)[0];
                alertsList.innerHTML = `
                    <div class="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                        <span class="text-amber-500 text-lg">⚠️</span>
                        <div>
                            <p class="text-xs font-bold text-amber-800">Stuck Orders Detected</p>
                            <p class="text-[10px] text-amber-600">${data.totalStuck} orders stuck (mostly ${topStatus})</p>
                            <button onclick="viewStuckOrders()" class="text-[10px] font-bold underline mt-1 text-amber-700">View All</button>
                        </div>
                    </div>
                `;
            }
        } else {
            alertBox.classList.add('hidden');
        }
    } catch (e) { console.error(e); }
}

// Redirect to stuck orders view (e.g., filtered list)
window.viewStuckOrders = function () {
    alert('Feature coming soon: Direct link to filtered list.');
}

// Helper: Animate numbers
function animateValue(id, end) {
    const obj = document.getElementById(id);
    if (!obj) return;

    // Ensure end is number
    const target = parseInt(end) || 0;
    obj.innerText = target.toLocaleString();
}


