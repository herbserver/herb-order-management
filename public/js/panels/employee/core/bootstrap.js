(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });

    function init() {
        const employeeRoot = document.getElementById('employeePanel');
        if (!employeeRoot || panel.isBooted) {
            return;
        }

        if (typeof checkAuth === 'function' && !checkAuth('employee')) {
            return;
        }

        panel.core.router?.bindHashListener?.();
        panel.activeTab = panel.core.router?.getTabFromLocation?.() || panel.activeTab || 'order';
        panel.isBooted = true;
        panel.core.layout?.showEmployeePanel?.();
    }

    panel.core.bootstrap = { init };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
