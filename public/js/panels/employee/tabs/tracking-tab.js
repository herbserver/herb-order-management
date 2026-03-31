(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });
    const ordersApi = panel.shared.ordersApi;
    const renderers = panel.shared.renderers;
    const ACTIVE_STATUSES = ['Pending', 'Address Verified', 'Dispatched', 'Out For Delivery', 'On Hold'];

    function renderMyOrderStats(orders) {
        const statsHost = document.getElementById('myOrdersStats');
        if (!statsHost) {
            return;
        }

        const stats = {
            total: orders.length,
            pending: orders.filter((order) => order.status === 'Pending').length,
            verified: orders.filter((order) => order.status === 'Address Verified').length,
            dispatched: orders.filter((order) => order.status === 'Dispatched').length,
            ofd: orders.filter((order) => order.status === 'Out For Delivery').length,
            hold: orders.filter((order) => order.status === 'On Hold').length
        };

        const cards = [
            { label: 'Total', value: stats.total, accent: 'blue' },
            { label: 'Pending', value: stats.pending, accent: 'yellow' },
            { label: 'Verified', value: stats.verified, accent: 'emerald' },
            { label: 'Dispatched', value: stats.dispatched, accent: 'indigo' },
            { label: 'OFD', value: stats.ofd, accent: 'orange' },
            { label: 'Hold', value: stats.hold, accent: 'amber' }
        ];

        statsHost.innerHTML = cards.map((card) => `
            <div class="glass-card p-2 flex flex-col items-center justify-center text-center border-b-2 border-${card.accent}-500 bg-white shadow-sm">
                <span class="text-[7px] font-black text-gray-400 uppercase tracking-tighter">${card.label}</span>
                <span class="text-sm font-black text-slate-800">${card.value}</span>
            </div>
        `).join('');
    }

    async function loadMyOrders(page) {
        if (!currentUser) {
            return;
        }

        const state = panel.tabs.tracking.state || (panel.tabs.tracking.state = { currentPage: 1, orders: [] });
        if (page !== undefined && page !== null) {
            state.currentPage = Number(page) || 1;
        }

        try {
            const data = await ordersApi.fetchEmployeeOrders();
            const allOrders = (data.orders || []).sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
            const selectedDate = document.getElementById('myOrdersDate')?.value || new Date().toISOString().split('T')[0];
            const dayOrders = allOrders.filter((order) => order.timestamp && order.timestamp.split('T')[0] === selectedDate);

            renderMyOrderStats(dayOrders);

            const activeOrders = dayOrders.filter((order) => ACTIVE_STATUSES.includes(order.status));
            state.orders = activeOrders;

            const list = document.getElementById('myOrdersList');
            if (!list) {
                return;
            }

            if (activeOrders.length === 0) {
                list.innerHTML = `
                    <div class="col-span-full text-center py-10 bg-white/50 rounded-2xl border-2 border-dashed border-gray-100">
                        <p class="text-[10px] text-gray-500 font-black uppercase tracking-widest">No active orders</p>
                    </div>
                `;
                return;
            }

            const limit = renderers.getItemsPerPage();
            const pageData = renderers.paginate(activeOrders, state.currentPage, limit);
            state.currentPage = pageData.currentPage;

            list.innerHTML = pageData.items.map((order) => renderers.renderEmpOrderCard(order, false)).join('');
            renderers.renderPaginationControls(list, pageData.currentPage, pageData.totalPages, 'loadMyOrders', pageData.totalItems);
        } catch (error) {
            console.error('Error loading my orders:', error);
            const list = document.getElementById('myOrdersList');
            if (list) {
                list.innerHTML = '<p class="col-span-full text-center text-red-500 py-8">Server connection failed</p>';
            }
        }
    }

    function filterMyOrders(query) {
        renderers.filterCardGrid('#myOrdersList > div[data-mobile]', query);
    }

    async function requestDelivery(orderId) {
        if (!window.confirm('Dispatch Department ko delivery request bhejni hai?')) {
            return;
        }

        try {
            const data = await ordersApi.requestDelivery(orderId, {
                employeeId: currentUser.id,
                employeeName: currentUser.name
            });

            if (data.success) {
                showSuccessPopup(
                    'Delivery Request Sent!',
                    'Delivery request successfully bhej di gayi.',
                    'OK',
                    '#8b5cf6'
                );

                window.setTimeout(() => {
                    loadMyOrders(1);
                    if (typeof closeModal === 'function') {
                        closeModal('requestDeliveryModal');
                    }
                }, 1000);
            } else {
                showMessage(data.message || 'Request nahi bheji ja saki', 'error', 'empMessage');
            }
        } catch (error) {
            console.error(error);
            showMessage('Server error!', 'error', 'empMessage');
        }
    }

    panel.tabs.tracking = {
        id: 'tracking',
        load: loadMyOrders,
        requestDelivery,
        rootId: 'empTrackingTab',
        state: { currentPage: 1, orders: [] }
    };

    window.filterMyOrders = filterMyOrders;
    window.loadMyOrders = loadMyOrders;
    window.requestDelivery = requestDelivery;
    window._empLoadMyOrders = loadMyOrders;
})();
