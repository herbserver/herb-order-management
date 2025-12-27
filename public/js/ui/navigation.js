/**
 * ============================================
 * UI NAVIGATION - Tab Switching & Sidebar
 * ============================================
 * All navigation and screen switching functions.
 * 
 * If tabs not switching → Check this file
 * If sidebar not working → Check toggle functions
 */

/**
 * Show Login Screen
 */
function showLoginScreen() {
    hideAllScreens();
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) loginScreen.classList.remove('hidden');
}

/**
 * Show Register Screen
 */
function showRegisterScreen() {
    hideAllScreens();
    const registerScreen = document.getElementById('registerScreen');
    if (registerScreen) registerScreen.classList.remove('hidden');
}

/**
 * Show Reset Password Screen
 */
function showResetScreen() {
    hideAllScreens();
    const resetScreen = document.getElementById('resetScreen');
    if (resetScreen) resetScreen.classList.remove('hidden');
}

/**
 * Show Employee Panel
 */
function showEmployeePanel() {
    hideAllScreens();
    const empPanel = document.getElementById('employeePanel');
    if (empPanel) {
        empPanel.classList.remove('hidden');

        // Update header with employee name
        const nameEl = document.getElementById('empName');
        const idEl = document.getElementById('empIdDisplay');
        if (nameEl && currentUser) nameEl.textContent = currentUser.name;
        if (idEl && currentUser) idEl.textContent = currentUser.empId;

        // Load default tab
        switchEmpTab('order');
    }
}

/**
 * Show Department Panel
 */
function showDepartmentPanel() {
    hideAllScreens();
    const deptPanel = document.getElementById('departmentPanel');
    if (deptPanel) {
        deptPanel.classList.remove('hidden');

        // Update header
        const nameEl = document.getElementById('deptNameDisplay');
        const typeEl = document.getElementById('deptTypeDisplay');
        if (nameEl && currentUser) nameEl.textContent = currentUser.name;
        if (typeEl) typeEl.textContent = currentDeptType.charAt(0).toUpperCase() + currentDeptType.slice(1);

        // Show/hide sections based on department type
        setupDepartmentSections();

        // Load orders
        loadDeptOrders();
    }
}

/**
 * Setup department sections based on type
 */
function setupDepartmentSections() {
    const verificationSection = document.getElementById('verificationSection');
    const dispatchSection = document.getElementById('dispatchSection');
    const deliverySection = document.getElementById('deliverySection');

    // Hide all first
    if (verificationSection) verificationSection.classList.add('hidden');
    if (dispatchSection) dispatchSection.classList.add('hidden');
    if (deliverySection) deliverySection.classList.add('hidden');

    // Show based on type
    if (currentDeptType === 'verification' && verificationSection) {
        verificationSection.classList.remove('hidden');
    } else if (currentDeptType === 'dispatch' && dispatchSection) {
        dispatchSection.classList.remove('hidden');
    } else if (currentDeptType === 'delivery' && deliverySection) {
        deliverySection.classList.remove('hidden');
    }
}

/**
 * Show Admin Panel
 */
function showAdminPanel() {
    hideAllScreens();
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.classList.remove('hidden');
        loadAdminData();
        switchAdminTab('pending');
    }
}

/**
 * Hide all screens
 */
function hideAllScreens() {
    const screens = [
        'loginScreen',
        'registerScreen',
        'resetScreen',
        'employeePanel',
        'departmentPanel',
        'adminPanel'
    ];

    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

/**
 * Switch login tab (Employee/Department/Admin)
 * @param {string} tab - Tab name
 */
function switchLoginTab(tab) {
    // Update tab buttons
    ['employeeTab', 'departmentTab', 'adminTab'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.remove('tab-active', 'bg-emerald-600', 'text-white');
            btn.classList.add('bg-gray-100', 'text-gray-600');
        }
    });

    const activeBtn = document.getElementById(tab + 'Tab');
    if (activeBtn) {
        activeBtn.classList.add('tab-active', 'bg-emerald-600', 'text-white');
        activeBtn.classList.remove('bg-gray-100', 'text-gray-600');
    }

    // Show/hide forms
    ['employeeForm', 'departmentForm', 'adminForm'].forEach(id => {
        const form = document.getElementById(id);
        if (form) form.classList.add('hidden');
    });

    const activeForm = document.getElementById(tab + 'Form');
    if (activeForm) activeForm.classList.remove('hidden');
}

/**
 * Set department type (verification/dispatch/delivery)
 * @param {string} type - Department type
 */
function setDeptType(type) {
    currentDeptType = type;

    // Update radio buttons visual
    document.querySelectorAll('.dept-type-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-600', 'text-white', 'ring-2');
        btn.classList.add('bg-gray-100', 'text-gray-600');
    });

    const activeBtn = document.querySelector(`[data-dept="${type}"]`);
    if (activeBtn) {
        activeBtn.classList.add('bg-emerald-600', 'text-white', 'ring-2');
        activeBtn.classList.remove('bg-gray-100', 'text-gray-600');
    }
}

