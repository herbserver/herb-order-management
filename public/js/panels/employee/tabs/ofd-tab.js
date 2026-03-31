(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });
    const ordersApi = panel.shared.ordersApi;
    const renderers = panel.shared.renderers;

    function renderOfdOrders(orders) {
        const list = document.getElementById('empOfdList');
        if (!list) {
            return;
        }

        if (orders.length === 0) {
            list.innerHTML = `
                <div class="col-span-full text-center py-12 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p class="text-gray-500 font-medium">No orders currently Out For Delivery</p>
                </div>
            `;
            return;
        }

        list.innerHTML = orders.map((order) => {
            const trackingId = order.shiprocket?.awb || order.tracking?.trackingId || '';
            const courierName = order.tracking?.courier || order.shiprocket?.courierName || 'Manual';
            const mobile = order.mobile || order.telNo || '';

            return `
                <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group ring-2 ring-orange-500/20 bg-white shadow-md" data-mobile="${renderers.escapeHtml(mobile)}">
                    <div class="p-4 border-b border-orange-50 bg-orange-50/50 flex justify-between items-center">
                        <span class="text-xs font-black text-orange-600 tracking-wider">${renderers.escapeHtml(order.orderId)}</span>
                        <span class="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-md uppercase border border-orange-200">OFD</span>
                    </div>
                    <div class="p-4">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-bold text-slate-800 truncate">${renderers.escapeHtml(order.customerName)}</p>
                                <p class="text-[10px] text-slate-500 font-semibold">${renderers.escapeHtml(mobile)}</p>
                            </div>
                        </div>
                        ${trackingId ? `
                            <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4 flex justify-between items-center">
                                <div>
                                    <p class="text-[9px] font-bold text-indigo-500 uppercase mb-0.5">${renderers.escapeHtml(courierName)}</p>
                                    <p class="text-[11px] font-mono font-bold text-slate-700">${renderers.escapeHtml(trackingId)}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Status</p>
                                    <p class="text-[10px] font-bold text-slate-600">${renderers.escapeHtml(order.tracking?.currentStatus || 'In Transit')}</p>
                                </div>
                            </div>
                        ` : ''}
                        <div class="bg-slate-50 rounded-2xl p-4 mb-4 space-y-2.5 border border-slate-100">
                            <div class="flex justify-between items-center text-[11px]">
                                <span class="text-slate-500 font-medium">Order Amount:</span>
                                <span class="text-slate-900 font-bold">Rs ${renderers.escapeHtml(order.total || 0)}</span>
                            </div>
                            <div class="flex justify-between items-center text-[11px]">
                                <span class="text-slate-500 font-medium tracking-tight">COD:</span>
                                <span class="text-orange-600 font-black text-xs">Rs ${renderers.escapeHtml(order.codAmount || order.cod || 0)}</span>
                            </div>
                            <div class="pt-2 border-t border-slate-200/50">
                                <p class="text-[10px] text-slate-400 font-bold uppercase mb-1">Delivery Address</p>
                                <p class="text-[11px] text-slate-700 font-medium line-clamp-2 leading-relaxed">${renderers.escapeHtml(order.address || 'No address provided')}</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <button onclick="viewOrder('${renderers.escapeHtml(order.orderId)}')" class="py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 border border-slate-200 shadow-sm">Details</button>
                            <button onclick="trackShiprocketOrder('${renderers.escapeHtml(order.orderId)}', '${renderers.escapeHtml(trackingId)}')" class="py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200 ${!trackingId ? 'opacity-50 cursor-not-allowed' : ''}" ${!trackingId ? 'disabled' : ''}>Track</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function loadMyOfdOrders() {
        try {
            const data = await ordersApi.fetchEmployeeOrders();
            const orders = (data.orders || [])
                .filter((order) => order.status === 'Out For Delivery')
                .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));

            panel.tabs.ofd.state.orders = orders;
            renderOfdOrders(orders);
        } catch (error) {
            console.error('Error loading OFD orders:', error);
        }
    }

    function filterMyOfdOrders(query) {
        const normalized = (query || '').toLowerCase().trim();
        const orders = panel.tabs.ofd.state.orders || [];
        const filtered = orders.filter((order) => {
            return String(order.orderId || '').toLowerCase().includes(normalized)
                || String(order.customerName || '').toLowerCase().includes(normalized)
                || String(order.mobile || order.telNo || '').toLowerCase().includes(normalized);
        });

        renderOfdOrders(filtered);
    }

    panel.tabs.ofd = {
        id: 'ofd',
        load: loadMyOfdOrders,
        rootId: 'empOfdTab',
        state: { orders: [] }
    };

    window.filterMyOfdOrders = filterMyOfdOrders;
    window.loadMyOfdOrders = loadMyOfdOrders;
})();
