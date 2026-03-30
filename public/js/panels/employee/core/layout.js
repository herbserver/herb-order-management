(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });

    function setSidebarOpen(isOpen) {
        const sidebar = document.getElementById('empSidebar');
        const backdrop = document.getElementById('empSidebarBackdrop');
        if (!sidebar) {
            return;
        }

        if (isOpen) {
            sidebar.classList.remove('-translate-x-full');
            backdrop?.classList.remove('opacity-0', 'pointer-events-none');
            backdrop?.classList.add('opacity-100', 'pointer-events-auto');
            return;
        }

        sidebar.classList.add('-translate-x-full');
        backdrop?.classList.add('opacity-0', 'pointer-events-none');
        backdrop?.classList.remove('opacity-100', 'pointer-events-auto');
    }

    function toggleEmpSidebar() {
        const sidebar = document.getElementById('empSidebar');
        if (!sidebar) {
            return;
        }

        setSidebarOpen(sidebar.classList.contains('-translate-x-full'));
    }

    function showEmployeePanel() {
        document.querySelectorAll('#app > div').forEach((node) => node.classList.add('hidden'));

        const employeePanel = document.getElementById('employeePanel');
        if (employeePanel) {
            employeePanel.classList.remove('hidden');
        }

        const nameDisplay = document.getElementById('empNameDisplay');
        if (nameDisplay && currentUser) {
            nameDisplay.textContent = `${currentUser.name} (${currentUser.id})`;
        }

        if (typeof switchEmpTab === 'function') {
            switchEmpTab(panel.activeTab || panel.core.router?.getTabFromLocation?.() || 'order', { replaceHash: true });
        }

        window.dispatchEvent(new Event('resize'));
    }

    function employeeLogout() {
        if (typeof clearSession === 'function') {
            clearSession();
        }
        window.location.href = '/login';
    }

    panel.core.layout = {
        backdropId: 'empSidebarBackdrop',
        setSidebarOpen,
        showEmployeePanel,
        sidebarId: 'empSidebar',
        toggleEmpSidebar
    };

    window.logout = employeeLogout;
    window.showEmployeePanel = showEmployeePanel;
    window.toggleEmpSidebar = toggleEmpSidebar;
})();
