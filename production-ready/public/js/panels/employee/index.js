(function () {
    const existing = window.EmployeePanel || {};

    window.EmployeePanel = {
        version: 'structure-v1',
        activeTab: existing.activeTab || 'order',
        isBooted: existing.isBooted || false,
        core: existing.core || {},
        shared: existing.shared || {},
        tabs: existing.tabs || {},
        paths: {
            bootstrap: 'js/panels/employee/core/bootstrap.js',
            router: 'js/panels/employee/core/router.js',
            layout: 'js/panels/employee/core/layout.js',
            helpers: 'js/panels/employee/shared/helpers.js',
            orderForm: 'js/panels/employee/shared/order-form.js',
            ordersApi: 'js/panels/employee/shared/orders-api.js',
            renderers: 'js/panels/employee/shared/renderers.js',
            search: 'js/panels/employee/shared/search.js',
            trackingModal: 'js/panels/employee/shared/tracking-modal.js',
            orderTab: 'js/panels/employee/tabs/order-tab.js',
            trackingTab: 'js/panels/employee/tabs/tracking-tab.js',
            historyTab: 'js/panels/employee/tabs/history-tab.js',
            progressTab: 'js/panels/employee/tabs/progress-tab.js',
            ofdTab: 'js/panels/employee/tabs/ofd-tab.js',
            cancelledTab: 'js/panels/employee/tabs/cancelled-tab.js'
        }
    };
})();
