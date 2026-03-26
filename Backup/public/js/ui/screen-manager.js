/**
 * Screen Management Module
 * Functions to show different panels/screens
 */

/**
 * Show Employee Panel
 */
function showEmployeePanel() {
    document.querySelectorAll('#app> div').forEach(d => d.classList.add('hidden'));
    document.getElementById('employeePanel').classList.remove('hidden');
    document.getElementById('empNameDisplay').textContent = currentUser.name + ' (' + currentUser.id + ')';
    initOrderForm();
    loadMyOrders();

    // Start auto-tracking for Out for Delivery alerts (employee's own orders)
    // Auto-tracking DISABLED - Using webhook for real-time updates
    // if (typeof initializeAutoTracking === 'function') {
    //     initializeAutoTracking();
    // }
}

/**
 * Show Admin Panel
 */
function showAdminPanel() {
    document.querySelectorAll('#app> div').forEach(d => d.classList.add('hidden'));
    document.getElementById('adminPanel').classList.remove('hidden');
    loadAdminData();

    // Start auto-tracking for Out for Delivery alerts
    // Auto-tracking DISABLED - Using webhook for real-time updates
    // if (typeof initializeAutoTracking === 'function') {
    //     initializeAutoTracking();
    // }
}

/**
 * Show Department Panel
 */
function showDepartmentPanel() {
    document.querySelectorAll('#app > div').forEach(d => d.classList.add('hidden'));
    document.getElementById('departmentPanel').classList.remove('hidden');
    document.getElementById('deptIdDisplay').textContent = currentUser.id;

    const exportBtn = document.getElementById('deptExportBtn');
    const dateFilter = document.getElementById('headerDateFilter');

    // Reset visibility
    if (exportBtn) exportBtn.classList.add('hidden');
    if (dateFilter) dateFilter.classList.add('hidden');

    // Hide all department content sections
    document.getElementById('verificationDeptContent').classList.add('hidden');
    document.getElementById('dispatchDeptContent').classList.add('hidden');
    if (document.getElementById('deliveryDeptContent')) {
        document.getElementById('deliveryDeptContent').classList.add('hidden');
    }

    // Hide all nav groups
    document.querySelectorAll('[id^="navGroup"]').forEach(group => group.classList.add('hidden'));

    if (currentDeptType === 'verification') {
        const headerTitle = document.getElementById('deptHeaderTitle');
        if (headerTitle) headerTitle.textContent = 'Verification Dept';
        const sidebarSubtitle = document.getElementById('deptSidebarSubtitle');
        if (sidebarSubtitle) sidebarSubtitle.textContent = 'Verification Team';

        const navGroup = document.getElementById('navGroupVerification');
        if (navGroup) navGroup.classList.remove('hidden');
        document.getElementById('verificationDeptContent').classList.remove('hidden');

        switchVerificationTab('pending');
    } else if (currentDeptType === 'dispatch') {
        const headerTitle = document.getElementById('deptHeaderTitle');
        if (headerTitle) headerTitle.textContent = 'Dispatch Dept';
        const sidebarSubtitle = document.getElementById('deptSidebarSubtitle');
        if (sidebarSubtitle) sidebarSubtitle.textContent = 'Dispatch Team';

        const navGroup = document.getElementById('navGroupDispatch');
        if (navGroup) navGroup.classList.remove('hidden');
        document.getElementById('dispatchDeptContent').classList.remove('hidden');

        if (exportBtn) {
            exportBtn.classList.remove('hidden');
            exportBtn.onclick = exportDispatchedOrdersFiltered;
        }

        switchDispatchTab('ready');
    } else if (currentDeptType === 'delivery') {
        const headerTitle = document.getElementById('deptHeaderTitle');
        if (headerTitle) headerTitle.textContent = 'Delivery Dept';
        const sidebarSubtitle = document.getElementById('deptSidebarSubtitle');
        if (sidebarSubtitle) sidebarSubtitle.textContent = 'Delivery Team';

        const navGroup = document.getElementById('navGroupDelivery');
        if (navGroup) navGroup.classList.remove('hidden');
        if (document.getElementById('deliveryDeptContent')) {
            document.getElementById('deliveryDeptContent').classList.remove('hidden');
        }

        switchDeliveryTab('onway');
    }

    loadDeptOrders();
}

/**
 * Toggle department sidebar (mobile)
 */
function toggleDeptSidebar() {
    const sidebar = document.getElementById('deptSidebar');
    if (sidebar) sidebar.classList.toggle('-translate-x-full');
}

/**
 * Set active department tab
 */
function setActiveDeptTab(tabId) {
    // Selection for both original tabs (if still present) and new sidebar items
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-indigo-100');
        btn.classList.add('text-slate-600', 'hover:bg-indigo-50');
    });

    const activeBtn = document.getElementById(tabId);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-600', 'hover:bg-indigo-50');
        activeBtn.classList.add('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-100');
    }

    // Auto-close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
        const sidebar = document.getElementById('deptSidebar');
        if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.add('-translate-x-full');
        }
    }
}
