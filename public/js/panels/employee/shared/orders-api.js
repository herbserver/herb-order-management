(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });

    function getCurrentEmployee() {
        return window.currentUser && currentUser.id ? currentUser : null;
    }

    function buildUrl(path, params) {
        const url = new URL(`${API_URL}${path}`, window.location.origin);

        Object.entries(params || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, String(value));
            }
        });

        return url.toString();
    }

    async function getJson(url, options) {
        const response = await fetch(url, options);
        return response.json();
    }

    async function fetchEmployeeOrders(params) {
        const employee = getCurrentEmployee();
        if (!employee) {
            return { success: false, orders: [] };
        }

        const url = buildUrl(`/orders/employee/${employee.id}`, params);
        return getJson(url);
    }

    async function fetchEmployeeProfile(params) {
        const employee = getCurrentEmployee();
        if (!employee) {
            return { success: false, orders: [], stats: null };
        }

        const url = buildUrl(`/employees/${employee.id}`, params);
        return getJson(url);
    }

    async function createOrder(payload) {
        return getJson(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    async function checkDuplicate(payload) {
        return getJson(`${API_URL}/orders/check-duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    async function requestDelivery(orderId, payload) {
        return getJson(`${API_URL}/orders/${orderId}/request-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    panel.shared.ordersApi = {
        buildUrl,
        checkDuplicate,
        createOrder,
        fetchEmployeeOrders,
        fetchEmployeeProfile,
        getCurrentEmployee,
        requestDelivery
    };
})();
