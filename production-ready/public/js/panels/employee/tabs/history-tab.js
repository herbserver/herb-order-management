(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });
    const ordersApi = panel.shared.ordersApi;
    const renderers = panel.shared.renderers;
    const FINAL_STATUSES = ['Delivered', 'Cancelled', 'Returned', 'RTO'];

    async function loadMyHistory(page) {
        if (!currentUser) {
            return;
        }

        const state = panel.tabs.history.state || (panel.tabs.history.state = { currentPage: 1, orders: [] });
        if (page !== undefined && page !== null) {
            state.currentPage = Number(page) || 1;
        }

        try {
            const data = await ordersApi.fetchEmployeeOrders();
            const selectedDate = document.getElementById('empHistoryDate')?.value || '';

            let orders = (data.orders || []).filter((order) => FINAL_STATUSES.includes(order.status));
            if (selectedDate) {
                orders = orders.filter((order) => order.timestamp && order.timestamp.startsWith(selectedDate));
            }

            orders.sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
            state.orders = orders;

            const list = document.getElementById('myHistoryList');
            if (!list) {
                return;
            }

            if (orders.length === 0) {
                list.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">No history found</div>';
                return;
            }

            const limit = renderers.getItemsPerPage();
            const pageData = renderers.paginate(orders, state.currentPage, limit);
            state.currentPage = pageData.currentPage;

            list.innerHTML = pageData.items.map((order) => renderers.renderEmpOrderCard(order, true)).join('');
            renderers.renderPaginationControls(list, pageData.currentPage, pageData.totalPages, 'loadMyHistory', pageData.totalItems);
        } catch (error) {
            console.error('History load error:', error);
        }
    }

    function filterMyHistory(query) {
        renderers.filterCardGrid('#myHistoryList > div[data-mobile]', query);
    }

    function reorderFromHistory(orderData) {
        const order = typeof orderData === 'string' ? JSON.parse(orderData) : orderData;
        const form = document.getElementById('orderForm');
        if (!form || !order) {
            return;
        }

        if (typeof switchEmpTab === 'function') {
            switchEmpTab('order');
        }

        form.customerName.value = order.customerName || '';
        form.telNo.value = order.telNo || '';
        form.hNo.value = order.hNo || '';
        form.blockGaliNo.value = order.blockGaliNo || '';
        form.villColony.value = order.villColony || '';
        form.landMark.value = order.landMark || '';
        form.po.value = order.po || '';
        form.tahTaluka.value = order.tahTaluka || '';
        form.distt.value = order.distt || '';
        form.state.value = order.state || '';
        form.pin.value = order.pin || '';

        const remark = document.getElementById('employeeRemark');
        if (remark) {
            remark.value = '';
        }

        const advanceField = form.querySelector('input[name="advance"]');
        if (advanceField) {
            advanceField.value = '0';
        }

        const codField = form.querySelector('input[name="codAmount"]');
        if (codField) {
            codField.value = '0';
        }

        const totalInput = document.getElementById('totalAmountInput');
        if (totalInput) {
            totalInput.value = '0';
        }

        if (order.orderType === 'Reorder' || order.orderType === 'REORDER') {
            form.querySelector('input[name="orderType"][value="REORDER"]')?.click();
        } else {
            form.querySelector('input[name="orderType"][value="NEW"]')?.click();
        }

        if (typeof updateAddress === 'function') {
            updateAddress();
        }

        showSuccessPopup(
            'Reorder Started',
            `Details for ${order.customerName} loaded. Add items and save the new order.`,
            'OK',
            '#3b82f6'
        );
    }

    panel.tabs.history = {
        id: 'history',
        load: loadMyHistory,
        rootId: 'empHistoryTab',
        state: { currentPage: 1, orders: [] }
    };

    window.filterMyHistory = filterMyHistory;
    window.loadMyHistory = loadMyHistory;
    window.reorderFromHistory = reorderFromHistory;
})();
