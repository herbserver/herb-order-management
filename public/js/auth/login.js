/**
 * Authentication Module - Login Functions
 * Handles employee, department, and admin login
 */

/**
 * Employee Login
 */
async function employeeLogin() {
    const id = document.getElementById('empLoginId').value.trim();
    const pass = document.getElementById('empLoginPass').value;
    if (!id || !pass) return showMessage('ID aur Password dono enter karein!', 'error', 'loginMessage');

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: id, password: pass })
        });
        const data = await res.json();

        if (data.success) {
            currentUser = data.employee;
            currentUserType = 'employee';
            saveSession();
            showSuccessPopup(
                'Login Successful! 🎉',
                `Welcome, ${data.employee.name}!`,
                '👋',
                '#3b82f6'
            );
            setTimeout(() => window.location.href = '/employee', 1500);
        } else {
            showMessage(data.message, 'error', 'loginMessage');
        }
    } catch (e) {
        showMessage('Server se connect nahi ho paya!', 'error', 'loginMessage');
    }
}

/**
 * Department Login
 */
async function departmentLogin() {
    const id = document.getElementById('deptLoginId').value.trim();
    const pass = document.getElementById('deptLoginPass').value;
    if (!id || !pass) return showMessage('ID aur Password dono enter karein!', 'error', 'loginMessage');

    try {
        const res = await fetch(`${API_URL}/departments/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deptId: id, password: pass, deptType: currentDeptType })
        });
        const data = await res.json();

        if (data.success) {
            currentUser = data.department;
            currentUserType = 'department';
            currentDeptType = data.department.type;
            saveSession();
            window.location.href = currentDeptType === 'dispatch'
                ? '/dispatch'
                : currentDeptType === 'delivery'
                    ? '/delivery'
                    : '/verification';
        } else {
            showMessage(data.message, 'error', 'loginMessage');
        }
    } catch (e) {
        showMessage('Server se connect nahi ho paya!', 'error', 'loginMessage');
    }
}

/**
 * Admin Login
 */
async function adminLogin() {
    const pass = document.getElementById('adminLoginPass').value;
    if (!pass) return showMessage('Password daalo!', 'error', 'loginMessage');

    const btn = document.querySelector('button[onclick="adminLogin()"]');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Authenticating...';
    }

    try {
        const res = await fetch(`${API_URL}/config/admin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pass })
        });
        const data = await res.json();

        if (data.success) {
            currentUser = { id: 'ADMIN', name: 'Administrator' };
            currentUserType = 'admin';
            saveSession();
            window.location.href = '/admin';
        } else {
            showMessage(data.message || 'Galat Admin Password!', 'error', 'loginMessage');
        }
    } catch (e) {
        showMessage('Server se connect nahi ho paya!', 'error', 'loginMessage');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Authenticate';
        }
    }
}

/**
 * Employee Registration
 */
async function registerEmployee() {
    const name = document.getElementById('regName').value.trim();
    const id = document.getElementById('regId').value.trim();
    const pass = document.getElementById('regPass').value;
    const confirmPass = document.getElementById('regConfirmPass').value;

    if (!name || !id || !pass) return showMessage('Sabhi fields bharein!', 'error', 'registerMessage');
    if (pass !== confirmPass) return showMessage('Password match nahi kar rahe!', 'error', 'registerMessage');

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: toTitleCase(name), employeeId: id, password: pass })
        });
        const data = await res.json();

        if (data.success) {
            currentUser = data.employee;
            currentUserType = 'employee';
            saveSession();
            window.location.href = '/employee';
        } else {
            showMessage(data.message, 'error', 'registerMessage');
        }
    } catch (e) {
        showMessage('Server se connect nahi ho paya!', 'error', 'registerMessage');
    }
}

/**
 * Password Reset
 */
async function resetPassword() {
    const id = document.getElementById('resetId').value.trim();
    const newPass = document.getElementById('resetNewPass').value;
    const confirmPass = document.getElementById('resetConfirmPass').value;

    if (!id || !newPass) return showMessage('Sabhi fields bharein!', 'error', 'resetMessage');
    if (newPass !== confirmPass) return showMessage('Password match nahi kar rahe!', 'error', 'resetMessage');

    try {
        const res = await fetch(`${API_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: id, newPassword: newPass })
        });
        const data = await res.json();

        if (data.success) {
            showSuccessPopup(
                'Password Reset! 🔑',
                'Password successfully reset ho gaya!\n\nAb login kar sakte ho.',
                '🔑',
                '#10b981'
            );
            setTimeout(showLoginScreen, 2000);
        } else {
            showMessage(data.message, 'error', 'resetMessage');
        }
    } catch (e) {
        showMessage('Server se connect nahi ho paya!', 'error', 'resetMessage');
    }
}
