/**
 * Global Order Search
 * Search orders from ANY panel by mobile number, order ID, or customer name
 */

// Global search function - works across all panels
async function globalSearchOrder(query) {
    if (!query || query.trim().length < 3) {
        showWarningPopup('Search Too Short', 'Please enter at least 3 characters to search');
        return;
    }

    const searchQuery = query.trim();
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

// Display search results in a modal
function displaySearchResults(orders, query) {
    // Remove existing modal if any
    document.getElementById('globalSearchModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'globalSearchModal';
    modal.className = 'fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 animate-fadeIn';

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
    const statusColors = {
        'Pending': 'bg-orange-100 text-orange-700 border-orange-300',
        'Address Verified': 'bg-blue-100 text-blue-700 border-blue-300',
        'Dispatched': 'bg-purple-100 text-purple-700 border-purple-300',
        'Out For Delivery': 'bg-indigo-100 text-indigo-700 border-indigo-300',
        'Delivered': 'bg-green-100 text-green-700 border-green-300',
        'Cancelled': 'bg-red-100 text-red-700 border-red-300',
        'RTO': 'bg-gray-100 text-gray-700 border-gray-300',
        'On Hold': 'bg-yellow-100 text-yellow-700 border-yellow-300'
    };

    const statusClass = statusColors[order.status] || 'bg-gray-100 text-gray-700 border-gray-300';
    const createdDate = new Date(order.timestamp || order.createdAt).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
            <!-- Order Header -->
            <div class="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-b border-gray-200">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">Order ID</span>
                        <h3 class="text-lg font-black text-gray-800">${order.orderId}</h3>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold border ${statusClass}">
                        ${order.status}
                    </span>
                </div>
            </div>
            
            <!-- Order Details Grid -->
            <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Customer Info -->
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
                            <p class="text-sm text-gray-700 leading-relaxed">${order.address || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Order Info -->
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
                        <span class="text-gray-400 text-sm">👨‍💼</span>
                        <div>
                            <p class="text-xs text-gray-500 uppercase">Created By</p>
                            <p class="font-semibold text-gray-800">${order.employeeName || order.employee || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-2">
                        <span class="text-gray-400 text-sm">📅</span>
                        <div>
                            <p class="text-xs text-gray-500 uppercase">Created On</p>
                            <p class="text-sm text-gray-700">${createdDate}</p>
                        </div>
                    </div>
                    
                    ${order.tracking?.trackingId ? `
                        <div class="flex items-start gap-2">
                            <span class="text-gray-400 text-sm">📦</span>
                            <div>
                                <p class="text-xs text-gray-500 uppercase">Tracking ID</p>
                                <p class="font-mono text-sm font-bold text-blue-600">${order.tracking.trackingId}</p>
                                ${order.tracking.currentStatus ? `<p class="text-xs text-gray-600 mt-1">${order.tracking.currentStatus}</p>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
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
window.closeGlobalSearchModal = closeGlobalSearchModal;

// Helper to show search bar
function showGlobalSearchBar() {
    const bar = document.getElementById('globalSearchBar');
    if (bar) {
        bar.classList.remove('hidden');
        document.getElementById('globalSearchInput').focus();
    }
}
window.showGlobalSearchBar = showGlobalSearchBar;

