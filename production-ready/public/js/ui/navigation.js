/**
 * Navigation Module
 * Handles screen transitions and tab switching
 */

/**
 * Show login screen
 */
function showLoginScreen() {
    document.querySelectorAll('#app> div').forEach(d => d.classList.add('hidden'));
    document.getElementById('loginScreen').classList.remove('hidden');
}

/**
 * Show registration screen
 */
function showRegisterScreen() {
    document.querySelectorAll('#app> div').forEach(d => d.classList.add('hidden'));
    document.getElementById('registerScreen').classList.remove('hidden');
}

/**
 * Show password reset screen
 */
function showResetScreen() {
    document.querySelectorAll('#app> div').forEach(d => d.classList.add('hidden'));
    document.getElementById('resetScreen').classList.remove('hidden');
}

/**
 * Switch between login tabs (Employee/Department/Admin)
 * @param {string} tab - Tab to switch to: 'employee', 'department', or 'admin'
 */
function switchLoginTab(tab) {
    document.getElementById('employeeLoginForm').classList.add('hidden');
    document.getElementById('departmentLoginForm').classList.add('hidden');
    document.getElementById('adminLoginForm').classList.add('hidden');

    document.getElementById('loginTabEmployee').classList.remove('tab-active');
    document.getElementById('loginTabDept').classList.remove('tab-active');
    document.getElementById('loginTabAdmin').classList.remove('tab-active');

    // Set all to inactive style
    document.getElementById('loginTabEmployee').classList.add('text-gray-500');
    document.getElementById('loginTabDept').classList.add('text-gray-500');
    document.getElementById('loginTabAdmin').classList.add('text-gray-500');

    if (tab === 'employee') {
        document.getElementById('employeeLoginForm').classList.remove('hidden');
        document.getElementById('loginTabEmployee').classList.add('tab-active');
        document.getElementById('loginTabEmployee').classList.remove('text-gray-500');
    } else if (tab === 'department') {
        document.getElementById('departmentLoginForm').classList.remove('hidden');
        document.getElementById('loginTabDept').classList.add('tab-active');
        document.getElementById('loginTabDept').classList.remove('text-gray-500');
    } else {
        document.getElementById('adminLoginForm').classList.remove('hidden');
        document.getElementById('loginTabAdmin').classList.add('tab-active');
        document.getElementById('loginTabAdmin').classList.remove('text-gray-500');
    }
}

/**
 * Set department type for login
 * @param {string} type - 'verification', 'dispatch', or 'delivery'
 */
function setDeptType(type) {
    currentDeptType = type;

    // Reset all buttons
    document.getElementById('deptTypeVerify').classList.remove('bg-white', 'text-blue-600', 'shadow-sm', 'border', 'border-blue-100');
    document.getElementById('deptTypeVerify').classList.add('text-gray-500');
    document.getElementById('deptTypeDispatch').classList.remove('bg-white', 'text-purple-600', 'shadow-sm', 'border', 'border-purple-100');
    document.getElementById('deptTypeDispatch').classList.add('text-gray-500');
    if (document.getElementById('deptTypeDelivery')) {
        document.getElementById('deptTypeDelivery').classList.remove('bg-white', 'text-orange-600', 'shadow-sm', 'border', 'border-orange-100');
        document.getElementById('deptTypeDelivery').classList.add('text-gray-500');
    }

    // Activate selected button
    if (type === 'verification') {
        document.getElementById('deptTypeVerify').classList.add('bg-white', 'text-blue-600', 'shadow-sm', 'border', 'border-blue-100');
        document.getElementById('deptTypeVerify').classList.remove('text-gray-500');
    } else if (type === 'dispatch') {
        document.getElementById('deptTypeDispatch').classList.add('bg-white', 'text-purple-600', 'shadow-sm', 'border', 'border-purple-100');
        document.getElementById('deptTypeDispatch').classList.remove('text-gray-500');
    } else if (type === 'delivery') {
        if (document.getElementById('deptTypeDelivery')) {
            document.getElementById('deptTypeDelivery').classList.add('bg-white', 'text-orange-600', 'shadow-sm', 'border', 'border-orange-100');
            document.getElementById('deptTypeDelivery').classList.remove('text-gray-500');
        }
    }
}
