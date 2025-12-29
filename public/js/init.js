/**
 * Application Initialization
 * This file bootstraps the application and checks for existing session
 */

// On page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('🌿 Herb On Naturals - System Initializing...');

    // Check if user has existing session
    if (loadSession()) {
        console.log('✅ Session found for:', currentUser);

        // Route to appropriate panel based on user type
        if (currentUserType === 'employee') {
            showEmployeePanel();
        } else if (currentUserType === 'department') {
            showDepartmentPanel();
        } else if (currentUserType === 'admin') {
            showAdminPanel();
        } else {
            showLoginScreen();
        }
    } else {
        console.log('❌ No session found - showing login');
        showLoginScreen();
    }

    console.log('✅ System Ready!');
});

// Global error handler
window.addEventListener('error', function (e) {
    console.error('⚠️ Global Error:', e.message, e.filename, e.lineno);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function (e) {
    console.error('⚠️ Unhandled Promise Rejection:', e.reason);
});
