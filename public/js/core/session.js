/**
 * ============================================
 * CORE SESSION - Login/Logout Management
 * ============================================
 * Handles user session, login state, and authentication.
 * 
 * If login issues → Check this file
 * If session not persisting → Check localStorage here
 */

// Session variables
let currentUser = null;
let currentUserType = null;
let currentDeptType = 'verification';

/**
 * Save current session to localStorage
 */
function saveSession() {
    localStorage.setItem('herbUser', JSON.stringify({
        user: currentUser,
        type: currentUserType,
        deptType: currentDeptType
    }));
}

/**
 * Load session from localStorage
 * @returns {boolean} True if session loaded successfully
 */
function loadSession() {
    try {
        const saved = localStorage.getItem('herbUser');
        if (saved) {
            const data = JSON.parse(saved);
            currentUser = data.user;
            currentUserType = data.type;
            currentDeptType = data.deptType || 'verification';
            return true;
        }
    } catch (e) {
        console.error('Session load error:', e);
    }
    return false;
}

/**
 * Clear session and logout
 */
function clearSession() {
    localStorage.removeItem('herbUser');
    currentUser = null;
    currentUserType = null;
}

/**
 * Logout and redirect to login
 */
function logout() {
    clearSession();
    showLoginScreen();
}

/**
 * Employee Login
 */
async function employeeLogin() {
    const empId = document.querySelector('input[name="empId"]').value.trim().toUpperCase();
    const password = document.querySelector('input[name="empPassword"]').value;

    if (!empId || !password) {
        showMessage('Please enter Employee ID and Password!', 'error', 'empMessage');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empId, password })
        });

        const data = await res.json();

        if (data.success) {
            currentUser = data.employee;
            currentUserType = 'employee';
            saveSession();
            showEmployeePanel();
        } else {
            showMessage(data.message || 'Login failed!', 'error', 'empMessage');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Server connection failed!', 'error', 'empMessage');
    }
}

/**
 * Department Login
 */
async function departmentLogin() {
    const deptId = document.querySelector('#deptIdInput').value.trim().toUpperCase();
    const password = document.querySelector('#deptPasswordInput').value;
    const deptType = currentDeptType;

    if (!deptId || !password) {
        showMessage('Please enter Department ID and Password!', 'error', 'deptMessage');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/departments/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deptId, password, type: deptType })
        });

        const data = await res.json();

        if (data.success) {
            currentUser = data.department;
            currentUserType = 'department';
            currentDeptType = deptType;
            saveSession();
            showDepartmentPanel();
        } else {
            showMessage(data.message || 'Login failed!', 'error', 'deptMessage');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Server connection failed!', 'error', 'deptMessage');
    }
}

/**
 * Admin Login
 */
function adminLogin() {
    const password = document.querySelector('input[name="adminPassword"]').value;

    if (password === ADMIN_PASS) {
        currentUser = { id: 'admin', name: 'Administrator' };
        currentUserType = 'admin';
        saveSession();
        showAdminPanel();
    } else {
        showMessage('Invalid Admin Password!', 'error', 'adminMessage');
    }
}

/**
 * Register new employee
 */
async function registerEmployee() {
    const name = document.querySelector('input[name="regName"]').value.trim();
    const mobile = document.querySelector('input[name="regMobile"]').value.trim();
    const password = document.querySelector('input[name="regPassword"]').value;
    const confirmPass = document.querySelector('input[name="regConfirmPassword"]').value;

    if (!name || !mobile || !password) {
        showMessage('All fields are required!', 'error', 'regMessage');
        return;
    }

    if (password !== confirmPass) {
        showMessage('Passwords do not match!', 'error', 'regMessage');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mobile, password })
        });

        const data = await res.json();

        if (data.success) {
            showMessage(`Registration successful! Your ID: ${data.empId}`, 'success', 'regMessage');
            setTimeout(() => showLoginScreen(), 2000);
        } else {
            showMessage(data.message || 'Registration failed!', 'error', 'regMessage');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Server connection failed!', 'error', 'regMessage');
    }
}

/**
 * Reset Password
 */
async function resetPassword() {
    const empId = document.querySelector('input[name="resetEmpId"]').value.trim().toUpperCase();
    const mobile = document.querySelector('input[name="resetMobile"]').value.trim();
    const newPassword = document.querySelector('input[name="newPassword"]').value;

    if (!empId || !mobile || !newPassword) {
        showMessage('All fields are required!', 'error', 'resetMessage');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empId, mobile, newPassword })
        });

        const data = await res.json();

        if (data.success) {
            showMessage('Password reset successful!', 'success', 'resetMessage');
            setTimeout(() => showLoginScreen(), 2000);
        } else {
            showMessage(data.message || 'Reset failed!', 'error', 'resetMessage');
        }
    } catch (error) {
        console.error('Reset error:', error);
        showMessage('Server connection failed!', 'error', 'resetMessage');
    }
}
