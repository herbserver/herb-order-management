/**
 * Global Order Search
 * Search orders from ANY panel by mobile number, order ID, or customer name
 */

// Global search function - works across all panels
async function globalSearchOrder(query) {
    if (!query) return;
    const qTrim = query.trim();

    // Command Interceptor (#)
    if (qTrim.startsWith('#')) {
        console.log('🤖 Command detected:', qTrim);
        
        // Try Employee Handler
        if (typeof window.handleEmployeeCommand === 'function') {
            if (window.handleEmployeeCommand(qTrim)) return;
        }

        if (typeof window.handleVerificationCommand === 'function') {
            if (window.handleVerificationCommand(qTrim)) return;
        }

        if (typeof window.handleDispatchCommand === 'function') {
            if (window.handleDispatchCommand(qTrim)) return;
        }

        if (typeof window.handleDeliveryCommand === 'function') {
            if (window.handleDeliveryCommand(qTrim)) return;
        }
        
        // Try Admin/Dept Handlers (to be implemented if needed)
        // if (typeof window.handleAdminCommand === 'function') ...
    }

    if (qTrim.length < 3) {
        showWarningPopup('Search Too Short', 'Please enter at least 3 characters to search');
        return;
    }

    const searchQuery = qTrim;
    console.log('🔍 Global search initiated:', searchQuery);

    try {
        // Show loading
        showLoadingPopup('Searching orders...');

        // Search across all orders via API
        const res = await fetch(`${API_URL}/orders?search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();

        closeLoadingPopup();

        if (!data.success) {
            showWarningPopup('Search Failed', data.message || 'Could not search orders');
            return;
        }

        const orders = data.orders || [];

        // Filter results locally for more precise matching
        const results = orders.filter(o => {
            const mobile = (o.telNo || '').toLowerCase();
            const orderId = (o.orderId || '').toLowerCase();
            const customerName = (o.customerName || '').toLowerCase();
            const q = searchQuery.toLowerCase();

            return mobile.includes(q) || orderId.includes(q) || customerName.includes(q);
        });

        if (results.length === 0) {
            showWarningPopup('No Results', `No orders found matching "${searchQuery}"`);
            return;
        }

        // Display search results
        displaySearchResults(results, searchQuery);

    } catch (error) {
        closeLoadingPopup();
        console.error('Search error:', error);
        showWarningPopup('Search Error', 'Failed to search orders. Please try again.');
    }
}

function handleVerificationCommand(cmd) {
    const command = String(cmd || '').toLowerCase().replace('#', '').trim();
    const isVerificationPage = window.location.pathname === '/verification' || window.currentDeptType === 'verification';

    if (!isVerificationPage || typeof window.switchVerificationTab !== 'function') {
        return false;
    }

    const mapping = {
        pending: 'pending',
        verify: 'pending',
        verification: 'pending',
        orders: 'pending',
        unverified: 'unverified',
        hold: 'unverified',
        onhold: 'unverified',
        history: 'history',
        past: 'history',
        cancelled: 'cancelled',
        cancel: 'cancelled'
    };

    const targetTab = mapping[command];
    if (!targetTab) {
        if (!command && typeof window.showToast === 'function') {
            window.showToast('Use #pending, #unverified, #history, or #cancelled', 'info');
            return true;
        }
        return false;
    }

    window.switchVerificationTab(targetTab);
    document.getElementById('globalSearchBar')?.classList.add('hidden');

    ['globalSearchInput', 'deptHeaderSearch'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });

    if (typeof window.showToast === 'function') {
        window.showToast(`Switched to ${targetTab} tab`, 'info');
    }

    return true;
}

function handleDispatchCommand(cmd) {
    const command = String(cmd || '').toLowerCase().replace('#', '').trim();
    const isDispatchPage = window.location.pathname === '/dispatch' || window.currentDeptType === 'dispatch';

    if (!isDispatchPage || typeof window.switchDispatchTab !== 'function') {
        return false;
    }

    const mapping = {
        ready: 'ready',
        pending: 'ready',
        queue: 'ready',
        dispatch: 'ready',
        dispatched: 'dispatched',
        shipped: 'dispatched',
        sent: 'dispatched',
        history: 'history',
        stats: 'history',
        past: 'history'
    };

    const targetTab = mapping[command];
    if (!targetTab) {
        if (!command && typeof window.showToast === 'function') {
            window.showToast('Use #ready, #dispatched, or #history', 'info');
            return true;
        }
        return false;
    }

    window.switchDispatchTab(targetTab);
    document.getElementById('globalSearchBar')?.classList.add('hidden');

    ['globalSearchInput', 'deptHeaderSearch'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });

    if (typeof window.showToast === 'function') {
        window.showToast(`Switched to ${targetTab} tab`, 'info');
    }

    return true;
}

function handleDeliveryCommand(cmd) {
    const command = String(cmd || '').toLowerCase().replace('#', '').trim();
    const isDeliveryPage = window.location.pathname === '/delivery' || window.currentDeptType === 'delivery';

    if (!isDeliveryPage || typeof window.switchDeliveryTab !== 'function') {
        return false;
    }

    const mapping = {
        requests: 'requests',
        request: 'requests',
        req: 'requests',
        onway: 'onway',
        transit: 'onway',
        intransit: 'onway',
        ofd: 'ofd',
        outfordelivery: 'ofd',
        delivered: 'delivered',
        complete: 'delivered',
        done: 'delivered',
        rto: 'rto',
        return: 'rto',
        returned: 'rto'
    };

    const targetTab = mapping[command];
    if (!targetTab) {
        if (!command && typeof window.showToast === 'function') {
            window.showToast('Use #requests, #onway, #ofd, #delivered, or #rto', 'info');
            return true;
        }
        return false;
    }

    window.switchDeliveryTab(targetTab);
    document.getElementById('globalSearchBar')?.classList.add('hidden');

    ['globalSearchInput', 'deptHeaderSearch'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });

    if (typeof window.showToast === 'function') {
        window.showToast(`Switched to ${targetTab} tab`, 'info');
    }

    return true;
}

// Display search results in a modal
function displaySearchResults(orders, query) {
    // Remove existing modal if any
    document.getElementById('globalSearchModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'globalSearchModal';
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center p-4 animate-fadeIn';
    modal.style.zIndex = '9000';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-slideUp">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white sticky top-0 z-10">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold">🔍 Search Results</h2>
                        <p class="text-white/80 text-sm mt-1">Found ${orders.length} order${orders.length > 1 ? 's' : ''} matching "${query}"</p>
                    </div>
                    <button onclick="closeGlobalSearchModal()" 
                        class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all">
                        <span class="text-2xl">×</span>
                    </button>
                </div>
            </div>
            
            <!-- Results List -->
            <div class="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div class="space-y-4">
                    ${orders.map(order => renderSearchResultCard(order)).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeGlobalSearchModal();
    });
}

// Render individual order card in search results
function renderSearchResultCard(order) {
    // 1. Determine Status & Colors
    const status = order.status || 'Pending';
    let statusColor = 'bg-gray-100 text-gray-700 border-gray-300';
    let statusIcon = '📦';

    if (status === 'Pending') { statusColor = 'bg-orange-100 text-orange-700 border-orange-200'; statusIcon = '⏳'; }
    else if (status === 'Address Verified') { statusColor = 'bg-blue-100 text-blue-700 border-blue-200'; statusIcon = '✅'; }
    else if (status === 'Dispatched') { statusColor = 'bg-purple-100 text-purple-700 border-purple-200'; statusIcon = '🚚'; }
    else if (status === 'Out For Delivery') { statusColor = 'bg-indigo-100 text-indigo-700 border-indigo-200'; statusIcon = '📦'; }
    else if (status === 'Delivered') { statusColor = 'bg-green-100 text-green-700 border-green-200'; statusIcon = '🎉'; }
    else if (status === 'Cancelled') { statusColor = 'bg-red-100 text-red-700 border-red-200'; statusIcon = '❌'; }
    else if (status === 'RTO') { statusColor = 'bg-rose-100 text-rose-700 border-rose-200'; statusIcon = '↩️'; }
    else if (status === 'On Hold') { statusColor = 'bg-yellow-100 text-yellow-700 border-yellow-200'; statusIcon = '⏸️'; }

    // 2. Format Date
    const createdDate = new Date(order.timestamp || order.createdAt).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // 3. Tracking Info Logic
    const hasShiprocket = order.shiprocket && order.shiprocket.awb;
    const trackingId = order.shiprocket?.awb || order.tracking?.trackingId;
    const carrier = order.tracking?.courier || order.shiprocket?.courierName || '';
    const currentStatus = order.tracking?.currentStatus || order.shiprocket?.currentStatus || '';

    // Tracking Badge Color
    let trackingBadgeColor = 'text-blue-600 bg-blue-50 border-blue-200';
    const sLower = (currentStatus || '').toLowerCase();
    if (sLower.includes('delivered')) trackingBadgeColor = 'text-green-600 bg-green-50 border-green-200';
    else if (sLower.includes('out for delivery')) trackingBadgeColor = 'text-purple-600 bg-purple-50 border-purple-200';
    else if (sLower.includes('rto')) trackingBadgeColor = 'text-red-600 bg-red-50 border-red-200';

    return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
            <!-- Order Header -->
            <div class="bg-gradient-to-r from-gray-50 to-slate-50 p-4 border-b border-gray-200">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">Order ID</span>
                        <h3 class="text-lg font-black text-gray-800">${order.orderId}</h3>
                    </div>
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${statusColor}">
                        <span>${statusIcon}</span> ${status}
                    </span>
                </div>
            </div>
            
            <!-- Order Details Grid -->
            <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Customer Info (Left) -->
                <div class="space-y-3">
                    <div class="flex items-start gap-2">
                        <span class="text-gray-400 text-sm">👤</span>
                        <div>
                            <p class="text-xs text-gray-500 uppercase">Customer</p>
                            <p class="font-bold text-gray-800">${order.customerName}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-2">
                        <span class="text-gray-400 text-sm">📱</span>
                        <div>
                            <p class="text-xs text-gray-500 uppercase">Mobile</p>
                            <p class="font-mono font-bold text-gray-800">${order.telNo}</p>
                            ${order.altNo ? `<p class="font-mono text-xs text-gray-500">${order.altNo}</p>` : ''}
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-2">
                        <span class="text-gray-400 text-sm">📍</span>
                        <div>
                            <p class="text-xs text-gray-500 uppercase">Address</p>
                            <p class="text-sm text-gray-700 leading-relaxed line-clamp-2">${order.address || 'N/A'} ${order.pin ? '- ' + order.pin : ''}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Order Info (Right) -->
                <div class="space-y-3">
                    <div class="flex items-start gap-2">
                        <span class="text-gray-400 text-sm">💰</span>
                        <div>
                            <p class="text-xs text-gray-500 uppercase">Amount</p>
                            <p class="text-2xl font-black text-green-600">₹${order.total}</p>
                            <p class="text-xs text-gray-500">COD: ₹${order.cod || order.total - (order.advance || 0)}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-2">
                        <span class="text-gray-400 text-sm">📅</span>
                        <div>
                            <p class="text-xs text-gray-500 uppercase">Created On</p>
                            <p class="text-sm text-gray-700">${createdDate}</p>
                        </div>
                    </div>

                    <!-- Integrated Tracking Details -->
                    ${(trackingId || carrier) ? `
                        <div class="flex items-start gap-2 pt-2 border-t border-dashed border-gray-200">
                            <span class="text-gray-400 text-sm">📦</span>
                            <div class="flex-1">
                                <p class="text-xs text-gray-500 uppercase flex justify-between">
                                    Tracking Info
                                    ${currentStatus ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold border ${trackingBadgeColor}">${currentStatus}</span>` : ''}
                                </p>
                                <p class="text-xs font-bold text-gray-800 mt-0.5">${carrier}</p>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <p class="font-mono text-xs text-blue-600 font-medium">${trackingId}</p>
                                    ${trackingId ? (hasShiprocket ? `
                                        <button onclick="trackShiprocketOrder('${order.orderId}', '${trackingId}')" class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 font-bold">
                                            Track
                                        </button>
                                    ` : `
                                        <button onclick="window.open('${getTrackingLink(carrier, trackingId)}', '_blank')" class="text-[10px] bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-100">
                                            ↗
                                        </button>
                                    `) : ''}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Reasons Section -->
            ${status === 'RTO' ? `
                <div class="px-5 pb-4">
                     <div class="bg-red-50 border border-red-100 rounded-xl p-3">
                        <p class="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">↩️ RTO Reason</p>
                        <p class="text-xs font-bold text-red-700 italic">"${order.rtoReason || 'No reason provided'}"</p>
                    </div>
                </div>
            ` : ''}

            ${status === 'Cancelled' ? `
                <div class="px-5 pb-4">
                     <div class="bg-red-50 border border-red-100 rounded-xl p-3">
                        <p class="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">❌ Cancellation Reason</p>
                        <p class="text-xs font-bold text-red-700 italic">"${order.cancelReason || 'No reason provided'}"</p>
                    </div>
                </div>
            ` : ''}
            
            <!-- Actions Footer -->
            <div class="bg-gray-50 p-4 border-t border-gray-200 flex justify-end gap-2">
                <button onclick="viewOrder('${order.orderId}')" 
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2">
                    <span>👁️</span> View Full Details
                </button>
                ${order.telNo ? `
                    <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                        class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-all flex items-center gap-2">
                        ${WHATSAPP_ICON} WhatsApp
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Helper to get tracking link (reused from other files if possible, but safe duplicated here for standalone search)
function getTrackingLink(courier, id) {
    const c = (courier || '').toLowerCase();
    if (c.includes('blue dart') || c.includes('bluedart')) return `https://www.bluedart.com/track?handler=trakDetails&trackId=${id}`;
    if (c.includes('india post') || c.includes('speed post')) return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
    if (c.includes('delhivery')) return `https://www.delhivery.com/track/package/${id}`;
    return `https://www.google.com/search?q=${courier}+tracking+${id}`;
}

// Close search modal
function closeGlobalSearchModal() {
    const modal = document.getElementById('globalSearchModal');
    if (modal) {
        modal.classList.add('animate-fadeOut');
        setTimeout(() => modal.remove(), 200);
    }
}

// Show loading popup
function showLoadingPopup(message) {
    const existing = document.getElementById('loadingPopup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'loadingPopup';
    popup.className = 'fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center';
    popup.innerHTML = `
        <div class="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-4">
            <div class="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p class="text-gray-700 font-semibold">${message}</p>
        </div>
    `;
    document.body.appendChild(popup);
}

// Close loading popup
function closeLoadingPopup() {
    document.getElementById('loadingPopup')?.remove();
}

// Export to window
window.globalSearchOrder = globalSearchOrder;
window.handleVerificationCommand = handleVerificationCommand;
window.handleDispatchCommand = handleDispatchCommand;
window.closeGlobalSearchModal = closeGlobalSearchModal;

// Helper to show search bar
function showGlobalSearchBar() {
    const bar = document.getElementById('globalSearchBar');
    if (bar) {
        bar.classList.remove('hidden');
        document.getElementById('globalSearchInput').focus();
    }

    // Auto-close sidebars on mobile
    if (window.innerWidth < 1024) {
        // Employee Sidebar
        const empSidebar = document.getElementById('empSidebar');
        const empBackdrop = document.getElementById('empSidebarBackdrop');
        if (empSidebar) empSidebar.classList.add('-translate-x-full');
        if (empBackdrop) {
            empBackdrop.classList.add('opacity-0', 'pointer-events-none');
            empBackdrop.classList.remove('opacity-100', 'pointer-events-auto');
        }

        // Department Sidebar
        const deptSidebar = document.getElementById('deptSidebar');
        const deptBackdrop = document.getElementById('deptSidebarBackdrop');
        if (deptSidebar) deptSidebar.classList.add('-translate-x-full');
        if (deptBackdrop) {
            deptBackdrop.classList.add('opacity-0', 'pointer-events-none');
            deptBackdrop.classList.remove('opacity-100', 'pointer-events-auto');
        }

        // Admin Sidebar
        const adminSidebar = document.getElementById('adminSidebar');
        const adminBackdrop = document.getElementById('adminSidebarBackdrop'); // Assuming ID based on pattern
        if (adminSidebar) adminSidebar.classList.add('-translate-x-full');
        if (adminBackdrop) { // Admin often uses a different backdrop structure, but applying safe check
            adminBackdrop.classList.add('opacity-0', 'pointer-events-none');
        }

        // Generic: Hide any active backdrop
        document.querySelectorAll('.backdrop-blur-sm').forEach(el => {
            if (!el.classList.contains('hidden')) {
                el.click(); // Trigger click to close using existing handlers if possible
            }
        });
    }
}
window.showGlobalSearchBar = showGlobalSearchBar;

