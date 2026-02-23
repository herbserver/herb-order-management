/**
 * Session Management Module
 * Handles user session storage, retrieval, and clearing
 */

// Session variables - using var to allow redeclaration across scripts
var currentUser = currentUser || null;
var currentUserType = currentUserType || null;
var currentDeptType = currentDeptType || 'verification';
var currentEditingOrderId = currentEditingOrderId || null; // Track order being edited
var currentDispatchOrder = currentDispatchOrder || null; // Track order being dispatched

/**
 * Save current session to localStorage
 */
function saveSession() {
    const session = {
        user: currentUser,
        type: currentUserType,
        deptType: currentDeptType
    };
    localStorage.setItem('herb_session', JSON.stringify(session));
}

/**
 * Load session from localStorage
 * @returns {boolean} True if session loaded successfully
 */
function loadSession() {
    try {
        const session = JSON.parse(localStorage.getItem('herb_session'));

        if (session && session.user) {
            currentUser = session.user;
            currentUserType = session.type;
            currentDeptType = session.deptType || 'verification';
            return true;
        }
    } catch (e) {
        console.error('Session load error:', e);
    }

    return false;
}

/**
 * Clear session data
 */
function clearSession() {
    localStorage.removeItem('herb_session');
    currentUser = null;
    currentUserType = null;
}

/**
 * Logout user and return to login screen
 */
function logout() {
    clearSession();
    showLoginScreen();
}