/**
 * Switch Employee Panel Tab
 * @param {string} tab - Tab name (order/orders/history/cancelled/progress)
 */
function switchEmpTab(tab) {
    // Update tab buttons
    ['orderTab', 'ordersTab', 'historyTab', 'cancelledTab', 'progressTab'].forEach(id => {
        const btn = document.getElementById('emp' + id.charAt(0).toUpperCase() + id.slice(1));
        if (btn) {
            btn.classList.remove('tab-active');
        }
    });

    const activeTab = document.getElementById('emp' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab');
    if (activeTab) activeTab.classList.add('tab-active');

    // Show/hide sections
    ['orderSection', 'ordersSection', 'historySection', 'cancelledSection', 'progressSection'].forEach(id => {
        const section = document.getElementById('emp' + id.charAt(0).toUpperCase() + id.slice(1));
        if (section) section.classList.add('hidden');
    });

    const activeSection = document.getElementById('emp' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Section');
    if (activeSection) activeSection.classList.remove('hidden');

    // Load data for tab
    if (tab === 'order') initOrderForm();
    else if (tab === 'orders') loadMyOrders();
    else if (tab === 'history') loadMyHistory();
    else if (tab === 'cancelled') loadMyCancelledOrders();
    else if (tab === 'progress') loadEmpProgress();
}

/**
 * Switch Admin Panel Tab
 * @param {string} tab - Tab name
 */
function switchAdminTab(tab) {
    // Update sidebar items
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active', 'bg-orange-100', 'text-orange-700');
    });

    const activeItem = document.querySelector(`[data-admin-tab="${tab}"]`);
    if (activeItem) {
        activeItem.classList.add('active', 'bg-orange-100', 'text-orange-700');
    }

    // Show/hide sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.add('hidden');
    });

    const activeSection = document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Section');
    if (activeSection) activeSection.classList.remove('hidden');

    // Load data
    if (tab === 'pending') loadAdminPending();
    else if (tab === 'verified') loadAdminVerified();
    else if (tab === 'dispatched') loadAdminDispatched();
    else if (tab === 'delivered') loadAdminDelivered();
    else if (tab === 'cancelled') loadAdminCancelled();
    else if (tab === 'onhold') loadAdminOnHold();
    else if (tab === 'employees') loadEmployees();
    else if (tab === 'departments') loadDepartments();
    else if (tab === 'analytics') loadAdminProgress();
}

/**
 * Toggle Admin Sidebar (mobile)
 */
function toggleAdminSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

/**
 * Toggle Department Sidebar (mobile)
 */
function toggleDeptSidebar() {
    const sidebar = document.getElementById('deptSidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

/**
 * Set active department tab
 * @param {string} tabId - Tab ID
 */
function setActiveDeptTab(tabId) {
    document.querySelectorAll('.dept-tab').forEach(tab => {
        tab.classList.remove('active', 'bg-emerald-100', 'text-emerald-700');
    });

    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add('active', 'bg-emerald-100', 'text-emerald-700');
    }
}

/**
 * Switch Verification Tab
 * @param {string} tab - Tab name
 */
function switchVerificationTab(tab) {
    setActiveDeptTab('verificationTab' + tab.charAt(0).toUpperCase() + tab.slice(1));

    // Hide all sections
    document.querySelectorAll('.verification-section').forEach(s => s.classList.add('hidden'));

    // Show active section
    const section = document.getElementById('verification' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Section');
    if (section) section.classList.remove('hidden');

    // Load data
    if (tab === 'unverified') loadVerificationUnverified();
    else if (tab === 'history') loadVerificationHistory();
    else if (tab === 'cancelled') loadVerificationCancelled();
}

/**
 * Switch Dispatch Tab
 * @param {string} tab - Tab name
 */
function switchDispatchTab(tab) {
    setActiveDeptTab('dispatchTab' + tab.charAt(0).toUpperCase() + tab.slice(1));

    // Hide all sections
    document.querySelectorAll('.dispatch-section').forEach(s => s.classList.add('hidden'));

    // Show active section
    const section = document.getElementById('dispatch' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Section');
    if (section) section.classList.remove('hidden');

    // Load data
    if (tab === 'ready') loadDeptOrders();
    else if (tab === 'history') loadDispatchHistory();
}

/**
 * Switch Delivery Tab
 * @param {string} tab - Tab name
 */
function switchDeliveryTab(tab) {
    setActiveDeptTab('deliveryTab' + tab.charAt(0).toUpperCase() + tab.slice(1));

    // Hide all sections
    document.querySelectorAll('.delivery-section').forEach(s => s.classList.add('hidden'));

    // Show active section
    const section = document.getElementById('delivery' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Section');
    if (section) section.classList.remove('hidden');

    // Load data
    if (tab === 'ofd') loadDeliveryOrders();
    else if (tab === 'delivered') loadDeliveredOrders();
    else if (tab === 'performance') loadDeliveryPerformance();
}
