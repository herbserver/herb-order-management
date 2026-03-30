(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });
    const ordersApi = panel.shared.ordersApi;
    const renderers = panel.shared.renderers;

    async function loadMyCancelledOrders() {
        try {
            const data = await ordersApi.fetchEmployeeOrders();
            const selectedDate = document.getElementById('myCancelledOrdersDate')?.value || new Date().toISOString().split('T')[0];

            const orders = (data.orders || [])
                .filter((order) => order.status === 'Cancelled')
                .filter((order) => order.timestamp && order.timestamp.split('T')[0] === selectedDate)
                .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));

            panel.tabs.cancelled.state.orders = orders;

            const list = document.getElementById('empCancelledList');
            if (!list) {
                return;
            }

            if (orders.length === 0) {
                list.innerHTML = `
                    <div class="col-span-full text-center py-12 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p class="text-gray-500 font-medium">No cancelled orders for this date</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = orders.map((order) => `
                <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-red-100 flex flex-col h-full bg-white" data-mobile="${renderers.escapeHtml(order.telNo || order.mobile || '')}">
                    <div class="p-4 border-b border-red-50 bg-gradient-to-r from-red-50/50 to-white">
                        <div class="flex justify-between items-start">
                            <div>
                                <span class="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-md border border-red-200 uppercase tracking-wide">${renderers.escapeHtml(order.orderId)}</span>
                                <h3 class="font-bold text-gray-800 text-lg leading-tight mt-2">${renderers.escapeHtml(order.customerName)}</h3>
                            </div>
                            <div class="text-right">
                                <p class="text-xl font-black text-gray-800 tracking-tight">Rs ${renderers.escapeHtml(order.total || 0)}</p>
                                <span class="text-xs font-bold text-red-600 mt-1">CANCELLED</span>
                            </div>
                        </div>
                    </div>
                    <div class="p-4 space-y-3 flex-grow">
                        <div class="bg-red-50 p-4 rounded-xl border border-red-100">
                            <p class="text-xs font-bold text-red-800 uppercase mb-1">Cancellation Reason</p>
                            <p class="text-sm text-red-700 italic">"${renderers.escapeHtml(order.cancellationReason || order.cancellationInfo?.reason || 'Reason not specified')}"</p>
                        </div>
                        <div class="text-xs text-gray-500">${order.timestamp ? renderers.escapeHtml(new Date(order.timestamp).toLocaleDateString()) : ''}</div>
                    </div>
                    <div class="p-3 bg-gray-50/50 border-t border-gray-100">
                        <button type="button" onclick="viewOrder('${renderers.escapeHtml(order.orderId)}')" class="w-full bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 py-2 rounded-xl text-xs font-bold shadow-sm transition-all">
                            View Details
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load cancelled orders error:', error);
        }
    }

    function filterMyCancelledOrders(query) {
        renderers.filterCardGrid('#empCancelledList > div[data-mobile]', query);
    }

    panel.tabs.cancelled = {
        id: 'cancelled',
        load: loadMyCancelledOrders,
        rootId: 'empCancelledTab',
        state: { orders: [] }
    };

    window.filterMyCancelledOrders = filterMyCancelledOrders;
    window.loadCancelledOrders = loadMyCancelledOrders;
    window.loadMyCancelledOrders = loadMyCancelledOrders;
})();
