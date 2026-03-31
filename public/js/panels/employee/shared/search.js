(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getStatusBadge(status) {
        const normalized = String(status || 'Pending');
        const classes = {
            Pending: 'bg-orange-100 text-orange-700 border-orange-200',
            'Address Verified': 'bg-blue-100 text-blue-700 border-blue-200',
            Dispatched: 'bg-purple-100 text-purple-700 border-purple-200',
            'Out For Delivery': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            Delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            Cancelled: 'bg-red-100 text-red-700 border-red-200',
            RTO: 'bg-rose-100 text-rose-700 border-rose-200',
            'On Hold': 'bg-yellow-100 text-yellow-700 border-yellow-200'
        };

        return classes[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';
    }

    function renderSearchResultCard(order) {
        const status = order.status || 'Pending';
        const trackingId = order.shiprocket?.awb || order.tracking?.trackingId || '';
        const hasTracking = Boolean(trackingId);
        const orderJson = JSON.stringify(order).replace(/"/g, '&quot;');
        const createdAt = order.timestamp
            ? new Date(order.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '-';

        return `
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="p-4 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-4">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order ID</p>
                        <h3 class="text-lg font-black text-slate-800 mt-1">${escapeHtml(order.orderId)}</h3>
                    </div>
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(status)}">
                        ${escapeHtml(status)}
                    </span>
                </div>
                <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-3">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Customer</p>
                            <p class="text-sm font-bold text-slate-800 mt-1">${escapeHtml(order.customerName || '-')}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mobile</p>
                            <p class="text-sm font-mono font-bold text-slate-800 mt-1">${escapeHtml(order.telNo || order.mobile || '-')}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Address</p>
                            <p class="text-sm text-slate-600 mt-1">${escapeHtml(order.address || '-')}</p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</p>
                            <p class="text-2xl font-black text-emerald-600 mt-1">Rs ${escapeHtml(order.total || 0)}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Created</p>
                            <p class="text-sm text-slate-600 mt-1">${escapeHtml(createdAt)}</p>
                        </div>
                        ${hasTracking ? `
                            <div>
                                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tracking</p>
                                <p class="text-sm font-mono font-bold text-indigo-600 mt-1">${escapeHtml(trackingId)}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-end gap-2">
                    ${hasTracking ? `
                        <button type="button" onclick="trackShiprocketOrder('${escapeHtml(order.orderId)}', '${escapeHtml(trackingId)}')" class="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
                            Track
                        </button>
                    ` : ''}
                    <button type="button" onclick="viewOrder('${escapeHtml(order.orderId)}')" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">
                        View
                    </button>
                    ${(order.telNo || order.mobile) ? `
                        <button type="button" onclick="sendWhatsAppDirect('booked', ${orderJson})" class="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition-colors">
                            WA
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function closeSearchResults() {
        document.getElementById('globalSearchResults')?.classList.add('hidden');
    }

    function showGlobalSearchBar() {
        const bar = document.getElementById('globalSearchBar');
        if (!bar) {
            return;
        }

        bar.classList.remove('hidden');
        document.getElementById('globalSearchInput')?.focus();
        panel.core.layout?.setSidebarOpen?.(false);
    }

    async function globalSearchOrder(query) {
        const searchQuery = String(query || '').trim();
        if (searchQuery.length < 3) {
            showWarningPopup('Search Too Short', 'Please enter at least 3 characters to search.');
            return;
        }

        const resultsModal = document.getElementById('globalSearchResults');
        const resultsContent = document.getElementById('globalSearchResultsContent');
        if (!resultsModal || !resultsContent) {
            return;
        }

        resultsModal.classList.remove('hidden');
        resultsContent.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-slate-400">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                <p class="text-sm font-medium">Searching orders...</p>
            </div>
        `;

        try {
            const response = await fetch(`${API_URL}/orders?search=${encodeURIComponent(searchQuery)}`);
            const payload = await response.json();

            if (!payload.success) {
                closeSearchResults();
                showWarningPopup('Search Failed', payload.message || 'Could not search orders.');
                return;
            }

            const filtered = (payload.orders || []).filter((order) => {
                const mobile = String(order.telNo || order.mobile || '').toLowerCase();
                const orderId = String(order.orderId || '').toLowerCase();
                const customerName = String(order.customerName || '').toLowerCase();
                const q = searchQuery.toLowerCase();
                return mobile.includes(q) || orderId.includes(q) || customerName.includes(q);
            });

            if (filtered.length === 0) {
                closeSearchResults();
                showWarningPopup('No Results', `No orders found matching "${searchQuery}".`);
                return;
            }

            resultsContent.innerHTML = `
                <div class="mb-4 px-1">
                    <p class="text-sm text-slate-500 font-medium">Found ${filtered.length} order${filtered.length > 1 ? 's' : ''} matching "${escapeHtml(searchQuery)}"</p>
                </div>
                <div class="space-y-4">
                    ${filtered.map((order) => renderSearchResultCard(order)).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Employee search error:', error);
            closeSearchResults();
            showWarningPopup('Search Error', 'Failed to search orders. Please try again.');
        }
    }

    function init() {
        const modal = document.getElementById('globalSearchResults');
        if (!modal || modal.dataset.empBound === 'true') {
            return;
        }

        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeSearchResults();
            }
        });
        modal.dataset.empBound = 'true';
    }

    panel.shared.search = {
        closeSearchResults,
        globalSearchOrder,
        showGlobalSearchBar
    };

    window.globalSearchOrder = globalSearchOrder;
    window.showGlobalSearchBar = showGlobalSearchBar;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
