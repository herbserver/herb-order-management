// API Configuration
// If API_URL is defined in HTML, use it, else default
var API_URL = typeof API_URL !== 'undefined' ? API_URL : (window.location.origin + '/api');

// Emoji constants for WhatsApp compatibility
const E = {
    leaf: String.fromCodePoint(0x1F33F),
    pray: String.fromCodePoint(0x1F64F),
    check: String.fromCodePoint(0x2705),
    box: String.fromCodePoint(0x1F4E6),
    phone: String.fromCodePoint(0x1F4DE),
    warn: String.fromCodePoint(0x26A0),
    no: String.fromCodePoint(0x1F6AB),
    heart: String.fromCodePoint(0x1F49A),
    globe: String.fromCodePoint(0x1F310),
    money: String.fromCodePoint(0x1F4B0),
    lock: String.fromCodePoint(0x1F510),
    truck: String.fromCodePoint(0x1F69A),
    pin: String.fromCodePoint(0x1F4CD),
    link: String.fromCodePoint(0x1F517),
    list: String.fromCodePoint(0x1F4CB),
    mobile: String.fromCodePoint(0x1F4F1),
    cash: String.fromCodePoint(0x1F4B5),
    eyes: String.fromCodePoint(0x1F440),
    bag: String.fromCodePoint(0x1F6CD),
    run: String.fromCodePoint(0x1F3C3),
    home: String.fromCodePoint(0x1F3E0),
    party: String.fromCodePoint(0x1F389),
    star: String.fromCodePoint(0x2B50),
    cart: String.fromCodePoint(0x1F6D2),
    arr: String.fromCodePoint(0x25B8)
};

// Fallback WhatsApp Templates - Hinglish Version (Consistent across all files)
if (typeof whatsappTemplates === 'undefined') {
    var whatsappTemplates = {
        booked: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

✅ Aapka order confirm ho gaya hai!

📦 *ORDER DETAILS*
▸ Order No: *${order.orderId}*
▸ Total Amount: *Rs. ${order.total || 0}*
▸ Advance Paid: Rs. ${order.advance || 0}
▸ COD Amount: *Rs. ${order.codAmount || order.cod || 0}*

📞 Hamari team jaldi hi aapko call karegi address verify karne ke liye.

⚠️ *IMPORTANT*
🚫 Product milne se pehle OTP share NA karein!

_Team Herb On Naturals_ 💚
🌐 herbonnaturals.in`,

        verified: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

✅ Aapka order *VERIFY* ho gaya hai!

📦 *ORDER: ${order.orderId}*

💰 *PAYMENT INFO*
▸ Total: Rs. ${order.total || 0}
▸ Paid: Rs. ${order.advance || 0}
▸ COD: *Rs. ${order.codAmount || order.cod || 0}*

📦 Order packing ho raha hai. Tracking details jaldi milenge!

🔐 *YAAD RAKHEIN*
🚫 Product check kiye bina OTP share NA karein!

_Team Herb On Naturals_ 💚`,

        dispatched: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

🚚 Aapka order *DISPATCH* ho gaya hai!

📦 *ORDER: ${order.orderId}*

📍 *TRACKING INFO*
▸ AWB No: *${order.shiprocket?.awb || order.tracking?.trackingId || 'Processing'}*
▸ Courier: *${order.shiprocket?.courierName || order.tracking?.courier || 'Processing'}*

💰 *PAYMENT*
▸ Total: Rs. ${order.total || 0}
▸ COD: *Rs. ${order.codAmount || order.cod || 0}*

🔗 Track karein: shiprocket.co/tracking

📋 *ZARURI BAATEIN*
📱 Phone ON rakhein
💵 COD amount ready rakhein
👀 Pehle product check karein
🔐 Phir OTP dein

_Happy Shopping!_ 🛍️
_Team Herb On Naturals_ 💚`,

        out_for_delivery: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

🏃 *AJ DELIVERY HOGI!*

📦 Order: *${order.orderId}*
💵 COD: *Rs. ${order.codAmount || order.cod || 0}*

🏠 Aaj aapka parcel aane wala hai, please available rahein.

⚠️ *YAAD RAKHEIN*
👀 Pehle product check karein, phir OTP dein!

_Team Herb On Naturals_ 💚`,

        delivered: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

🎉 *ORDER DELIVER HO GAYA!*

📦 Order: ${order.orderId}

🙏 Hamare saath shopping karne ke liye dhanyavaad!

⭐ Hume umeed hai ki aapko products pasand aayenge. Apna feedback zarur share karein - yeh hamare liye bahut important hai!

🛒 Dobara shopping karein: herbonnaturals.in

_Warm regards,_ 💚
_Team Herb On Naturals_`
    };
}

console.log('Connecting to API at:', API_URL);
const ADMIN_PASS = 'admin123';

// Session variables
let currentUser = null;
let currentUserType = null;
let currentDeptType = 'verification';
let currentEditingOrderId = null; // Track order being edited
let currentDispatchOrder = null; // Track order being dispatched

// Courier tracking URLs
const COURIER_URLS = {
    'India Post': 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx',
    'DTDC': 'https://www.dtdc.in/tracking.asp',
    'Blue Dart': 'https://www.bluedart.com/tracking',
    'Delhivery': 'https://www.delhivery.com/track/package/',
    'Ekart': 'https://ekartlogistics.com/track/',
    'Xpressbees': 'https://www.xpressbees.com/track',
    'Ecom Express': 'https://ecomexpress.in/tracking/',
    'Shadowfax': 'https://tracker.shadowfax.in/',
    'Amazon': 'https://www.amazon.in/gp/your-account/order-history',
    'Professional': 'https://www.tpcindia.com/track.aspx'
};

// ==================== SESSION MANAGEMENT ====================
const WHATSAPP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width:1.2em; height:1.2em;"><path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.1 0-65.6-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.1-3.2-5.4-.3-8.3 2.4-11.1 2.4-2.5 5.5-6.4 8.3-9.6 2.8-3.2 3.7-5.5 5.5-9.1 1.9-3.7 1-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>`;

function saveSession() {
    const session = {
        user: currentUser,
        type: currentUserType,
        deptType: currentDeptType
    };
    localStorage.setItem('herb_session', JSON.stringify(session));
}

function loadSession() {
    try {
        const session = JSON.parse(localStorage.getItem('herb_session'));

        if (session && session.user) {
            currentUser = session.user;
            currentUserType = session.type;
            currentDeptType = session.deptType || 'verification';
            return true;
        }
    }

    catch (e) { }

    return false;
}

function clearSession() {
    localStorage.removeItem('herb_session');
    currentUser = null;
    currentUserType = null;
}

// ==================== UI HELPERS ====================
function showMessage(msg, type, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Fixed Top positioning for common message containers
    if (elementId === 'adminMessage' || elementId === 'loginMessage' || elementId === 'registerMessage' || elementId === 'resetMessage') {
        el.className = `fixed top-10 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90%] p-5 rounded-2xl text-sm shadow-2xl transition-all duration-300 transform font-bold flex items-center gap-3 border-l-8 ${type === 'success' ? 'bg-white text-emerald-700 border-emerald-500' :
            type === 'error' ? 'bg-white text-red-700 border-red-500' :
                'bg-white text-blue-700 border-blue-500'
            }`;
        el.style.opacity = '1';
        el.style.transform = 'translate(-50%, 0)';
        el.innerHTML = `<span class="text-xl">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> <div>${msg}</div>`;
    } else {
        // Fallback for contextual messages
        el.className = `mb-4 p-3 rounded-xl text-sm ${type === 'success' ? 'bg-green-100 text-green-700' :
            type === 'error' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
            }`;
        el.textContent = msg;
    }

    el.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        el.classList.add('hidden');
    }, 5000);
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function copyTracking(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => alert('Copied: ' + text))
            .catch(err => console.error('Copy failed', err));
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            alert('Copied: ' + text);
        } catch (err) {
            prompt("Copy manually:", text);
        }
        document.body.removeChild(textArea);
    }
}

// ==================== LOGIN TAB SWITCHING ====================
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
    }

    else if (tab === 'department') {
        document.getElementById('departmentLoginForm').classList.remove('hidden');
        document.getElementById('loginTabDept').classList.add('tab-active');
        document.getElementById('loginTabDept').classList.remove('text-gray-500');
    }

    else {
        document.getElementById('adminLoginForm').classList.remove('hidden');
        document.getElementById('loginTabAdmin').classList.add('tab-active');
        document.getElementById('loginTabAdmin').classList.remove('text-gray-500');
    }
}
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

// ==================== SCREEN MANAGEMENT ====================
function showLoginScreen() {
    document.querySelectorAll('#app> div').forEach(d => d.classList.add('hidden'));
    document.getElementById('loginScreen').classList.remove('hidden');
}

function showRegisterScreen() {
    document.querySelectorAll('#app> div').forEach(d => d.classList.add('hidden'));
    document.getElementById('registerScreen').classList.remove('hidden');
}

function showResetScreen() {
    document.querySelectorAll('#app> div').forEach(d => d.classList.add('hidden'));
    document.getElementById('resetScreen').classList.remove('hidden');
}

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

        switchDeliveryTab('outfordelivery');
    }

    loadDeptOrders();
}

function toggleDeptSidebar() {
    const sidebar = document.getElementById('deptSidebar');
    if (sidebar) sidebar.classList.toggle('-translate-x-full');
}

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


// Load Admin Panel Data - COMPLETE VERSION
async function loadAdminData() {
    try {
        console.log('📊 Loading admin panel data...');

        // Fetch all data in parallel
        const [employeesRes, ordersRes] = await Promise.all([
            fetch(`${API_URL}/employees`),
            fetch(`${API_URL}/orders`)
        ]);

        const employeesData = await employeesRes.json();
        const ordersData = await ordersRes.json();

        if (!employeesData.success || !ordersData.success) {
            console.error('❌ Failed to load admin data');
            return;
        }

        const employees = employeesData.employees || [];
        const orders = ordersData.orders || [];

        console.log(`✅ Loaded ${employees.length} employees, ${orders.length} orders`);

        // Calculate statistics
        const stats = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
            avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length : 0,
            pendingOrders: orders.filter(o => o.status === 'Pending').length,
            verifiedOrders: orders.filter(o => o.status === 'Address Verified').length,
            dispatchedOrders: orders.filter(o => o.status === 'Dispatched').length,
            deliveredOrders: orders.filter(o => o.status === 'Delivered').length,
            totalEmployees: employees.length
        };

        console.log('📈 Stats calculated:', stats);

        // Update UI elements if they exist
        // Try common element IDs/classes that might show stats
        const updateElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                console.log(`✅ Updated ${id}: ${value}`);
            }
        };

        const updateElementByQuery = (selector, value) => {
            const el = document.querySelector(selector);
            if (el) {
                el.textContent = value;
                console.log(`✅ Updated ${selector}: ${value}`);
            }
        };

        // Try to update various possible stat elements
        updateElement('totalOrders', stats.totalOrders);
        updateElement('totalRevenue', `₹${stats.totalRevenue}`);
        updateElement('avgOrderValue', `₹${Math.round(stats.avgOrderValue)}`);
        updateElement('pendingCount', stats.pendingOrders);
        updateElement('verifiedCount', stats.verifiedOrders);
        updateElement('dispatchedCount', stats.dispatchedOrders);
        updateElement('deliveredCount', stats.deliveredOrders);
        updateElement('totalEmployees', stats.totalEmployees);

        // Also log to console for manual checking
        console.log('📊 Admin Panel Stats:');
        console.log(`  Total Orders: ${stats.totalOrders}`);
        console.log(`  Total Revenue: ₹${stats.totalRevenue}`);
        console.log(`  Avg Order Value: ₹${Math.round(stats.avgOrderValue)}`);
        console.log(`  Pending: ${stats.pendingOrders} | Verified: ${stats.verifiedOrders}`);
        console.log(`  Dispatched: ${stats.dispatchedOrders} | Delivered: ${stats.deliveredOrders}`);
        console.log(`  Total Employees: ${stats.totalEmployees}`);

    } catch (error) {
        console.error('❌ Error loading admin data:', error);
    }
}

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

// ==================== AUTH FUNCTIONS ====================
async function employeeLogin() {
    const id = document.getElementById('empLoginId').value.trim();
    const pass = document.getElementById('empLoginPass').value;
    if (!id || !pass) return showMessage('ID aur Password dono enter karein!', 'error', 'loginMessage');

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }

            ,
            body: JSON.stringify({
                employeeId: id, password: pass
            })
        });
        const data = await res.json();

        if (data.success) {
            currentUser = data.employee;
            currentUserType = 'employee';
            saveSession();
            showSuccessPopup(
                'Login Successful! 🎉',
                `Welcome ${data.employee.name}!\n\nAap Employee Panel mein aa gaye hain.`,
                '👋',
                '#3b82f6'
            );
            setTimeout(() => showEmployeePanel(), 1500);
        }

        else {
            showMessage(data.message, 'error', 'loginMessage');
        }
    }

    catch (e) {
        showMessage('Server se connect nahi ho paya!', 'error', 'loginMessage');
    }
}

async function departmentLogin() {
    const id = document.getElementById('deptLoginId').value.trim();
    const pass = document.getElementById('deptLoginPass').value;
    if (!id || !pass) return showMessage('ID aur Password dono enter karein!', 'error', 'loginMessage');

    try {
        const res = await fetch(`${API_URL}/departments/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }

            ,
            body: JSON.stringify({
                deptId: id, password: pass, deptType: currentDeptType
            })
        });
        const data = await res.json();

        if (data.success) {
            currentUser = data.department;
            currentUserType = 'department';
            currentDeptType = data.department.type;
            saveSession();
            showDepartmentPanel();
        }

        else {
            showMessage(data.message, 'error', 'loginMessage');
        }
    }

    catch (e) {
        showMessage('Server se connect nahi ho paya!', 'error', 'loginMessage');
    }
}

function adminLogin() {
    const pass = document.getElementById('adminLoginPass').value;

    if (pass === ADMIN_PASS) {
        currentUser = {
            id: 'ADMIN', name: 'Administrator'
        }

            ;
        currentUserType = 'admin';
        saveSession();
        showAdminPanel();
    }

    else {
        showMessage('Galat Admin Password!', 'error', 'loginMessage');
    }
}

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
            headers: {
                'Content-Type': 'application/json'
            }

            ,
            body: JSON.stringify({
                name: toTitleCase(name), employeeId: id, password: pass
            })
        });
        const data = await res.json();

        if (data.success) {
            currentUser = data.employee;
            currentUserType = 'employee';
            saveSession();
            showEmployeePanel();
        }

        else {
            showMessage(data.message, 'error', 'registerMessage');
        }
    }

    catch (e) {
        showMessage('Server se connect nahi ho paya!', 'error', 'registerMessage');
    }
}

async function resetPassword() {
    const id = document.getElementById('resetId').value.trim();
    const newPass = document.getElementById('resetNewPass').value;
    const confirmPass = document.getElementById('resetConfirmPass').value;

    if (!id || !newPass) return showMessage('Sabhi fields bharein!', 'error', 'resetMessage');
    if (newPass !== confirmPass) return showMessage('Password match nahi kar rahe!', 'error', 'resetMessage');

    try {
        const res = await fetch(`${API_URL}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }

            ,
            body: JSON.stringify({
                employeeId: id, newPassword: newPass
            })
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
        }

        else {
            showMessage(data.message, 'error', 'resetMessage');
        }
    }

    catch (e) {
        showMessage('Server se connect nahi ho paya!', 'error', 'resetMessage');
    }
}

function logout() {
    clearSession();
    showLoginScreen();
}

// ==================== EMPLOYEE PANEL ====================
function switchEmpTab(tab) {
    document.getElementById('empOrderTab').classList.add('hidden');
    document.getElementById('empTrackingTab').classList.add('hidden');
    document.getElementById('empHistoryTab').classList.add('hidden');
    document.getElementById('empProgressTab').classList.add('hidden');
    document.getElementById('empCancelledTab').classList.add('hidden');

    document.querySelectorAll('[id^="empTab"]').forEach(b => {
        b.classList.remove('tab-active');
        b.classList.add('bg-white', 'text-gray-600');
    });

    if (tab === 'order') {
        document.getElementById('empOrderTab').classList.remove('hidden');
        document.getElementById('empTabOrder').classList.add('tab-active');
        initOrderForm();
    }

    else if (tab === 'tracking') {
        document.getElementById('empTrackingTab').classList.remove('hidden');
        document.getElementById('empTabTracking').classList.add('tab-active');
        loadMyOrders();
    }

    else if (tab === 'history') {
        document.getElementById('empHistoryTab').classList.remove('hidden');
        document.getElementById('empTabHistory').classList.add('tab-active');
        loadMyHistory();
    }

    else if (tab === 'progress') {
        document.getElementById('empProgressTab').classList.remove('hidden');
        document.getElementById('empTabProgress').classList.add('tab-active');
        loadEmpProgress();
    }

    else if (tab === 'cancelled') {
        document.getElementById('empCancelledTab').classList.remove('hidden');
        document.getElementById('empTabCancelled').classList.add('tab-active');
        loadMyCancelledOrders();
    }
}

function initOrderForm() {
    document.getElementById('itemsContainer').innerHTML = '';
    addItem();

    const addressFields = ['hNo',
        'blockGaliNo',
        'villColony',
        'po',
        'tahTaluka',
        'distt',
        'state',
        'pin',
        'landMark'];

    addressFields.forEach(field => {
        const input = document.querySelector(`[name="${field}"]`);
        if (input) input.addEventListener('input', updateAddress);
    });

    // Set today's date and current time
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    // Auto-fill date (YYYY-MM-DD format for input type="date")
    const dateInput = document.querySelector('[name="date"]');
    if (dateInput) {
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    // Auto-fill time (HH:MM format for input type="time")
    const timeInput = document.querySelector('[name="time"]');
    if (timeInput) {
        timeInput.value = `${hh}:${min}`;
    }
}

function updateAddress() {
    const form = document.getElementById('orderForm');

    let hNo = form.hNo.value.trim();
    let village = form.villColony.value.trim();

    // Format house number
    if (hNo && !isNaN(hNo)) {
        hNo = 'H.No ' + hNo;
    }

    // Combine House No + Village together
    let houseVillage = '';
    if (hNo && village) {
        houseVillage = `${hNo}, Village ${toTitleCase(village)}`;
    } else if (hNo) {
        houseVillage = hNo;
    } else if (village) {
        houseVillage = `Village ${toTitleCase(village)}`;
    }

    const parts = [
        houseVillage,
        form.blockGaliNo.value.trim() ? toTitleCase(form.blockGaliNo.value.trim()) : "",
        form.landMark.value.trim() ? "Landmark: " + toTitleCase(form.landMark.value.trim()) : "",
        form.po.value.trim() ? "PO: " + toTitleCase(form.po.value.trim()) : "",
        toTitleCase(form.tahTaluka.value.trim()),
        toTitleCase(form.distt.value.trim()),
        toTitleCase(form.state.value.trim()),
        form.pin.value.trim() ? "PIN: " + form.pin.value.trim() : ""
    ].filter(v => v);

    form.address.value = parts.join(', ');
}





// ==================== DISTRICT AUTOCOMPLETE (Auto-Select) ====================
let districtTimeout;
async function handleDistrictInput(query) {
    const suggestionsBox = document.getElementById('districtSuggestions');
    clearTimeout(districtTimeout);

    if (query.length < 2) {
        suggestionsBox.classList.add('hidden');
        return;
    }

    districtTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`${API_URL}/locations/search-district?q=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (data.success && data.districts.length > 0) {
                // Extract unique districts
                const seenDistricts = new Map();
                data.districts.forEach(item => {
                    if (!seenDistricts.has(item.district)) {
                        seenDistricts.set(item.district, item.state);
                    }
                });

                // Check for exact match
                const queryLower = query.toLowerCase();
                let exactMatch = null;
                seenDistricts.forEach((state, district) => {
                    if (district.toLowerCase() === queryLower) {
                        exactMatch = { district, state };
                    }
                });

                // If exact match OR only one result, auto-select
                if (exactMatch || seenDistricts.size === 1) {
                    const selected = exactMatch || {
                        district: Array.from(seenDistricts.keys())[0],
                        state: Array.from(seenDistricts.values())[0]
                    };
                    suggestionsBox.classList.add('hidden');
                    selectDistrictAndLoadPOs(selected.district, selected.state);
                    return;
                }

                // Otherwise show dropdown
                let html = '';
                seenDistricts.forEach((state, district) => {
                    html += `
                            <li class="px-4 py-2 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-none text-sm"
                                onclick="selectDistrictAndLoadPOs('${district.replace(/'/g, "\\'")}', '${state.replace(/'/g, "\\'")}')">
                                <div class="font-semibold text-gray-800">${district}</div>
                                <div class="text-xs text-gray-500">📍 ${state}</div>
                            </li>`;
                });

                suggestionsBox.innerHTML = html;
                suggestionsBox.classList.remove('hidden');
            } else {
                suggestionsBox.innerHTML = '<li class="px-4 py-2 text-red-400 text-sm">No districts found</li>';
            }
        } catch (e) {
            console.error('District autocomplete error:', e);
            suggestionsBox.classList.add('hidden');
        }
    }, 300);
}

async function selectDistrictAndLoadPOs(district, state) {
    const form = document.getElementById('orderForm');

    // Step 1: Fill District and State
    form.distt.value = district;
    form.state.value = state;
    document.getElementById('districtSuggestions').classList.add('hidden');
    updateAddress();

    // Step 2: Load Post Offices for this district
    const poSuggestions = document.getElementById('poSuggestions');
    poSuggestions.innerHTML = '<li class="px-4 py-2 text-gray-500 text-sm">⏳ Loading Post Offices...</li>';
    poSuggestions.classList.remove('hidden');

    try {
        const res = await fetch(`${API_URL}/locations/district/${encodeURIComponent(district)}`);
        const data = await res.json();

        if (data.success && data.offices && data.offices.length > 0) {
            // Sort alphabetically
            const sorted = data.offices.sort((a, b) => a.Name.localeCompare(b.Name));

            // Create search box + list with sticky header
            let html = `<div class="sticky top-0 bg-white border-b border-gray-200 p-2 z-10">
                        <input type="text" 
                            placeholder="🔍 Search Post Office..." 
                            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                            oninput="filterPOList(this.value)"
                            onclick="event.stopPropagation()">
                        <div class="text-xs text-gray-400 mt-1">${sorted.length} Post Offices</div>
                    </div>`;

            sorted.forEach(item => {
                const poName = item.Name || '';
                const pin = item.Pincode || '';
                const block = item.Block || '';
                html += `<li class="po-item px-4 py-2 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-none text-sm" 
                            data-name="${poName.toLowerCase()}"
                            onclick="selectPOFromList('${poName.replace(/'/g, "\\'")}', '${pin}', '${block.replace(/'/g, "\\'")}')">
${poName}</li>`;
            });
            poSuggestions.innerHTML = html;
        } else {
            poSuggestions.innerHTML = '<li class="px-4 py-2 text-gray-400 text-sm">No post offices found</li>';
        }
    } catch (e) {
        console.error('Post Office load error:', e);
        poSuggestions.innerHTML = '<li class="px-4 py-2 text-red-400 text-sm">Failed to load</li>';
    }
}

function filterPOList(query) {
    const items = document.querySelectorAll('.po-item');
    const lowerQuery = query.toLowerCase();

    items.forEach(item => {
        const name = item.getAttribute('data-name');
        if (name.includes(lowerQuery)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function selectPOFromList(office, pin, taluk) {
    const form = document.getElementById('orderForm');
    form.po.value = office;
    form.pin.value = pin;
    form.tahTaluka.value = taluk;
    document.getElementById('poSuggestions').classList.add('hidden');
    updateAddress();
}

function selectFullAddress(office, pin, taluk, district, state) {
    const form = document.getElementById('orderForm');
    form.po.value = office;
    form.pin.value = pin;
    form.tahTaluka.value = taluk;
    form.distt.value = district;
    form.state.value = state;
    document.getElementById('poSuggestions').classList.add('hidden');
    updateAddress();
}


function showPostOfficesByIndex(taluk) {
    const poList = document.getElementById('postOfficesList');

    // Filter offices by selected Taluk
    currentFilteredOffices = currentDistrictOffices.filter(o => o.Block === taluk || (taluk === 'Others' && !o.Block));

    renderExplorerOffices(currentFilteredOffices);
}

function renderExplorerOffices(list) {
    const poList = document.getElementById('postOfficesList');
    if (list.length === 0) {
        poList.innerHTML = '<div class="col-span-full text-center text-gray-500">No Post Offices found in this Taluka.</div>';
        return;
    }

    // FOR VERIFICATION DEPT: Group orders by date for priority
    if (currentDeptType === 'verification') {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        const todayOrders = [];
        const yesterdayOrders = [];
        const olderOrders = [];

        orders.forEach(order => {
            if (!order.timestamp) {
                olderOrders.push(order);
                return;
            }
            const orderDate = order.timestamp.split('T')[0];
            if (orderDate === today) {
                todayOrders.push(order);
            } else if (orderDate === yesterday) {
                yesterdayOrders.push(order);
            } else {
                olderOrders.push(order);
            }
        });

        let html = '';

        // OLDER ORDERS (PRIORITY!)
        if (olderOrders.length > 0) {
            html += `
                    <div class="col-span-full mb-6">
                        <div class="flex items-center gap-3 mb-4 pb-3 border-b-2 border-red-300">
                            <span class="w-3 h-10 bg-red-500 rounded-full block shadow"></span>
                            <h3 class="text-xl font-bold text-red-700 flex items-center gap-2">
                                ⚠️ Older Orders - PRIORITY FIRST
                            </h3>
                            <span class="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">${olderOrders.length}</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    `;
            olderOrders.forEach(order => {
                html += renderOrderCard(order, 'red');
            });
            html += `</div></div>`;
        }

        // YESTERDAY'S ORDERS
        if (yesterdayOrders.length > 0) {
            html += `
                    <div class="col-span-full mb-6">
                        <div class="flex items-center gap-3 mb-4 pb-3 border-b-2 border-orange-300">
                            <span class="w-3 h-10 bg-orange-500 rounded-full block shadow"></span>
                            <h3 class="text-xl font-bold text-orange-700">📆 Yesterday's Orders</h3>
                            <span class="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">${yesterdayOrders.length}</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    `;
            yesterdayOrders.forEach(order => {
                html += renderOrderCard(order, 'orange');
            });
            html += `</div></div>`;
        }

        // TODAY'S ORDERS
        if (todayOrders.length > 0) {
            html += `
                    <div class="col-span-full">
                        <div class="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-300">
                            <span class="w-3 h-10 bg-blue-500 rounded-full block shadow"></span>
                            <h3 class="text-xl font-bold text-blue-700">🆕 Today's Orders</h3>
                            <span class="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">${todayOrders.length}</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    `;
            todayOrders.forEach(order => {
                html += renderOrderCard(order, 'blue');
            });
            html += `</div></div>`;
        }

        document.getElementById(containerId).innerHTML = html;
        return;
    }

    // FOR DISPATCH DEPT: Normal display (no grouping)
    let html = '';
    list.forEach(item => {
        html += `
            <div onclick="selectPO('${item.Name.replace(/'/g, "\\'")}', '${item.Pincode}', '${item.Block.replace(/'/g, "\\'")}', '${item.District.replace(/'/g, "\\'")}', '${item.State.replace(/'/g, "\\'")}')" 
                class="bg-white border rounded-xl p-3 hover:shadow-md hover:border-blue-500 cursor-pointer transition group flex flex-col justify-between h-auto">
                <div>
                    <div class="font-bold text-gray-800 group-hover:text-blue-600">📮 ${item.Name}</div>
                    <div class="text-xs text-gray-500">PIN: <span class="font-mono bg-gray-100 px-1 rounded">${item.Pincode}</span></div>
                </div>
                <div class="mt-2 text-right">
                    <span class="text-xs text-blue-500 font-medium">Select ➜</span>
                </div>
            </div>`;
    });
    poList.innerHTML = html;
}

function filterExplorerOffices(query) {
    if (!query) {
        renderExplorerOffices(currentFilteredOffices);
        return;
    }
    const lower = query.toLowerCase();
    const filtered = currentFilteredOffices.filter(item =>
        item.Name.toLowerCase().includes(lower) || item.Pincode.toString().includes(lower)
    );
    renderExplorerOffices(filtered);
}

function showPostOfficesByName(talukName) {
    // Filter offices by looking up the normalized map
    if (window.currentTalukaMap && window.currentTalukaMap[talukName]) {
        currentFilteredOffices = window.currentTalukaMap[talukName];
        renderExplorerOffices(currentFilteredOffices);
    }
}

function selectPO(office, pin, taluk, district, state) {
    // Priority 1: Close Modal First (UI Responsiveness)
    const modal = document.getElementById('districtExplorerModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex'); // Remove flex if it was used for centering
    }

    // Priority 2: Auto-fill Data (Safe Mode)
    try {
        selectPostOffice(office, pin, taluk, district, state);
    } catch (e) {
        console.error("Auto-fill Error:", e);
        // Fallback attempt
        const form = document.getElementById('orderForm');
        if (form) {
            if (office) form.po.value = office;
            if (pin) form.pin.value = pin;
        }
    }
}

// ==================== POST OFFICE AUTOCOMPLETE ====================
let postOfficeTimeout;
async function handlePostOfficeInput(query) {
    const suggestionsBox = document.getElementById('postOfficeSuggestions');
    clearTimeout(postOfficeTimeout);

    if (query.length < 2) {
        suggestionsBox.classList.add('hidden');
        return;
    }

    postOfficeTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`${API_URL}/locations/search-po?q=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (data.success && data.offices.length > 0) {
                let html = '';
                const lowerQ = query.toLowerCase();

                data.offices.forEach(item => {
                    // Intelligent Highlighting
                    let matchContext = '';
                    let nameDisplay = item.office;

                    // Highlighting Name
                    const nameIndex = item.office.toLowerCase().indexOf(lowerQ);
                    if (nameIndex >= 0) {
                        nameDisplay = item.office.substring(0, nameIndex) +
                            `<span class="bg-yellow-200 text-gray-900">${item.office.substring(nameIndex, nameIndex + query.length)}</span>` +
                            item.office.substring(nameIndex + query.length);
                    }

                    // Highlighting Block Match if Name doesn't match well or just to show context
                    if (item.taluk && item.taluk.toLowerCase().includes(lowerQ)) {
                        matchContext = `<span class="text-xs bg-green-100 text-green-800 px-1 rounded ml-2">Matched Block: ${item.taluk}</span>`;
                    }

                    html += `
                        <div class="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition group"
                            onclick="selectPO(
                                '${item.office.replace(/'/g, "\\'")}', 
                                '${item.pincode}', 
                                '${item.taluk.replace(/'/g, "\\'")}', 
                                '${item.district.replace(/'/g, "\\'")}', 
                                '${item.state.replace(/'/g, "\\'")}'
                            )">
                            <div class="flex justify-between items-center">
                                <div class="font-bold text-gray-800">${nameDisplay}</div>
                                <div class="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">${item.pincode}</div>
                            </div>
                            <div class="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <span>📍 ${item.taluk}, ${item.district}</span>
                                ${matchContext}
                            </div>
                        </div>`;
                });

                suggestionsBox.innerHTML = html;
                suggestionsBox.classList.remove('hidden');
            } else {
                suggestionsBox.classList.add('hidden');
            }
        } catch (e) {
            console.error('PO autocomplete error:', e);
            suggestionsBox.classList.add('hidden');
        }
    }, 300);
}

function selectPostOffice(office, pin, taluk, district, state) {
    const form = document.getElementById('orderForm');

    form.po.value = office;
    form.pin.value = pin;
    form.tahTaluka.value = taluk;
    form.distt.value = district;
    form.state.value = state;

    document.getElementById('postOfficeSuggestions').classList.add('hidden');

    updateAddress();
    // showMessage(`✅ Selected: ${office}, ${pin}`, 'success', 'empMessage');
}








async function selectPostOfficeDirect(postOffice) {
    const form = document.getElementById('orderForm');
    form.po.value = postOffice;
    document.getElementById('poSuggestions').classList.add('hidden');
    try {
        const res = await fetch(`${API_URL}/postoffice/${encodeURIComponent(postOffice)}`);
        const data = await res.json();
        if (data[0] && data[0].Status === "Success" && data[0].PostOffice.length > 0) {
            const firstPO = data[0].PostOffice[0];
            form.pin.value = firstPO.Pincode;
            form.state.value = firstPO.State;
            form.distt.value = firstPO.District;
            form.tahTaluka.value = firstPO.Block;
            fetchPincodeDetails(firstPO.Pincode);
        }
    } catch (e) { console.error(e); }
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('input[name="distt"]')) {
        const list = document.getElementById('districtSuggestions');
        if (list) list.classList.add('hidden');
    }
    if (!e.target.closest('input[name="po"]')) {
        const list = document.getElementById('poSuggestions');
        if (list) list.classList.add('hidden');
    }
});


async function fetchPincodeDetails(pincode) {
    if (pincode.length !== 6) return;
    const suggestList = document.getElementById('poSuggestions');

    // Show loading state
    suggestList.innerHTML = '<li class="px-4 py-2 text-gray-500 text-sm">⏳ Loading P.O...</li>';
    suggestList.classList.remove('hidden');

    try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();

        if (data[0].Status === "Success") {
            const postOffices = data[0].PostOffice;
            const details = postOffices[0];
            const form = document.getElementById('orderForm');
            form.state.value = details.State;
            form.distt.value = details.District;
            form.tahTaluka.value = details.Block;
            updateAddress();


            // Enhanced: Populate Post Office Suggestions with Search
            suggestList.innerHTML = '';
            if (postOffices.length > 0) {
                // Sort alphabetically
                const sorted = postOffices.sort((a, b) => a.Name.localeCompare(b.Name));

                // Create search box + list with sticky header
                let html = `<div class="sticky top-0 bg-white border-b border-gray-200 p-2 z-10">
                            <input type="text" 
                                placeholder="🔍 Search Post Office..." 
                                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                                oninput="filterPOList(this.value)"
                                onclick="event.stopPropagation()">
                            <div class="text-xs text-gray-400 mt-1">${sorted.length} Post Offices</div>
                        </div>`;

                sorted.forEach(po => {
                    html += `<li class="po-item px-4 py-2 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-none text-sm"
                                data-name="${po.Name.toLowerCase()}"
                                onclick="selectPOFromPincode('${po.Name.replace(/'/g, "\\'")}')">
${po.Name}</li>`;
                });

                suggestList.innerHTML = html;
                suggestList.classList.remove('hidden');
            } else {
                suggestList.classList.add('hidden');
            }
        }
    } catch (e) {
        console.error("Pincode fetch error", e);
    }
}

// Select Post Office from PIN code suggestions
function selectPOFromPincode(poName) {
    const form = document.getElementById('orderForm');
    form.po.value = poName;
    document.getElementById('poSuggestions').classList.add('hidden');
    updateAddress();
}

const PRODUCT_LIST = [
    { name: "Vedic Vain's Liquid" },
    { name: "Pain Snap Prash" },
    { name: "Naskhol" },
    { name: "Nadiyog" },
    { name: "Oil" },
    { name: "Spray Oil" },
    { name: "Vedic-Tab" },
    { name: "Vedic-Cap" },
    { name: "Vena-V" },
    { name: "Painover" },
    { name: "Ostrich-Cap" },
    { name: "Gaumutra" },
    { name: "Amlex" },
    { name: "Black pills" },
    { name: "Tea-400" },
    { name: "Tea-1500" },
    { name: "Tea-1800" }
];

function addItem() {
    const container = document.getElementById('itemsContainer');
    const div = document.createElement('div');
    div.className = 'grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 mb-2';

    let options = PRODUCT_LIST.map(p => `<option value="${p.name}">${p.name}</option>`).join('');

    div.innerHTML = ` 
            <select class="col-span-12 md:col-span-8 border rounded-lg px-3 py-2 text-sm item-desc bg-white outline-none focus:border-emerald-500 transition-colors"
                onchange="calculateTotal()"> 
                <option value="">Select Product...</option> 
                ${options}
                <option value="Other">Other</option> 
            </select> 
            
            <input type="number" placeholder="Qty" value="1" min="1"
                class="col-span-8 md:col-span-3 border rounded-lg px-2 py-2 text-sm item-qty outline-none focus:border-emerald-500"
                oninput="calculateTotal()"> 
            
            <button type="button" onclick="this.parentElement.remove(); calculateTotal();" class="col-span-4 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors text-center">×</button> `;
    container.appendChild(div);
}

function calculateTotal() {
    const items = document.querySelectorAll('#itemsContainer > div');
    const totalInput = document.getElementById('totalAmountInput');
    const comboBadge = document.getElementById('comboBadge');

    let itemCount = 0;
    items.forEach(div => {
        const desc = div.querySelector('.item-desc').value;
        const qty = parseInt(div.querySelector('.item-qty').value) || 0;
        if (desc) itemCount += qty;
    });

    // Combo Offer: 3 items for 3400
    if (itemCount === 3) {
        totalInput.value = 3400;
        comboBadge.classList.remove('hidden');
    } else {
        comboBadge.classList.add('hidden');
        // If not combo, maybe just leave last value or clear if 0
        if (itemCount === 0) totalInput.value = 0;
    }

    calculateCOD();
}

function calculateCOD() {
    const total = parseFloat(document.getElementById('totalAmountInput').value) || 0;
    const advance = parseFloat(document.querySelector('input[name="advance"]').value) || 0;
    document.querySelector('input[name="codAmount"]').value = Math.max(0, total - advance).toFixed(2);
}

// Show validation popup for missing fields
function showValidationPopup(missingFields) {
    const popup = document.createElement('div');

    // Create list of missing fields
    const fieldsList = missingFields.map(field =>
        `<li class="flex items-center gap-2 text-gray-700">
            <span class="text-red-500 font-bold">❌</span>
            <span>${field}</span>
        </li>`
    ).join('');

    popup.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s;">
            <div style="background: white; border-radius: 20px; padding: 30px; max-width: 450px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s;">
                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; animation: shake 0.5s;">
                    <span style="font-size: 40px;">⚠️</span>
                </div>
                <h2 style="font-size: 22px; font-weight: bold; color: #1f2937; margin-bottom: 12px; text-align: center;">Form Incomplete!</h2>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 16px; text-align: center;">Kripya ye fields bharein:</p>
                
                <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; max-height: 200px; overflow-y: auto;">
                    ${fieldsList}
                </ul>
                
                <button onclick="this.closest('div[style*=fixed]').remove()" 
                    style="width: 100%; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 14px 24px; border-radius: 12px; font-weight: bold; font-size: 16px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(239,68,68,0.3);" 
                    onmouseover="this.style.transform='scale(1.02)'" 
                    onmouseout="this.style.transform='scale(1)'">
                    ठीक है, भर देता हूं
                </button>
            </div>
        </div>
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes shake { 
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-5deg); }
                75% { transform: rotate(5deg); }
            }
        </style>
    `;

    document.body.appendChild(popup);

    // Auto-scroll to first missing field after closing popup
    popup.querySelector('button').addEventListener('click', () => {
        const firstEmptyField = document.querySelector('.border-red-500');
        if (firstEmptyField) {
            firstEmptyField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => firstEmptyField.focus(), 300);
        }
    });
}

async function saveOrder() {
    const form = document.getElementById('orderForm');
    const customerName = form.customerName.value.trim();
    const telNo = form.telNo.value.trim();

    // Enhanced Validation: Check ALL required fields
    let missingFields = [];
    const inputs = form.querySelectorAll('input[required], select[required]');

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('border-red-500', 'bg-red-50');

            // Get field name from placeholder or name attribute
            const fieldName = input.placeholder || input.name || 'Unknown field';
            missingFields.push(fieldName);

            // Add listener to remove error on type
            input.addEventListener('input', () => {
                input.classList.remove('border-red-500', 'bg-red-50');
            }, { once: true });
        } else {
            input.classList.remove('border-red-500', 'bg-red-50');
        }
    });

    if (missingFields.length > 0) {
        // Show custom popup with list of missing fields
        showValidationPopup(missingFields);
        return;
    }

    // Additional phone number validation
    if (telNo && telNo.length !== 10) {
        showValidationPopup(['Tel No. - 10 digits hone chahiye (currently ' + telNo.length + ' digits)']);
        document.querySelector('input[name="telNo"]').classList.add('border-red-500', 'bg-red-50');
        return;
    }

    const items = [];

    document.querySelectorAll('#itemsContainer > div').forEach(div => {
        const desc = div.querySelector('.item-desc').value.trim();
        const qty = parseFloat(div.querySelector('.item-qty').value) || 0;

        if (desc) items.push({
            description: desc,
            quantity: qty,
            amount: 0,  // Will calculate below
            rate: 0     // Will calculate below
        });
    });

    if (items.length === 0) {
        return showMessage('Kam se kam ek item add karein!', 'error', 'empMessage');
    }

    const total = parseFloat(document.getElementById('totalAmountInput').value) || 0;

    // Calculate total quantity
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    // Distribute total amount proportionally based on quantity
    if (totalQty > 0) {
        items.forEach(item => {
            const proportion = item.quantity / totalQty;
            item.amount = Math.round(total * proportion);
            item.rate = item.quantity > 0 ? Math.round(item.amount / item.quantity) : 0;
        });
    }

    const orderData = {
        employeeId: currentUser.id,
        employee: currentUser.name,
        customerName: toTitleCase(customerName),
        address: form.address.value,
        hNo: form.hNo.value.trim(),
        blockGaliNo: toTitleCase(form.blockGaliNo.value.trim()),
        villColony: toTitleCase(form.villColony.value.trim()),
        po: toTitleCase(form.po.value.trim()),
        tahTaluka: toTitleCase(form.tahTaluka.value.trim()),
        distt: toTitleCase(form.distt.value.trim()),
        state: toTitleCase(form.state.value.trim()),
        pin: form.pin.value.trim(),
        landMark: toTitleCase(form.landMark.value.trim()),
        treatment: form.treatment.value, // Added treatment field
        date: form.date.value,
        time: form.time.value,
        telNo,
        altNo: form.altNo.value,
        orderType: form.orderType.value,
        items,
        total: total,
        advance: parseFloat(form.advance.value) || 0,
        codAmount: parseFloat(form.codAmount.value) || 0
    };

    // LOGIC CHANGE: Decide URL and Method based on Create or Edit mode
    const url = currentEditingOrderId ? `${API_URL}/orders/${currentEditingOrderId}` : `${API_URL}/orders`;
    const method = currentEditingOrderId ? 'PUT' : 'POST';

    try {
        const btn = document.querySelector('#orderForm button[onclick="saveOrder()"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Saving...';
        btn.disabled = true;

        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        const data = await res.json();

        if (data.success) {
            const bookedOrder = {
                orderId: data.order?.orderId || data.orderId || 'Updated',
                customerName: orderData.customerName,
                total: orderData.total,
                telNo: orderData.telNo
            };

            showSuccessPopup(
                currentEditingOrderId ? 'Order Updated!' : 'Order Saved!',
                currentEditingOrderId ? 'Order details successfully update ho gaye' : 'Order successfully Verification Department mein chala gaya',
                '✅',
                '#10b981',
                currentEditingOrderId ? null : { type: 'booked', order: bookedOrder }
            );

            form.reset();
            currentEditingOrderId = null; // Reset edit mode

            // Reset Button
            btn.innerHTML = '💾 SAVE ORDER';
            btn.classList.remove('bg-amber-600', 'hover:bg-amber-700');
            btn.classList.add('btn-primary'); // Assuming btn-primary is the default class

            initOrderForm();

            // Switch to My Orders tab to see the updated/new order
            switchEmpTab('tracking');
            loadMyOrders();
        }

        else {
            // Check if it's a duplicate order error
            if (data.existingOrder) {
                const popup = document.createElement('div');
                popup.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s;">
                        <div style="background: white; border-radius: 20px; padding: 30px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s;">
                            <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 40px;">⚠️</span>
                            </div>
                            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 12px; text-align: center;">Duplicate Order Alert!</h2>
                            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px; text-align: center;">
                                Is mobile number par pehle se ek order hai!<br>
                                Doosre employee ne already order le liya hai.
                            </p>
                            
                            <div style="background: #fef3c7; padding: 16px; border-radius: 12px; border: 1px solid #fcd34d; margin-bottom: 20px;">
                                <div style="display: grid; gap: 8px; font-size: 14px;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #92400e;">📦 Order ID:</span>
                                        <span style="font-weight: bold; color: #1f2937;">${data.existingOrder.orderId}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #92400e;">📊 Status:</span>
                                        <span style="font-weight: bold; color: #1f2937;">${data.existingOrder.status}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #92400e;">👤 Employee:</span>
                                        <span style="font-weight: bold; color: #1f2937;">${data.existingOrder.employeeName || data.existingOrder.createdBy || 'Unknown'}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #92400e;">📅 Created:</span>
                                        <span style="font-weight: bold; color: #1f2937;">${new Date(data.existingOrder.createdAt).toLocaleDateString('hi-IN')}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button onclick="this.closest('div[style*=fixed]').remove()" 
                                style="width: 100%; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 14px 24px; border-radius: 12px; font-weight: bold; font-size: 16px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(245,158,11,0.3);" 
                                onmouseover="this.style.transform='scale(1.02)'" 
                                onmouseout="this.style.transform='scale(1)'">
                                समझ गया!
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(popup);
            } else {
                showMessage(data.message || 'Order save nahi hua!', 'error', 'empMessage');
            }
        }

        btn.innerHTML = originalText;
        btn.disabled = false;
    }

    catch (e) {
        console.error('Save order error:', e);
        const btn = document.querySelector('#orderForm button[onclick="saveOrder()"]');
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        showMessage('Server se connect nahi ho paya! Check karo server chal raha hai?', 'error', 'empMessage');
    }
}

// Edit Order Function
async function editOrder(orderId) {
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await res.json();

        if (!data.success || !data.order) {
            return showMessage('Order fetch failed!', 'error', 'empMessage');
        }

        const order = data.order;
        const form = document.getElementById('orderForm');

        // Populate Fields
        form.customerName.value = order.customerName || '';
        form.telNo.value = order.telNo || '';
        form.altNo.value = order.altNo || '';
        form.hNo.value = order.hNo || '';
        form.blockGaliNo.value = order.blockGaliNo || '';
        form.villColony.value = order.villColony || '';
        form.landMark.value = order.landmark || order.landMark || '';
        form.po.value = order.po || order.postOfficeName || '';
        form.tahTaluka.value = order.tahTaluka || '';
        form.distt.value = order.distt || '';
        form.state.value = order.state || '';
        form.pin.value = order.pin || order.pincode || '';
        form.address.value = order.address || '';
        form.treatment.value = order.treatment || '';

        form.date.value = order.date || '';
        form.time.value = order.time || '';
        form.advance.value = order.advance || 0;
        document.getElementById('totalAmountInput').value = order.total || 0;
        calculateTotal(); // Trigger combo check

        // Radio Button
        if (order.orderType === 'REORDER') {
            document.querySelector('input[name="orderType"][value="REORDER"]').checked = true;
        } else {
            document.querySelector('input[name="orderType"][value="NEW"]').checked = true;
        }

        // Populate Items manually as they no longer have per-row Amount
        const container = document.getElementById('itemsContainer');
        container.innerHTML = '';
        (order.items || []).forEach(item => {
            const div = document.createElement('div');
            div.className = 'grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 mb-2';

            let options = PRODUCT_LIST.map(p =>
                `<option value="${p.name}" ${p.name === item.description ? 'selected' : ''}>${p.name}</option>`
            ).join('');

            // Add "Other" if description is not in list
            if (!PRODUCT_LIST.find(p => p.name === item.description)) {
                options += `<option value="${item.description}" selected>${item.description}</option>`;
            } else {
                options += `<option value="Other">Other</option>`;
            }

            div.innerHTML = ` 
                    <select class="col-span-12 md:col-span-8 border rounded-lg px-3 py-2 text-sm item-desc bg-white outline-none focus:border-emerald-500 transition-colors"
                        onchange="calculateTotal()"> 
                        <option value="">Select Product...</option> 
                        ${options}
                    </select> 
                    
                    <input type="number" placeholder="Qty" value="${item.quantity || 1}" min="1"
                        class="col-span-8 md:col-span-3 border rounded-lg px-2 py-2 text-sm item-qty outline-none focus:border-emerald-500"
                        oninput="calculateTotal()"> 
                    
                    <button type="button" onclick="this.parentElement.remove(); calculateTotal();" class="col-span-4 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors text-center">×</button> `;
            container.appendChild(div);
        });
        if (order.items.length === 0) {
            addItem();
        }

        calculateTotal(); // Recalculate totals

        // Set Edit Mode
        currentEditingOrderId = orderId;

        // Update Button UI
        const btn = document.querySelector('#orderForm button[onclick="saveOrder()"]');
        if (btn) {
            btn.innerHTML = '✏️ UPDATE ORDER';
            btn.classList.remove('btn-primary'); // Remove default
            btn.classList.add('bg-amber-600', 'hover:bg-amber-700', 'text-white'); // Amber for edit mode
        }

        // Switch to Form Tab
        switchEmpTab('order');

        // Scroll to top
        document.getElementById('empOrderTab').scrollIntoView({ behavior: 'smooth' });

        showMessage(`Editing Order: ${orderId}`, 'success', 'empMessage');

    } catch (e) {
        console.error("Edit order error", e);
        showMessage('Failed to load order for editing', 'error', 'empMessage');
    }
}

async function loadMyOrders() {
    try {
        const res = await fetch(`${API_URL}/orders/employee/${currentUser.id}`);
        const data = await res.json();

        // Get date filter value (if empty, use today's date)
        const dateFilter = document.getElementById('myOrdersDate').value;
        const targetDate = dateFilter || new Date().toISOString().split('T')[0];

        // Filter for selected date's orders
        const allOrders = data.orders || [];
        const orders = allOrders
            .filter(o => {
                if (!o.timestamp) return false;
                const orderDate = o.timestamp.split('T')[0];
                return orderDate === targetDate;
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const stats = {
            total: orders.length,
            pending: orders.filter(o => o.status === 'Pending').length,
            verified: orders.filter(o => o.status === 'Address Verified').length,
            dispatched: orders.filter(o => o.status === 'Dispatched').length,
            delivered: orders.filter(o => o.status === 'Delivered').length,
            hold: orders.filter(o => o.status === 'On Hold').length
        };

        // Render Stats
        document.getElementById('myOrdersStats').innerHTML = `
            <div class="glass-card p-3 flex flex-col items-center justify-center text-center border-b-4 border-blue-500 shadow-sm hover:scale-105 transition-transform">
                <span class="text-2xl mb-1">📦</span>
                <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total</span>
                <span class="text-xl font-bold text-gray-800">${stats.total}</span>
            </div>
             <div class="glass-card p-3 flex flex-col items-center justify-center text-center border-b-4 border-yellow-500 shadow-sm hover:scale-105 transition-transform">
                <span class="text-2xl mb-1">⏳</span>
                <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pending</span>
                <span class="text-xl font-bold text-gray-800">${stats.pending}</span>
            </div>
             <div class="glass-card p-3 flex flex-col items-center justify-center text-center border-b-4 border-orange-500 shadow-sm hover:scale-105 transition-transform">
                <span class="text-2xl mb-1">⏸️</span>
                <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">On Hold</span>
                <span class="text-xl font-bold text-gray-800">${stats.hold}</span>
            </div>
             <div class="glass-card p-3 flex flex-col items-center justify-center text-center border-b-4 border-emerald-500 shadow-sm hover:scale-105 transition-transform">
                <span class="text-2xl mb-1">✅</span>
                <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Verified</span>
                <span class="text-xl font-bold text-gray-800">${stats.verified}</span>
            </div>
             <div class="glass-card p-3 flex flex-col items-center justify-center text-center border-b-4 border-indigo-500 shadow-sm hover:scale-105 transition-transform">
                <span class="text-2xl mb-1">🚚</span>
                <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dispatched</span>
                <span class="text-xl font-bold text-gray-800">${stats.dispatched}</span>
            </div>
             <div class="glass-card p-3 flex flex-col items-center justify-center text-center border-b-4 border-green-500 shadow-sm hover:scale-105 transition-transform">
                <span class="text-2xl mb-1">🎉</span>
                <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Delivered</span>
                <span class="text-xl font-bold text-gray-800">${stats.delivered}</span>
            </div>
        `;

        const list = document.getElementById('myOrdersList');

        if (orders.length === 0) {
            list.innerHTML = `
                 <div class="col-span-full text-center py-12 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p class="text-4xl mb-3">📭</p>
                    <p class="text-gray-500 font-medium">No active orders</p>
                </div>`;
            return;
        }

        let html = '';
        orders.forEach(order => {
            const hasRequestedDelivery = order.deliveryRequests && order.deliveryRequests.some(r => r.employeeId === currentUser.id);

            let statusColor = 'gray';
            if (order.status === 'Pending') statusColor = 'yellow';
            else if (order.status === 'Address Verified') statusColor = 'emerald';
            else if (order.status === 'Dispatched') statusColor = 'indigo';
            else if (order.status === 'Delivered') statusColor = 'green';
            else if (order.status === 'On Hold') statusColor = 'orange';

            html += `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-${statusColor}-100 flex flex-col h-full bg-white">
                <!-- Card Header -->
                <div class="p-4 border-b border-${statusColor}-50 bg-gradient-to-r from-${statusColor}-50/50 to-white relative">
                     <div class="absolute top-0 right-0 w-24 h-24 bg-${statusColor}-400 rounded-bl-full opacity-5 pointer-events-none"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                             <div class="flex items-center gap-2 mb-1">
                                <span class="bg-${statusColor}-100 text-${statusColor}-700 text-xs font-bold px-2 py-0.5 rounded-md border border-${statusColor}-200 uppercase tracking-wide">
                                    ${order.orderId}
                                </span>
                                <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                                    class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-sm transition-all" title="Send WhatsApp">
                                    ${WHATSAPP_ICON}
                                </button>
                                ${order.orderType === 'REORDER' ?
                    '<span class="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200">REORDER</span>' : ''}
                            </div>
                            <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[150px]" title="${order.customerName}">
                                ${order.customerName}
                            </h3>
                        </div>
                        <div class="text-right">
                             <p class="text-xl font-black text-gray-800 tracking-tight">₹${order.total}</p>
                             <div class="flex flex-col items-end">
                                <span class="text-xs font-bold text-${statusColor}-600 mt-1">${order.status}</span>
                             </div>
                        </div>
                    </div>
                </div>

                 <!-- Card Body -->
                <div class="p-4 space-y-3 flex-grow bg-white/60">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 flex-shrink-0">
                            📍
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Location</p>
                            <p class="text-sm font-medium text-gray-700 leading-snug line-clamp-2" title="${order.address}">
                                ${order.villColony}, ${order.distt}
                            </p>
                        </div>
                    </div>

                    ${order.tracking && order.tracking.trackingId ? `
                    <div class="flex items-start gap-3">
                         <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                             🧾
                         </div>
                         <div>
                             <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Tracking ID</p>
                             <div class="flex items-center gap-2">
                                <p class="text-sm font-mono font-bold text-blue-700 tracking-wide">${order.tracking.trackingId}</p>
                                <button onclick="copyTracking('${order.tracking.trackingId}')" class="text-xs text-blue-400 hover:text-blue-600">📋</button>
                             </div>
                         </div>
                    </div>
                    ` : ''}

                    ${order.verificationRemark && order.verificationRemark.text ? `
                    <div class="mt-2 bg-amber-50 border border-amber-100 p-2 rounded-lg mb-2">
                        <p class="text-[10px] font-bold text-amber-600 uppercase mb-0.5">⚠️ Verification Remark</p>
                        <p class="text-xs text-gray-700 italic">"${order.verificationRemark.text}"</p>
                    </div>
                    ` : ''}

                    <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span class="text-xs text-gray-400">📅 ${new Date(order.timestamp).toLocaleDateString()} ⏰ ${new Date(order.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        ${order.status === 'Dispatched' && !hasRequestedDelivery ?
                    `<button onclick="requestDelivery('${order.orderId}')" class="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-lg font-bold hover:bg-pink-100 transition-colors">
                                ✋ Request Delivery
                        </button>` : ''
                }
                        ${hasRequestedDelivery && order.status === 'Dispatched' ?
                    `<span class="text-[10px] bg-pink-100 text-pink-700 px-2 py-1 rounded-lg font-bold">⏳ Req Pending</span>` : ''
                }
                    </div>
                </div>

                 ${/* Show tracking badge for dispatched and delivered orders */
                ['Dispatched', 'Delivered'].includes(order.status) ? getTrackingStatusBadge(order) : ''}

                 <!-- Footer Actions -->
                <div class="p-3 bg-gray-50/50 border-t border-gray-100 grid grid-cols-1 gap-2">
                    <button type="button" onclick="viewOrder('${order.orderId}')" 
                        class="w-full bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2">
                        <span>👁️</span> View Details
                    </button>
                    ${['Pending', 'On Hold', 'Address Verified', 'Unverified'].includes(order.status) ? `
                    <button type="button" onclick="editOrder('${order.orderId}')" 
                        class="w-full bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2">
                        <span>✏️</span> Edit Order
                    </button>
                    ` : ''}
                    ${order.tracking && order.tracking.trackingId ? `
                     <button type="button" onclick="trackOrder('${order.orderId}')" 
                        class="w-full bg-indigo-500 text-white py-2 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                        <span>🛰️</span> Track Package
                    </button>
                    ` : ''}
                </div>
            </div>`;
        });
        list.innerHTML = html;
    } catch (e) {
        console.error(e);
        document.getElementById('myOrdersList').innerHTML = '<p class="text-center text-red-500 py-8">Server connection failed</p>';
    }
}

// ==================== TRACKING STATUS BADGE HELPER ====================
// Generate tracking status badge HTML for an order
function getTrackingStatusBadge(order) {
    // Check if order has Shiprocket tracking
    const hasShiprocket = order.shiprocket && order.shiprocket.awb;
    // Check if order has manual tracking
    const hasManualTracking = order.tracking && order.tracking.trackingId;

    if (!hasShiprocket && !hasManualTracking) {
        // No tracking info available
        return '';
    }

    // Get tracking data (prefer Shiprocket over manual)
    const awb = hasShiprocket ? order.shiprocket.awb : order.tracking.trackingId;
    const courier = hasShiprocket ?
        (order.shiprocket.courierName || 'Shiprocket') :
        (order.tracking.courier || 'Manual');
    const currentStatus = order.tracking && order.tracking.currentStatus ?
        order.tracking.currentStatus : 'In Transit';

    // Determine badge color based on status
    let badgeColor = 'blue';
    if (currentStatus.includes('Delivered')) badgeColor = 'green';
    else if (currentStatus.includes('Out for Delivery')) badgeColor = 'purple';
    else if (currentStatus.includes('Transit')) badgeColor = 'yellow';
    else if (currentStatus.includes('Pickup')) badgeColor = 'orange';

    return `
        <div class="mt-3 p-3 bg-gradient-to-r from-${badgeColor}-50 to-white border border-${badgeColor}-200 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-bold text-${badgeColor}-700 uppercase tracking-wide flex items-center gap-1">
                    ${hasShiprocket ? '🚀' : '📦'} Tracking Info
                </p>
                <span class="bg-${badgeColor}-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    ${currentStatus}
                </span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>
                    <p class="text-gray-500 font-medium mb-0.5">AWB Number:</p>
                    <div class="flex items-center gap-1">
                        <p class="font-mono font-bold text-gray-800 text-[11px] truncate">${awb}</p>
                        <button onclick="copyTracking('${awb}')" 
                            class="text-${badgeColor}-600 hover:text-${badgeColor}-800 transition-colors" 
                            title="Copy AWB">
                            📋
                        </button>
                    </div>
                </div>
                <div>
                    <p class="text-gray-500 font-medium mb-0.5">Courier:</p>
                    <p class="font-bold text-${badgeColor}-700 text-[11px]">${courier}</p>
                </div>
            </div>
            ${order.tracking && order.tracking.lastUpdate ? `
                <div class="text-[10px] text-gray-600 italic border-t border-${badgeColor}-100 pt-2 mt-1">
                    📍 ${order.tracking.lastUpdate}
                </div>
            ` : ''}
        </div>
    `;
}

function copyTracking(trackingId) {
    navigator.clipboard.writeText(trackingId);
    alert('Tracking ID copied: ' + trackingId);
}

async function loadMyCancelledOrders() {
    try {
        const res = await fetch(`${API_URL}/orders/employee/${currentUser.id}`);
        const data = await res.json();

        const dateFilter = document.getElementById('myCancelledOrdersDate').value;
        const targetDate = dateFilter || new Date().toISOString().split('T')[0];

        const allOrders = data.orders || [];
        const orders = allOrders
            .filter(o => {
                if (o.status !== 'Cancelled') return false;
                if (!o.timestamp) return false;
                const orderDate = o.timestamp.split('T')[0];
                return orderDate === targetDate;
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const list = document.getElementById('empCancelledList');

        if (orders.length === 0) {
            list.innerHTML = `
                <div class="col-span-full text-center py-12 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p class="text-4xl mb-3">📭</p>
                    <p class="text-gray-500 font-medium">No cancelled orders for this date</p>
                </div>`;
            return;
        }

        let html = '';
        orders.forEach(order => {
            html += `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-red-100 flex flex-col h-full bg-white">
                <div class="p-4 border-b border-red-50 bg-gradient-to-r from-red-50/50 to-white relative">
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-md border border-red-200 uppercase tracking-wide">
                                    ${order.orderId}
                                </span>
                            </div>
                            <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[180px]" title="${order.customerName}">
                                ${order.customerName}
                            </h3>
                        </div>
                        <div class="text-right">
                            <p class="text-xl font-black text-gray-800 tracking-tight">₹${order.total}</p>
                            <span class="text-xs font-bold text-red-600 mt-1">CANCELLED</span>
                        </div>
                    </div>
                </div>
                <div class="p-4 space-y-3 flex-grow">
                    <div class="flex items-center justify-between text-xs text-gray-400">
                        <span>📅 ${new Date(order.timestamp).toLocaleDateString()}</span>
                        <span>📱 ${order.telNo}</span>
                    </div>
                    <div class="bg-red-50 p-2 rounded-lg text-xs text-red-700 italic">
                        💬 ${order.remarks || 'No remarks provided'}
                    </div>
                </div>
                <div class="p-3 bg-gray-50/50 border-t border-gray-100">
                    <button type="button" onclick="viewOrder('${order.orderId}')" 
                        class="w-full bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2">
                        <span>👁️</span> View Details
                    </button>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    } catch (e) {
        console.error('Load cancelled orders error:', e);
    }
}

function filterMyCancelledOrders(query) {
    const q = query.toLowerCase();
    const cards = document.querySelectorAll('#empCancelledList> div');
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? '' : 'none';
    });
}

async function requestDelivery(orderId) {
    if (!confirm('Dispatch Department ko delivery request bhejni hai?')) return;

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/request-delivery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }

            ,
            body: JSON.stringify({
                employeeId: currentUser.id,
                employeeName: currentUser.name
            })
        });
        const data = await res.json();

        if (data.success) {
            showSuccessPopup(
                'Delivery Request Sent! 🚚',
                `Delivery request successfully bhej di gayi!\n\nDispatch Department approve karega.`,
                '🚚',
                '#8b5cf6'
            );
            setTimeout(() => {
                loadMyOrders();
                closeModal('requestDeliveryModal');
            }, 1000);
        }

        else {
            showMessage(data.message || 'Request nahi bheji ja saki', 'error', 'empMessage');
        }
    }

    catch (e) {
        console.error(e);
        showMessage('Server error!', 'error', 'empMessage');
    }
}

async function loadMyHistory() {
    const date = document.getElementById('empHistoryDate').value;

    try {
        const res = await fetch(`${API_URL}/orders/employee/${currentUser.id}`);
        const data = await res.json();
        let orders = (data.orders || [])
            // Show ALL orders in history, not just delivered
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (date) {
            orders = orders.filter(o => o.timestamp && o.timestamp.startsWith(date));
        }

        if (orders.length === 0) {
            document.getElementById('myHistoryList').innerHTML = `
                <div class="col-span-full text-center py-12 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p class="text-4xl mb-3">📂</p>
                    <p class="text-gray-500 font-medium">No history found</p>
                </div>`;
            return;
        }

        let html = '';
        orders.forEach(order => {
            let statusColor = 'gray';
            if (order.status === 'Pending') statusColor = 'yellow';
            else if (order.status === 'Address Verified') statusColor = 'blue';
            else if (order.status === 'Dispatched') statusColor = 'purple';
            else if (order.status === 'Delivered') statusColor = 'green';
            else if (order.status === 'On Hold') statusColor = 'orange';

            html += `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-${statusColor}-100 flex flex-col h-full bg-slate-50">
                <div class="p-4 border-b border-${statusColor}-50 bg-gradient-to-r from-${statusColor}-50/50 to-white relative">
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                             <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                Order #${order.orderId}
                                <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                                    class="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-sm transition-all" title="Send WhatsApp">
                                    ${WHATSAPP_ICON}
                                </button>
                             </p>
                            <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[200px]" title="${order.customerName}">
                                ${order.customerName}
                            </h3>
                            <p class="text-xs text-gray-500 font-mono mt-0.5">${order.telNo}</p>
                        </div>
                        <div class="text-right">
                             <p class="text-lg font-bold text-gray-800">₹${order.total}</p>
                             <span class="text-xs font-bold text-${statusColor}-600 bg-${statusColor}-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                ${order.status}
                             </span>
                        </div>
                    </div>
                </div>

                <div class="p-4 flex gap-2 items-center justify-between border-t border-${statusColor}-100">
                    <div class="text-xs text-gray-500">
                        <span class="block text-gray-400 text-[10px] uppercase font-bold">Date</span>
                        ${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}
                    </div>
                    <button type="button" onclick="viewOrder('${order.orderId}')" 
                        class="bg-white border border-${statusColor}-200 text-${statusColor}-600 hover:bg-${statusColor}-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors">
                        👁️ View Details
                    </button>
                </div>
            </div>`;
        });
        document.getElementById('myHistoryList').innerHTML = html;
    } catch (e) {
        console.error(e);
    }
}

// Load My Cancelled Orders
async function loadMyCancelledOrders() {
    try {
        const res = await fetch(`${API_URL}/orders/employee/${currentUser.id}`);
        const data = await res.json();
        const cancelled = (data.orders || [])
            .filter(o => o.status === 'Cancelled')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const container = document.getElementById('empCancelledList');
        if (cancelled.length === 0) {
            container.innerHTML = `
                        <div class="col-span-full text-center py-12 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p class="text-4xl mb-3">❌</p>
                            <p class="text-gray-500 font-medium">No cancelled orders</p>
                        </div>`;
            return;
        }

        container.innerHTML = cancelled.map(order => `
                    <div class="glass-card p-5 border-l-4 border-red-500 hover:shadow-xl transition-all">
                        <div class="flex justify-between mb-3">
                            <span class="font-bold text-gray-800 text-sm">${order.orderId}</span>
                            <span class="text-red-600 font-bold text-lg">₹${order.total}</span>
                        </div>
                        <p class="text-sm text-gray-700 font-medium mb-1">${order.customerName}</p>
                        <p class="text-xs text-gray-500 mb-2">📞 ${order.telNo}</p>
                        <p class="text-xs text-gray-400">${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}</p>
                        
                        <div class="mt-4 pt-4 border-t border-red-200 bg-red-50 -mx-5 -mb-5 px-5 pb-5">
                            <p class="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
                                ❌ CANCELLATION INFO
                            </p>
                            <p class="text-xs text-gray-700"><strong>Reason:</strong> ${order.cancellationInfo?.reason || 'No reason provided'}</p>
                            <p class="text-xs text-gray-500 mt-1">Cancelled by: ${order.cancellationInfo?.cancelledBy || 'N/A'}</p>
                        </div>
                    </div>
                `).join('');
    } catch (e) {
        console.error('Load cancelled orders error:', e);
    }
}

// Load Verification Cancelled Orders
async function loadVerificationCancelled() {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        const cancelled = (data.orders || [])
            .filter(o => o.status === 'Cancelled')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const container = document.getElementById('verificationCancelledList');
        if (cancelled.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center col-span-full py-8">No cancelled orders</p>';
            return;
        }

        container.innerHTML = cancelled.map(order => generateOrderCardHTML(order)).join('');
    } catch (e) {
        console.error('Load verification cancelled error:', e);
    }
}

async function loadEmpProgress() {
    try {
        const res = await fetch(`${API_URL}/orders/employee/${currentUser.id}`);
        const data = await res.json();
        let orders = data.orders || [];

        const startDate = document.getElementById('empProgressStartDate').value;
        const endDate = document.getElementById('empProgressEndDate').value;

        if (startDate) orders = orders.filter(o => o.timestamp && o.timestamp >= startDate);
        if (endDate) orders = orders.filter(o => o.timestamp && o.timestamp <= endDate + 'T23:59:59');

        const stats = {
            total: orders.length,
            pending: orders.filter(o => o.status === 'Pending').length,
            dispatched: orders.filter(o => o.status === 'Dispatched').length,
            delivered: orders.filter(o => o.status === 'Delivered').length
        };

        const deliveryRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0;
        const totalAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);

        document.getElementById('empProgressStats').innerHTML = `
            <div class="glass-card bg-blue-50/50 border-b-4 border-blue-500 p-4 rounded-xl text-center shadow-sm">
                <p class="text-3xl font-bold text-blue-600 mb-1">${stats.total}</p>
                <p class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total</p>
            </div>
             <div class="glass-card bg-yellow-50/50 border-b-4 border-yellow-500 p-4 rounded-xl text-center shadow-sm">
                <p class="text-3xl font-bold text-yellow-600 mb-1">${stats.pending}</p>
                <p class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Pending</p>
            </div>
             <div class="glass-card bg-purple-50/50 border-b-4 border-purple-500 p-4 rounded-xl text-center shadow-sm">
                <p class="text-3xl font-bold text-purple-600 mb-1">${stats.dispatched}</p>
                 <p class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Dispatched</p>
            </div>
             <div class="glass-card bg-green-50/50 border-b-4 border-green-500 p-4 rounded-xl text-center shadow-sm">
                <p class="text-3xl font-bold text-green-600 mb-1">${stats.delivered}</p>
                 <p class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Delivered</p>
            </div>
        `;

        // Chart/Metrics Section
        document.getElementById('empProgressChart').innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div class="glass-card p-6 shadow-sm flex flex-col justify-center">
                    <div class="flex justify-between mb-2 items-center">
                        <span class="text-sm font-bold text-gray-700">Delivery Success Rate</span>
                        <span class="text-2xl font-bold text-green-600">${deliveryRate}%</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
                        <div class="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-1000 shadow-sm" style="width: ${deliveryRate}%"></div>
                    </div>
                    <p class="text-xs text-gray-400 mt-2 italic">Based on delivered orders vs total orders</p>
                </div>
                <div class="glass-card p-6 shadow-sm flex flex-col justify-center bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                    <p class="text-xs text-emerald-800 font-bold uppercase mb-2 tracking-wide">Total Revenue Generated</p>
                    <div class="flex items-center gap-2">
                         <span class="text-4xl font-black text-emerald-600 tracking-tight">₹${totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;

        // Orders Table (Improved)
        if (orders.length > 0) {
            let tableHtml = `
            <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-6">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                            <tr>
                                <th class="px-6 py-4">Order ID</th>
                                <th class="px-6 py-4">Customer</th>
                                <th class="px-6 py-4 text-right">Amount</th>
                                <th class="px-6 py-4 text-center">Status</th>
                                <th class="px-6 py-4 text-right">Date</th>
                            </tr>
                        </thead>
                    <tbody class="divide-y divide-gray-100">`;

            orders.slice(0, 50).forEach(o => {
                let statusClass = 'bg-gray-100 text-gray-600';
                if (o.status === 'Pending') statusClass = 'bg-yellow-100 text-yellow-700';
                else if (o.status === 'Address Verified') statusClass = 'bg-blue-100 text-blue-700';
                else if (o.status === 'Dispatched') statusClass = 'bg-purple-100 text-purple-700';
                else if (o.status === 'Delivered') statusClass = 'bg-green-100 text-green-700';

                tableHtml += `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-6 py-4 font-mono font-bold text-blue-600">${o.orderId}</td>
                        <td class="px-6 py-4 font-medium text-gray-800">${o.customerName}</td>
                        <td class="px-6 py-4 text-right font-bold text-gray-700">₹${o.total}</td>
                        <td class="px-6 py-4 text-center">
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${statusClass}">${o.status}</span>
                        </td>
                        <td class="px-6 py-4 text-right text-gray-500 text-xs font-mono">
                            ${o.timestamp ? new Date(o.timestamp).toLocaleDateString() : ''}
                        </td>
                    </tr>`;
            });
            tableHtml += '</tbody></table></div></div>';
            document.getElementById('empProgressTable').innerHTML = tableHtml;
        } else {
            document.getElementById('empProgressTable').innerHTML = `
                <div class="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 mt-6">
                    <p class="text-gray-400">No orders found for this period</p>
                </div>`;
        }
    } catch (e) {
        console.error(e);
        document.getElementById('empProgressStats').innerHTML = '<p class="text-center text-red-500 py-4">Failed to load data</p>';
    }
}

// ==================== DEPARTMENT PANEL ====================
function switchDispatchTab(tab) {
    document.getElementById('dispatchReadyTab').classList.add('hidden');
    document.getElementById('dispatchRequestsTab').classList.add('hidden');
    document.getElementById('dispatchDispatchedTab').classList.add('hidden');
    document.getElementById('dispatchHistoryTab').classList.add('hidden');

    if (tab === 'ready') {
        document.getElementById('dispatchReadyTab').classList.remove('hidden');
        setActiveDeptTab('deptTabReady');
        loadDeptOrders();
    } else if (tab === 'requests') {
        document.getElementById('dispatchRequestsTab').classList.remove('hidden');
        setActiveDeptTab('deptTabRequests');
        loadDeliveryRequests();
    } else if (tab === 'dispatched') {
        document.getElementById('dispatchDispatchedTab').classList.remove('hidden');
        setActiveDeptTab('deptTabDispatched');
        loadDispatchedOrders();
    } else if (tab === 'history') {
        document.getElementById('dispatchHistoryTab').classList.remove('hidden');
        setActiveDeptTab('deptTabDispatchHistory');
        loadDispatchHistory();
    }
}


// Delivery Department Tab Switching
function switchDeliveryTab(tab) {
    document.getElementById('deliveryOutForDeliveryTab').classList.add('hidden');
    document.getElementById('deliveryDeliveredTab').classList.add('hidden');
    document.getElementById('deliveryFailedTab').classList.add('hidden');
    document.getElementById('deliveryPerformanceTab').classList.add('hidden');

    if (tab === 'outfordelivery') {
        document.getElementById('deliveryOutForDeliveryTab').classList.remove('hidden');
        setActiveDeptTab('deptTabOutForDelivery');
        loadDeliveryOrders();
    } else if (tab === 'delivered') {
        document.getElementById('deliveryDeliveredTab').classList.remove('hidden');
        setActiveDeptTab('deptTabDelivered');
        loadDeliveredOrders();
    } else if (tab === 'failed') {
        document.getElementById('deliveryFailedTab').classList.remove('hidden');
        setActiveDeptTab('deptTabFailed');
        loadFailedDeliveries();
    } else if (tab === 'performance') {
        document.getElementById('deliveryPerformanceTab').classList.remove('hidden');
        setActiveDeptTab('deptTabPerformance');
        loadDeliveryPerformance();
    }
}


// Load Out for Delivery Orders
async function loadDeliveryOrders() {
    try {
        const res = await fetch(`${API_URL}/orders/dispatched`);
        const data = await res.json();
        const orders = data.orders || [];

        if (orders.length === 0) {
            document.getElementById('outForDeliveryList').innerHTML = '<p class="text-center text-gray-500 py-8">Koi order out for delivery nahi hai</p>';
            return;
        }

        let html = '';
        orders.forEach(order => {
            const hasShiprocket = order.shiprocket && order.shiprocket.awb;

            // Get tracking status badge
            let statusBadge = '';
            if (order.tracking && order.tracking.currentStatus) {
                const status = order.tracking.currentStatus;
                let badgeColor = 'bg-blue-500';
                if (status.includes('Delivered')) badgeColor = 'bg-green-500';
                else if (status.includes('Out for Delivery')) badgeColor = 'bg-purple-500';
                else if (status.includes('Transit')) badgeColor = 'bg-yellow-500';

                statusBadge = `<span class="${badgeColor} text-white text-xs px-2 py-1 rounded-full font-bold">${status}</span>`;
            }

            html += `
                    <div class="glass-card p-4 hover:shadow-lg transition-all" data-order-id="${order.orderId}">
                        ${hasShiprocket ? `
                        <div class="bg-orange-100 border-l-4 border-orange-500 p-3 rounded-lg mb-3">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-orange-600 font-bold text-xs">🚀 via Shiprocket</span>
                                ${statusBadge}
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <p class="text-gray-500 font-bold">AWB:</p>
                                    <p class="font-mono font-black text-orange-700">${order.shiprocket.awb}</p>
                                </div>
                                <div>
                                    <p class="text-gray-500 font-bold">Courier:</p>
                                    <p class="font-bold text-gray-800">${order.shiprocket.courierName || 'N/A'}</p>
                                </div>
                            </div>
                            ${order.tracking && order.tracking.lastUpdate ? `
                            <div class="mt-2 text-xs text-gray-600">
                                <p>📍 ${order.tracking.lastUpdate}</p>
                            </div>
                            ` : ''}
                        </div>
                        ` : ''}
                        
                        <div class="mb-3">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">${order.orderId}</span>
                                    <h4 class="font-bold text-lg text-gray-800 mt-1">${order.customerName}</h4>
                                </div>
                                <p class="text-xl font-black text-gray-800">₹${order.total}</p>
                            </div>
                            
                            <div class="text-sm text-gray-600 space-y-1">
                                <p>📞 ${order.telNo || order.mobile}</p>
                                <p class="line-clamp-2">📍 ${order.address}, ${order.pin}</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            ${hasShiprocket ? `
                            <button onclick="trackShiprocketOrder('${order.orderId}', '${order.shiprocket.awb}')" 
                                class="bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2">
                                🔍 Track
                            </button>
                            ` : '<div></div>'}
                            <button onclick="markAsDelivered('${order.orderId}')" 
                                class="bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2">
                                ✅ Delivered
                            </button>
                        </div>
                    </div>
                    `;
        });
        document.getElementById('outForDeliveryList').innerHTML = html;

        // Start auto-refresh if not already running
        startAutoTrackingRefresh();
    } catch (e) {
        console.error(e);
    }
}

// Track specific Shiprocket order (Manual)
async function trackShiprocketOrder(orderId, awb) {
    try {
        const res = await fetch(`${API_URL}/shiprocket/track/${awb}`);
        const data = await res.json();

        if (data.success && data.tracking) {
            const tracking = data.tracking;
            let statusText = 'Status: Unknown';
            let updates = 'No tracking updates available';

            if (tracking.tracking_data && tracking.tracking_data.shipment_track) {
                const track = tracking.tracking_data.shipment_track[0];
                statusText = `Status: ${track.current_status || 'In Transit'}`;

                if (track.shipment_track_activities && track.shipment_track_activities.length > 0) {
                    updates = track.shipment_track_activities.slice(0, 5).map(a =>
                        `📍 ${a.activity} - ${a.location || 'N/A'}\n   ${a.date}`
                    ).join('\n\n');
                }
            }

            alert(`🚀 Tracking: ${orderId}\nAWB: ${awb}\n${statusText}\n\n${updates}`);

            // Refresh the list to show updated status
            loadDeliveryOrders();
        } else {
            alert('❌ Tracking not available yet');
        }
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

// Auto-refresh tracking every 5 minutes
let trackingInterval = null;
function startAutoTrackingRefresh() {
    if (trackingInterval) return; // Already running

    trackingInterval = setInterval(async () => {
        // Only refresh if on delivery department and out for delivery tab
        if (currentPanel !== 'delivery') return;

        console.log('🔄 Auto-refreshing Shiprocket tracking...');

        try {
            const res = await fetch(`${API_URL}/orders/dispatched`);
            const data = await res.json();
            const orders = data.orders || [];

            // Update tracking for all Shiprocket orders
            for (const order of orders) {
                if (order.shiprocket && order.shiprocket.awb) {
                    await updateOrderTracking(order.orderId, order.shiprocket.awb);
                }
            }

            // Reload display
            loadDeliveryOrders();
        } catch (e) {
            console.error('Auto-refresh error:', e);
        }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('✅ Auto-tracking started (5 min intervals)');
}

// Update tracking for an order
async function updateOrderTracking(orderId, awb) {
    try {
        const res = await fetch(`${API_URL}/shiprocket/track/${awb}`);
        const data = await res.json();

        if (data.success && data.tracking) {
            const tracking = data.tracking;
            let currentStatus = 'In Transit';
            let lastUpdate = '';

            if (tracking.tracking_data && tracking.tracking_data.shipment_track) {
                const track = tracking.tracking_data.shipment_track[0];
                currentStatus = track.current_status || 'In Transit';

                if (track.shipment_track_activities && track.shipment_track_activities.length > 0) {
                    const latest = track.shipment_track_activities[0];
                    lastUpdate = `${latest.activity} - ${latest.location || 'N/A'}`;
                }
            }

            // Update order in backend
            await fetch(`${API_URL}/orders/update-tracking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    tracking: { currentStatus, lastUpdate }
                })
            });
        }
    } catch (e) {
        console.error('Tracking update error:', e);
    }
}

// Mark order as delivered
async function markAsDelivered(orderId) {
    if (!confirm('Mark this order as delivered?')) return;

    try {
        const res = await fetch(`${API_URL}/orders/deliver`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
        });
        const data = await res.json();

        if (data.success) {
            showSuccessPopup('Order Delivered! ✅', `${orderId} marked as delivered successfully!`, '📦', '#10b981');
            loadDeliveryOrders(); // Refresh list
        } else {
            alert('❌ ' + data.message);
        }
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

// Load Delivered Orders
async function loadDeliveredOrders() {
    try {
        const res = await fetch(`${API_URL}/orders/delivered`);
        const data = await res.json();
        const orders = data.orders || [];

        if (orders.length === 0) {
            document.getElementById('deliveredOrdersList').innerHTML = '<p class="text-center text-gray-500 py-8">Koi delivered order nahi hai</p>';
            return;
        }

        let html = '';
        orders.forEach(order => {
            html += renderOrderCard(order, 'green');
        });
        document.getElementById('deliveredOrdersList').innerHTML = html;
    } catch (e) {
        console.error(e);
    }
}

// Load Failed Deliveries
async function loadFailedDeliveries() {
    document.getElementById('failedDeliveriesList').innerHTML = '<p class="text-center text-gray-500 py-8">No failed deliveries recorded</p>';
}

// Load Delivery Performance
async function loadDeliveryPerformance() {
    try {
        const res = await fetch(`${API_URL}/orders/delivered`);
        const data = await res.json();
        let orders = data.orders || [];

        const startInput = document.getElementById('deliveryPerformanceStartDate');
        const endInput = document.getElementById('deliveryPerformanceEndDate');
        const start = startInput ? startInput.value : '';
        const end = endInput ? endInput.value : '';

        // CALCULATE STATS (Before filtering the list display, but after fetching all)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const countToday = orders.filter(o => {
            const d = new Date(o.deliveredAt || o.timestamp);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
        }).length;

        const countYesterday = orders.filter(o => {
            const d = new Date(o.deliveredAt || o.timestamp);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === yesterday.getTime();
        }).length;

        const countWeek = orders.filter(o => new Date(o.deliveredAt || o.timestamp) >= lastWeek).length;

        if (document.getElementById('statsDeliveryToday')) document.getElementById('statsDeliveryToday').textContent = countToday;
        if (document.getElementById('statsDeliveryYesterday')) document.getElementById('statsDeliveryYesterday').textContent = countYesterday;
        if (document.getElementById('statsDeliveryWeek')) document.getElementById('statsDeliveryWeek').textContent = countWeek;

        // Apply filters for the list display
        if (start) {
            orders = orders.filter(o => (o.deliveredAt || o.timestamp).split('T')[0] >= start);
        }
        if (end) {
            orders = orders.filter(o => (o.deliveredAt || o.timestamp).split('T')[0] <= end);
        }

        document.getElementById('deliveryPerformanceData').innerHTML = `
                    <div class="glass-card p-6">
                        <h4 class="font-bold text-lg mb-4">📊 Performance Overview</h4>
                        <p class="text-gray-600">Total Deliveries: <span class="font-bold text-green-600">${orders.length}</span></p>
                    </div>
                `;
    } catch (e) {
        console.error(e);
    }
}

// Filter Delivery Orders by Mobile
function filterDeliveryOrders(query) {
    const cards = document.querySelectorAll('#deliveryOutForDeliveryTab .order-card, #deliveryDeliveredTab .order-card');
    const lowerQuery = query.toLowerCase().trim();

    cards.forEach(card => {
        const mobile = card.getAttribute('data-mobile') || '';
        if (mobile.includes(lowerQuery) || !query) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Helper function to render order card
function renderOrderCard(order, borderColor = 'gray') {
    return `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border-2 border-${borderColor}-200 flex flex-col h-full">
                <!-- Card Header -->
                <div class="p-5 border-b border-gray-100 bg-gradient-to-r from-${borderColor}-50 to-white relative">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-${borderColor}-400 rounded-bl-full opacity-5 pointer-events-none"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="bg-${borderColor}-100 text-${borderColor}-700 text-xs font-bold px-2 py-0.5 rounded-md border border-${borderColor}-200 uppercase tracking-wide">
                                    ${order.orderId}
                                </span>
                                ${order.orderType === 'REORDER' ?
            '<span class="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-md border border-purple-200">REORDER</span>'
            : ''}
                            </div>
                            <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[180px]" title="${order.customerName}">
                                ${order.customerName}
                            </h3>
                        </div>
                        <div class="text-right">
                             <p class="text-xl font-black text-gray-800 tracking-tight">₹${order.total}</p>
                             <p class="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                COD: ₹${order.codAmount || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Card Body -->
                <div class="p-5 space-y-4 flex-grow bg-white/60">
                    
                    <!-- Contact Info -->
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                            📞
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Contact</p>
                            <p class="text-sm font-semibold text-gray-700 font-mono">${order.telNo}</p>
                            ${order.altNo ? `<p class="text-xs text-gray-500 font-mono mt-0.5">Alt: ${order.altNo}</p>` : ''}
                        </div>
                    </div>

                    <!-- Address Info -->
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                            📍
                        </div>
                        <div>
                             <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Delivery Location</p>
                             <p class="text-sm text-gray-600 leading-snug line-clamp-2" title="${order.address}">
                                ${order.address || 'No Address Provided'}
                             </p>
                             <div class="flex gap-2 mt-1.5 flex-wrap">
                                 <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium border border-gray-200">
                                    PIN: ${order.pin || 'N/A'}
                                 </span>
                                 <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium border border-gray-200">
                                    ${order.state || 'N/A'}
                                 </span>
                             </div>
                        </div>
                    </div>

                    <!-- Meta Info -->
                     <div class="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <span class="text-xs text-gray-400">📅 ${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'} ⏰ ${order.timestamp ? new Date(order.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        <span class="text-xs text-gray-300">•</span>
                        <span class="text-xs text-gray-400">By: <span class="font-extrabold text-emerald-700">${order.employee} (${order.employeeId})</span></span>
                    </div>

                </div>

                <!-- Footer Actions -->
                <div class="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white flex gap-2">
                    <button type="button" onclick="viewOrder('${order.orderId}')"
                        class="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 group">
                        <span class="group-hover:scale-110 transition-transform">👁️</span> View Details
                    </button>
                </div>
            </div>`;
}

async function loadDeptOrders() {
    const endpoint = currentDeptType === 'verification' ? '/orders/pending' : '/orders/verified';

    try {
        const res = await fetch(`${API_URL}${endpoint}`);
        const data = await res.json();
        let orders = data.orders || [];

        // Load dashboard stats in background
        if (currentDeptType === 'verification') {
            loadVerificationDashboardStats();
        }

        // Apply Date Filter if in Verification Pending tab
        const containerId = currentDeptType === 'verification' ? 'pendingVerificationList' : 'readyDispatchList';

        if (currentDeptType === 'verification' && containerId === 'pendingVerificationList') {
            const dateFilter = document.getElementById('verificationPendingDate').value;
            if (dateFilter) {
                orders = orders.filter(o => o.timestamp && o.timestamp.startsWith(dateFilter));
            }
        }

        // Apply Filters for Dispatch Ready Tab - NEW FEATURE
        if (currentDeptType === 'dispatch' && containerId === 'readyDispatchList') {
            // Load dashboard stats in background
            loadDispatchDashboardStats();

            // Search Filter
            const search = document.getElementById('dispatchReadySearch')?.value.toLowerCase();
            if (search) {
                orders = orders.filter(o =>
                    (o.customerName && o.customerName.toLowerCase().includes(search)) ||
                    (o.telNo && o.telNo.includes(search)) ||
                    (o.orderId && o.orderId.toLowerCase().includes(search))
                );
            }

            // Date Filter
            const dateFilter = document.getElementById('dispatchReadyDate')?.value;
            if (dateFilter) {
                orders = orders.filter(o => o.timestamp && o.timestamp.startsWith(dateFilter));
            }
        }

        // Sort orders by date - oldest first
        orders.sort((a, b) => {
            const dateA = new Date(a.timestamp || 0);
            const dateB = new Date(b.timestamp || 0);
            return dateA - dateB; // Ascending order (oldest first)
        });

        if (orders.length === 0) {
            document.getElementById(containerId).innerHTML = `
                <div class="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p class="text-4xl mb-3">📭</p>
                    <p class="text-gray-500 font-medium">No pending orders found</p>
                </div>`;
            return;
        }

        // Group orders by date categories for better organization
        const groups = {
            today: [],
            yesterday: [],
            recent: [], // 2-6 days
            week: [], // 7-29 days
            old: [] // 30+ days
        };

        orders.forEach(order => {
            const diffDays = Math.floor((Date.now() - new Date(order.timestamp)) / 86400000);
            if (diffDays === 0) groups.today.push(order);
            else if (diffDays === 1) groups.yesterday.push(order);
            else if (diffDays < 7) groups.recent.push(order);
            else if (diffDays < 30) groups.week.push(order);
            else groups.old.push(order);
        });

        let html = '';

        // TODAY section
        if (groups.today.length > 0) {
            html += `<div id="section-today" class="col-span-full"><div class="flex items-center gap-3 mb-4 pb-2 border-b-2 border-emerald-200"><span class="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wide border-2 border-emerald-300">⏰ TODAY</span><span class="text-emerald-600 font-bold text-sm">${groups.today.length} order${groups.today.length > 1 ? 's' : ''}</span></div></div>`;
            groups.today.forEach(order => { html += generateOrderCardHTML(order); });
        }

        // YESTERDAY section
        if (groups.yesterday.length > 0) {
            html += `<div id="section-yesterday" class="col-span-full mt-6"><div class="flex items-center gap-3 mb-4 pb-2 border-b-2 border-blue-200"><span class="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wide border-2 border-blue-300">📅 YESTERDAY</span><span class="text-blue-600 font-bold text-sm">${groups.yesterday.length} order${groups.yesterday.length > 1 ? 's' : ''}</span></div></div>`;
            groups.yesterday.forEach(order => { html += generateOrderCardHTML(order); });
        }

        // 2-6 DAYS section
        if (groups.recent.length > 0) {
            html += `<div id="section-recent" class="col-span-full mt-6"><div class="flex items-center gap-3 mb-4 pb-2 border-b-2 border-amber-200"><span class="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wide border-2 border-amber-300">🕐 2-6 DAYS AGO</span><span class="text-amber-600 font-bold text-sm">${groups.recent.length} order${groups.recent.length > 1 ? 's' : ''}</span></div></div>`;
            groups.recent.forEach(order => { html += generateOrderCardHTML(order); });
        }

        // WEEKS section
        if (groups.week.length > 0) {
            html += `<div id="section-week" class="col-span-full mt-6"><div class="flex items-center gap-3 mb-4 pb-2 border-b-2 border-orange-200"><span class="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wide border-2 border-orange-300">📆 1-4 WEEKS AGO</span><span class="text-orange-600 font-bold text-sm">${groups.week.length} order${groups.week.length > 1 ? 's' : ''}</span></div></div>`;
            groups.week.forEach(order => { html += generateOrderCardHTML(order); });
        }

        // OLD section
        if (groups.old.length > 0) {
            html += `<div id="section-old" class="col-span-full mt-6"><div class="flex items-center gap-3 mb-4 pb-2 border-b-2 border-red-200"><span class="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wide border-2 border-red-300">⚠️ 1+ MONTHS AGO</span><span class="text-red-600 font-bold text-sm">${groups.old.length} order${groups.old.length > 1 ? 's' : ''}</span></div></div>`;
            groups.old.forEach(order => { html += generateOrderCardHTML(order); });
        }

        // Populate filter buttons if in verification pending tab
        if (currentDeptType === 'verification' && containerId === 'pendingVerificationList') {
            const filterContainer = document.getElementById('filterButtonsContainer');
            const filterButtons = document.getElementById('dateFilterButtons');

            if (filterContainer && filterButtons) {
                let buttonsHTML = '';

                if (groups.today.length > 0) {
                    buttonsHTML += `<button onclick="document.getElementById('section-today')?.scrollIntoView({behavior:'smooth', block:'start'})" class="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-1.5 hover:shadow-md">⏰ TODAY <span class="bg-white text-emerald-600 px-2 py-0.5 rounded-full">${groups.today.length}</span></button>`;
                }
                if (groups.yesterday.length > 0) {
                    buttonsHTML += `<button onclick="document.getElementById('section-yesterday')?.scrollIntoView({behavior:'smooth', block:'start'})" class="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600 transition-all shadow-sm flex items-center gap-1.5 hover:shadow-md">📅 YESTERDAY <span class="bg-white text-blue-600 px-2 py-0.5 rounded-full">${groups.yesterday.length}</span></button>`;
                }
                if (groups.recent.length > 0) {
                    buttonsHTML += `<button onclick="document.getElementById('section-recent')?.scrollIntoView({behavior:'smooth', block:'start'})" class="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-600 transition-all shadow-sm flex items-center gap-1.5 hover:shadow-md">🕐 2-6 DAYS <span class="bg-white text-amber-600 px-2 py-0.5 rounded-full">${groups.recent.length}</span></button>`;
                }
                if (groups.week.length > 0) {
                    buttonsHTML += `<button onclick="document.getElementById('section-week')?.scrollIntoView({behavior:'smooth', block:'start'})" class="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 transition-all shadow-sm flex items-center gap-1.5 hover:shadow-md">📆 1-4 WEEKS <span class="bg-white text-orange-600 px-2 py-0.5 rounded-full">${groups.week.length}</span></button>`;
                }
                if (groups.old.length > 0) {
                    buttonsHTML += `<button onclick="document.getElementById('section-old')?.scrollIntoView({behavior:'smooth', block:'start'})" class="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition-all shadow-sm flex items-center gap-1.5 hover:shadow-md">⚠️ 1+ MONTHS <span class="bg-white text-red-600 px-2 py-0.5 rounded-full">${groups.old.length}</span></button>`;
                }

                filterContainer.innerHTML = buttonsHTML;
                filterButtons.classList.remove('hidden');
            }
        }

        document.getElementById(containerId).innerHTML = html;
    }

    catch (e) {
        console.error(e);
    }
}

// Helper to Title Case a string
function toTitleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Generate order card HTML
function generateOrderCardHTML(order) {
    const isVerification = currentDeptType === 'verification';
    const statusColor = isVerification ? 'blue' : 'emerald';

    // Icon SVGs
    const phoneIcon = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>`;
    const locationIcon = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

    return `
    <div class="relative overflow-hidden hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200/60 flex flex-col h-full shadow-lg hover:shadow-2xl" style="backdrop-filter: blur(10px);">
        <!-- Premium Header with Gradient -->
        <div class="px-4 py-3 border-b border-${statusColor}-100 bg-gradient-to-r from-${statusColor}-50 via-${statusColor}-100/50 to-${statusColor}-50 flex justify-between items-center relative overflow-hidden">
            <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: radial-gradient(circle, rgba(255,255,255,0.3), transparent); border-radius: 50%;"></div>
            <div class="flex items-center gap-2 z-10">
                <span class="bg-gradient-to-r from-${statusColor}-500 to-${statusColor}-600 text-white px-3 py-1 rounded-lg font-black text-xs shadow-lg shadow-${statusColor}-200/50 tracking-wide">${order.orderId}</span>
                <button onclick="sendWhatsAppDirect('${isVerification ? 'booked' : 'dispatched'}', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                    class="w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-full flex items-center justify-center hover:scale-110 shadow-lg shadow-green-200/50 transition-all" title="Send WhatsApp">
                    ${WHATSAPP_ICON}
                </button>
                ${order.orderType === 'REORDER' ? `<span class="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-md">REORDER</span>` : ''}
            </div>
            <div class="text-gray-900 font-black text-sm z-10">₹${order.total} <span class="text-emerald-600 ml-1 font-extrabold">COD: ₹${order.codAmount || 0}</span></div>
        </div>

        <!-- Body Section with Modern Layout -->
        <div class="p-4 space-y-3 flex-grow">
            <!-- Name & Timestamp -->
            <div class="flex justify-between items-start gap-3">
                <h3 class="font-black text-gray-900 text-lg leading-tight truncate flex-grow bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text" title="${order.customerName}">${order.customerName}</h3>
                <div class="flex items-center gap-1 text-[10px] text-gray-500 font-bold shrink-0 bg-gradient-to-r from-gray-100 to-gray-50 px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
                   📅 ${(() => {
            if (!order.timestamp) return 'N/A';
            const dateObj = new Date(order.timestamp);
            const days = Math.floor((Date.now() - dateObj) / 86400000);
            const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const dayLabel = days === 0 ? 'Today' : days === 1 ? 'Yest.' : days + 'd ago';
            return `${dayLabel} ${timeStr}`;
        })()}
                </div>
            </div>
            
            <!-- Employee Badge -->
            ${order.employeeId || order.createdBy || order.employee ? `
            <div class="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-1.5 rounded-lg border border-purple-200/50 shadow-sm">
                <span class="text-purple-600 text-xs">👤</span>
                <span class="text-xs font-bold text-purple-700">
                    ${order.employee ? `${order.employee}${order.employeeId ? ` (${order.employeeId})` : ''}` : (order.employeeId || order.createdBy)}
                </span>
            </div>
            ` : ''}
            
            <!-- Contact Card -->
            <div class="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-2 rounded-xl border border-blue-200/50 shadow-sm">
                <span class="text-blue-500">${phoneIcon}</span>
                <span class="text-sm font-black font-mono tracking-wide text-blue-900">${order.telNo}</span>
                ${order.altNo ? `<span class="text-[10px] text-gray-500 font-bold ml-auto bg-white px-2 py-0.5 rounded-full">ALT: ${order.altNo}</span>` : ''}
            </div>

            <!-- Address Card -->
            <div class="space-y-2 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-3 rounded-xl border border-amber-200/40">
                <div class="flex items-center gap-1.5 text-amber-600 font-black text-[10px] uppercase tracking-wider">
                    ${locationIcon} <span class="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Address Details</span>
                </div>
                <p class="text-xs text-gray-800 font-semibold leading-relaxed line-clamp-3 capitalize">
                    ${toTitleCase(order.address) || 'No Address Provided'}
                </p>
                <div class="flex gap-2 items-center pt-1">
                    <span class="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-sm">PIN: ${order.pin || 'N/A'}</span>
                    <span class="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-sm capitalize">${order.state || 'N/A'}</span>
                    <button onclick="copyAddress('${order.address ? order.address.replace(/'/g, "\\'") : ""}')\" 
                        class="text-[10px] text-blue-600 hover:text-blue-700 font-black ml-auto flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-blue-200 hover:border-blue-300 transition-all shadow-sm">📋 COPY</button>
                </div>
            </div>
        </div>

        <!-- Remarks Section -->
        ${isVerification ? `
        <div class="px-4 py-2.5 bg-amber-50/50 border-t border-amber-100 flex items-center gap-2">
            <input type="text" id="remark-${order.orderId}" placeholder="Add remark..."
                class="flex-grow text-xs border border-amber-200 rounded-lg px-3 py-2 focus:border-amber-400 outline-none bg-white font-bold text-gray-600 shadow-inner"
                value="${order.verificationRemark?.text || ''}">
            <button type="button" onclick="saveOrderRemark('${order.orderId}')"
                class="bg-amber-500 text-white p-2 rounded-lg hover:bg-amber-600 transition-all shadow-sm active:scale-90 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            </button>
        </div>
        ` : ''}

        <!-- Actions Footer with Modern Design -->
        <div class="px-4 py-3.5 bg-gray-50/70 border-t border-gray-100 space-y-2.5">
            ${isVerification ? `
                <!-- Primary Action -->
                <button type="button" onclick="verifyAddress('${order.orderId}', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                    class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-xl text-xs font-black shadow-xl shadow-blue-300/40 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest">✅ VERIFY ADDRESS</button>
                
                <!-- Quick Actions Row -->
                <div class="grid grid-cols-3 gap-2">
                    <button type="button" onclick="openEditOrderModal('${order.orderId}')" 
                        class="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-amber-300/40 hover:shadow-xl hover:scale-105 active:scale-95 transition-all">✏️ EDIT</button>
                    <button type="button" onclick="cancelOrder('${order.orderId}')" 
                        class="bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-red-300/40 hover:shadow-xl hover:scale-105 active:scale-95 transition-all">❌ CANCEL</button>
                    <button type="button" onclick="viewOrderDetails('${order.orderId}')" 
                        class="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-gray-300/40 hover:shadow-xl hover:scale-105 active:scale-95 transition-all">👁️ VIEW</button>
                </div>

                <!-- Hold Button -->
                <button type="button" onclick="markAsUnverified('${order.orderId}')" 
                    class="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-xl text-xs font-black shadow-lg shadow-amber-300/40 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest">⏸️ HOLD ORDER</button>

                <!-- Courier Suggestion -->
                <div class="pt-2 border-t border-gray-100">
                    <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">💡 Suggest Courier for Dispatch</label>
                    <select id="courierSelect_${order.orderId}" 
                        class="w-full border border-purple-200 rounded-lg px-3 py-2 text-xs bg-white font-bold text-gray-700 outline-none focus:border-purple-500 shadow-sm">
                        <option value="">Optional - Select if known...</option>
                        <option value="Delhivery">📦 Delhivery</option>
                        <option value="BlueDart">📦 BlueDart</option>
                        <option value="DTDC">📦 DTDC</option>
                        <option value="Ecom Express">📦 Ecom Express</option>
                        <option value="Shiprocket">🚀 Shiprocket</option>
                        <option value="India Post">📮 India Post</option>
                    </select>
                </div>
            ` : (order.status === 'Dispatched' ? `
                <!-- Courier Suggestion Badge for Dispatched Orders -->
                ${order.suggestedCourier || order.courierSuggestion?.suggestedCourier ? `
                <div class="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 p-3 rounded-xl mx-4 mt-2 shadow-sm">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">💡</span>
                        <div class="flex-grow">
                            <div class="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Verification Suggested</div>
                            <div class="text-sm font-black text-purple-800">${order.suggestedCourier || order.courierSuggestion?.suggestedCourier}</div>
                        </div>
                        <span class="bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">USED</span>
                    </div>
                    ${order.courierSuggestion?.suggestedBy ? `<div class="text-[10px] text-purple-500 mt-1 ml-8">By: ${order.courierSuggestion.suggestedBy}</div>` : ''}
                </div>
                ` : ''}
                
                <!-- Already Dispatched Actions with Modern Design -->
                <div class="space-y-2.5 pt-1 px-4 pb-4">
                    <button type="button" onclick="approveDelivery('${order.orderId}')" 
                        class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-xl text-xs font-black shadow-xl shadow-blue-300/40 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest">✅ MARK DELIVERED</button>
                    <div class="grid grid-cols-3 gap-2">
                        <button type="button" onclick="editDispatchedOrder('${order.orderId}', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                            class="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-amber-300/40 hover:shadow-xl hover:scale-105 active:scale-95 transition-all">✏️ EDIT</button>
                        <button type="button" onclick="revertDispatch('${order.orderId}')" 
                            class="bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-rose-300/40 hover:shadow-xl hover:scale-105 active:scale-95 transition-all">🔙 REVERT</button>
                        <button type="button" onclick="viewOrderDetails('${order.orderId}')" 
                            class="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-gray-300/40 hover:shadow-xl hover:scale-105 active:scale-95 transition-all">👁️ VIEW</button>
                    </div>
                    ${(order.tracking?.trackingId || order.shiprocket?.awb) ? `
                    <div class="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 p-3.5 rounded-xl space-y-2 shadow-sm">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] font-black text-indigo-700 uppercase bg-white px-2 py-1 rounded-lg shadow-sm">${order.tracking?.courier || 'Shiprocket'}</span>
                            <span class="text-[11px] font-mono font-bold text-gray-700 bg-white px-2 py-1 rounded-lg">${order.tracking?.trackingId || order.shiprocket?.awb}</span>
                        </div>
                        ${order.tracking?.currentStatus ? `
                        <div class="pt-2 border-t border-indigo-200">
                            <div class="text-[10px] font-bold text-gray-500 uppercase mb-1">Status</div>
                            <div class="text-xs font-black text-indigo-800">${order.tracking.currentStatus}</div>
                            ${order.tracking.lastUpdate ? `<div class="text-[10px] text-gray-600 mt-1">${order.tracking.lastUpdate}</div>` : ''}
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                </div>
            ` : `
                <!-- Suggested Courier Badge -->
                ${order.suggestedCourier ? `
                <div class="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 p-3 rounded-xl mb-3 shadow-sm">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">💡</span>
                        <div class="flex-grow">
                            <div class="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Verification Suggested</div>
                            <div class="text-sm font-black text-purple-800">${order.suggestedCourier}</div>
                        </div>
                        <span class="bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">RECOMMENDED</span>
                    </div>
                </div>
                ` : ''}
                
                <!-- Dispatch Actions with Modern Design -->
                <div class="space-y-2.5 pt-1 px-4 pb-4">
                    <!-- Primary Action -->
                    <button type="button" onclick="dispatchWithShiprocket('${order.orderId}', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                        class="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-3.5 rounded-xl text-xs font-black shadow-xl shadow-orange-300/50 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">🚀 SHIPROCKET DISPATCH</button>
                    
                    <!-- Quick Actions Row -->
                    <div class="grid grid-cols-3 gap-2">
                        <button type="button" onclick="editDispatchOrder('${order.orderId}', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                            class="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-amber-300/40 hover:shadow-xl hover:scale-105 active:scale-95 transition-all">✏️ EDIT</button>
                        <button type="button" onclick="cancelOrder('${order.orderId}')" 
                            class="bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-red-300/40 hover:shadow-xl hover:scale-105 active:scale-95 transition-all">❌ CANCEL</button>
                        <button type="button" onclick="viewOrderDetails('${order.orderId}')" 
                            class="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-gray-300/40 hover:shadow-xl hover:scale-105 active:scale-95 transition-all">👁️ VIEW</button>
                    </div>
                    
                    <!-- Manual Dispatch -->
                    <button type="button" onclick="openDispatchModal('${order.orderId}', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                        class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-xl text-xs font-black shadow-lg shadow-purple-300/40 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all">📦 MANUAL DISPATCH</button>
                </div>
            `)}
        </div>
    </div>`;
}

async function loadDeliveryRequests() {
    try {
        const res = await fetch(`${API_URL}/orders/delivery-requests`);
        const data = await res.json();
        const requests = data.requests || [];

        document.getElementById('requestsCount').textContent = requests.length;

        if (requests.length === 0) {
            document.getElementById('deliveryRequestsList').innerHTML = '<p class="text-center text-gray-500 py-8">Koi delivery requests nahi hain</p>';
            return;
        }

        let html = '';

        requests.forEach(req => {
            html += ` <div class="order-card bg-white border rounded-xl p-4 border-l-4 border-l-pink-500"> <div class="flex justify-between items-start"> <div> <p class="font-bold text-blue-600">${req.orderId}

                        </p> <p class="text-gray-800">${req.customerName}

                        </p> <p class="text-sm text-gray-500">Requested by: <strong>${req.employeeName}

                        </strong> (${req.employeeId})</p> <p class="text-xs text-gray-400">${new Date(req.requestedAt).toLocaleString()
                }

                        </p> </div> <div class="flex gap-2"> <button type="button" onclick="approveDelivery('${req.orderId}')" class="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600">✅ Approve Delivered</button> </div> </div> </div> `;
        });
        document.getElementById('deliveryRequestsList').innerHTML = html;
    }

    catch (e) {
        console.error(e);
    }
}

async function loadDispatchedOrders() {
    try {
        const res = await fetch(`${API_URL}/orders/dispatched`);

        // Check if response is OK and content-type is JSON
        if (!res.ok) {
            console.error('API Error:', res.status, res.statusText);
            const text = await res.text();
            console.error('Response:', text);
            throw new Error(`Server error: ${res.status}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error('Expected JSON but got:', contentType);
            console.error('Response:', text);
            throw new Error('Server returned non-JSON response');
        }

        const data = await res.json();
        let orders = data.orders || [];

        // Apply Search Filter
        const search = document.getElementById('dispatchedSearch')?.value.toLowerCase();
        if (search) {
            orders = orders.filter(o =>
                (o.customerName && o.customerName.toLowerCase().includes(search)) ||
                (o.telNo && o.telNo.includes(search)) ||
                (o.orderId && o.orderId.toLowerCase().includes(search))
            );
        }

        // Apply Date Filter
        const dateFilter = document.getElementById('dispatchedDateFilter')?.value;
        if (dateFilter) {
            orders = orders.filter(o => {
                const dateStr = o.dispatchedAt ? o.dispatchedAt.split('T')[0] : (o.timestamp ? o.timestamp.split('T')[0] : null);
                return dateStr === dateFilter;
            });
        }

        if (orders.length === 0) {
            document.getElementById('dispatchedOrdersList').innerHTML = `
                <div class="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p class="text-4xl mb-3">🚚</p>
                    <p class="text-gray-500 font-medium">No dispatched orders found matching filters</p>
                </div>`;
            return;
        }

        // Sort by Dispatched Date (newest first)
        orders.sort((a, b) => {
            const dateA = new Date(a.dispatchedAt || a.timestamp);
            const dateB = new Date(b.dispatchedAt || b.timestamp);
            return dateB - dateA;
        });

        let html = '';
        let lastDate = '';

        orders.forEach(order => {
            const dateStr = order.dispatchedAt ? order.dispatchedAt.split('T')[0] : (order.timestamp ? order.timestamp.split('T')[0] : 'N/A');

            if (dateStr !== lastDate) {
                const displayDate = new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const isTodayStr = new Date().toISOString().split('T')[0] === dateStr;

                html += `
                <div class="col-span-full mt-6 mb-2">
                    <div class="flex items-center gap-4">
                        <span class="bg-${isTodayStr ? 'indigo' : 'gray'}-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                            ${isTodayStr ? 'Today' : displayDate}
                        </span>
                        <div class="h-[2px] flex-grow bg-gradient-to-r from-${isTodayStr ? 'indigo' : 'gray'}-200 to-transparent rounded-full"></div>
                    </div>
                </div>`;
                lastDate = dateStr;
            }

            html += generateOrderCardHTML(order, false); // false = dispatch style
        });

        document.getElementById('dispatchedOrdersList').innerHTML = html;
    } catch (e) {
        console.error('Load Dispatched Orders Error:', e);
        document.getElementById('dispatchedOrdersList').innerHTML = '<p class="text-red-500 text-center py-8">Orders load karne mein error aaya.</p>';
    }
}

// Copy Address Function
function copyAddress(address) {
    if (!address || address === 'No Address Provided') {
        alert('No address to copy!');
        return;
    }

    const formattedAddress = toTitleCase(address);
    navigator.clipboard.writeText(formattedAddress).then(() => {
        showSuccessPopup(
            'Address Copied! 📋',
            `Clipboard mein copy ho gaya!\n\n${address}`,
            '📋',
            '#3b82f6'
        );
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('Failed to copy address. Please try manually.');
    });
}

async function verifyAddress(orderId, order = null) {
    if (!confirm('Address verify karke Dispatch Department ko bhejni hai?')) return;

    try {
        // Get selected courier suggestion
        const courierSelect = document.getElementById(`courierSelect_${orderId}`);
        const suggestedCourier = courierSelect?.value || null;

        const res = await fetch(`${API_URL}/orders/${orderId}/verify`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                verifiedBy: currentUser.id,
                suggestedCourier: suggestedCourier
            })
        });
        const data = await res.json();

        if (data.success) {
            const whatsappData = order ? { type: 'verified', order: order } : null;
            const courierMsg = suggestedCourier ? `\n\n💡 Suggested Courier: ${suggestedCourier}` : '';
            showSuccessPopup(
                'Address Verified! ✅',
                `Order ${orderId} successfully verified!${courierMsg}\n\nAb yeh Dispatch Department mein chala gaya hai.`,
                '✅',
                '#10b981',
                whatsappData
            );
            setTimeout(() => {
                loadDeptOrders();
                loadVerificationHistory();
            }, 1000);
        }
    }

    catch (e) {
        console.error(e);
    }
}

// Cancel Order Function - NEW FEATURE
async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }

    const reason = prompt('Cancellation reason (required):');
    if (!reason || reason.trim() === '') {
        alert('Cancellation reason is required!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reason: reason.trim(),
                cancelledBy: currentUser.id || 'verification'
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccessPopup(
                'Order Cancelled! ❌',
                `Order ${orderId} cancelled successfully!\\n\\nReason: ${reason}`,
                '❌',
                '#ef4444'
            );
            setTimeout(() => loadDeptOrders(), 1000);
        } else {
            alert('Failed to cancel order: ' + data.message);
        }
    } catch (error) {
        console.error('Cancel error:', error);
        alert('Error cancelling order. Please try again.');
    }
}

// Suggest Courier Function - NEW FEATURE
async function suggestCourier(orderId) {
    const courierSelect = document.getElementById(`courierSelect_${orderId}`);
    const courier = courierSelect?.value;

    if (!courier) {
        alert('Please select a courier!');
        return;
    }

    const note = prompt('Add a note for dispatch team (optional):');

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/suggest-courier`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courier: courier,
                note: note || '',
                suggestedBy: currentUser.id || 'verification'
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccessPopup(
                'Courier Suggested! 📦',
                `Suggested ${courier} for Order ${orderId}!\\n\\nDispatch team will see this recommendation.`,
                '📦',
                '#9333ea'
            );
            // Don't reload, just reset the dropdown
            courierSelect.value = '';
        } else {
            alert('Failed to suggest courier: ' + data.message);
        }
    } catch (error) {
        console.error('Courier suggest error:', error);
        alert('Error suggesting courier. Please try again.');
    }
}

// Revert Dispatch - Move order back from Dispatched to Ready for Dispatch
async function revertDispatch(orderId) {
    const reason = prompt('Revert karne ka reason batao (e.g., Galti se dispatch, Wrong address, etc.):');

    if (reason === null) return; // User cancelled

    if (!reason.trim()) {
        alert('Please provide a reason for reverting the dispatch!');
        return;
    }

    if (!confirm(`⚠️ Kya aap sure ho?\n\nOrder "${orderId}" wapas "Ready for Dispatch" mein chala jayega.\n\nNote: Shiprocket mein order manually cancel karna padega!`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/revert-dispatch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reason: reason.trim(),
                revertedBy: currentUser?.id || currentUser?.name || 'Dispatch Dept'
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccessPopup(
                'Order Reverted! 🔙',
                `Order ${orderId} wapas "Ready for Dispatch" mein aa gaya!\n\nReason: ${reason}\n\n⚠️ Shiprocket mein manually cancel karo!`,
                '🔙',
                '#ec4899'
            );

            // Reload the dispatched orders list
            setTimeout(() => {
                if (typeof loadDispatchedOrders === 'function') loadDispatchedOrders();
                if (typeof loadDeptOrders === 'function') loadDeptOrders();
                if (typeof loadDispatchHistory === 'function') loadDispatchHistory();
            }, 1000);
        } else {
            alert('Failed to revert dispatch: ' + data.message);
        }
    } catch (error) {
        console.error('Revert dispatch error:', error);
        alert('Error reverting dispatch. Please try again.');
    }
}

// Load Dispatch Dashboard Stats (Mini Dashboard)
async function loadDispatchDashboardStats() {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        const orders = data.orders || [];

        const today = new Date().toDateString();
        const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toDateString();
        const lastWeek = new Date(new Date().setDate(new Date().getDate() - 7));

        const dispatchedOrders = orders.filter(o => ['Dispatched', 'Delivered'].includes(o.status));

        const countToday = dispatchedOrders.filter(o => {
            const d = o.dispatchedAt ? new Date(o.dispatchedAt) : new Date(o.timestamp);
            return d.toDateString() === today;
        }).length;

        const countYesterday = dispatchedOrders.filter(o => {
            const d = o.dispatchedAt ? new Date(o.dispatchedAt) : new Date(o.timestamp);
            return d.toDateString() === yesterday;
        }).length;

        const countWeek = dispatchedOrders.filter(o => {
            const d = o.dispatchedAt ? new Date(o.dispatchedAt) : new Date(o.timestamp);
            return d >= lastWeek;
        }).length;

        document.getElementById('miniStatDispatchToday').textContent = countToday;
        document.getElementById('miniStatDispatchYesterday').textContent = countYesterday;
        document.getElementById('miniStatDispatchWeek').textContent = countWeek;

    } catch (e) {
        console.error('Failed to load dispatch stats:', e);
    }
}

async function loadVerificationDashboardStats() {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        const orders = data.orders || [];

        const today = new Date().toDateString();
        const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toDateString();
        const lastWeek = new Date(new Date().setDate(new Date().getDate() - 7));

        const verifiedOrders = orders.filter(o => ['Address Verified', 'Dispatched', 'Delivered'].includes(o.status));

        const countToday = verifiedOrders.filter(o => {
            const d = o.verifiedAt ? new Date(o.verifiedAt) : new Date(o.timestamp);
            return d.toDateString() === today;
        }).length;

        const countYesterday = verifiedOrders.filter(o => {
            const d = o.verifiedAt ? new Date(o.verifiedAt) : new Date(o.timestamp);
            return d.toDateString() === yesterday;
        }).length;

        const countWeek = verifiedOrders.filter(o => {
            const d = o.verifiedAt ? new Date(o.verifiedAt) : new Date(o.timestamp);
            return d >= lastWeek;
        }).length;

        if (document.getElementById('miniStatVerifyToday')) {
            document.getElementById('miniStatVerifyToday').textContent = countToday;
            document.getElementById('miniStatVerifyYesterday').textContent = countYesterday;
            document.getElementById('miniStatVerifyWeek').textContent = countWeek;
        }

        // Also update actual stats on History tab if present
        if (document.getElementById('statsVerifyToday')) {
            document.getElementById('statsVerifyToday').textContent = countToday;
            document.getElementById('statsVerifyYesterday').textContent = countYesterday;
            document.getElementById('statsVerifyWeek').textContent = countWeek;
        }

    } catch (e) {
        console.error('Verify Stats Error:', e);
    }
}

async function loadDispatchHistory() {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        let orders = data.orders || [];

        // Filter for Dispatched/Delivered only for this view
        orders = orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered');

        // DEBUG: Check AWB data
        console.log('📦 Dispatched Orders AWB Check:');
        orders.slice(0, 3).forEach(o => {
            console.log(`${o.orderId}:`, {
                'tracking.trackingId': o.tracking?.trackingId,
                'shiprocket.awb': o.shiprocket?.awb,
                'tracking': o.tracking,
                'shiprocket': o.shiprocket
            });
        });

        // CALCULATE STATS
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const countToday = orders.filter(o => {
            const dateStr = o.dispatchedAt ? o.dispatchedAt.split('T')[0] : (o.timestamp ? o.timestamp.split('T')[0] : null);
            return dateStr === today.toISOString().split('T')[0];
        }).length;

        const countYesterday = orders.filter(o => {
            const dateStr = o.dispatchedAt ? o.dispatchedAt.split('T')[0] : (o.timestamp ? o.timestamp.split('T')[0] : null);
            return dateStr === yesterday.toISOString().split('T')[0];
        }).length;

        const countWeek = orders.filter(o => {
            const date = o.dispatchedAt ? new Date(o.dispatchedAt) : new Date(o.timestamp);
            return date >= lastWeek;
        }).length;

        document.getElementById('statsDispatchToday').textContent = countToday;
        document.getElementById('statsDispatchYesterday').textContent = countYesterday;
        document.getElementById('statsDispatchWeek').textContent = countWeek;

        // Update mini stats in Ready tab too if they exist
        if (document.getElementById('miniStatDispatchToday')) {
            document.getElementById('miniStatDispatchToday').textContent = countToday;
            document.getElementById('miniStatDispatchYesterday').textContent = countYesterday;
            document.getElementById('miniStatDispatchWeek').textContent = countWeek;
        }

        // FILTERS
        const search = document.getElementById('dispatchHistorySearch').value.toLowerCase();
        const startDate = document.getElementById('dispatchHistoryStart').value;
        const endDate = document.getElementById('dispatchHistoryEnd').value;

        if (search) {
            orders = orders.filter(o =>
                (o.customerName && o.customerName.toLowerCase().includes(search)) ||
                (o.telNo && o.telNo.includes(search)) ||
                (o.orderId && o.orderId.toLowerCase().includes(search))
            );
        }

        if (startDate) {
            orders = orders.filter(o => {
                const dateStr = o.dispatchedAt ? o.dispatchedAt.split('T')[0] : o.timestamp.split('T')[0];
                return dateStr >= startDate;
            });
        }
        if (endDate) {
            orders = orders.filter(o => {
                const dateStr = o.dispatchedAt ? o.dispatchedAt.split('T')[0] : o.timestamp.split('T')[0];
                return dateStr <= endDate;
            });
        }

        if (orders.length === 0) {
            document.getElementById('dispatchHistoryList').innerHTML = `
                <div class="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p class="text-4xl mb-3">📭</p>
                    <p class="text-gray-500 font-medium">No dispatch history found matching filters</p>
                </div>`;
            return;
        }

        // Sort by Dispatched Date (newest first)
        orders.sort((a, b) => {
            const dateA = new Date(a.dispatchedAt || a.timestamp);
            const dateB = new Date(b.dispatchedAt || b.timestamp);
            return dateB - dateA;
        });

        let html = '';
        let lastDate = '';

        orders.forEach(order => {
            const dateStr = order.dispatchedAt ? order.dispatchedAt.split('T')[0] : (order.timestamp ? order.timestamp.split('T')[0] : 'N/A');

            if (dateStr !== lastDate) {
                const displayDate = new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const isTodayStr = new Date().toISOString().split('T')[0] === dateStr;

                html += `
                <div class="col-span-full mt-6 mb-2">
                    <div class="flex items-center gap-4">
                        <span class="bg-${isTodayStr ? 'indigo' : 'gray'}-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                            ${isTodayStr ? 'Today' : displayDate}
                        </span>
                        <div class="h-[2px] flex-grow bg-gradient-to-r from-${isTodayStr ? 'indigo' : 'gray'}-200 to-transparent rounded-full"></div>
                    </div>
                </div>`;
                lastDate = dateStr;
            }

            html += generateOrderCardHTML(order, false); // false = dispatch style
        });
        document.getElementById('dispatchHistoryList').innerHTML = html;

    } catch (e) {
        console.error('Dispatch History Error:', e);
        document.getElementById('dispatchHistoryList').innerHTML = '<p class="text-red-500">History load karne mein error aaya.</p>';
    }
}

function resetDispatchHistoryFilters() {
    document.getElementById('dispatchHistorySearch').value = '';
    document.getElementById('dispatchHistoryStart').value = '';
    document.getElementById('dispatchHistoryEnd').value = '';
    loadDispatchHistory();
}

function resetDispatchHistoryFilters() {
    document.getElementById('dispatchHistorySearch').value = '';
    document.getElementById('dispatchHistoryStart').value = '';
    document.getElementById('dispatchHistoryEnd').value = '';
    loadDispatchHistory();
}

async function filterDispatchOrders(mobile) {
    const searchValue = mobile.trim();

    if (!searchValue) {
        const activeTab = document.querySelector('[id^="dispatchTab"].tab-active').id.replace('dispatchTab', '').toLowerCase();
        if (activeTab === 'ready') loadDeptOrders();
        else if (activeTab === 'requests') loadDeliveryRequests();
        else if (activeTab === 'dispatched') loadDispatchedOrders();
        else if (activeTab === 'history') loadDispatchHistory();
        return;
    }

    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        let orders = (data.orders || []).filter(o =>
            o.telNo.includes(searchValue) ||
            (o.customerName && o.customerName.toLowerCase().includes(searchValue.toLowerCase())) ||
            (o.orderId && o.orderId.toLowerCase().includes(searchValue.toLowerCase()))
        );

        // Determine active tab context
        const activeTab = document.querySelector('[id^="dispatchTab"].tab-active').id.replace('dispatchTab', '').toLowerCase();
        let listId = 'readyDispatchList';
        let themeColor = 'blue';

        if (activeTab === 'ready') {
            listId = 'readyDispatchList';
            orders = orders.filter(o => o.status === 'Address Verified');
            themeColor = 'blue';
        }
        else if (activeTab === 'requests') {
            listId = 'deliveryRequestsList';
            orders = orders.filter(o => o.status === 'Delivery Requested');
            themeColor = 'pink';
        }
        else if (activeTab === 'dispatched') {
            listId = 'dispatchedOrdersList';
            orders = orders.filter(o => o.status === 'Dispatched');
            themeColor = 'indigo';
        }
        else if (activeTab === 'history') {
            listId = 'dispatchHistoryList';
            orders = orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered');
            themeColor = 'purple';
        }

        // If history tab, use grid layout container
        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
        if (orders.length === 0) {
            document.getElementById(listId).innerHTML = `
                        <div class="col-span-full text-center py-8">
                            <p class="text-4xl mb-2">🔍</p>
                            <p class="text-gray-500">No matching orders found</p>
                        </div>`;
            return;
        }

        orders.forEach(order => {
            // Adjust color for specific item in history if delivered
            let itemColor = themeColor;
            if (activeTab === 'history' && order.status === 'Delivered') itemColor = 'green';

            html += `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-${itemColor}-100 flex flex-col h-full bg-white">
                <!-- Card Header -->
                <div class="p-5 border-b border-${itemColor}-50 bg-gradient-to-r from-${itemColor}-50/50 to-white relative">
                     <div class="absolute top-0 right-0 w-24 h-24 bg-${itemColor}-400 rounded-bl-full opacity-5 pointer-events-none"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                             <div class="flex items-center gap-2 mb-1">
                                <span class="bg-${itemColor}-100 text-${itemColor}-700 text-xs font-bold px-2 py-0.5 rounded-md border border-${itemColor}-200 uppercase tracking-wide">
                                    ${order.orderId}
                                </span>
                            </div>
                            <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[180px]" title="${order.customerName}">
                                ${order.customerName}
                            </h3>
                        </div>
                        <div class="text-right">
                             <p class="text-xl font-black text-gray-800 tracking-tight">₹${order.total}</p>
                             <span class="bg-${itemColor}-100 text-${itemColor}-700 px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 mt-1">
                                ${order.status}
                             </span>
                        </div>
                    </div>
                </div>

                 <!-- Card Body -->
                <div class="p-5 space-y-4 flex-grow bg-white/60">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-${itemColor}-50 flex items-center justify-center text-${itemColor}-600 flex-shrink-0">
                            📞
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Contact</p>
                            <p class="text-sm font-semibold text-gray-700 font-mono">${order.telNo}</p>
                        </div>
                    </div>
                     <div class="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <span class="text-xs text-gray-400">📅 ${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>

                 <!-- Footer Actions -->
                <div class="p-4 bg-${itemColor}-50/30 border-t border-${itemColor}-100 flex justify-between items-center gap-2">
                    <button type="button" onclick="viewOrder('${order.orderId}')" 
                        class="bg-white border border-${itemColor}-200 text-${itemColor}-700 hover:bg-${itemColor}-50 flex-1 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors">
                        👁️ View
                    </button>
                    ${activeTab === 'ready' ? `
                    <button type="button" onclick="openDispatchModal('${order.orderId}')" 
                        class="bg-blue-500 text-white flex-1 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-blue-600 transition-colors">
                        📦 Dispatch
                    </button>
                    <button type="button" onclick="cancelOrder('${order.orderId}')" 
                        class="bg-red-500 text-white flex-1 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-red-600 transition-colors">
                        ❌ Cancel
                    </button>
                    ` : ''}
                     ${activeTab === 'requests' ? `
                    <button type="button" onclick="openDispatchModal('${order.orderId}')" 
                        class="bg-pink-500 text-white flex-1 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-pink-600 transition-colors">
                        📦 Dispatch
                    </button>
                    <button type="button" onclick="cancelOrder('${order.orderId}')" 
                        class="bg-red-500 text-white flex-1 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-red-600 transition-colors">
                        ❌ Cancel
                    </button>
                    ` : ''}
                </div>
            </div>`;
        });
        html += '</div>';
        document.getElementById(listId).innerHTML = html;

    } catch (e) {
        console.error(e);
    }
}


function openDispatchModal(orderId, order = null) {
    currentDispatchOrder = order;
    document.getElementById('dispatchOrderId').value = orderId;
    document.getElementById('dispatchCourier').value = '';
    document.getElementById('dispatchTrackingId').value = '';
    document.getElementById('dispatchModal').classList.remove('hidden');
}

async function confirmDispatch() {
    const orderId = document.getElementById('dispatchOrderId').value;
    const courier = document.getElementById('dispatchCourier').value;
    const trackingId = document.getElementById('dispatchTrackingId').value.trim();

    if (!courier) return alert('Courier select karein!');
    if (!trackingId) return alert('Tracking ID daalna zaroori hai!');

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/dispatch`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }

            ,
            body: JSON.stringify({
                courier, trackingId, dispatchedBy: currentUser.id
            })
        });
        const data = await res.json();

        if (data.success) {
            closeModal('dispatchModal');

            const whatsappData = currentDispatchOrder ? { type: 'dispatched', order: { ...currentDispatchOrder, tracking: { courier, trackingId } } } : null;

            showSuccessPopup(
                'Order Dispatched! 🚀',
                `Order ${orderId} successfully dispatched!\n\nCourier: ${courier}\nTracking: ${trackingId}`,
                '🚀',
                '#9333ea',
                whatsappData
            );

            currentDispatchOrder = null;
            setTimeout(() => {
                loadDeptOrders();
                loadDispatchHistory();
            }, 1000);
        }
    }

    catch (e) {
        console.error(e);
    }
}


// Edit Dispatch Order (Ready to Dispatch or Dispatched)
// Redirect to full edit modal for consistency and all fields
function editDispatchOrder(orderId, order) {
    openEditOrderModal(orderId);
}

// Keeping old function as backup - renamed
function _oldEditDispatchOrder(orderId, order) {
    // Create edit modal
    const modal = document.createElement('div');
    modal.id = 'editOrderModal';
    modal.innerHTML = `
        <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div style="background: white; border-radius: 20px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="background: linear-gradient(135deg, #f97316, #fb923c); padding: 20px; border-radius: 20px 20px 0 0;">
                    <h3 style="font-size: 24px; font-weight: bold; color: white; margin: 0;">✏️ Edit Order</h3>
                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 5px;">${orderId}</p>
                </div>
                
                <div style="padding: 25px;">
                    <form id="editOrderForm">
                        <!-- Customer Details -->
                        <div style="margin-bottom: 20px;">
                            <h4 style="font-weight: bold; color: #f97316; margin-bottom: 10px; font-size: 14px;">👤 Customer Details</h4>
                            <div style="display: grid; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">Customer Name</label>
                                    <input type="text" id="edit_customerName" value="${order.customerName || ''}" 
                                        style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" required>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">Phone</label>
                                        <input type="tel" id="edit_telNo" value="${order.telNo || ''}" 
                                            style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" required>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">Alt Phone</label>
                                        <input type="tel" id="edit_altNo" value="${order.altNo || ''}" 
                                            style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Address -->
                        <div style="margin-bottom: 20px;">
                            <h4 style="font-weight: bold; color: #f97316; margin-bottom: 10px; font-size: 14px;">📍 Address</h4>
                            <div style="display: grid; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">Full Address</label>
                                    <textarea id="edit_address" rows="2" 
                                        style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" required>${order.address || ''}</textarea>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">District</label>
                                        <input type="text" id="edit_distt" value="${order.distt || ''}" 
                                            style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" required>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">State</label>
                                        <input type="text" id="edit_state" value="${order.state || ''}" 
                                            style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" required>
                                    </div>
                                </div>
                                <div>
                                    <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">Pincode</label>
                                    <input type="text" id="edit_pin" value="${order.pin || order.pincode || ''}" 
                                        style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" required>
                                </div>
                            </div>
                        </div>

                        <!-- Order Details -->
                        <div style="margin-bottom: 20px;">
                            <h4 style="font-weight: bold; color: #f97316; margin-bottom: 10px; font-size: 14px;">💰 Order Details</h4>
                            <div class="grid grid-cols-3 gap-3">
                                <div>
                                    <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">Total</label>
                                    <input type="number" id="edit_total" value="${order.total || 0}" 
                                        style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" required>
                                </div>
                                <div>
                                    <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">Advance</label>
                                    <input type="number" id="edit_advance" value="${order.advance || 0}" 
                                        style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">COD</label>
                                    <input type="number" id="edit_codAmount" value="${order.codAmount || 0}" 
                                        style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                                </div>
                            </div>
                        </div>

                        <!-- Tracking Details (for Dispatched orders) -->
                        ${order.status === 'Dispatched' ? `
                        <div style="margin-bottom: 20px;">
                            <h4 style="font-weight: bold; color: #f97316; margin-bottom: 10px; font-size: 14px;">📦 Tracking Details</h4>
                            <div style="display: grid; gap: 12px;">
                                <div>
                                    <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">AWB / Tracking Number</label>
                                    <input type="text" id="edit_awb" value="${order.shiprocket?.awb || order.tracking?.trackingId || ''}" 
                                        style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" placeholder="Enter AWB number">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px;">Courier Name</label>
                                    <input type="text" id="edit_courier" value="${order.tracking?.courier || 'Shiprocket'}" 
                                        style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;" placeholder="e.g., Delhivery, BlueDart">
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- Action Buttons -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 25px;">
                            <button type="button" onclick="document.getElementById('editOrderModal').remove()" 
                                style="padding: 12px; background: #e5e7eb; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 14px;">Cancel</button>
                            <button type="submit" 
                                style="padding: 12px; background: linear-gradient(135deg, #f97316, #fb923c); color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 14px; box-shadow: 0 4px 12px rgba(249,115,22,0.3);">💾 Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    document.getElementById('editOrderForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const updates = {
            customerName: document.getElementById('edit_customerName').value.trim(),
            telNo: document.getElementById('edit_telNo').value.trim(),
            altNo: document.getElementById('edit_altNo').value.trim(),
            address: document.getElementById('edit_address').value.trim(),
            distt: document.getElementById('edit_distt').value.trim(),
            state: document.getElementById('edit_state').value.trim(),
            pin: document.getElementById('edit_pin').value.trim(),
            total: parseFloat(document.getElementById('edit_total').value) || 0,
            advance: parseFloat(document.getElementById('edit_advance').value) || 0,
            codAmount: parseFloat(document.getElementById('edit_codAmount').value) || 0
        };

        // Add tracking info if order is dispatched
        if (order.status === 'Dispatched') {
            const awb = document.getElementById('edit_awb')?.value.trim();
            const courier = document.getElementById('edit_courier')?.value.trim();

            if (awb) {
                updates.tracking = {
                    trackingId: awb,
                    courier: courier || 'Shiprocket'
                };

                // Also update shiprocket.awb if exists
                if (order.shiprocket) {
                    updates.shiprocket = {
                        ...order.shiprocket,
                        awb: awb
                    };
                }
            }
        }

        try {
            const res = await fetch(`${API_URL}/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            const data = await res.json();

            if (data.success) {
                modal.remove();
                showSuccessPopup('Order Updated!', 'Order details successfully update ho gaye', '✅', '#10b981');
                setTimeout(() => {
                    loadDeptOrders();
                    loadDispatchHistory();
                }, 1000);
            } else {
                alert('❌ Error: ' + (data.message || 'Failed to update order'));
            }
        } catch (error) {
            console.error('Edit order error:', error);
            alert('❌ Error: ' + error.message);
        }
    });
}

// Edit Dispatched Order (alias for consistency)
function editDispatchedOrder(orderId, order) {
    editDispatchOrder(orderId, order);
}

// View Order Details
async function viewOrderDetails(orderId) {
    try {
        // Fetch order details
        const res = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await res.json();

        if (!data.success || !data.order) {
            alert('Order not found!');
            return;
        }

        const order = data.order;

        // Create view modal
        const modal = document.createElement('div');
        modal.id = 'viewOrderModal';
        modal.innerHTML = `
            <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease;">
                <div style="background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95)); border-radius: 24px; max-width: 800px; width: 100%; max-height: 90vh; overflow: hidden; box-shadow: 0 25px 80px rgba(0,0,0,0.4); animation: slideUp 0.3s ease;">
                    
                    <!-- Premium Header with Gradient -->
                    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%); padding: 32px 28px; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50%; right: -10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(255,255,255,0.15), transparent); border-radius: 50%;"></div>
                        <div style="position: relative; z-index: 1;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">📋</div>
                                <div>
                                    <h3 style="font-size: 28px; font-weight: 800; color: white; margin: 0; letter-spacing: -0.5px;">Order Details</h3>
                                    <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 4px 0 0 0; font-weight: 600; font-family: monospace;">${order.orderId}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Scrollable Content -->
                    <div style="padding: 28px; max-height: calc(90vh - 200px); overflow-y: auto;">
                        
                        <!-- Customer Card -->
                        <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 16px; border: 1px solid rgba(59,130,246,0.2); box-shadow: 0 2px 8px rgba(59,130,246,0.08);">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
                                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(59,130,246,0.3);">👤</div>
                                <h4 style="font-weight: 700; color: #1e40af; margin: 0; font-size: 16px;">Customer Information</h4>
                            </div>
                            <div style="display: grid; gap: 10px; font-size: 14px;">
                                <div style="display: flex; gap: 8px;"><span style="color: #64748b; min-width: 80px;">Name:</span><strong style="color: #0f172a;">${order.customerName}</strong></div>
                                <div style="display: flex; gap: 8px;"><span style="color: #64748b; min-width: 80px;">Phone:</span><strong style="font-family: monospace; color: #0f172a;">${order.telNo}</strong></div>
                                ${order.altNo ? `<div style="display: flex; gap: 8px;"><span style="color: #64748b; min-width: 80px;">Alt Phone:</span><strong style="font-family: monospace; color: #0f172a;">${order.altNo}</strong></div>` : ''}
                            </div>
                        </div>

                        <!-- Address Card -->
                        <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 16px; border: 1px solid rgba(245,158,11,0.2); box-shadow: 0 2px 8px rgba(245,158,11,0.08);">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
                                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(245,158,11,0.3);">📍</div>
                                <h4 style="font-weight: 700; color: #92400e; margin: 0; font-size: 16px;">Delivery Address</h4>
                            </div>
                            <div style="font-size: 14px; line-height: 1.7; color: #78350f; font-weight: 500;">
                                ${order.address}<br>
                                <strong>${order.distt || order.district || ''}, ${order.state || ''} - ${order.pin || order.pincode || ''}</strong>
                            </div>
                        </div>

                        <!-- Items Card -->
                        <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 16px; border: 1px solid rgba(34,197,94,0.2); box-shadow: 0 2px 8px rgba(34,197,94,0.08);">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
                                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(34,197,94,0.3);">🛒</div>
                                <h4 style="font-weight: 700; color: #14532d; margin: 0; font-size: 16px;">Order Items</h4>
                            </div>
                            ${order.items && order.items.length > 0 ? order.items.map((item, idx) => `
                                <div style="padding: 12px; background: white; border-radius: 10px; margin-bottom: 8px; border: 1px solid rgba(34,197,94,0.15); box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                                    <div style="display: flex; justify-between; align-items: center; font-size: 14px;">
                                        <span style="font-weight: 600; color: #0f172a;">${idx + 1}. ${item.description || 'Product'}</span>
                                        <span style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 4px 12px; border-radius: 8px; font-weight: 700; font-size: 12px;">Qty: ${item.quantity || 1}</span>
                                    </div>
                                </div>
                            `).join('') : '<p style="font-size: 14px; color: #6b7280; text-align: center; padding: 12px;">No items</p>'}
                        </div>

                        <!-- Payment Card -->
                        <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #fce7f3, #fbcfe8); border-radius: 16px; border: 1px solid rgba(236,72,153,0.2); box-shadow: 0 2px 8px rgba(236,72,153,0.08);">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
                                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #ec4899, #db2777); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(236,72,153,0.3);">💰</div>
                                <h4 style="font-weight: 700; color: #831843; margin: 0; font-size: 16px;">Payment Details</h4>
                            </div>
                            <div style="display: grid; gap: 10px; font-size: 14px;">
                                <div style="display: flex; justify-between; padding: 10px; background: white; border-radius: 8px;"><span style="color: #64748b;">Total:</span><strong style="color: #0f172a; font-size: 16px;">₹${order.total || 0}</strong></div>
                                <div style="display: flex; justify-between; padding: 10px; background: white; border-radius: 8px;"><span style="color: #64748b;">Advance:</span><span style="color: #22c55e; font-weight: 600;">₹${order.advance || 0}</span></div>
                                <div style="display: flex; justify-between; padding: 14px; background: linear-gradient(135deg, #fee2e2, #fecaca); border-radius: 10px; border: 2px solid #ef4444;"><span style="font-weight: 700; color: #7f1d1d;">COD:</span><strong style="color: #dc2626; font-size: 18px;">₹${order.codAmount || 0}</strong></div>
                            </div>
                        </div>

                        ${order.status === 'Dispatched' && order.tracking ? `
                        <!-- Tracking Card -->
                        <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-radius: 16px; border: 2px solid #10b981; box-shadow: 0 4px 16px rgba(16,185,129,0.15);">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
                                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">📦</div>
                                <h4 style="font-weight: 700; color: #064e3b; margin: 0; font-size: 16px;">Tracking Info</h4>
                            </div>
                            <div style="display: grid; gap: 10px; font-size: 14px;">
                                <div style="display: flex; gap: 8px;"><span style="color: #065f46; min-width: 100px;">Courier:</span><strong style="color: #064e3b;">${order.tracking.courier || 'N/A'}</strong></div>
                                <div style="display: flex; gap: 8px;"><span style="color: #065f46; min-width: 100px;">Tracking ID:</span><span style="font-family: monospace; background: white; padding: 6px 12px; border-radius: 8px; font-weight: 700; color: #064e3b;">${order.tracking.trackingId || order.shiprocket?.awb || 'Pending'}</span></div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- Status Card -->
                        <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #e0e7ff, #c7d2fe); border-radius: 16px; border: 1px solid rgba(99,102,241,0.2); box-shadow: 0 2px 8px rgba(99,102,241,0.08);">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
                                <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(99,102,241,0.3);">📊</div>
                                <h4 style="font-weight: 700; color: #312e81; margin: 0; font-size: 16px;">Status & Timeline</h4>
                            </div>
                            <div style="display: grid; gap: 10px; font-size: 14px;">
                                <div style="display: flex; gap: 8px;"><span style="color: #64748b; min-width: 100px;">Status:</span><span style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 6px 16px; border-radius: 20px; font-weight: 700; box-shadow: 0 2px 8px rgba(99,102,241,0.3);">${order.status}</span></div>
                                <div style="display: flex; gap: 8px;"><span style="color: #64748b; min-width: 100px;">Order Date:</span><strong style="color: #0f172a;">${new Date(order.timestamp).toLocaleString('en-IN')}</strong></div>
                                ${order.dispatchedAt ? `<div style="display: flex; gap: 8px;"><span style="color: #64748b; min-width: 100px;">Dispatched:</span><strong style="color: #0f172a;">${new Date(order.dispatchedAt).toLocaleString('en-IN')}</strong></div>` : ''}
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px;">
                            <button onclick="document.getElementById('viewOrderModal').remove(); openEditOrderModal('${order.orderId}')" 
                                style="padding: 16px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 14px; font-weight: 700; cursor: pointer; font-size: 15px; box-shadow: 0 6px 20px rgba(245,158,11,0.35); transition: all 0.2s;"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(245,158,11,0.45)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(245,158,11,0.35)'">
                                ✏️ Edit Order
                            </button>
                            <button onclick="document.getElementById('viewOrderModal').remove()" 
                                style="padding: 16px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; border-radius: 14px; font-weight: 700; cursor: pointer; font-size: 15px; box-shadow: 0 6px 20px rgba(99,102,241,0.35); transition: all 0.2s;"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(99,102,241,0.45)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(99,102,241,0.35)'">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

    } catch (error) {
        console.error('View order error:', error);
        alert('Failed to load order details');
    }
}

async function approveDelivery(orderId) {
    if (!confirm('Order ko Delivered mark karna hai?')) return;

    try {
        const res = await fetch(`${API_URL}/orders/deliver`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: orderId,
                deliveredBy: currentUser?.id || currentUser?.name || 'Dispatch Dept'
            })
        });
        const data = await res.json();

        if (data.success) {
            showSuccessPopup(
                'Delivery Confirmed! 🎊',
                `Order ${orderId} successfully delivered!\n\nCustomer ko product mil gaya hai.`,
                '🎊',
                '#f59e0b'
            );
            setTimeout(() => {
                loadDeliveryRequests();
                loadDispatchedOrders();
                loadDispatchHistory();
            }, 1000);
        }
    }

    catch (e) {
        console.error(e);
    }
}

// ==================== EDIT ORDER ====================
async function openEditOrderModal(orderId) {
    try {
        console.log('Opening edit modal for order:', orderId);

        // Fetch order data first
        const res = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}`);
        const data = await res.json();

        if (!data.success || !data.order) {
            console.error('Failed to fetch order:', data);
            alert('❌ Order data load nahi hua! Order: ' + orderId);
            return;
        }

        const order = data.order;
        console.log('Order data loaded:', order.orderId);

        // Remove existing modal if any
        const existingModal = document.getElementById('dynamicEditModal');
        if (existingModal) existingModal.remove();

        // Create modal dynamically with inline styles
        const modal = document.createElement('div');
        modal.id = 'dynamicEditModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';

        let itemsHtml = '';
        (order.items || []).forEach((item, idx) => {
            const qty = item.quantity || item.qty || 1;
            const rate = item.rate || item.price || item.mrp || 0;
            const amount = item.amount || (rate * qty) || 0;
            itemsHtml += `
                <div class="grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 edit-item-row">
                    <input type="text" value="${item.description || item.name || ''}" placeholder="Product" class="col-span-12 md:col-span-5 border rounded-lg px-3 py-2 text-sm edit-item-desc outline-none focus:border-emerald-500">
                    <input type="number" value="${qty}" min="1" placeholder="Qty" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-qty outline-none focus:border-emerald-500 text-center font-bold" oninput="updateEditItemAmount(this)">
                    <input type="number" value="${rate}" placeholder="Rate" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-rate outline-none focus:border-emerald-500" oninput="updateEditItemAmount(this)">
                    <input type="number" value="${amount}" placeholder="Amt" class="col-span-4 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-amount outline-none focus:border-emerald-500 bg-gray-50 font-bold" oninput="updateEditTotal()">
                    <button type="button" onclick="this.parentElement.remove(); updateEditTotal();" class="col-span-2 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors">×</button>
                </div>
            `;
        });

        modal.innerHTML = `
            <div style="background:white;border-radius:20px;max-width:800px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,0.3);">
                <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:20px;border-radius:20px 20px 0 0;display:flex;justify-content:space-between;align-items:center;">
                    <h3 style="color:white;font-size:20px;font-weight:bold;margin:0;">✏️ Edit Order - ${orderId}</h3>
                    <button onclick="document.getElementById('dynamicEditModal').remove();" style="background:rgba(255,255,255,0.2);border:none;color:white;font-size:24px;width:40px;height:40px;border-radius:50%;cursor:pointer;">×</button>
                </div>
                <div style="padding:24px;">
                    <form id="editOrderForm" class="space-y-4">
                        <input type="hidden" id="editOrderId" value="${orderId}">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Customer Name *</label>
                                <input type="text" id="editCustomerName" value="${order.customerName || ''}" required class="w-full border-2 rounded-xl px-4 py-2">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Tel No. *</label>
                                <input type="tel" id="editTelNo" value="${order.telNo || ''}" required class="w-full border-2 rounded-xl px-4 py-2">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div><label class="block text-xs font-medium mb-1">H.NO.</label><input type="text" id="editHNo" value="${order.hNo || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">BLOCK/GALI</label><input type="text" id="editBlockGaliNo" value="${order.blockGaliNo || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">VILL/COLONY</label><input type="text" id="editVillColony" value="${order.villColony || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">P.O.</label><input type="text" id="editPo" value="${order.po || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div><label class="block text-xs font-medium mb-1">TAH/TALUKA</label><input type="text" id="editTahTaluka" value="${order.tahTaluka || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">DISTT.</label><input type="text" id="editDistt" value="${order.distt || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">STATE</label><input type="text" id="editState" value="${order.state || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">PIN</label><input type="text" id="editPin" value="${order.pin || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div><label class="block text-xs font-medium mb-1">LANDMARK</label><input type="text" id="editLandMark" value="${order.landMark || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                            <div><label class="block text-xs font-medium mb-1">ALT NO.</label><input type="tel" id="editAltNo" value="${order.altNo || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"></div>
                        </div>
                        <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                            <div class="flex justify-between items-center mb-3">
                                <label class="font-bold text-emerald-700">🛒 ITEMS</label>
                                <button type="button" onclick="addEditItem()" class="bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm">+ Add Item</button>
                            </div>
                            <div class="mb-2 grid grid-cols-12 gap-2 text-xs font-bold text-emerald-800 px-2">
                                <span class="col-span-12 md:col-span-5">Product</span>
                                <span class="col-span-3 md:col-span-2 text-center">Qty</span>
                                <span class="col-span-3 md:col-span-2 text-center">Rate</span>
                                <span class="col-span-4 md:col-span-2 text-center">Amount</span>
                                <span class="col-span-2 md:col-span-1"></span>
                            </div>
                            <div id="editItemsContainer" class="space-y-2">${itemsHtml}</div>
                            <div class="mt-3 pt-3 border-t border-emerald-300 flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span id="editTotalAmount" class="text-red-600">₹${order.total || 0}</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div><label class="block text-sm font-medium mb-1">Advance</label><input type="number" id="editAdvance" value="${order.advance || 0}" oninput="updateEditCOD()" class="w-full border-2 rounded-xl px-4 py-2"></div>
                            <div><label class="block text-sm font-medium mb-1">COD Amount</label><input type="number" id="editCodAmount" value="${order.codAmount || 0}" readonly class="w-full border-2 rounded-xl px-4 py-2 bg-red-50 text-red-700 font-bold"></div>
                        </div>
                        <div class="flex gap-3">
                            <button type="button" onclick="document.getElementById('dynamicEditModal').remove();" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium">Cancel</button>
                            <button type="button" onclick="saveEditOrder()" class="flex-1 bg-orange-600 text-white py-3 rounded-xl font-medium hover:bg-orange-700">💾 Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        console.log('Dynamic edit modal created and appended to body');

    } catch (e) {
        console.error('Error in openEditOrderModal:', e);
        alert('Order load nahi hua! Error: ' + e.message);
    }
}

function addEditItem() {
    const container = document.getElementById('editItemsContainer');
    const div = document.createElement('div');
    // Responsive Grid Layout with Qty field
    div.className = 'grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 mb-2 edit-item-row';
    div.innerHTML = ` 
            <input type="text" placeholder="Product" class="col-span-12 md:col-span-5 border rounded-lg px-3 py-2 text-sm edit-item-desc outline-none focus:border-emerald-500"> 
            <input type="number" placeholder="Qty" value="1" min="1" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-qty outline-none focus:border-emerald-500 text-center font-bold" oninput="updateEditItemAmount(this)"> 
            <input type="number" placeholder="Rate" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-rate outline-none focus:border-emerald-500" oninput="updateEditItemAmount(this)"> 
            <input type="number" placeholder="Amt" class="col-span-4 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-amount outline-none focus:border-emerald-500 bg-gray-50 font-bold" oninput="updateEditTotal()"> 
            <button type="button" onclick="this.parentElement.remove(); updateEditTotal();" class="col-span-2 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors">×</button> `;
    container.appendChild(div);
}

// Auto-calculate Amount when Qty or Rate changes
function updateEditItemAmount(input) {
    const row = input.closest('.edit-item-row');
    const qty = parseFloat(row.querySelector('.edit-item-qty').value) || 1;
    const rate = parseFloat(row.querySelector('.edit-item-rate').value) || 0;
    const amountInput = row.querySelector('.edit-item-amount');
    amountInput.value = (qty * rate).toFixed(0);
    updateEditTotal();
}

function updateEditTotal() {
    let total = 0;

    document.querySelectorAll('.edit-item-amount').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('editTotalAmount').textContent = '₹' + total.toFixed(2);
    updateEditCOD();
}

function updateEditCOD() {
    const total = parseFloat(document.getElementById('editTotalAmount').textContent.replace('₹', '')) || 0;
    const advance = parseFloat(document.getElementById('editAdvance').value) || 0;
    document.getElementById('editCodAmount').value = Math.max(0, total - advance).toFixed(2);
}

async function saveEditOrder() {
    // Try to find editOrderId from dynamic modal first
    const dynamicModal = document.getElementById('dynamicEditModal');
    let orderId = '';

    if (dynamicModal) {
        const orderIdInput = dynamicModal.querySelector('#editOrderId');
        if (orderIdInput) {
            orderId = orderIdInput.value;
        }
    }

    // Fallback to global search
    if (!orderId) {
        const globalOrderIdEl = document.getElementById('editOrderId');
        if (globalOrderIdEl) {
            orderId = globalOrderIdEl.value;
        }
    }

    console.log('🆔 Order ID found:', orderId);

    if (!orderId) {
        alert('❌ Order ID not found! Cannot save.');
        return;
    }

    // Helper function to get value from modal (scoped to dynamic modal)
    const getVal = (id) => {
        if (dynamicModal) {
            const el = dynamicModal.querySelector('#' + id);
            if (el) return el.value || '';
        }
        // Fallback to global
        const globalEl = document.getElementById(id);
        return globalEl ? (globalEl.value || '') : '';
    };

    const items = [];

    // Find items within dynamic modal if present
    const itemContainer = dynamicModal || document;
    itemContainer.querySelectorAll('.edit-item-row').forEach(row => {
        const desc = row.querySelector('.edit-item-desc').value.trim();
        const qtyInput = row.querySelector('.edit-item-qty');
        const qty = qtyInput ? (parseFloat(qtyInput.value) || 1) : 1;
        const rate = row.querySelector('.edit-item-rate').value;
        const amount = row.querySelector('.edit-item-amount').value;

        if (desc) items.push({
            description: desc,
            name: desc,
            quantity: qty,
            rate: parseFloat(rate) || 0,
            price: parseFloat(rate) || 0,
            amount: parseFloat(amount) || 0
        });
    });

    const total = items.reduce((sum, item) => sum + item.amount, 0);

    // Build address using scoped getVal helper
    const addressParts = [
        getVal('editHNo'),
        getVal('editBlockGaliNo'),
        getVal('editVillColony'),
        getVal('editPo'),
        getVal('editTahTaluka'),
        getVal('editDistt'),
        getVal('editState'),
        getVal('editPin')
    ].filter(v => v && v.trim());

    const updateData = {
        customerName: toTitleCase(getVal('editCustomerName').trim()),
        telNo: getVal('editTelNo').trim(),
        altNo: getVal('editAltNo').trim(),
        hNo: getVal('editHNo').trim(),
        blockGaliNo: toTitleCase(getVal('editBlockGaliNo').trim()),
        villColony: toTitleCase(getVal('editVillColony').trim()),
        po: toTitleCase(getVal('editPo').trim()),
        tahTaluka: toTitleCase(getVal('editTahTaluka').trim()),
        distt: toTitleCase(getVal('editDistt').trim()),
        state: toTitleCase(getVal('editState').trim()),
        pin: getVal('editPin').trim(),
        landMark: toTitleCase(getVal('editLandMark').trim()),
        address: addressParts.map(p => toTitleCase(p.trim())).join(', '),
        items,
        total,
        advance: parseFloat(getVal('editAdvance')) || 0,
        codAmount: parseFloat(getVal('editCodAmount')) || 0,
        editedBy: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : 'Department',
        editedAt: new Date().toISOString()
    };

    try {
        const apiUrl = `${API_URL}/orders/${encodeURIComponent(orderId)}`;
        console.log('📤 Saving order to:', apiUrl);
        console.log('📄 Update data:', updateData);

        const res = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        console.log('📥 Response status:', res.status, res.statusText);

        // Check if response is OK before parsing JSON
        if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ Server response (not JSON):', errorText.substring(0, 200));
            throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        if (data.success) {
            // Close dynamic modal
            const dynamicModal = document.getElementById('dynamicEditModal');
            if (dynamicModal) dynamicModal.remove();

            // Also try closing static modal if it exists
            const staticModal = document.getElementById('editOrderModal');
            if (staticModal) staticModal.classList.add('hidden');

            showSuccessPopup(
                'Order Updated! ✏️',
                `Order ${orderId} successfully update ho gaya!`,
                '✏️',
                '#3b82f6'
            );

            // Reload appropriate list
            if (typeof loadDeptOrders === 'function') {
                setTimeout(() => loadDeptOrders(), 1000);
            } else if (typeof loadAdminPending === 'function') {
                setTimeout(() => location.reload(), 1000);
            }
        } else {
            alert(data.message || 'Update failed!');
        }
    } catch (e) {
        console.error('Error saving order:', e);
        alert('Server error! ' + e.message);
    }
}

async function filterAdminOrders(mobile) {
    const searchValue = mobile.trim();

    if (!searchValue) {
        // Reload current admin tab
        const activeTab = document.querySelector('[id^="adminTab"].tab-active').id.replace('adminTab', '').toLowerCase();
        switchAdminTab(activeTab);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        let orders = (data.orders || []).filter(o => (o.telNo && o.telNo.includes(searchValue)) || (o.altNo && o.altNo.includes(searchValue)));

        // Display in current active admin tab list
        const activeTabContent = document.querySelector('[id^="admin"][id$="Tab"]:not(.hidden)');
        if (!activeTabContent) return;

        const listId = activeTabContent.id.replace('Tab', 'List');
        const container = document.getElementById(listId);

        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">Koi orders nahi mile is mobile number se</p>';
            return;
        }

        let html = '<div class="space-y-3">';

        orders.forEach(order => {
            const hasRequestedDelivery = order.status === 'Delivery Requested';
            html += ` <div class="glass-card p-4 border-l-4 ${order.status === 'Pending' ? 'border-red-500' : order.status === 'Address Verified' ? 'border-blue-500' : order.status === 'Dispatched' ? 'border-purple-500' : 'border-green-500'}"> 
                        <div class="flex justify-between items-start"> 
                            <div> 
                                <div class="flex items-center gap-2">
                                    <p class="font-bold text-gray-800">${order.orderId}</p> 
                                    ${order.isReorder ?
                    '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">🔄 Re-order</span>' :
                    '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">🆕 New</span>'}
                                </div>
                                <p class="text-sm text-gray-600">${order.customerName} - ${order.telNo}</p> 
                                <p class="text-xs text-gray-500 mt-1">Date: ${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}</p> 
                            </div> 
                            <div class="text-right"> 
                                <p class="font-bold text-gray-800">₹${order.total}</p> 
                                <span class="px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'Pending' ? 'bg-red-100 text-red-700' : order.status === 'Address Verified' ? 'bg-blue-100 text-blue-700' : order.status === 'Dispatched' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}">${order.status}</span> 
                            </div> 
                        </div> 
                        <div class="p-3 bg-gray-50 flex justify-between items-center border-t">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono text-gray-400">#${order.orderId}</span>
                                <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                                    class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-sm transition-all" title="Send WhatsApp">
                                    ${WHATSAPP_ICON}
                                </button>
                            </div>
                            <div class="flex gap-2">
                                <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50">View</button>
                                ${!hasRequestedDelivery && order.status === 'Address Verified' ? `
                                    <button type="button" onclick="requestDelivery('${order.orderId}')" class="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700">Request Delivery</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (e) {
        console.error(e);
    }
}


// ==================== ADMIN PANEL ====================
// Toggle Admin Sidebar (for mobile)
function toggleAdminSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) {
        sidebar.classList.toggle('-translate-x-full');
    }
}

function switchAdminTab(tab) {
    if (!tab) return;
    const capTab = tab.charAt(0).toUpperCase() + tab.slice(1);
    const contentId = `admin${capTab}Tab`;
    const buttonId = `adminTab${capTab}`;

    const contentEl = document.getElementById(contentId);
    const buttonEl = document.getElementById(buttonId);

    if (!contentEl) {
        console.error(`Tab Content missing: ${contentId}`);
        return;
    }
    if (!buttonEl) {
        console.error(`Tab Button missing: ${buttonId}`);
    }

    // Hide all contents
    const contents = document.querySelectorAll('[id^="admin"][id$="Tab"]');
    contents.forEach(el => {
        el.classList.add('hidden');
    });

    // Deactivate all sidebar nav items
    const buttons = document.querySelectorAll('.sidebar-nav-item, [id^="adminTab"]');
    buttons.forEach(el => {
        el.classList.remove('sidebar-active');
    });

    contentEl.classList.remove('hidden');

    if (buttonEl) {
        buttonEl.classList.add('sidebar-active');
    }

    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
        const sidebar = document.getElementById('adminSidebar');
        if (sidebar) {
            sidebar.classList.add('-translate-x-full');
        }
    }

    if (tab === 'employees') loadEmployees();
    if (tab === 'departments') loadDepartments();
    if (tab === 'history') loadAdminHistory();
    if (tab === 'progress') loadAdminProgress();

    // Updated Logic for Status Tabs
    if (tab === 'pending') loadAdminPending();
    if (tab === 'verified') loadAdminVerified();
    if (tab === 'dispatched') loadAdminDispatched();
    if (tab === 'delivered') loadAdminDelivered();
    if (tab === 'cancelled') loadAdminCancelled();
    if (tab === 'onhold') loadAdminOnHold();

    updateAdminBadges();
}

async function updateAdminBadges() {
    try {
        const pending = await (await fetch(`${API_URL}/orders/pending`)).json();
        const verified = await (await fetch(`${API_URL}/orders/verified`)).json();
        const dispatched = await (await fetch(`${API_URL}/orders/dispatched`)).json();
        const delivered = await (await fetch(`${API_URL}/orders/delivered`)).json();
        const cancelled = await (await fetch(`${API_URL}/orders/cancelled`)).json();
        const onhold = await (await fetch(`${API_URL}/orders/onhold`)).json();

        const pendingCount = pending.orders ? pending.orders.length : 0;
        const verifiedCount = verified.orders ? verified.orders.length : 0;
        const dispatchedCount = dispatched.orders ? dispatched.orders.length : 0;
        const deliveredCount = delivered.orders ? delivered.orders.length : 0;
        const cancelledCount = cancelled.orders ? cancelled.orders.length : 0;
        const onholdCount = onhold.orders ? onhold.orders.length : 0;

        // Update Tab Badges
        if (document.getElementById('pendingCount')) document.getElementById('pendingCount').textContent = pendingCount;
        if (document.getElementById('verifiedCount')) document.getElementById('verifiedCount').textContent = verifiedCount;
        if (document.getElementById('dispatchedCount')) document.getElementById('dispatchedCount').textContent = dispatchedCount;
        if (document.getElementById('deliveredCount')) document.getElementById('deliveredCount').textContent = deliveredCount;
        if (document.getElementById('cancelledCount')) document.getElementById('cancelledCount').textContent = cancelledCount;
        if (document.getElementById('onholdCount')) document.getElementById('onholdCount').textContent = onholdCount;

        // Update Quick Stats Pills (Header)
        if (document.getElementById('quickStatPending')) document.getElementById('quickStatPending').textContent = pendingCount;
        if (document.getElementById('quickStatVerified')) document.getElementById('quickStatVerified').textContent = verifiedCount;
        if (document.getElementById('quickStatDispatched')) document.getElementById('quickStatDispatched').textContent = dispatchedCount;
        if (document.getElementById('quickStatDelivered')) document.getElementById('quickStatDelivered').textContent = deliveredCount;
    } catch (e) { console.error('Badge update failed', e); }
}

function calculateAndRenderStats(orders, todayId, yesterdayId, weekId, dateField) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const countToday = orders.filter(o => {
        const d = new Date(o[dateField] || o.timestamp);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    }).length;

    const countYesterday = orders.filter(o => {
        const d = new Date(o[dateField] || o.timestamp);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === yesterday.getTime();
    }).length;

    const countWeek = orders.filter(o => {
        const d = new Date(o[dateField] || o.timestamp);
        return d >= lastWeek;
    }).length;

    const tEl = document.getElementById(todayId);
    if (tEl) tEl.textContent = countToday;
    const yEl = document.getElementById(yesterdayId);
    if (yEl) yEl.textContent = countYesterday;
    const wEl = document.getElementById(weekId);
    if (wEl) wEl.textContent = countWeek;
}

function applyQuickDateFilter(prefix, range) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const startInput = document.getElementById(prefix + 'StartDate');
    const endInput = document.getElementById(prefix + 'EndDate');
    const searchInput = document.getElementById(prefix + 'Search');

    if (!startInput || !endInput) return;

    // Clear search when applying date filter for clarity
    if (searchInput) searchInput.value = '';

    if (range === 'today') {
        startInput.value = todayStr;
        endInput.value = todayStr;
    } else if (range === 'yesterday') {
        startInput.value = yesterdayStr;
        endInput.value = yesterdayStr;
    } else if (range === 'week') {
        startInput.value = weekAgoStr;
        endInput.value = todayStr;
    }

    // Trigger specific load function
    if (prefix === 'adminPending') loadAdminPending();
    else if (prefix === 'adminVerified') loadAdminVerified();
    else if (prefix === 'adminDispatched') loadAdminDispatched();
    else if (prefix === 'adminDelivered') loadAdminDelivered();
    else if (prefix === 'verificationHistory') loadVerificationHistory();
    else if (prefix === 'deliveryPerformance') loadDeliveryPerformance();

    // Scroll to the list for better focus
    const listId = prefix.replace('admin', 'admin') + 'List';
    const listEl = document.getElementById(listId) || document.getElementById(prefix + 'List');
    if (listEl) {
        listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// GENERIC LOAD FUNCTION FOR ADMIN TABS
// Pagination state
let adminPagination = {
    pending: 1,
    verified: 1,
    dispatched: 1,
    delivered: 1,
    cancelled: 1,
    onhold: 1
};
const ORDERS_PER_PAGE = 10;

async function loadAdminStatusTab(status, listId, searchId, startId, endId, statsIds, dateField, page = null) {
    try {
        let res;
        const endpointMap = {
            'Pending': '/orders/pending',
            'Address Verified': '/orders/verified',
            'Dispatched': '/orders/dispatched',
            'Delivered': '/orders/delivered',
            'Cancelled': '/orders/cancelled',
            'On Hold': '/orders/onhold'
        };

        // Determine page key
        const pageKey = status === 'Address Verified' ? 'verified' : (status === 'On Hold' ? 'onhold' : status.toLowerCase());

        // Set page if provided, else use current
        if (page !== null) {
            adminPagination[pageKey] = page;
        }
        const currentPage = adminPagination[pageKey] || 1;

        res = await fetch(`${API_URL}${endpointMap[status]}`);
        const data = await res.json();
        let orders = data.orders || [];

        if (statsIds && statsIds.length > 0) {
            calculateAndRenderStats(orders, statsIds[0], statsIds[1], statsIds[2], dateField);
        }

        const searchInput = document.getElementById(searchId);
        const search = searchInput ? searchInput.value.toLowerCase() : '';

        const startInput = document.getElementById(startId);
        const start = startInput ? startInput.value : '';

        const endInput = document.getElementById(endId);
        const end = endInput ? endInput.value : '';

        if (search) {
            orders = orders.filter(o =>
                (o.orderId && o.orderId.toLowerCase().includes(search)) ||
                (o.customerName && o.customerName.toLowerCase().includes(search)) ||
                (o.telNo && o.telNo.includes(search)) ||
                (o.tracking && o.tracking.trackingId && o.tracking.trackingId.toLowerCase().includes(search))
            );
        }

        if (start) {
            orders = orders.filter(o => {
                const d = o[dateField] ? o[dateField].split('T')[0] : o.timestamp.split('T')[0];
                return d >= start;
            });
        }
        if (end) {
            orders = orders.filter(o => {
                const d = o[dateField] ? o[dateField].split('T')[0] : o.timestamp.split('T')[0];
                return d <= end;
            });
        }

        // Sort descending
        orders.sort((a, b) => new Date(b[dateField] || b.timestamp) - new Date(a[dateField] || a.timestamp));

        // Render
        const container = document.getElementById(listId);
        if (!container) return;

        // Calculate pagination
        const totalOrders = orders.length;
        const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);
        const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
        const endIndex = startIndex + ORDERS_PER_PAGE;
        const paginatedOrders = orders.slice(startIndex, endIndex);

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p class="text-4xl mb-3">📭</p>
                    <p class="text-slate-500 font-medium">No ${status} orders found</p>
                </div>`;
            return;
        }

        let html = '';
        let lastDate = '';

        let themeColor = 'blue';
        if (status === 'Pending') themeColor = 'red';
        if (status === 'Address Verified') themeColor = 'blue'; // Default for verified
        if (status === 'Dispatched') themeColor = 'purple';
        if (status === 'Delivered') themeColor = 'green';

        paginatedOrders.forEach(order => {
            // Determine date for grouping
            const orderDateStr = order[dateField] ? order[dateField].split('T')[0] : (order.timestamp ? order.timestamp.split('T')[0] : 'N/A');

            if (orderDateStr !== lastDate) {
                const displayDate = new Date(orderDateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const isTodayStr = new Date().toISOString().split('T')[0] === orderDateStr;

                html += `
                <div class="col-span-full mt-6 mb-3">
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${isTodayStr ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 border border-slate-200'}">
                            ${isTodayStr ? '📌 Today' : displayDate}
                        </span>
                        <div class="h-px flex-grow bg-slate-200"></div>
                    </div>
                </div>`;
                lastDate = orderDateStr;
            }

            const tracking = order.tracking || {};
            const dateDisplay = order[dateField] ? new Date(order[dateField]).toLocaleDateString() : (order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A');

            html += `
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col h-full">
                <!-- Card Header - Clean & Minimal -->
                <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            ${order.orderId}
                        </span>
                        ${order.isReorder ?
                    '<span class="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">🔄 Re-order</span>' :
                    '<span class="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">🆕 New</span>'}
                        <span class="w-2 h-2 rounded-full ${status === 'Pending' ? 'bg-red-500' : status === 'Address Verified' ? 'bg-blue-500' : status === 'Dispatched' ? 'bg-purple-500' : 'bg-emerald-500'} animate-pulse"></span>
                    </div>
                    <span class="text-lg font-black text-slate-800">₹${order.total}</span>
                </div>
                
                <!-- Customer Info -->
                <div class="px-4 py-3 flex-grow">
                    <div class="flex items-start gap-3 mb-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-${themeColor}-400 to-${themeColor}-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                            ${order.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3 class="font-bold text-slate-800 text-base truncate" title="${order.customerName}">${order.customerName}</h3>
                            <p class="text-sm text-slate-500 font-medium font-mono">${order.telNo}</p>
                        </div>
                        <button onclick="sendWhatsAppDirect('${status === 'Pending' ? 'booked' : status === 'Address Verified' ? 'verified' : 'dispatched'}', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                            class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-md transition-all flex-shrink-0" title="WhatsApp">
                            ${WHATSAPP_ICON}
                        </button>
                    </div>
                    
                    ${tracking.trackingId ? `
                    <div class="flex items-center gap-2 p-2 bg-blue-50 rounded-lg mb-3">
                        <span class="text-blue-600">🧾</span>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs text-blue-600 font-bold truncate">${tracking.trackingId}</p>
                            <p class="text-[10px] text-blue-500">${tracking.courier || 'Courier'}</p>
                        </div>
                        <button onclick="copyTracking('${tracking.trackingId}')" class="text-blue-400 hover:text-blue-600">📋</button>
                    </div>
                    ` : ''}
                    
                    <!-- Meta Info Row -->
                    <div class="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-50">
                        <span>📅 ${dateDisplay}</span>
                        ${order.employee ? `<span class="text-emerald-600 font-semibold">👤 ${order.employee} (${order.employeeId})</span>` : ''}
                    </div>
                </div>

                <!-- Footer Actions - Compact -->
                <div class="px-3 py-2 bg-slate-50 border-t border-slate-100 flex gap-2">
                    <button onclick="viewOrder('${order.orderId}')" 
                        class="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1">
                        👁️ View
                    </button>
                    
                    ${status === 'Address Verified' ? `
                    <button onclick="openDispatchModal('${order.orderId}', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                        class="flex-1 bg-purple-600 text-white py-2 rounded-lg text-xs font-bold shadow-md hover:bg-purple-700 transition-all flex items-center justify-center gap-1">
                        📦 Dispatch
                    </button>
                    ` : ''}
                    
                    ${status === 'Pending' ? `
                    <button onclick="openEditOrderModal('${order.orderId}')" 
                        class="flex-1 bg-amber-50 text-amber-700 border border-amber-200 py-2 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-all flex items-center justify-center gap-1">
                        ✏️ Edit
                    </button>
                    ` : ''}
                    
                    <button onclick="deleteOrder('${order.orderId}')" 
                        class="px-3 bg-red-50 text-red-500 border border-red-100 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 transition-all">
                        🗑️
                    </button>
                </div>
            </div>`;
        });

        // Add pagination controls
        if (totalPages > 1) {
            const loadFuncName = status === 'Pending' ? 'loadAdminPending' :
                status === 'Address Verified' ? 'loadAdminVerified' :
                    status === 'Dispatched' ? 'loadAdminDispatched' :
                        status === 'Delivered' ? 'loadAdminDelivered' : 'loadAdminCancelled';

            html += `
            <div class="col-span-full mt-6 flex items-center justify-center gap-2">
                <button onclick="goToAdminPage('${pageKey}', ${currentPage - 1}, '${loadFuncName}')" 
                    ${currentPage === 1 ? 'disabled' : ''}
                    class="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}">
                    ← Previous
                </button>
                
                <div class="flex items-center gap-1">
                    ${Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                    pageNum = i + 1;
                } else if (currentPage <= 3) {
                    pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                } else {
                    pageNum = currentPage - 2 + i;
                }
                return `<button onclick="goToAdminPage('${pageKey}', ${pageNum}, '${loadFuncName}')" 
                            class="w-9 h-9 rounded-lg text-sm font-bold transition-all ${pageNum === currentPage ? 'bg-emerald-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}">
                            ${pageNum}
                        </button>`;
            }).join('')}
                </div>
                
                <button onclick="goToAdminPage('${pageKey}', ${currentPage + 1}, '${loadFuncName}')" 
                    ${currentPage === totalPages ? 'disabled' : ''}
                    class="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}">
                    Next →
                </button>
            </div>
            
            <div class="col-span-full text-center mt-2">
                <p class="text-xs text-slate-400">Showing ${startIndex + 1}-${Math.min(endIndex, totalOrders)} of ${totalOrders} orders</p>
            </div>`;
        }

        container.innerHTML = html;

    } catch (e) { console.error('Error loading admin tab', e); }
}

// Pagination navigation helper
function goToAdminPage(pageKey, page, loadFunc) {
    if (page < 1) return;
    adminPagination[pageKey] = page;
    window[loadFunc]();
}

function loadAdminPending() {
    loadAdminStatusTab('Pending', 'adminPendingList', 'adminPendingSearch', 'adminPendingStartDate', 'adminPendingEndDate',
        ['statsAdminPendingToday', 'statsAdminPendingYesterday', 'statsAdminPendingWeek'], 'timestamp');
}
function loadAdminVerified() {
    loadAdminStatusTab('Address Verified', 'adminVerifiedList', 'adminVerifiedSearch', 'adminVerifiedStartDate', 'adminVerifiedEndDate',
        ['statsAdminVerifiedToday', 'statsAdminVerifiedYesterday', 'statsAdminVerifiedWeek'], 'verifiedAt');
}
function loadAdminDispatched() {
    loadAdminStatusTab('Dispatched', 'adminDispatchedList', 'adminDispatchedSearch', 'adminDispatchedStartDate', 'adminDispatchedEndDate',
        ['statsAdminDispatchedToday', 'statsAdminDispatchedYesterday', 'statsAdminDispatchedWeek'], 'dispatchedAt');
}
function loadAdminDelivered() {
    loadAdminStatusTab('Delivered', 'adminDeliveredList', 'adminDeliveredSearch', 'adminDeliveredStartDate', 'adminDeliveredEndDate',
        ['statsAdminDeliveredToday', 'statsAdminDeliveredYesterday', 'statsAdminDeliveredWeek'], 'deliveredAt');
}
function loadAdminCancelled() {
    loadAdminStatusTab('Cancelled', 'adminCancelledList', 'adminCancelledSearch', 'adminCancelledStartDate', 'adminCancelledEndDate',
        null, 'cancelledAt');
}
function loadAdminOnHold() {
    loadAdminStatusTab('On Hold', 'adminOnholdList', 'adminOnholdSearch', 'adminOnholdStartDate', 'adminOnholdEndDate',
        null, 'timestamp');
}

function resetAdminFilters(type) {
    const capType = type.charAt(0).toUpperCase() + type.slice(1);
    if (document.getElementById(`admin${capType}Search`)) document.getElementById(`admin${capType}Search`).value = '';
    if (document.getElementById(`admin${capType}StartDate`)) document.getElementById(`admin${capType}StartDate`).value = '';
    if (document.getElementById(`admin${capType}EndDate`)) document.getElementById(`admin${capType}EndDate`).value = '';

    if (type === 'pending') loadAdminPending();
    else if (type === 'verified') loadAdminVerified();
    else if (type === 'dispatched') loadAdminDispatched();
    else if (type === 'delivered') loadAdminDelivered();
    else if (type === 'cancelled') loadAdminCancelled();
    else if (type === 'onhold') loadAdminOnHold();

    // Scroll to the list after reset
    const listId = `admin${capType}List`;
    const listEl = document.getElementById(listId);
    if (listEl) {
        listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

async function loadEmployees() {
    try {
        const res = await fetch(`${API_URL}/employees`);
        const data = await res.json();
        const employees = data.employees || [];

        if (employees.length === 0) {
            document.getElementById('adminEmployeesTab').innerHTML = `
                        <div class="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p class="text-4xl mb-3">👥</p>
                            <p class="text-gray-500 font-medium">No employees registered</p>
                        </div>`;
            return;
        }

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';

        employees.forEach(emp => {
            html += `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border border-indigo-100 bg-white" onclick="viewEmployeeProfile('${emp.id}')">
                <div class="p-6 bg-gradient-to-br from-indigo-50/80 to-white flex items-center gap-4 relative">
                     <div class="absolute top-0 right-0 w-20 h-20 bg-indigo-500 rounded-full opacity-5 -mr-8 -mt-8"></div>
                    <div class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl font-black text-indigo-600 shadow-sm border border-indigo-100 shrink-0">
                        ${emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 text-lg leading-tight mb-1">${emp.name}</h3>
                        <p class="text-xs font-mono text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-100 inline-block">${emp.id}</p>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="grid grid-cols-2 gap-3 text-center">
                        <div class="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <p class="text-xl font-black text-gray-800">${emp.totalOrders}</p>
                            <p class="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total</p>
                        </div>
                        <div class="bg-red-50 rounded-xl p-3 border border-red-100">
                            <p class="text-xl font-black text-red-500">${emp.pendingOrders}</p>
                            <p class="text-[10px] uppercase font-bold text-red-400 tracking-wider">Pending</p>
                        </div>
                        <div class="bg-purple-50 rounded-xl p-3 border border-purple-100">
                            <p class="text-xl font-black text-purple-500">${emp.dispatchedOrders}</p>
                            <p class="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Dispatched</p>
                        </div>
                        <div class="bg-green-50 rounded-xl p-3 border border-green-100">
                            <p class="text-xl font-black text-green-500">${emp.deliveredOrders}</p>
                            <p class="text-[10px] uppercase font-bold text-green-400 tracking-wider">Delivered</p>
                        </div>
                    </div>
                    
                    <div class="flex gap-2 mt-4">
                        <button onclick="event.stopPropagation(); showEditEmployeeModal('${emp.id}', '${emp.name}')" 
                            class="flex-1 bg-orange-50 text-orange-600 font-bold py-2 rounded-xl text-xs hover:bg-orange-100 transition-colors flex items-center justify-center gap-2 border border-orange-100">
                            <span>✏️</span> Edit
                        </button>
                        <button class="flex-[2] bg-indigo-50 text-indigo-600 font-bold py-2 rounded-xl text-xs hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                            <span>📊</span> Performance
                        </button>
                    </div>
                </div>
            </div>`;
        });
        html += '</div>';
        document.getElementById('adminEmployeesTab').innerHTML = html;
    } catch (e) { console.error(e); }
}

async function viewEmployeeProfile(empId) {
    try {
        const res = await fetch(`${API_URL}/employees/${empId}`);
        const data = await res.json();
        const emp = data.employee;
        const orders = data.orders || [];
        const stats = data.stats;

        // Improved Table Render
        let ordersHtml = '';
        if (orders.length === 0) {
            ordersHtml = `
                        <tr>
                            <td colspan="5" class="px-6 py-8 text-center text-gray-500 bg-gray-50">
                                <p class="text-xl mb-1">📭</p>
                                No order history found
                            </td>
                        </tr>`;
        } else {
            ordersHtml = orders.slice(0, 50).map(o => {
                let statusClass = 'bg-gray-100 text-gray-600';
                if (o.status === 'Pending') statusClass = 'bg-red-100 text-red-700';
                if (o.status === 'Address Verified') statusClass = 'bg-blue-100 text-blue-700';
                if (o.status === 'Dispatched') statusClass = 'bg-purple-100 text-purple-700';
                if (o.status === 'Delivered') statusClass = 'bg-green-100 text-green-700';

                return `
                         <tr class="hover:bg-gray-50 transition-colors border-b border-gray-100">
                            <td class="px-4 py-3 font-mono font-bold text-blue-600 text-xs">${o.orderId}</td>
                            <td class="px-4 py-3 font-medium text-gray-800 text-sm whitespace-nowrap max-w-[150px] truncate" title="${o.customerName}">${o.customerName}</td>
                            <td class="px-4 py-3 text-right font-bold text-gray-700 text-sm">₹${o.total}</td>
                            <td class="px-4 py-3 text-center">
                                <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusClass}">${o.status}</span>
                            </td>
                            <td class="px-4 py-3 text-right text-gray-400 text-xs font-mono">
                                ${o.timestamp ? new Date(o.timestamp).toLocaleDateString() : ''}
                            </td>
                        </tr>`;
            }).join('');
        }

        document.getElementById('employeeProfileContent').innerHTML = `
                <div class="glass-card p-0 overflow-hidden mb-6 bg-indigo-600 text-white relative">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-white rounded-full opacity-10 blur-3xl -mr-16 -mt-16"></div>
                    <div class="p-8 relative z-10 flex items-center gap-6">
                         <div class="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl font-black text-indigo-600 shadow-lg">
                            ${emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 class="text-3xl font-black tracking-tight mb-1">${emp.name}</h3>
                            <div class="flex items-center gap-2">
                                <p class="opacity-80 font-mono text-sm bg-indigo-500/30 inline-block px-3 py-1 rounded-lg border border-indigo-400/30">${emp.id}</p>
                                <button onclick="showEditEmployeeModal('${emp.id}', '${emp.name}')" class="bg-white/20 hover:bg-white/40 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-white/20">
                                    <span>✏️</span> Edit Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
                     <div class="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                        <p class="text-3xl font-black text-gray-800">${stats.total}</p>
                        <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total</p>
                    </div>
                     <div class="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                        <p class="text-3xl font-black text-red-500">${stats.pending}</p>
                        <p class="text-[10px] text-red-400 uppercase font-bold tracking-wider">Pending</p>
                    </div>
                     <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                        <p class="text-3xl font-black text-blue-500">${stats.verified}</p>
                        <p class="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Verified</p>
                    </div>
                     <div class="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                        <p class="text-3xl font-black text-purple-500">${stats.dispatched}</p>
                        <p class="text-[10px] text-purple-400 uppercase font-bold tracking-wider">Dispatched</p>
                    </div>
                     <div class="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                        <p class="text-3xl font-black text-green-500">${stats.delivered}</p>
                        <p class="text-[10px] text-green-400 uppercase font-bold tracking-wider">Delivered</p>
                    </div>
                </div>

                 <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex items-center justify-between">
                    <span class="text-sm font-bold text-indigo-800">📅 This Month's Performance</span>
                    <span class="text-2xl font-black text-indigo-600">${stats.thisMonth} <span class="text-xs font-medium text-indigo-400">Orders</span></span>
                </div>

                <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h4 class="font-bold text-gray-700">📋 Recent Activity (Last 50)</h4>
                    </div>
                    <div class="overflow-x-auto max-h-[400px]">
                        <table class="w-full text-left">
                            <thead class="bg-white sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                                    <th class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                                    <th class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                                    <th class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 text-sm">
                                ${ordersHtml}
                            </tbody>
                        </table>
                    </div>
                </div>`;

        document.getElementById('employeeProfileModal').classList.remove('hidden');

    } catch (e) { console.error(e); }
}

async function loadDepartments() {
    try {
        // Fetch departments and stats in parallel
        const [deptRes, statsRes] = await Promise.all([
            fetch(`${API_URL}/departments`),
            fetch(`${API_URL}/admin/department-stats`)
        ]);

        const deptData = await deptRes.json();
        const statsData = await statsRes.json();

        const departments = deptData.departments || [];
        const allStats = statsData.stats || {};

        if (departments.length === 0) {
            document.getElementById('adminDepartmentsTab').innerHTML = `
                        <div class="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p class="text-4xl mb-3">🏢</p>
                            <p class="text-gray-500 font-medium">No departments found. Use "Register Dept".</p>
                        </div>`;
            return;
        }

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';

        departments.forEach(dept => {
            // Determine type-specific styling
            let themeColor, icon, label, deptStats;
            if (dept.type === 'verification') {
                themeColor = 'blue';
                icon = '📍';
                label = 'Verification Dept';
                deptStats = allStats.verification || { today: 0, yesterday: 0, last7Days: 0 };
            } else if (dept.type === 'dispatch') {
                themeColor = 'purple';
                icon = '📦';
                label = 'Dispatch Dept';
                deptStats = allStats.dispatch || { today: 0, yesterday: 0, last7Days: 0 };
            } else if (dept.type === 'delivery') {
                themeColor = 'orange';
                icon = '🚚';
                label = 'Delivery Dept';
                deptStats = allStats.delivery || { today: 0, yesterday: 0, last7Days: 0 };
            } else {
                themeColor = 'gray';
                icon = '🏢';
                label = 'Department';
                deptStats = { today: 0, yesterday: 0, last7Days: 0 };
            }

            html += `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-${themeColor}-100 bg-white">
                <div class="p-6 bg-gradient-to-br from-${themeColor}-50/80 to-white flex items-center gap-4 relative">
                     <div class="absolute top-0 right-0 w-24 h-24 bg-${themeColor}-500 rounded-full opacity-5 -mr-8 -mt-8 pointer-events-none"></div>
                    <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-${themeColor}-100 shrink-0">
                        ${icon}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 text-lg leading-tight mb-1">${dept.name}</h3>
                        <span class="text-[10px] font-bold uppercase tracking-wider bg-${themeColor}-100 text-${themeColor}-700 px-2 py-0.5 rounded-md inline-block">
                            ${label}
                        </span>
                    </div>
                </div>
                
                <div class="p-6 border-t border-${themeColor}-50">
                    <!-- Day-to-Day Output Section -->
                    <div class="mb-6">
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span>📅</span> Day-to-Day Output
                        </p>
                        <div class="space-y-2">
                            <!-- Today -->
                            <div class="bg-${themeColor}-50/50 rounded-xl p-2 border border-${themeColor}-100/50 flex justify-between items-center">
                                <span class="text-[10px] font-bold text-${themeColor}-700 uppercase w-16">Today</span>
                                <div class="flex gap-3">
                                    <div class="text-center">
                                        <p class="text-lg font-black text-${themeColor}-700 loading-none">${(deptStats.today.fresh || 0) + (deptStats.today.reorder || 0)}</p>
                                    </div>
                                    <div class="h-8 w-px bg-${themeColor}-200"></div>
                                    <div class="text-right">
                                        <p class="text-[9px] font-bold text-${themeColor}-600">🆕 ${deptStats.today.fresh || 0}</p>
                                        <p class="text-[9px] font-bold text-${themeColor}-600">🔄 ${deptStats.today.reorder || 0}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Yesterday -->
                            <div class="bg-gray-50 rounded-xl p-2 border border-gray-100 flex justify-between items-center">
                                <span class="text-[10px] font-bold text-gray-500 uppercase w-16">Yesterday</span>
                                <div class="flex gap-3">
                                    <div class="text-center">
                                        <p class="text-lg font-black text-gray-600 loading-none">${(deptStats.yesterday.fresh || 0) + (deptStats.yesterday.reorder || 0)}</p>
                                    </div>
                                    <div class="h-8 w-px bg-gray-200"></div>
                                    <div class="text-right">
                                        <p class="text-[9px] font-bold text-gray-500">🆕 ${deptStats.yesterday.fresh || 0}</p>
                                        <p class="text-[9px] font-bold text-gray-500">🔄 ${deptStats.yesterday.reorder || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- 7 Days -->
                            <div class="bg-slate-50 rounded-xl p-2 border border-slate-100 flex justify-between items-center">
                                <span class="text-[10px] font-bold text-slate-500 uppercase w-16">Last 7 Days</span>
                                <div class="flex gap-3">
                                    <div class="text-center">
                                        <p class="text-lg font-black text-slate-600 loading-none">${(deptStats.last7Days.fresh || 0) + (deptStats.last7Days.reorder || 0)}</p>
                                    </div>
                                    <div class="h-8 w-px bg-slate-200"></div>
                                    <div class="text-right">
                                        <p class="text-[9px] font-bold text-slate-500">🆕 ${deptStats.last7Days.fresh || 0}</p>
                                        <p class="text-[9px] font-bold text-slate-500">🔄 ${deptStats.last7Days.reorder || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between gap-4">
                        <div class="flex items-center gap-2">
                            <span class="text-gray-400 text-[10px] font-bold uppercase tracking-wider">ID</span>
                            <span class="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded border border-gray-100 text-gray-600">${dept.id}</span>
                        </div>
                        <button type="button" onclick="openEditDeptModal('${dept.id}', '${dept.name}')" 
                            class="bg-white text-gray-500 hover:text-${themeColor}-600 p-2 rounded-lg hover:bg-${themeColor}-50 transition-all border border-transparent hover:border-${themeColor}-100">
                            ⚙️
                        </button>
                    </div>
                </div>
            </div>`;
        });
        html += '</div>';
        document.getElementById('adminDepartmentsTab').innerHTML = html;
    } catch (e) { console.error('Error loading departments:', e); }
}

async function openEditDeptModal(deptId, deptName) {
    // Fetch full department data
    try {
        const res = await fetch(`${API_URL}/departments`);
        const data = await res.json();
        const dept = (data.departments || []).find(d => d.id === deptId);

        if (dept) {
            document.getElementById('editDeptOldId').value = deptId;
            document.getElementById('editDeptNewId').value = deptId;
            document.getElementById('editDeptName').value = dept.name;
            document.getElementById('editDeptPass').value = '';
            document.getElementById('editDeptType').value = dept.type || 'verification';
            document.getElementById('editDeptModal').classList.remove('hidden');
        }
    } catch (e) {
        alert('Department load nahi hua!');
    }
}

async function updateDepartmentFull() {
    const oldId = document.getElementById('editDeptOldId').value;
    const newId = document.getElementById('editDeptNewId').value.trim().toUpperCase();
    const name = document.getElementById('editDeptName').value.trim();
    const password = document.getElementById('editDeptPass').value;
    const type = document.getElementById('editDeptType').value;

    if (!newId || !name || !password) {
        return alert('Sabhi fields bharein! ID, Name aur Password required hai.');
    }

    // If ID changed, we need to delete old and create new
    if (oldId !== newId) {
        if (!confirm(`Department ID "${oldId}" se "${newId}" change hogi. Purani ID delete ho jayegi. Confirm?`)) {
            return;
        }
    }

    try {
        // First delete old department
        await fetch(`${API_URL}/departments/${oldId}`, {
            method: 'DELETE'
        });

        // Then create new department with new/same ID
        const res = await fetch(`${API_URL}/departments/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                deptId: newId,
                password,
                deptType: type
            })
        });
        const data = await res.json();

        if (data.success) {
            closeModal('editDeptModal');
            showMessage(`✅ Department fully updated! New ID: ${newId}`, 'success', 'adminMessage');
            loadDepartments();
        } else {
            // If registration failed, try to restore old one
            alert(data.message || 'Update failed! Try again.');
        }
    } catch (e) {
        console.error(e);
        alert('Server error!');
    }
}

async function deleteDepartment() {
    const deptId = document.getElementById('editDeptOldId').value;

    if (!confirm(`Department "${deptId}" permanently delete karna hai? Ye action undo nahi hoga!`)) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/departments/${deptId}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
            closeModal('editDeptModal');
            showMessage('🗑️ Department deleted!', 'success', 'adminMessage');
            loadDepartments();
        } else {
            alert(data.message || 'Delete failed!');
        }
    } catch (e) {
        console.error(e);
        alert('Server error!');
    }
}

async function loadAdminHistory() {
    try {
        const res = await fetch(`${API_URL}/admin/history`);
        const data = await res.json();
        const orders = data.orders || [];

        const employees = [...new Set(orders.map(o => o.employeeId))];

        let html = `
                <div class="glass-card mb-6 p-4">
                    <div class="flex flex-wrap gap-4 items-end">
                        <div class="flex-1 min-w-[200px]">
                            <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Filter By Date</label>
                            <input type="date" id="adminHistoryDate" onchange="filterAdminHistory()" class="w-full border-2 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500">
                        </div>
                        <div class="flex-1 min-w-[200px]">
                            <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Employee</label>
                            <select id="adminHistoryEmployee" onchange="filterAdminHistory()" class="w-full border-2 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 bg-white">
                                <option value="">All Employees</option>
                                ${[...new Map(orders.filter(o => o.employeeId && o.employee).map(o => [o.employeeId, o.employee])).entries()].map(([id, name]) => `<option value="${id}">${name} (${id})</option>`).join('')}
                            </select>
                        </div>
                        <div class="flex-1 min-w-[200px]">
                             <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Status</label>
                             <select id="adminHistoryStatus" onchange="filterAdminHistory()" class="w-full border-2 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 bg-white">
                                <option value="">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Address Verified">Verified</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div id="adminHistoryList" class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"></div>`;

        document.getElementById('adminHistoryTab').innerHTML = html;
        renderAdminHistoryTable(orders);
    } catch (e) { console.error(e); }
}

async function filterAdminHistory() {
    const date = document.getElementById('adminHistoryDate').value;
    const employee = document.getElementById('adminHistoryEmployee').value;
    const status = document.getElementById('adminHistoryStatus').value;

    let url = `${API_URL}/admin/history?`;
    if (date) url += `date=${date}&`;
    if (employee) url += `employee=${employee}&`;
    if (status) url += `status=${status}&`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        renderAdminHistoryTable(data.orders || []);
    } catch (e) { console.error(e); }
}

function renderAdminHistoryTable(orders) {
    if (orders.length === 0) {
        document.getElementById('adminHistoryList').innerHTML = `
                <div class="text-center py-12">
                    <p class="text-4xl mb-3">🔍</p>
                    <p class="text-gray-500 font-medium">No matching history found</p>
                </div>`;
        return;
    }

    let html = `
            <div class="overflow-x-auto max-h-[600px]">
                <table class="w-full text-left">
                    <thead class="bg-white sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Employee</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Date</th>
                            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">`;

    orders.forEach(o => {
        let statusClass = 'bg-gray-100 text-gray-600';
        if (o.status === 'Pending') statusClass = 'bg-red-100 text-red-700';
        else if (o.status === 'Address Verified') statusClass = 'bg-blue-100 text-blue-700';
        else if (o.status === 'Dispatched') statusClass = 'bg-purple-100 text-purple-700';
        else if (o.status === 'Delivered') statusClass = 'bg-green-100 text-green-700';

        html += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 font-mono font-bold text-blue-600 text-xs">${o.orderId}</td>
                    <td class="px-6 py-4 font-medium text-gray-700">${o.employee} (${o.employeeId})</td>
                    <td class="px-6 py-4 text-gray-600 max-w-[150px] truncate" title="${o.customerName}">${o.customerName}</td>
                    <td class="px-6 py-4 text-right font-bold text-gray-800">₹${(o.total || 0).toFixed(2)}</td>
                    <td class="px-6 py-4 text-center">
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusClass}">${o.status}</span>
                    </td>
                    <td class="px-6 py-4 text-right text-xs text-gray-400 font-mono">
                        ${o.timestamp ? new Date(o.timestamp).toLocaleDateString() + ' ' + new Date(o.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button type="button" onclick="viewOrder('${o.orderId}')" 
                                class="text-indigo-600 hover:text-indigo-800 font-bold text-xs hover:underline">
                                View
                            </button>
                            <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(o).replace(/"/g, '&quot;')})" 
                                class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-sm transition-all" title="Send WhatsApp">
                                ${WHATSAPP_ICON}
                            </button>
                        </div>
                    </td>
                </tr>`;
    });
    html += '</tbody></table></div>';
    document.getElementById('adminHistoryList').innerHTML = html;
}

async function loadAdminProgress() {
    const html = `
        <div class="glass-card mb-6 p-4">
            <div class="flex flex-wrap gap-4 items-end">
                <div class="flex-1 min-w-[150px]">
                    <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Start Date</label>
                    <input type="date" id="adminProgressStartDate" onchange="filterAdminProgress()" class="w-full border-2 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500">
                </div>
                <div class="flex-1 min-w-[150px]">
                    <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">End Date</label>
                    <input type="date" id="adminProgressEndDate" onchange="filterAdminProgress()" class="w-full border-2 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500">
                </div>
                <div class="flex-1 min-w-[150px]">
                    <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Employee</label>
                    <select id="adminProgressEmployee" onchange="filterAdminProgress()" class="w-full border-2 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 bg-white">
                        <option value="">All Employees</option>
                    </select>
                </div>
                <div class="flex gap-2">
                    <button onclick="loadAdminProgress()" class="bg-blue-500 text-white font-bold px-6 py-2 rounded-xl text-sm hover:bg-blue-600 transition-all">
                        🔄 Refresh
                    </button>
                    <button onclick="exportAnalyticsReport()" class="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl text-sm hover:bg-emerald-700 transition-all flex items-center gap-2">
                        <span>📥</span> Export Report
                    </button>
                </div>
            </div>
        </div>

        <div id="adminProgressStatsContainer" class="space-y-6">
            <!-- Summary Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="analyticsSummaryGrid">
                <div class="animate-pulse bg-gray-100 h-24 rounded-2xl"></div>
                <div class="animate-pulse bg-gray-100 h-24 rounded-2xl"></div>
                <div class="animate-pulse bg-gray-100 h-24 rounded-2xl"></div>
                <div class="animate-pulse bg-gray-100 h-24 rounded-2xl"></div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Main Trend Chart -->
                <div class="lg:col-span-2 glass-card p-6 bg-white shadow-sm border border-slate-100">
                    <div class="flex items-center justify-between mb-6">
                        <h4 class="font-bold text-slate-800 flex items-center gap-2">
                             <span class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">📈</span>
                             Business Performance Trend
                        </h4>
                        <div class="flex gap-4 text-xs font-semibold">
                             <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span>Revenue</span>
                             <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500"></span>Delivered</span>
                             <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-rose-500"></span>Cancelled</span>
                        </div>
                    </div>
                    <div class="relative h-[300px]">
                        <canvas id="trendChart"></canvas>
                    </div>
                </div>

                <!-- Status Distribution Chart -->
                <div class="glass-card p-6 bg-white shadow-sm border border-slate-100">
                    <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2">
                         <span class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">🥧</span>
                         Order Breakdown
                    </h4>
                    <div class="relative h-[300px] flex items-center justify-center">
                        <canvas id="statusChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Employee Performance -->
                <div class="glass-card p-6 bg-white shadow-sm border border-slate-100">
                    <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2">
                         <span class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">🏆</span>
                         Employee Leaderboard
                    </h4>
                    <div class="relative h-[300px]">
                        <canvas id="employeeChart"></canvas>
                    </div>
                </div>

                <!-- City Distribution -->
                <div class="glass-card p-6 bg-white shadow-sm border border-slate-100">
                    <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2">
                         <span class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">📍</span>
                         Top Cities (Orders)
                    </h4>
                    <div class="relative h-[300px]">
                        <canvas id="cityChart"></canvas>
                    </div>
                </div>
            </div>
        </div>`;

    document.getElementById('adminProgressTab').innerHTML = html;

    // Load Employees for dropdown
    try {
        const res = await fetch(`${API_URL}/employees`);
        const data = await res.json();
        const employees = data.employees || [];
        const select = document.getElementById('adminProgressEmployee');
        employees.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e.id;
            opt.textContent = `${e.name} (${e.id})`;
            select.appendChild(opt);
        });
    } catch (e) { console.error('Error loading employees for filter', e); }

    // Initial Filter Call
    filterAdminProgress();
}

// Global Chart Instances
let analyticsCharts = {
    trend: null,
    status: null,
    employee: null,
    city: null
};

async function filterAdminProgress() {
    try {
        const startDate = document.getElementById('adminProgressStartDate').value;
        const endDate = document.getElementById('adminProgressEndDate').value;
        const employeeId = document.getElementById('adminProgressEmployee').value;

        // Fetch range data from dedicated API
        let url = `${API_URL}/analytics/range?`;
        if (startDate) url += `startDate=${startDate}&`;
        if (endDate) url += `endDate=${endDate}&`;
        if (employeeId) url += `employeeId=${employeeId}&`;

        const res = await fetch(url);
        const result = await res.json();

        // We also need all orders for detailed chart processing if range API is too light
        // For now, let's fetch history for full flexibility in charting
        const historyRes = await fetch(`${API_URL}/admin/history`);
        const historyData = await historyRes.json();
        // Pre-process Fresh/Re-order status on FULL history before filtering
        const sortedHistory = [...(historyData.orders || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const seenMobiles = new Set();
        const orderReorderMap = new Map(); // Map orderId -> isReorder boolean

        sortedHistory.forEach(o => {
            const mobile = o.telNo || o.mobileNumber;
            const isReorder = seenMobiles.has(mobile);
            if (mobile) seenMobiles.add(mobile);
            orderReorderMap.set(o.orderId, isReorder);
        });

        // Apply filters locally on the full set
        // Note: We use orderReorderMap to check status during counting
        let orders = historyData.orders || [];
        if (startDate) orders = orders.filter(o => o.timestamp >= startDate);
        if (endDate) orders = orders.filter(o => o.timestamp <= endDate + 'T23:59:59');
        if (employeeId) orders = orders.filter(o => o.employeeId === employeeId);

        // Calculate Summary Stats
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const delivered = orders.filter(o => o.status === 'Delivered').length;
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0;

        // Calculate Fresh vs Re-order for the FILTERED set
        let freshCount = 0;
        let reorderCount = 0;
        orders.forEach(o => {
            if (orderReorderMap.get(o.orderId)) reorderCount++;
            else freshCount++;
        });

        // Find Top City
        const cityCounts = {};
        orders.forEach(o => {
            const loc = (o.distt || o.city || '').trim().toUpperCase();
            if (loc && loc !== 'SAME' && loc !== 'NA' && loc !== 'N/A' && loc !== 'NULL') {
                cityCounts[loc] = (cityCounts[loc] || 0) + 1;
            }
        });
        const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Render Summary Grid
        document.getElementById('analyticsSummaryGrid').innerHTML = `
            <div class="glass-card p-6 bg-white border border-blue-50">
                <p class="text-xs font-bold text-slate-400 uppercase mb-1">Total Revenue</p>
                <div class="flex items-end justify-between">
                    <p class="text-2xl font-black text-slate-800">₹${totalRevenue.toLocaleString()}</p>
                    <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">💰 Income</span>
                </div>
            </div>
            <div class="glass-card p-4 bg-white border border-emerald-50">
                <p class="text-xs font-bold text-slate-400 uppercase mb-1">Total Orders</p>
                <div class="flex items-end justify-between mb-2">
                    <p class="text-3xl font-black text-slate-800">${totalOrders}</p>
                    <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">📦 Volume</span>
                </div>
                <div class="flex gap-2 pt-2 border-t border-slate-50">
                     <div class="flex-1 text-center bg-emerald-50/50 rounded-lg py-1 border border-emerald-100">
                        <span class="block text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Fresh</span>
                        <span class="block text-xl font-black text-emerald-600">🆕 ${freshCount}</span>
                     </div>
                     <div class="flex-1 text-center bg-blue-50/50 rounded-lg py-1 border border-blue-100">
                        <span class="block text-[10px] uppercase font-bold text-blue-500 tracking-wider">Re-order</span>
                        <span class="block text-xl font-black text-blue-600">🔄 ${reorderCount}</span>
                     </div>
                </div>
            </div>
            <div class="glass-card p-6 bg-white border border-amber-50">
                <p class="text-xs font-bold text-slate-400 uppercase mb-1">Avg Order Value</p>
                <div class="flex items-end justify-between">
                    <p class="text-2xl font-black text-slate-800">₹${avgOrderValue}</p>
                    <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">📊 Ticket</span>
                </div>
            </div>
            <div class="glass-card p-6 bg-white border border-purple-50">
                <p class="text-xs font-bold text-slate-400 uppercase mb-1">Top Marketing City</p>
                <div class="flex items-end justify-between">
                    <p class="text-2xl font-black text-slate-800 truncate pr-2" title="${topCity}">${topCity}</p>
                    <span class="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">📍 Lead</span>
                </div>
            </div>
        `;

        // Render Charts
        renderAnalyticsTrend(orders);
        renderAnalyticsStatus(orders);
        renderAnalyticsEmployees(orders);
        renderAnalyticsCities(orders);

    } catch (e) {
        console.error('Error filtering progress', e);
        showToast('Analytics load failed!', 'error');
    }
}

// Chart Helper: Trend Line
function renderAnalyticsTrend(orders) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    if (analyticsCharts.trend) analyticsCharts.trend.destroy();

    // Process data: group by date
    const dailyData = {};
    orders.forEach(o => {
        const date = (o.timestamp || '').split('T')[0];
        if (!date) return;
        if (!dailyData[date]) dailyData[date] = { revenue: 0, delivered: 0, cancelled: 0 };
        dailyData[date].revenue += (o.total || 0);
        if (o.status === 'Delivered') dailyData[date].delivered++;
        if (o.status === 'Cancelled') dailyData[date].cancelled++;
    });

    const labels = Object.keys(dailyData).sort();
    const revenueSet = labels.map(l => dailyData[l].revenue);
    const deliveredSet = labels.map(l => dailyData[l].delivered);
    const cancelledSet = labels.map(l => dailyData[l].cancelled);

    analyticsCharts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Revenue (₹)',
                    data: revenueSet,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Delivered',
                    data: deliveredSet,
                    borderColor: '#10b981',
                    borderDash: [5, 5],
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: { type: 'linear', display: true, position: 'left', grid: { drawOnChartArea: false } },
                y1: { type: 'linear', display: true, position: 'right' }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// Chart Helper: Status Doughnut
function renderAnalyticsStatus(orders) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    if (analyticsCharts.status) analyticsCharts.status.destroy();

    const stats = {
        'Delivered': orders.filter(o => o.status === 'Delivered').length,
        'Cancelled': orders.filter(o => o.status === 'Cancelled').length,
        'On Hold': orders.filter(o => o.status === 'On Hold').length,
        'Pending': orders.filter(o => o.status === 'Pending').length,
        'Verified': orders.filter(o => o.status === 'Address Verified').length,
        'In Transit': orders.filter(o => o.status === 'Dispatched').length
    };

    analyticsCharts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(stats),
            datasets: [{
                data: Object.values(stats),
                backgroundColor: [
                    '#10b981', // Delivered (Emerald)
                    '#ef4444', // Cancelled (Red)
                    '#f59e0b', // On Hold (Amber)
                    '#f43f5e', // Pending (Rose/Pink)
                    '#3b82f6', // Verified (Blue)
                    '#8b5cf6'  // In Transit (Violet)
                ],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    bodyFont: { size: 13 },
                    titleFont: { size: 13, weight: '700' }
                }
            },
            cutout: '70%'
        }
    });
}

// Chart Helper: Employee Performance
function renderAnalyticsEmployees(orders) {
    const ctx = document.getElementById('employeeChart').getContext('2d');
    if (analyticsCharts.employee) analyticsCharts.employee.destroy();

    const empStats = {};
    orders.forEach(o => {
        if (!o.employee) return;
        const empName = o.employee;
        if (!empStats[empName]) empStats[empName] = { total: 0, delivered: 0 };
        empStats[empName].total++;
        if (o.status === 'Delivered') empStats[empName].delivered++;
    });

    // Sort by total orders and take top 10
    const sortedData = Object.entries(empStats)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10);

    const labels = sortedData.map(d => d[0]);
    const totalData = sortedData.map(d => d[1].total);
    const deliveredData = sortedData.map(d => d[1].delivered);

    analyticsCharts.employee = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Orders',
                    data: totalData,
                    backgroundColor: '#6366f1', // Indigo
                    borderRadius: 6
                },
                {
                    label: 'Delivered',
                    data: deliveredData,
                    backgroundColor: '#10b981', // Emerald
                    borderRadius: 6
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { boxWidth: 12, font: { size: 10, weight: '600' } }
                }
            },
            scales: {
                x: { stacked: false, grid: { display: false } },
                y: { stacked: false, grid: { display: false } }
            }
        }
    });
}

// Chart Helper: City Distribution
function renderAnalyticsCities(orders) {
    const ctx = document.getElementById('cityChart').getContext('2d');
    if (analyticsCharts.city) analyticsCharts.city.destroy();

    const cityStats = {};
    orders.forEach(o => {
        const city = (o.distt || o.city || '').trim().toUpperCase();
        if (!city || city === 'SAME' || city === 'NA' || city === 'N/A' || city === 'NULL') return;
        cityStats[city] = (cityStats[city] || 0) + 1;
    });

    const data = Object.entries(cityStats).sort((a, b) => b[1] - a[1]).slice(0, 5);

    analyticsCharts.city = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: data.map(d => d[0]),
            datasets: [{
                data: data.map(d => d[1]),
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });
}

// ==================== SHARED FUNCTIONS ====================
async function viewOrder(orderId) {
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await res.json();
        const order = data.order;

        const tracking = order.tracking || {};

        let itemsHtml = (order.items || []).map(i => {
            const name = i.description || i.name || i.product || 'Unknown Item';
            const qty = i.quantity || i.qty || 0;

            return `<tr>
                        <td class="p-2">${name}</td>
                        <td class="p-2 text-center font-bold">${qty}</td>
                    </tr>`;
        }).join('');

        document.getElementById('orderModalContent').innerHTML = ` <div class="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <h4 class="font-bold text-gray-700 mb-3">👤 Customer Info</h4> <p><strong>Name:</strong> ${order.customerName}

                </p> <p><strong>Tel:</strong> ${order.telNo}

                </p> <p><strong>Alt:</strong> ${order.altNo || 'N/A'
            }

                </p> <p><strong>Treatment:</strong> ${order.treatment || 'N/A'
            }

                </p> <h4 class="font-bold text-gray-700 mt-4 mb-3">📍 Address</h4> <p class="text-sm bg-gray-100 p-3 rounded-lg">${order.address || 'N/A'
            }

                </p> <p class="text-xs text-gray-500 mt-1">PIN: ${order.pin || 'N/A'
            }

                | State: ${order.state || 'N/A'
            }

                </p> ${order.landMark ? `<p class="text-xs text-gray-500"> Landmark: ${order.landMark}

                    </p> ` : ''
            }

                </div> <div> <h4 class="font-bold text-gray-700 mb-3">📦 Order Info</h4> <p><strong>Order ID:</strong> ${order.orderId}

                </p> <p><strong>Status:</strong> <span class="px-2 py-0.5 rounded-full text-xs ${order.status === 'Delivered' ? 'status-delivered' : order.status === 'Pending' ? 'status-pending' : order.status === 'Dispatched' ? 'status-dispatched' : 'status-verified'}">${order.status}

                </span></p> <p><strong>Employee:</strong> <span class="font-extrabold text-emerald-700">${order.employee}</span>

                (${order.employeeId})</p> <p><strong>Date:</strong> ${order.date || 'N/A'
            }

                | <strong>Time:</strong> ${order.time || 'N/A'
            }

                </p> <p><strong>Type:</strong> ${order.orderType}

                </p> ${tracking.courier ? ` <div class="bg-purple-50 p-3 rounded-lg mt-3"> <p><strong>🚚 Courier:</strong> ${tracking.courier}

                    </p> <p><strong>Tracking:</strong> <span class="font-mono bg-white px-2 py-1 rounded">${tracking.trackingId || 'N/A'
                }

                    </span></p> </div> ` : ''
            }

                </div> </div> <h4 class="font-bold text-gray-700 mt-6 mb-3">🛒 Items</h4> <div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"> <thead class="bg-gray-100"><tr><th class="p-2 text-left">ITEM</th><th class="p-2 text-center">QTY</th></tr></thead> <tbody>${itemsHtml}

                </tbody> </table></div> <div class="mt-4 bg-emerald-50 p-4 rounded-lg"> <div class="flex justify-between"><span>Total:</span><span class="font-bold">₹${order.total}

                </span></div> <div class="flex justify-between"><span>Advance:</span><span>₹${order.advance || 0
            }

                </span></div> <div class="flex justify-between text-lg font-bold text-red-600"><span>COD:</span><span>₹${order.codAmount || 0
            }

                </span></div> </div> `;
        document.getElementById('orderModal').classList.remove('hidden');
    }

    catch (e) {
        console.error(e);
    }
}

async function deleteOrder(orderId) {
    if (!confirm(`Are you sure you want to delete order ${orderId}?`)) return;

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'DELETE'
        });
        const data = await res.json();

        if (data.success) {
            showMessage('Order deleted successfully! ✅', 'success', 'adminMessage');
            loadAdminData(); // Refresh stats

            // Refresh current active tab
            const activeTabButton = document.querySelector('#adminPanel .tab-active');
            if (activeTabButton) {
                const tabId = activeTabButton.id;
                if (tabId === 'adminTabPending') loadAdminPending();
                else if (tabId === 'adminTabVerified') loadAdminVerified();
                else if (tabId === 'adminTabDispatched') loadAdminDispatched();
                else if (tabId === 'adminTabDelivered') loadAdminDelivered();
            }
        } else {
            alert('❌ Delete failed: ' + (data.message || 'Unknown error'));
        }
    } catch (e) {
        console.error('Delete error:', e);
        alert('❌ Error: Server se contact nahi ho paya!');
    }
}

function showRegisterDeptModal() {
    document.getElementById('newDeptName').value = '';
    document.getElementById('newDeptId').value = '';
    document.getElementById('newDeptPass').value = '';
    document.getElementById('newDeptType').value = '';
    document.getElementById('registerDeptModal').classList.remove('hidden');
}

async function registerDepartment() {
    const name = document.getElementById('newDeptName').value.trim();
    const id = document.getElementById('newDeptId').value.trim();
    const pass = document.getElementById('newDeptPass').value;
    const type = document.getElementById('newDeptType').value;

    if (!name || !id || !pass) return alert('Sabhi fields bharein!');

    try {
        const res = await fetch(`${API_URL}/departments/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }

            ,
            body: JSON.stringify({
                name: toTitleCase(name), deptId: id, password: pass, deptType: type
            })
        });
        const data = await res.json();

        if (data.success) {
            closeModal('registerDeptModal');
            showMessage('✅ Department registered!', 'success', 'adminMessage');
            loadDepartments();
        }

        else {
            alert(data.message);
        }
    }

    catch (e) {
        alert('Server error!');
    }
}

function copyTracking(text) {
    // Text argument can be tracking ID or Address
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => alert('Copied: ' + text))
            .catch(err => console.error('Copy failed', err));
    } else {
        // Robust Fallback for Mobile/HTTP
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure element is part of the layout but invisible to user
        // 'display: none' or 'visibility: hidden' won't work for selection
        textArea.style.position = "fixed";
        textArea.style.left = "0";
        textArea.style.top = "0";
        textArea.style.width = "2em";
        textArea.style.height = "2em";
        textArea.style.opacity = "0";
        textArea.style.pointerEvents = "none";
        textArea.style.zIndex = "-1";

        textArea.setAttribute("readonly", ""); // Prevent zoom on mobile

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        // For mobile devices specifically
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 999999);

        try {
            const successful = document.execCommand('copy');
            const msg = successful ? 'Copied: ' + text : 'Copy failed manually';
            alert(msg);
        } catch (err) {
            console.error('Fallback copy failed', err);
            prompt("Copy manually:", text);
        }

        document.body.removeChild(textArea);
    }
}

// Helper to map order to Excel schema
function mapOrderForExport(order, index) {
    let address = order.address || '';
    let landmark = '';
    if (typeof address === 'object' && address !== null) {
        landmark = address.landmark || order.landmark || order.landMark || '';
        address = `${address.houseNo || ''}, ${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;
    } else {
        landmark = order.landmark || order.landMark || '';
    }

    const fullAddress = landmark ? `${address} {${landmark}}` : address;

    let productNames = '';
    if (Array.isArray(order.items)) {
        productNames = order.items.map(i => i && i.description ? i.description : '').join(', ');
    } else if (typeof order.items === 'string') {
        productNames = order.items;
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB');
        } catch (e) { return dateStr; }
    };

    return {
        "S.No": index + 1,
        "Customer Name": order.customerName || '',
        "Mobile Number": order.telNo || '',
        "Address": toTitleCase(fullAddress),
        "Add1": "",
        "Add2": "",
        "Add3": "",
        "Order Date": formatDate(order.timestamp),
        "Delivered Date": order.status === 'Delivered' ? formatDate(order.deliveryDate) : '',
        "Product Name": productNames,
        "Delivery Status": order.status || 'Unknown',
        "Amount Rs.": order.total || 0,
        "Advance Payment": order.advance || 0,
        "Payment Method": order.paymentMode || 'COD',
        "Agent": order.employee || '',
        "Order Type": order.orderType || 'New',
        "Invoice Date": formatDate(order.tracking?.dispatchedAt || order.dispatchedAt || order.timestamp),
        "Delivered by": (order.shiprocket && order.shiprocket.courierName) ? order.shiprocket.courierName : (order.courier || order.dispatchedBy || ''),
        "AWB Number": order.tracking ? (order.tracking.trackingId || '') : '',
        "RTO Status": order.rtoStatus || ''
    };
}

async function exportAllOrders() {
    try {
        showMessage('⏳ Generating Excel file...', 'success', 'adminMessage');
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        if (!data.success || !data.orders) throw new Error('Orders load nahi hue!');

        const exportData = data.orders.map((o, i) => mapOrderForExport(o, i));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "All_Orders");

        XLSX.writeFile(wb, `HerbOnNaturals_All_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
        showMessage('All Orders Exported! ✅', 'success', 'adminMessage');
    } catch (e) {
        console.error(e);
        alert('Export failed! ' + e.message);
    }
}

async function exportOrdersByStatus(status) {
    try {
        showMessage(`⏳ Generating ${status} Orders Excel...`, 'success', 'adminMessage');
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        if (!data.success || !data.orders) throw new Error('Orders load nahi hue!');

        // Filter by Status
        const filtered = data.orders.filter(o => o.status === status);

        if (filtered.length === 0) {
            return alert(`Koi '${status}' orders nahi mile!`);
        }

        const exportData = filtered.map((o, i) => mapOrderForExport(o, i));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Orders");

        const fileName = `${status.replace(/\s+/g, '_')}_Orders_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showMessage(`${status} Orders Exported! ✅`, 'success', 'adminMessage');
    } catch (e) {
        console.error(e);
        alert('Export failed! ' + e.message);
    }
}

async function exportAnalyticsReport() {
    try {
        const startDate = document.getElementById('adminProgressStartDate').value;
        const endDate = document.getElementById('adminProgressEndDate').value;
        const employeeId = document.getElementById('adminProgressEmployee').value;

        showMessage('⏳ Preparing Analytics Report...', 'success', 'adminMessage');

        // Fetch all orders for report generation
        const res = await fetch(`${API_URL}/admin/history`);
        const data = await res.json();
        let orders = data.orders || [];

        // Apply filters
        if (startDate) orders = orders.filter(o => o.timestamp >= startDate);
        if (endDate) orders = orders.filter(o => o.timestamp <= endDate + 'T23:59:59');
        if (employeeId) orders = orders.filter(o => o.employeeId === employeeId);

        const wb = XLSX.utils.book_new();

        // 1. DASHBOARD SUMMARY
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const delivered = orders.filter(o => o.status === 'Delivered').length;
        const cancelled = orders.filter(o => o.status === 'Cancelled').length;
        const hold = orders.filter(o => o.status === 'On Hold').length;
        const pending = orders.filter(o => o.status === 'Pending').length;

        const summaryData = [
            { Metric: "Total Orders", Value: orders.length },
            { Metric: "Total Revenue", Value: `₹${totalRevenue.toLocaleString()}` },
            { Metric: "Average Order Value", Value: orders.length > 0 ? `₹${(totalRevenue / orders.length).toFixed(2)}` : 0 },
            { Metric: "Delivered Orders", Value: delivered },
            { Metric: "Cancelled Orders", Value: cancelled },
            { Metric: "On Hold Orders", Value: hold },
            { Metric: "Pending Orders", Value: pending },
            { Metric: "Report Start Date", Value: startDate || 'All Time' },
            { Metric: "Report End Date", Value: endDate || 'All Time' }
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

        // 2. EMPLOYEE PERFORMANCE
        const empStats = {};
        orders.forEach(o => {
            const eid = o.employeeId || 'Unknown';
            const ename = o.employee || 'Unknown';
            const key = `${eid} - ${ename}`;
            if (!empStats[key]) empStats[key] = { ID: eid, Name: ename, Total: 0, Delivered: 0, Revenue: 0 };
            empStats[key].Total++;
            empStats[key].Revenue += (o.total || 0);
            if (o.status === 'Delivered') empStats[key].Delivered++;
        });
        const employeeData = Object.values(empStats).sort((a, b) => b.Total - a.Total);
        const wsEmployee = XLSX.utils.json_to_sheet(employeeData);
        XLSX.utils.book_append_sheet(wb, wsEmployee, "Employee_Performance");

        // 3. CITY BREAKDOWN
        const cityStats = {};
        orders.forEach(o => {
            const city = (o.distt || o.city || 'Unknown').trim().toUpperCase();
            if (city === 'SAME' || city === 'NA') return;
            if (!cityStats[city]) cityStats[city] = { City: city, Orders: 0, Revenue: 0 };
            cityStats[city].Orders++;
            cityStats[city].Revenue += (o.total || 0);
        });
        const cityData = Object.values(cityStats).sort((a, b) => b.Orders - a.Orders).slice(0, 100);
        const wsCity = XLSX.utils.json_to_sheet(cityData);
        XLSX.utils.book_append_sheet(wb, wsCity, "City_Breakdown");

        // 4. DAILY TREND
        const dailyStats = {};
        orders.forEach(o => {
            const date = (o.timestamp || '').split('T')[0];
            if (!date) return;
            if (!dailyStats[date]) dailyStats[date] = { Date: date, Orders: 0, Revenue: 0, Delivered: 0 };
            dailyStats[date].Orders++;
            dailyStats[date].Revenue += (o.total || 0);
            if (o.status === 'Delivered') dailyStats[date].Delivered++;
        });
        const trendData = Object.values(dailyStats).sort((a, b) => a.Date.localeCompare(b.Date));
        const wsTrend = XLSX.utils.json_to_sheet(trendData);
        XLSX.utils.book_append_sheet(wb, wsTrend, "Daily_Trend");

        // 5. RAW DATA
        const rawData = orders.map((o, i) => mapOrderForExport(o, i));
        const wsRaw = XLSX.utils.json_to_sheet(rawData);
        XLSX.utils.book_append_sheet(wb, wsRaw, "Source_Data");

        // Save File
        const fileName = `HerbOnNaturals_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showMessage('Analytics Report Exported! ✅', 'success', 'adminMessage');

    } catch (e) {
        console.error('Export Analytics Error', e);
        alert('Export Failed: ' + e.message);
    }
}

// Helper function for title case
function toTitleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Handle Header Export Button Click
function handleDepartmentExport() {
    if (currentDeptType === 'dispatch') {
        exportDispatchedOrders();
    } else {
        exportAllOrders();
    }
}

// Export Only Dispatched Orders (For Dispatch Dept)
async function exportDispatchedOrders() {
    try {
        // Show loading
        const btn = document.getElementById('deptExportBtn') || event.target.closest('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Generating...';
        btn.disabled = true;

        // Fetch all raw data from server
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();

        if (!data.success || !data.orders) throw new Error('Failed to fetch orders');

        // Read Date Filter from HEADER
        const dateInput = document.getElementById('headerDateFilter');
        let selectedDateStr = dateInput ? dateInput.value : '';

        let targetDate;
        if (selectedDateStr) {
            targetDate = new Date(selectedDateStr).toDateString(); // User selected date
        } else {
            // Default to TODAY if empty
            targetDate = new Date().toDateString();
            if (dateInput) dateInput.valueAsDate = new Date(); // Visually set it
        }

        // Filter: 'Dispatched' OR 'Delivered' AND matches Date
        const orders = data.orders.filter(o => {
            // 1. Status Check (Include both Dispatched and Delivered)
            if (o.status !== 'Dispatched' && o.status !== 'Delivered') return false;

            // 2. Date Check (Prefer root dispatchedAt, then tracking, then timestamp)
            const dAt = o.dispatchedAt || o.tracking?.dispatchedAt || o.timestamp;
            if (!dAt) return false;

            const orderDate = new Date(dAt);
            return orderDate.toDateString() === targetDate;
        });

        if (orders.length === 0) {
            alert(`No 'Dispatched' orders found for ${targetDate}!`);
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        const fileNameLabel = selectedDateStr || 'Today';

        // Map to Schema (MATCHING ADMIN EXPORT EXACTLY)
        const exportData = orders.map((order, index) => {
            let address = order.address || '';
            let landmark = '';

            if (typeof address === 'object' && address !== null) {
                // Try all sources for landmark
                landmark = address.landmark || order.landmark || order.landMark || '';
                address = `${address.houseNo || ''}, ${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;
            } else {
                // Legacy address string, try to find landmark in order root
                landmark = order.landmark || order.landMark || '';
            }

            // Append landmark in braces if it exists
            const fullAddress = landmark ? `${address} {${landmark}}` : address;

            // Handle items safely
            let productNames = '';
            if (Array.isArray(order.items)) {
                productNames = order.items.map(i => i && i.description ? i.description : '').join(', ');
            } else if (typeof order.items === 'string') {
                productNames = order.items;
            }

            // Safe date formatting
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                try {
                    return new Date(dateStr).toLocaleDateString('en-GB');
                } catch (e) { return dateStr; }
            };

            return {
                "S.No": index + 1,
                "Customer Name": order.customerName || '',
                "Mobile Number": order.telNo || '',
                "Address": toTitleCase(fullAddress),
                "Add1": "", // Placeholder
                "Add2": "", // Placeholder
                "Add3": "", // Placeholder
                "Order Date": formatDate(order.timestamp),
                "Delivered Date": order.status === 'Delivered' ? formatDate(order.deliveryDate) : '',
                "Product Name": productNames,
                "Delivery Status": "On Way",
                "Amount Rs.": order.total || 0,
                "Advance Payment": order.advance || 0,
                "Payment Method": order.paymentMode || 'COD',
                "Agent": order.employee || '',
                "Order Type": order.orderType || 'New',
                "Invoice Date": formatDate(order.tracking?.dispatchedAt || order.dispatchedAt || order.timestamp),
                "Delivered by": (order.shiprocket && order.shiprocket.courierName)
                    ? order.shiprocket.courierName
                    : (order.tracking && order.tracking.courier ? order.tracking.courier
                        : (order['shiprocket.courierName'] || order.courier || order.dispatchedBy || '')),
                "AWB Number": (order.shiprocket && order.shiprocket.awb)
                    ? order.shiprocket.awb
                    : (order['shiprocket.awb'] || (order.tracking ? (order.tracking.trackingId || '') : '')),
                "RTO Status": order.rtoStatus || ''
            };
        });

        // Convert to Sheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dispatched_Orders");

        // Download
        XLSX.writeFile(wb, `Dispatched_Orders_${fileNameLabel}_${new Date().getTime()}.xlsx`);

        btn.innerHTML = originalText;
        btn.disabled = false;

    } catch (e) {
        console.error('Export Error:', e);
        alert('Export failed! ' + e.message);
        const btn = document.getElementById('deptExportBtn') || event?.target?.closest('button');
        if (btn) {
            btn.innerHTML = '📥 Export CSV';
            btn.disabled = false;
        }
    }
}

async function exportDispatchedOrdersFiltered(event) {
    try {
        // Show loading
        const btn = event?.target?.closest('button') || document.querySelector('button[onclick*="exportDispatchedOrdersFiltered"]');
        if (!btn) {
            alert('Button not found!');
            return;
        }
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ Generating...';
        btn.disabled = true;

        // Fetch all raw data from server
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();

        if (!data.success || !data.orders) throw new Error('Failed to fetch orders');

        // Read filters from Dispatched tab
        const dateFilter = document.getElementById('dispatchedDateFilter')?.value;
        const searchFilter = document.getElementById('dispatchedSearch')?.value.toLowerCase();

        // Filter: 'Dispatched' OR 'Delivered'
        let orders = data.orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered');

        // Apply Date Filter
        if (dateFilter) {
            orders = orders.filter(o => {
                const dateStr = o.dispatchedAt ? o.dispatchedAt.split('T')[0] : (o.timestamp ? o.timestamp.split('T')[0] : null);
                return dateStr === dateFilter;
            });
        }

        // Apply Search Filter
        if (searchFilter) {
            orders = orders.filter(o =>
                (o.customerName && o.customerName.toLowerCase().includes(searchFilter)) ||
                (o.telNo && o.telNo.includes(searchFilter)) ||
                (o.orderId && o.orderId.toLowerCase().includes(searchFilter))
            );
        }

        if (orders.length === 0) {
            alert('No dispatched orders found matching the current filters!');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        const fileNameLabel = dateFilter || 'All_Dispatched';

        // Map to Schema (MATCHING ADMIN EXPORT EXACTLY)
        const exportData = orders.map((order, index) => {
            let address = order.address || '';
            let landmark = '';

            if (typeof address === 'object' && address !== null) {
                landmark = address.landmark || order.landmark || order.landMark || '';
                address = `${address.houseNo || ''}, ${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;
            } else {
                landmark = order.landmark || order.landMark || '';
            }

            const fullAddress = landmark ? `${address} {${landmark}}` : address;

            let productNames = '';
            if (Array.isArray(order.items)) {
                productNames = order.items.map(i => i && i.description ? i.description : '').join(', ');
            } else if (typeof order.items === 'string') {
                productNames = order.items;
            }

            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                try {
                    return new Date(dateStr).toLocaleDateString('en-GB');
                } catch (e) { return dateStr; }
            };

            return {
                "S.No": index + 1,
                "Customer Name": order.customerName || '',
                "Mobile Number": order.telNo || '',
                "Address": toTitleCase(fullAddress),
                "Add1": "",
                "Add2": "",
                "Add3": "",
                "Order Date": formatDate(order.timestamp),
                "Delivered Date": order.status === 'Delivered' ? formatDate(order.deliveryDate) : '',
                "Product Name": productNames,
                "Delivery Status": order.status === 'Delivered' ? 'Delivered' : 'On Way',
                "Amount Rs.": order.total || 0,
                "Advance Payment": order.advance || 0,
                "Payment Method": order.paymentMode || 'COD',
                "Agent": order.employee || '',
                "Order Type": order.orderType || 'New',
                "Invoice Date": formatDate(order.dispatchedAt || order.tracking?.dispatchedAt || order.timestamp),
                "Delivered by": (order.shiprocket && order.shiprocket.courierName)
                    ? order.shiprocket.courierName
                    : (order.tracking && order.tracking.courier ? order.tracking.courier
                        : (order['shiprocket.courierName'] || order.courier || order.dispatchedBy || '')),
                "AWB Number": (order.shiprocket && order.shiprocket.awb)
                    ? order.shiprocket.awb
                    : (order['shiprocket.awb'] || (order.tracking ? (order.tracking.trackingId || '') : '')),
                "RTO Status": order.rtoStatus || ''
            };
        });

        // Convert to Sheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dispatched_Orders");

        // Download
        XLSX.writeFile(wb, `Dispatched_Orders_${fileNameLabel}_${new Date().getTime()}.xlsx`);

        btn.innerHTML = originalText;
        btn.disabled = false;

        showSuccessPopup('Export Successful! 📥', `${orders.length} orders exported to Excel`, '✅', '#10b981');

    } catch (e) {
        console.error('Export Error:', e);
        alert('Export failed! ' + e.message);
        const btn = event?.target?.closest('button') || document.querySelector('button[onclick*="exportDispatchedOrdersFiltered"]');
        if (btn) {
            btn.innerHTML = '📥 Export Excel';
            btn.disabled = false;
        }
    }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    if (loadSession()) {
        if (currentUserType === 'employee') showEmployeePanel();
        else if (currentUserType === 'department') showDepartmentPanel();
        else if (currentUserType === 'admin') showAdminPanel();
    }

    else {
        showLoginScreen();
    }
});

// ==================== ORDER DETAIL VIEW ====================
async function viewOrder(orderId) {
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await res.json();
        const order = data.order;

        if (!order) {
            alert('Order not found!');
            return;
        }

        const fullAddress = `${order.address || ''}, ${order.distt || ''}, ${order.state || ''} - ${order.pin || ''}`;

        document.getElementById('orderDetailContent').innerHTML = `
                <div class="flex flex-col h-full bg-gray-50/50">
                    <!-- Premium Header -->
                    <div class="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-8 text-white relative flex-shrink-0 rounded-t-2xl shadow-lg border-b border-white/10">
                        <!-- Close Button -->
                        <button onclick="closeModal('orderDetailModal')" class="absolute top-5 right-5 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2.5 transition-all z-20 backdrop-blur-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <div class="flex justify-between items-end relative z-10">
                            <div class="space-y-2">
                                <div class="flex items-center gap-3">
                                    <h4 class="text-4xl font-black font-mono tracking-tighter drop-shadow-lg">${order.orderId}</h4>
                                    <span class="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl bg-white/20 backdrop-blur-md border border-white/30">
                                        ${order.status}
                                    </span>
                                </div>
                                <p class="text-sm font-bold text-white/70 flex items-center gap-2">
                                    📅 ${order.timestamp ? new Date(order.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                            <div class="text-right">
                                <p class="text-5xl font-black drop-shadow-2xl tracking-tighter">₹${order.total || 0}</p>
                                <p class="text-xs font-black text-white/60 uppercase tracking-widest mt-1">Total Order Value</p>
                            </div>
                        </div>
                    </div>

                    <!-- Layout Grid -->
                    <div class="p-6 space-y-8 overflow-y-auto">
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- Customer Details Card -->
                            <div class="bg-white border-2 border-gray-50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div class="absolute top-0 right-0 bg-blue-600 text-white px-5 py-1.5 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest shadow-md">CUSTOMER</div>
                                <div class="flex items-center gap-5 mb-6">
                                    <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-3xl shadow-inner group-hover:scale-110 transition-transform cursor-pointer">👤</div>
                                    <div>
                                        <div class="flex items-center gap-3">
                                            <h5 class="text-2xl font-black text-gray-900 leading-tight">${order.customerName}</h5>
                                            <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                                                class="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-sm transition-all" title="Send WhatsApp">
                                                ${WHATSAPP_ICON}
                                            </button>
                                        </div>
                                        <p class="text-xs text-blue-500 font-black uppercase tracking-widest mt-0.5">Verified Client</p>
                                    </div>
                                </div>
                                <div class="space-y-4">
                                   <div class="flex flex-col">
                                       <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile Contact</span>
                                       <span class="text-xl font-black text-gray-800 font-mono tracking-wide">${order.telNo}</span>
                                   </div>
                                   ${order.altNo ? `
                                   <div class="flex flex-col">
                                       <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alternative Number</span>
                                       <span class="text-lg font-bold text-gray-700 font-mono">${order.altNo}</span>
                                   </div>` : ''}
                                   <div class="pt-2">
                                       <span class="px-4 py-2 bg-gray-100 rounded-xl text-xs font-black text-gray-600 border border-gray-200 uppercase tracking-wider">${order.orderType || 'Standard Order'}</span>
                                   </div>
                                </div>
                            </div>

                            <!-- Delivery Address Card -->
                            <div class="bg-white border-2 border-gray-50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div class="absolute top-0 right-0 bg-orange-500 text-white px-5 py-1.5 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest shadow-md">DELIVERY</div>
                                <div class="flex items-center justify-between mb-6">
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 text-2xl shadow-inner">📍</div>
                                        <h5 class="text-xl font-black text-gray-900 leading-none">Shipping Address</h5>
                                    </div>
                                    <button type="button" onclick="copyTracking(this.getAttribute('data-addr'))" data-addr="${fullAddress.replace(/"/g, '&quot;')}" 
                                        class="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white px-4 py-2 rounded-2xl text-[10px] font-black transition-all border border-blue-100 flex items-center gap-2 shadow-sm uppercase tracking-widest">
                                        📋 Copy
                                    </button>
                                </div>
                                <div class="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 flex flex-col gap-3">
                                    <p class="text-gray-900 font-bold text-lg leading-relaxed capitalize">
                                        ${fullAddress}
                                    </p>
                                    ${order.landMark ? `
                                    <div class="pt-2 border-t border-orange-200/50 flex items-start gap-3 text-sm text-gray-600">
                                        <span class="text-orange-500 font-black">🚩</span>
                                        <div class="flex flex-col">
                                            <span class="text-[10px] font-black text-orange-400 uppercase tracking-widest">Landmark</span>
                                            <span class="font-bold">${order.landMark}</span>
                                        </div>
                                    </div>` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Order Items Section -->
                        <div class="bg-white border-2 border-gray-50 rounded-[40px] shadow-sm overflow-hidden">
                            <div class="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <h5 class="text-xl font-black text-gray-900 flex items-center gap-3">📦 <span class="uppercase tracking-tighter">Order Line Items</span></h5>
                                <span class="text-[10px] bg-white text-gray-700 px-4 py-2 rounded-2xl border-2 border-gray-50 font-black uppercase tracking-widest shadow-sm">
                                    ${order.items ? order.items.length : 0} Unique Products
                                </span>
                            </div>
                            <div class="px-2 pb-2">
                                ${order.items && order.items.length > 0 ?
                `<div class="overflow-x-auto rounded-[30px] border border-gray-50">
                                    <table class="w-full text-base">
                                        <thead class="bg-gray-100/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] text-left">
                                            <tr>
                                                <th class="px-8 py-5">Product Description</th>
                                                <th class="px-8 py-5 text-right">Rate</th>
                                                <th class="px-8 py-5 text-center w-32">Qty</th>
                                                <th class="px-8 py-5 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-50">
                                            ${order.items.map(item => {
                    const rate = item.rate || item.price || 0;
                    const qty = item.quantity || item.qty || 1;
                    const subtotal = item.amount || (rate * qty);
                    return `
                                                <tr class="hover:bg-blue-50/30 transition-all">
                                                    <td class="px-8 py-5 font-black text-gray-800">${item.description || 'Unnamed Product'}</td>
                                                    <td class="px-8 py-5 text-right font-bold text-gray-500">₹${rate}</td>
                                                    <td class="px-8 py-5 text-center">
                                                        <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-black text-gray-700">x${qty}</span>
                                                    </td>
                                                    <td class="px-8 py-5 text-right font-black text-gray-900 text-lg">₹${subtotal}</td>
                                                </tr>
                                            `}).join('')}
                                        </tbody>
                                    </table>
                                </div>`
                : '<div class="p-16 text-center text-gray-300 font-black uppercase tracking-widest">No Items in this Order</div>'
            }
                            </div>
                            
                            <!-- Detailed Totals Summary -->
                            <div class="bg-gray-900 mx-4 mb-4 mt-2 p-8 rounded-[30px] shadow-2xl relative overflow-hidden">
                                <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                                <div class="flex flex-col gap-4 ml-auto w-full md:w-1/2 relative z-10">
                                    <div class="flex justify-between text-white/50 text-xs font-black uppercase tracking-widest">
                                        <span>Order Total (MRP)</span>
                                        <span class="text-white font-bold">₹${order.total || 0}</span>
                                    </div>
                                    <div class="flex justify-between text-white/50 text-xs font-black uppercase tracking-widest">
                                        <span>Advance Payment</span>
                                        <span class="text-emerald-400 font-bold">- ₹${order.advance || 0}</span>
                                    </div>
                                    <div class="h-px bg-white/10 my-1"></div>
                                    <div class="flex justify-between items-end">
                                        <div class="flex flex-col">
                                            <span class="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-1">Total Balance Due</span>
                                            <span class="text-3xl font-black text-white tracking-tighter">COD Payable</span>
                                        </div>
                                        <span class="text-4xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">₹${order.codAmount || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Map Integration -->
                        <div class="bg-white border-2 border-gray-50 p-2 rounded-[40px] shadow-sm overflow-hidden">
                            <div id="orderDetailMap" class="w-full h-80 rounded-[35px] bg-gray-100 overflow-hidden relative shadow-inner">
                                <div class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                                    <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">Calibrating Satellite Imagery...</span>
                                </div>
                            </div>
                        </div>

                        <!-- Professional Footer Meta -->
                        <div class="bg-gray-800 p-8 rounded-[40px] border border-gray-700 shadow-xl flex flex-col md:flex-row gap-6 items-center justify-between text-white">
                            <div class="flex items-center gap-4">
                               <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl backdrop-blur-sm">👨‍💻</div>
                               <div class="flex flex-col">
                                   <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Created By</span>
                                   <span class="font-black text-lg text-emerald-400 capitalize">${order.employee} <span class="text-gray-500 font-mono text-sm">(${order.employeeId})</span></span>
                               </div>
                            </div>
                            <div class="flex gap-4">
                                ${order.verifiedBy ? `
                                <div class="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex flex-col">
                                    <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Verified</span>
                                    <span class="text-sm font-black text-blue-400">${order.verifiedBy}</span>
                                </div>` : ''}
                                ${order.dispatchedBy ? `
                                <div class="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex flex-col">
                                    <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Dispatched</span>
                                    <span class="text-sm font-black text-purple-400">${order.dispatchedBy}</span>
                                </div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>`;

        // Show modal
        document.getElementById('orderDetailModal').classList.remove('hidden');

        // Initialize map after modal is visible
        setTimeout(() => {
            initOrderMap(fullAddress);
        }, 300);

    } catch (e) {
        console.error('Error loading order:', e);
        alert('Failed to load order details');
    }
}

async function initOrderMap(address) {
    const mapDiv = document.getElementById('orderDetailMap');
    const API_KEY = 'f4c410f517ad05591fbebd88cb3742fa';

    try {
        // MapMyIndia Atlas Geocoding API
        const geocodeUrl = `https://atlas.mappls.com/api/places/geocode?address=${encodeURIComponent(address)}&access_token=${API_KEY}`;

        mapDiv.innerHTML = '<p class="text-center p-10 text-blue-600 font-semibold">🔍 Searching exact location...</p>';

        const response = await fetch(geocodeUrl);
        const data = await response.json();

        console.log('MapMyIndia Response:', data);

        if (data && data.copResults && data.copResults.length > 0) {
            const location = data.copResults[0];
            const lat = parseFloat(location.latitude || location.lat);
            const lng = parseFloat(location.longitude || location.lng);

            console.log('Found coordinates:', lat, lng);

            // Try MapMyIndia native map
            if (window.MapmyIndia && window.MapmyIndia.Map) {
                mapDiv.innerHTML = '';

                const map = new MapmyIndia.Map(mapDiv, {
                    center: [lat, lng],
                    zoom: 16,
                    zoomControl: true,
                    hybrid: false
                });

                new MapmyIndia.Marker({
                    position: [lat, lng],
                    map: map,
                    title: address,
                    icon: 'https://apis.mappls.com/map_v3/1.png'
                });

                console.log('MapMyIndia map loaded successfully');
            }

            else {
                // Use coordinates with Google Maps
                console.log('MapMyIndia SDK not loaded, using Google Maps with coordinates');
                const searchUrl = `https://maps.google.com/maps?q=${lat},${lng}&output=embed&z=16`;
                mapDiv.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0; border-radius:8px;" src="${searchUrl}" allowfullscreen></iframe>`;
            }
        }

        else {
            throw new Error('No results from geocoding');
        }

    }

    catch (e) {
        console.error("Map Error:", e);
        // Final fallback
        const searchUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
        mapDiv.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0; border-radius:8px;" src="${searchUrl}" allowfullscreen></iframe><p class="text-xs text-gray-500 mt-2 text-center">Using fallback map (MapMyIndia API issue)</p>`;
    }
}

// ==================== MAP INTEGRATION ====================
let currentMap = null;

function showMap(orderId, address) {
    const mapDiv = document.getElementById(`map-${orderId}

                `);

    if (mapDiv.classList.contains('hidden')) {
        // Show Map
        mapDiv.classList.remove('hidden');

        // Initialize Map if not already done (Basic Init)
        // Note: Real Geocoding requires checking MapMyIndia Docs for 'search' or 'geocode'
        // Here we initialize a simple map. For Geocoding, we need an extra API call.

        try {

            // Try to initialize map (Assuming SDK is loaded)
            if (window.MapmyIndia && window.MapmyIndia.Map) {
                mapDiv.innerHTML = '<p class="text-center p-10">Loading Map...</p>';

                // Use Mappls Search to find coordinates
                // Only works if Key supports optional Search API
                // Since we don't have the exact Geocoding URL configured, we will show a placeholder
                // instructing to use the actual key.

                // For demonstration, we link to a map view:
                const searchUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
                mapDiv.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0" src="${searchUrl}" allowfullscreen></iframe>`;

            }

            else {
                // Fallback to Google Maps Embed if Mappls fails (or Key invalid)
                const searchUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
                mapDiv.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0" src="${searchUrl}" allowfullscreen></iframe>`;
            }
        }

        catch (e) {
            console.error("Map Error", e);
            mapDiv.innerHTML = `<p class="text-red-500 p-4">Map load failed. Check API Key.</p>`;
        }

    }

    else {
        // Hide Map
        mapDiv.classList.add('hidden');
    }
}


// ==================== VERIFICATION DEPARTMENT TABS ====================
function switchVerificationTab(tab) {
    document.getElementById('verificationPendingTab').classList.add('hidden');
    document.getElementById('verificationUnverifiedTab').classList.add('hidden');
    document.getElementById('verificationHistoryTab').classList.add('hidden');
    if (document.getElementById('verificationCancelledTab')) {
        document.getElementById('verificationCancelledTab').classList.add('hidden');
    }

    if (tab === 'pending') {
        document.getElementById('verificationPendingTab').classList.remove('hidden');
        setActiveDeptTab('deptTabPending');
        loadDeptOrders();
    } else if (tab === 'unverified') {
        document.getElementById('verificationUnverifiedTab').classList.remove('hidden');
        setActiveDeptTab('deptTabUnverified');
        loadVerificationUnverified();
    } else if (tab === 'history') {
        document.getElementById('verificationHistoryTab').classList.remove('hidden');
        setActiveDeptTab('deptTabHistory');
        loadVerificationHistory();
    } else if (tab === 'cancelled') {
        if (document.getElementById('verificationCancelledTab')) {
            document.getElementById('verificationCancelledTab').classList.remove('hidden');
        }
        setActiveDeptTab('deptTabCancelled');
        loadVerificationCancelled();
    }
}


async function loadVerificationUnverified() {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        let orders = data.orders || [];

        // Filter for 'On Hold' status
        orders = orders.filter(o => o.status === 'On Hold');
        orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Filters from input
        const search = document.getElementById('verificationUnverifiedSearch').value.toLowerCase();
        if (search) {
            orders = orders.filter(o =>
                (o.orderId && o.orderId.toLowerCase().includes(search)) ||
                (o.customerName && o.customerName.toLowerCase().includes(search)) ||
                (o.telNo && o.telNo.includes(search))
            );
        }

        if (orders.length === 0) {
            document.getElementById('verificationUnverifiedList').innerHTML = `
                <div class="col-span-full text-center py-12 bg-yellow-50 rounded-2xl border-2 border-dashed border-yellow-200">
                    <p class="text-4xl mb-3">✅</p>
                    <p class="text-yellow-700 font-medium">No orders currently on hold</p>
                </div>`;
            return;
        }

        let html = '';
        orders.forEach(order => {
            html += `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-yellow-100 flex flex-col h-full bg-white">
                <!-- Card Header -->
                <div class="p-5 border-b border-yellow-50 bg-gradient-to-r from-yellow-50/50 to-white relative">
                     <div class="absolute top-0 right-0 w-24 h-24 bg-yellow-400 rounded-bl-full opacity-5 pointer-events-none"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                             <div class="flex items-center gap-2 mb-1">
                                <span class="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-md border border-yellow-200 uppercase tracking-wide">
                                    ${order.orderId}
                                </span>
                            </div>
                            <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[180px]" title="${order.customerName}">
                                ${order.customerName}
                            </h3>
                        </div>
                        <div class="text-right">
                             <p class="text-xl font-black text-gray-800 tracking-tight">₹${order.total}</p>
                             <span class="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 mt-1">
                                ⏸️ On Hold
                             </span>
                        </div>
                    </div>
                </div>

                 <!-- Card Body -->
                <div class="p-5 space-y-4 flex-grow bg-white/60">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600 flex-shrink-0">
                            📞
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Contact</p>
                            <p class="text-sm font-semibold text-gray-700 font-mono">${order.telNo}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-3">
                         <div class="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600 flex-shrink-0">
                             ⚠️
                         </div>
                         <div>
                             <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Reason / Status</p>
                             <p class="text-sm text-gray-600 italic">Marked as Unverified/Hold</p>
                         </div>
                    </div>

                    <div class="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <span class="text-xs text-gray-400">📅 ${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="p-4 bg-yellow-50/30 border-t border-yellow-100 grid grid-cols-3 gap-2">
                    <button type="button" onclick="viewOrder('${order.orderId}')" 
                        class="bg-white border border-yellow-200 text-yellow-700 hover:bg-yellow-50 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1">
                        👁️ View
                    </button>
                    <button type="button" onclick="openEditOrderModal('${order.orderId}')" 
                        class="bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1">
                        ✏️ Edit
                    </button>
                    <button type="button" onclick="verifyAddress('${order.orderId}')" 
                        class="bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold shadow-md hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1">
                        ✅ Verify
                    </button>
                </div>
            </div>`;
        });
        document.getElementById('verificationUnverifiedList').innerHTML = html;
    } catch (e) {
        console.error(e);
    }
}


async function markAsUnverified(orderId) {
    // Show modal with date picker for expected dispatch date
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    modal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scaleIn">
                    <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span>⏸️</span> Put Order on Hold
                    </h3>
                    
                    <div class="space-y-4 mb-6">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                Expected Dispatch Date *
                            </label>
                            <input type="date" id="expectedDispatchDate" 
                                min="${new Date().toISOString().split('T')[0]}"
                                class="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-lg">
                            <p class="text-xs text-gray-500 mt-1">📅 Jis din dispatch karna ho, select karo</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                Hold Reason (Optional)
                            </label>
                            <textarea id="holdReason" rows="3" 
                                placeholder="e.g., Customer requested delay, Stock issue, etc."
                                class="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-orange-500 outline-none resize-none"></textarea>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="this.closest('.fixed').remove()" 
                            class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors">
                            Cancel
                        </button>
                        <button onclick="submitHoldOrder('${orderId}')" 
                            class="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg">
                            ⏸️ Put on Hold
                        </button>
                    </div>
                </div>
            `;
    document.body.appendChild(modal);
}

// Submit hold order with expected dispatch date
async function submitHoldOrder(orderId) {
    const expectedDate = document.getElementById('expectedDispatchDate').value;
    const holdReason = document.getElementById('holdReason').value.trim();

    if (!expectedDate) {
        alert('❌ Expected dispatch date required!');
        return;
    }

    try {
        const holdModal = document.querySelector('.fixed.inset-0');
        if (holdModal) holdModal.remove();

        const res = await fetch(`${API_URL}/orders/${orderId}/hold`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                holdReason: holdReason || 'On hold',
                expectedDispatchDate: expectedDate,
                holdBy: currentUser.id || currentUser.name
            })
        });
        const data = await res.json();

        if (data.success) {
            // Update UI
            const card = document.querySelector(`button[onclick="viewOrder('${orderId}')"]`)?.closest('.order-card');
            if (card) card.remove();

            const activeTab = document.querySelector('[id^="verificationTab"].tab-active')?.id.replace("verificationTab", "").toLowerCase();
            if (activeTab === 'pending') loadDeptOrders();

            showSuccessPopup(
                'Order On Hold! ⏸️',
                `Order ${orderId} hold pe daal diya!\\n\\nExpected Dispatch: ${new Date(expectedDate).toLocaleDateString()}\\n\\nReminder aayega us din!`,
                '⏸️',
                '#f59e0b'
            );
            setTimeout(() => loadVerificationUnverified(), 1000);
        } else {
            alert(data.message || 'Error putting order on hold');
        }
    } catch (e) {
        console.error(e);
        alert('Connection error');
    }
}

async function filterVerificationUnverified() {
    const input = document.getElementById('verificationUnverifiedSearch');
    const filter = input.value.trim().toLowerCase();
    const list = document.getElementById('verificationUnverifiedList');

    if (!filter) {
        loadVerificationUnverified();
        return;
    }

    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        let orders = data.orders || [];

        // Filter for 'On Hold' AND search term
        orders = orders.filter(o =>
            o.status === 'On Hold' && (
                (o.telNo && o.telNo.includes(filter)) ||
                (o.customerName && o.customerName.toLowerCase().includes(filter)) ||
                (o.orderId && o.orderId.toLowerCase().includes(filter))
            )
        );

        if (orders.length === 0) {
            list.innerHTML = `
                        <div class="col-span-full text-center py-12 bg-yellow-50 rounded-2xl border-2 border-dashed border-yellow-200">
                            <p class="text-4xl mb-3">🔍</p>
                            <p class="text-yellow-700 font-medium">No matching unverified orders found</p>
                        </div>`;
            return;
        }

        let html = '';
        orders.forEach(order => {
            html += `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-yellow-100 flex flex-col h-full bg-white">
                <!-- Card Header -->
                <div class="p-5 border-b border-yellow-50 bg-gradient-to-r from-yellow-50/50 to-white relative">
                     <div class="absolute top-0 right-0 w-24 h-24 bg-yellow-400 rounded-bl-full opacity-5 pointer-events-none"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                             <div class="flex items-center gap-2 mb-1">
                                <span class="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-md border border-yellow-200 uppercase tracking-wide">
                                    ${order.orderId}
                                </span>
                            </div>
                            <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[180px]" title="${order.customerName}">
                                ${order.customerName}
                            </h3>
                        </div>
                        <div class="text-right">
                             <p class="text-xl font-black text-gray-800 tracking-tight">₹${order.total}</p>
                             <span class="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 mt-1">
                                ⏸️ On Hold
                             </span>
                        </div>
                    </div>
                </div>

                 <!-- Card Body -->
                <div class="p-5 space-y-4 flex-grow bg-white/60">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600 flex-shrink-0">
                            📞
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Contact</p>
                            <p class="text-sm font-semibold text-gray-700 font-mono">${order.telNo}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start gap-3">
                         <div class="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600 flex-shrink-0">
                             ⚠️
                         </div>
                         <div>
                             <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Reason / Status</p>
                             <p class="text-sm text-gray-600 italic">Marked as Unverified/Hold</p>
                         </div>
                    </div>

                    <div class="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <span class="text-xs text-gray-400">📅 ${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="p-4 bg-yellow-50/30 border-t border-yellow-100 grid grid-cols-2 gap-2">
                    <button type="button" onclick="viewOrder('${order.orderId}')" 
                        class="bg-white border border-yellow-200 text-yellow-700 hover:bg-yellow-50 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1">
                        👁️ View
                    </button>
                    <button type="button" onclick="verifyAddress('${order.orderId}')" 
                        class="bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold shadow-md hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1">
                        ✅ Verify Now
                    </button>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    } catch (e) {
        console.error(e);
    }
}

async function loadVerificationHistory() {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        let orders = data.orders || [];

        // Filter for Verified orders (including those that moved to Dispatch/Delivered)
        orders = orders.filter(o => ['Address Verified', 'Dispatched', 'Delivered'].includes(o.status));

        // CALCULATE STATS
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const countToday = orders.filter(o => {
            const dateStr = o.verifiedAt ? o.verifiedAt.split('T')[0] : (o.timestamp ? o.timestamp.split('T')[0] : null);
            return dateStr === today.toISOString().split('T')[0];
        }).length;

        const countYesterday = orders.filter(o => {
            const dateStr = o.verifiedAt ? o.verifiedAt.split('T')[0] : (o.timestamp ? o.timestamp.split('T')[0] : null);
            return dateStr === yesterday.toISOString().split('T')[0];
        }).length;

        const countWeek = orders.filter(o => {
            const date = o.verifiedAt ? new Date(o.verifiedAt) : new Date(o.timestamp);
            return date >= lastWeek;
        }).length;

        document.getElementById('statsVerifyToday').textContent = countToday;
        document.getElementById('statsVerifyYesterday').textContent = countYesterday;
        document.getElementById('statsVerifyWeek').textContent = countWeek;

        // APPLY FILTERS
        const search = document.getElementById('verificationHistorySearch').value.toLowerCase();
        const start = document.getElementById('verificationHistoryStartDate').value;
        const end = document.getElementById('verificationHistoryEndDate').value;

        if (search) {
            orders = orders.filter(o =>
                (o.orderId && o.orderId.toLowerCase().includes(search)) ||
                (o.customerName && o.customerName.toLowerCase().includes(search)) ||
                (o.telNo && o.telNo.includes(search))
            );
        }

        if (start) {
            orders = orders.filter(o => {
                const dateStr = o.verifiedAt ? o.verifiedAt.split('T')[0] : o.timestamp.split('T')[0];
                return dateStr >= start;
            });
        }
        if (end) {
            orders = orders.filter(o => {
                const dateStr = o.verifiedAt ? o.verifiedAt.split('T')[0] : o.timestamp.split('T')[0];
                return dateStr <= end;
            });
        }

        // Sort by verified date (newest first)
        orders.sort((a, b) => {
            const dateA = new Date(a.verifiedAt || a.timestamp);
            const dateB = new Date(b.verifiedAt || b.timestamp);
            return dateB - dateA;
        });

        if (orders.length === 0) {
            document.getElementById('verificationHistoryList').innerHTML = `
                <div class="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p class="text-4xl mb-3">📂</p>
                    <p class="text-gray-500 font-medium">No history found matching filters</p>
                </div>`;
            return;
        }

        let html = '';
        let lastDate = '';

        orders.forEach(order => {
            const dateStr = order.verifiedAt ? order.verifiedAt.split('T')[0] : (order.timestamp ? order.timestamp.split('T')[0] : 'N/A');

            if (dateStr !== lastDate) {
                const displayDate = new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const isTodayStr = new Date().toISOString().split('T')[0] === dateStr;

                html += `
                <div class="col-span-full mt-6 mb-2">
                    <div class="flex items-center gap-4">
                        <span class="bg-${isTodayStr ? 'emerald' : 'gray'}-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                            ${isTodayStr ? 'Today' : displayDate}
                        </span>
                        <div class="h-[2px] flex-grow bg-gradient-to-r from-${isTodayStr ? 'emerald' : 'gray'}-200 to-transparent rounded-full"></div>
                    </div>
                </div>`;
                lastDate = dateStr;
            }

            html += `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-purple-100 flex flex-col h-full bg-slate-50">
                <!-- Card Header -->
                <div class="p-4 border-b border-purple-50 bg-gradient-to-r from-purple-50/50 to-white relative">
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                             <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                Order #${order.orderId}
                                <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                                    class="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-sm transition-all" title="Send WhatsApp">
                                    ${WHATSAPP_ICON}
                                </button>
                             </p>
                            <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[200px]" title="${order.customerName}">
                                ${order.customerName}
                            </h3>
                            <p class="text-xs text-gray-500 font-mono mt-0.5">${order.telNo}</p>
                        </div>
                        <div class="text-right">
                             <p class="text-lg font-bold text-gray-800">₹${order.total}</p>
                             <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                ✅ Verified
                             </span>
                        </div>
                    </div>
                </div>

                <!-- Courier Suggestion Badge (if exists) -->
                ${order.suggestedCourier || order.courierSuggestion?.suggestedCourier ? `
                <div class="mx-4 mt-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 p-3 rounded-xl shadow-sm">
                    <div class="flex items-center gap-2">
                        <span class="text-xl">🚚</span>
                        <div class="flex-grow">
                            <div class="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Courier Suggested</div>
                            <div class="text-sm font-black text-purple-800">${order.suggestedCourier || order.courierSuggestion?.suggestedCourier}</div>
                        </div>
                        <span class="bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">SENT</span>
                    </div>
                    ${order.courierSuggestion?.suggestedBy ? `<div class="text-[10px] text-purple-500 mt-1 ml-7">By: ${order.courierSuggestion.suggestedBy}</div>` : ''}
                </div>
                ` : ''}

                <!-- Footer Actions -->
                <div class="p-4 flex gap-2 items-center justify-between border-t border-purple-100 mt-auto">
                    <div class="text-xs text-gray-500">
                        <span class="block text-gray-400 text-[10px] uppercase font-bold">Verified On</span>
                        ${order.verifiedAt ? new Date(order.verifiedAt).toLocaleDateString() + ' ' + new Date(order.verifiedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : (order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A')}
                    </div>
                    <button type="button" onclick="viewOrder('${order.orderId}')" 
                        class="bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors">
                        👁️ View Details
                    </button>
                </div>
            </div>`;
        });
        document.getElementById('verificationHistoryList').innerHTML = html;

    } catch (e) {
        console.error(e);
    }
}


function resetVerificationHistoryFilters() {
    document.getElementById('verificationHistorySearch').value = '';
    document.getElementById('verificationHistoryStartDate').value = '';
    document.getElementById('verificationHistoryEndDate').value = '';
    loadVerificationHistory();
}

async function filterVerificationOrders(mobile) {
    const searchValue = mobile.trim();
    if (!searchValue) {
        const activeTab = document.querySelector('[id^="verificationTab"].tab-active').id.replace("verificationTab", "").toLowerCase();
        if (activeTab === 'pending') loadDeptOrders();
        else if (activeTab === 'history') loadVerificationHistory();
        return;
    }

    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();

        // Fetch matches
        let orders = (data.orders || []).filter(o =>
            (o.telNo && o.telNo.includes(searchValue)) ||
            (o.altNo && o.altNo.includes(searchValue))
        );

        const activeTabContent = document.querySelector('[id^="verification"][id$="Tab"]:not(.hidden)');
        let listId = '';
        let isHistory = false;

        if (activeTabContent.id === 'verificationPendingTab') {
            listId = 'pendingVerificationList';
            // Filter pending only logic if strictly needed, or just show all matches? 
            // Usually search searches everything, but context implies we want actions relevant to the tab.
            // For now, let's just show the matches but with the "Pending" style card if in pending tab.
        } else if (activeTabContent.id === 'verificationHistoryTab') {
            listId = 'verificationHistoryList';
            isHistory = true;
        }

        if (!listId) return;

        if (orders.length === 0) {
            document.getElementById(listId).innerHTML = `
                        <div class="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p class="text-4xl mb-3">🔍</p>
                            <p class="text-gray-500 font-medium">No orders found</p>
                        </div>`;
            return;
        }

        let html = '';
        orders.forEach(order => {
            if (isHistory) {
                // History Style Card (Purple)
                html += `
                        <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-purple-100 flex flex-col h-full bg-slate-50">
                            <div class="p-4 border-b border-purple-50 bg-gradient-to-r from-purple-50/50 to-white relative">
                                <div class="flex justify-between items-start relative z-10">
                                    <div>
                                         <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                            Order #${order.orderId}
                                            <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                                                class="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-sm transition-all" title="Send WhatsApp">
                                                ${WHATSAPP_ICON}
                                            </button>
                                         </p>
                                        <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[200px]" title="${order.customerName}">${order.customerName}</h3>
                                        <p class="text-xs text-gray-500 font-mono mt-0.5">${order.telNo}</p>
                                    </div>
                                    <div class="text-right">
                                         <p class="text-lg font-bold text-gray-800">₹${order.total}</p>
                                         <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">✅ ${order.status}</span>
                                    </div>
                                </div>
                            </div>
                             <div class="p-4 flex gap-2 items-center justify-between border-t border-purple-100">
                                <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors">👁️ View Details</button>
                            </div>
                        </div>`;
            } else {
                // Pending Style Card (Blue)
                html += `
                        <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-100 flex flex-col h-full">
                            <div class="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white relative">
                                <div class="absolute top-0 right-0 w-24 h-24 bg-blue-400 rounded-bl-full opacity-5 pointer-events-none"></div>
                                <div class="flex justify-between items-start relative z-10">
                                    <div>
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md border border-blue-200 uppercase tracking-wide">${order.orderId}</span>
                                            <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                                                class="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-sm transition-all" title="Send WhatsApp">
                                                ${WHATSAPP_ICON}
                                            </button>
                                        </div>
                                        <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[180px]" title="${order.customerName}">${order.customerName}</h3>
                                    </div>
                                    <div class="text-right">
                                         <p class="text-xl font-black text-gray-800 tracking-tight">₹${order.total}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="p-5 space-y-4 flex-grow bg-white/60">
                                <div class="flex items-start gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">📞</div>
                                    <div>
                                        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Contact</p>
                                        <p class="text-sm font-semibold text-gray-700 font-mono">${order.telNo}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="p-4 bg-gray-50 border-t border-gray-100 grid gap-2">
                                <div class="grid grid-cols-2 gap-2">
                                    <button type="button" onclick="showMap('${order.orderId}', '${(order.address || '').replace(/'/g, "\\'") + ' ' + (order.pin || '')}')" class="bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1">📍 Locate</button>
                                    <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1">👁️ Details</button>
                                </div>
                                <div class="grid grid-cols-2 gap-2 mt-1">
                                   <button type="button" onclick="verifyAddress('${order.orderId}')" class="bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-emerald-600 transition-all flex items-center justify-center gap-1">✅ VERIFY</button>
                                   <button type="button" onclick="markAsUnverified('${order.orderId}')" class="bg-amber-100 text-amber-700 border border-amber-200 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-200 transition-colors flex items-center justify-center gap-1">⏸️ HOLD</button>
                               </div>
                            </div>
                            <div id="map-${order.orderId}" class="hidden h-64 w-full bg-gray-100 border-t border-gray-200 relative animate-fadeIn"></div>
                        </div>`;
            }
        });
        document.getElementById(listId).innerHTML = html;

    } catch (e) {
        console.error(e);
    }
}

// ==================== GLOBAL KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', function (event) {
    // ESC Key: Close Modals
    if (event.key === 'Escape') {
        const modals = [
            'orderModal',
            'trackingModal',
            'editOrderModal',
            'dispatchModal',
            'districtExplorerModal'
        ];

        modals.forEach(id => {
            const modal = document.getElementById(id);
            if (modal && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        });
    }

    // ENTER Key: Submit Forms / Search
    // ENTER Key: Submit Forms / Search
    if (event.key === 'Enter') {
        const focusedId = document.activeElement.id; // Get ID of focused element

        // === LOGIN SCREENS ===
        if (focusedId === 'empLoginPass' || focusedId === 'empLoginId') {
            employeeLogin();
        } else if (focusedId === 'deptLoginPass' || focusedId === 'deptLoginId') {
            departmentLogin();
        } else if (focusedId === 'adminLoginPass') {
            adminLogin();
        }

        // === SEARCH INPUTS ===

        // Verification Dept
        else if (focusedId === 'verificationMobileSearch') {
            filterVerificationOrders(document.getElementById('verificationMobileSearch').value);
        }
        else if (focusedId === 'verificationHistorySearch') {
            loadVerificationHistory();
        }

        // Dispatch Dept
        else if (focusedId === 'dispatchMobileSearch') {
            filterDispatchOrders(document.getElementById('dispatchMobileSearch').value);
        }
        else if (focusedId === 'dispatchHistorySearch') {
            loadDispatchHistory();
        }

        // Admin Panel
        else if (focusedId === 'adminMobileSearch') {
            filterAdminOrders(document.getElementById('adminMobileSearch').value);
        }
        else if (focusedId === 'adminPendingSearch') {
            loadAdminPending();
        }
        else if (focusedId === 'adminVerifiedSearch') {
            loadAdminVerified();
        }
        else if (focusedId === 'adminDispatchedSearch') {
            loadAdminDispatched();
        }
    }
});

// ==================== HELPER FUNCTIONS ====================


async function trackOrder(orderId) {
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await res.json();
        if (data.order && data.order.tracking && data.order.tracking.trackingId) {
            const t = data.order.tracking;
            // Try to construct a direct URL if possible, otherwise generic or Google
            let url = COURIER_URLS[t.courier];
            if (!url) {
                url = `https://www.google.com/search?q=${t.trackingId}`;
            }
            window.open(url, '_blank');
        } else {
            alert('Tracking Details not found!');
        }
    } catch (e) {
        console.error(e);
        alert('Error fetching tracking details');
    }
}

async function requestDelivery(orderId) {
    if (!confirm('Request delivery for this order?')) return;
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/request-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: currentUser.id, employeeName: currentUser.name })
        });
        const data = await res.json();
        if (data.success) {
            alert('Delivery requested successfully!');
            loadMyOrders(); // Refresh
        } else {
            alert(data.message || 'Request failed');
        }
    } catch (e) {
        console.error(e);
        alert('Server error');
    }
}

// ==================== EMPLOYEE PANEL: SEARCH AND REORDER ====================

// Global variables to store original order lists for filtering
let allMyOrders = [];
let allMyHistory = [];

// Filter My Orders by mobile number
function filterMyOrders(query) {
    const cards = document.querySelectorAll('#myOrdersList .order-card');
    const lowerQuery = query.toLowerCase().trim();

    cards.forEach(card => {
        const mobile = card.getAttribute('data-mobile') || '';
        if (mobile.includes(lowerQuery) || !query) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Filter History by mobile number
function filterMyHistory(query) {
    const cards = document.querySelectorAll('#myHistoryList .order-card');
    const lowerQuery = query.toLowerCase().trim();

    cards.forEach(card => {
        const mobile = card.getAttribute('data-mobile') || '';
        if (mobile.includes(lowerQuery) || !query) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Reorder function: Pre-fills order form with customer details
function reorderFromHistory(orderData) {
    try {
        const order = typeof orderData === 'string' ? JSON.parse(orderData) : orderData;
        const form = document.getElementById('orderForm');

        // Fill customer details
        form.customerName.value = order.customerName || '';
        form.mobile.value = order.mobile || '';
        form.village.value = order.village || '';
        form.landmark.value = order.landmark || '';
        form.po.value = order.po || '';
        form.tahTaluka.value = order.tahTaluka || '';
        form.distt.value = order.distt || '';
        form.state.value = order.state || '';
        form.pin.value = order.pin || '';

        // Clear items (user will add fresh items)
        const itemsDiv = document.getElementById('itemsContainer');
        if (itemsDiv) {
            itemsDiv.innerHTML = '';
        }

        // Clear totals
        const totalField = document.getElementById('total');
        if (totalField) {
            totalField.value = '';
        }

        // Update address preview
        if (typeof updateAddress === 'function') {
            updateAddress();
        }

        // Switch to New Order tab
        if (typeof switchEmpTab === 'function') {
            switchEmpTab('order');
        }

        // Show success message
        const msg = document.getElementById('empMessage');
        if (msg) {
            msg.textContent = `✅ Customer details loaded! Add items to create new order for ${order.customerName}`;
            msg.className = 'mb-6 p-4 rounded-2xl text-sm glass-card border-l-4 border-emerald-500 bg-emerald-50 text-emerald-700';
            msg.classList.remove('hidden');
            setTimeout(() => msg.classList.add('hidden'), 5000);
        }
    } catch (e) {
        console.error('Reorder error:', e);
        alert('Failed to load order details');
    }
}

// Auto-inject Reorder buttons into order cards
// DISABLED - Using simple reorder script at end of file instead
/*
function injectReorderButtons() {
    // Find all order cards in My Orders and History tabs
    const orderCards = document.querySelectorAll('#myOrdersList > div, #myHistoryList > div');

    orderCards.forEach(card => {
        // Skip if already has reorder button
        if (card.querySelector('.reorder-btn')) return;

        // Check if order is DELIVERED (look for status badge/text)
        const cardText = card.textContent.toLowerCase();
        const isDelivered = cardText.includes('delivered') ||
            cardText.includes('डिलीवर') ||
            cardText.includes('complete') ||
            card.querySelector('[class*="delivered"]') ||
            card.querySelector('[class*="success"]');

        // Only add button if delivered
        if (!isDelivered) return;

        // Extract mobile number for search filtering
        const mobileMatch = card.textContent.match(/(\d{10})/);
        const mobile = mobileMatch ? mobileMatch[1] : '';

        // Extract Order ID from card (with ORD- prefix)
        const orderIdMatch = card.textContent.match(/ORD-\d+/i);
        const orderId = orderIdMatch ? orderIdMatch[0] : '';

        if (!orderId) {
            console.warn('No order ID found in card, skipping reorder button');
            return;
        }

        // Add data-mobile attribute for filtering (THIS FIXES MOBILE SEARCH)
        if (mobile && !card.getAttribute('data-mobile')) {
            card.setAttribute('data-mobile', mobile);
        }

        // Add order-card class if not present
        if (!card.classList.contains('order-card')) {
            card.classList.add('order-card');
        }

        // Create and append reorder button (TESTED AND WORKING)
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'reorder-btn w-full mt-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg';
        btn.innerHTML = '<span>🔄</span> Reorder';
        btn.onclick = function () {
            // Extract data fresh on click
            const mobileMatch = card.textContent.match(/(\d{10})/);
            const orderMobile = mobileMatch ? mobileMatch[1] : '';
            const nameEl = card.querySelector('[class*="font-bold"]');
            const customerName = nameEl ? nameEl.textContent.trim() : '';

            if (!orderMobile || !customerName) {
                return alert('Could not extract order details!');
            }

            const form = document.getElementById('orderForm');
            if (!form) return alert('Form not found!');

            // Fill form
            form.customerName.value = customerName;
            form.mobile.value = orderMobile;
            form.village.value = '';
            form.landmark.value = '';
            form.po.value = '';
            form.pin.value = '';
            form.tahTaluka.value = '';
            form.distt.value = '';
            form.state.value = '';

            // Clear items
            const items = document.getElementById('itemsContainer');
            if (items) items.innerHTML = '';

            // Switch to New Order tab
            if (typeof switchEmpTab === 'function') switchEmpTab('order');

            // Success alert
            alert('✅ Reorder Started!\n\nName: ' + customerName + '\nMobile: ' + orderMobile + '\n\nPlease add items and submit.');
        };


        card.appendChild(btn);
    });
} */ // End of disabled function

// Mobile Search Functions
function filterMyOrders(q) {
    document.querySelectorAll('#myOrdersList > div').forEach(c => {
        const m = c.textContent.match(/(\d{10})/);
        c.style.display = (m && m[1].includes(q.trim())) || !q ? '' : 'none';
    });
}
function filterMyHistory(q) {
    document.querySelectorAll('#myHistoryList > div').forEach(c => {
        const m = c.textContent.match(/(\d{10})/);
        c.style.display = (m && m[1].includes(q.trim())) || !q ? '' : 'none';
    });
}

// PERFORMANCE: Removed fetch wrapper - was adding 500ms delay to every API call
// All fetch calls now execute at full speed
const originalSwitchEmpTab = window.switchEmpTab;
if (typeof originalSwitchEmpTab === 'function') {
    window.switchEmpTab = function (tab) {
        originalSwitchEmpTab(tab);
        // setTimeout(injectReorderButtons, 500); // DISABLED - function doesn't exist
    };
}

// Run once on page load
// DISABLED - Using simple reorder script at end of file instead
// setTimeout(injectReorderButtons, 1000);

// AGGRESSIVE: Keep checking every 2 seconds to ensure buttons are added
// DISABLED - Using simple reorder script at end of file instead  
// setInterval(injectReorderButtons, 2000);

setInterval(function () {
    document.querySelectorAll('#myHistoryList > div, #myOrdersList > div').forEach(function (card) {
        if (!card.textContent.toLowerCase().includes('delivered')) return;
        if (card.querySelector('.simple-reorder-btn')) return;
        var btn = document.createElement('button');
        btn.className = 'simple-reorder-btn w-full mt-3 px-4 py-3 rounded-xl font-bold text-white';
        btn.style.background = 'linear-gradient(135deg,#3b82f6,#2563eb)';
        btn.innerHTML = '🔄 Reorder';
        btn.onclick = function () {
            // Extract Order ID
            var orderIdMatch = card.textContent.match(/ORD-\d+/i);
            if (!orderIdMatch) { alert('❌ Order ID not found!'); return; }
            var orderId = orderIdMatch[0];

            // Show loading
            btn.disabled = true;
            btn.textContent = '⏳ Loading...';

            // Fetch complete order data from server
            fetch('/api/orders/' + orderId)
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (!data || !data.order) { throw new Error('Order not found'); }
                    var order = data.order;

                    // Get form
                    var f = document.getElementById('orderForm');
                    if (!f) { alert('❌ Form not found!'); return; }

                    // Fill ALL form fields with correct names
                    f.customerName.value = order.customerName || '';
                    f.telNo.value = order.telNo || '';
                    f.villColony.value = order.villColony || '';
                    f.landMark.value = order.landMark || '';
                    f.po.value = order.po || '';
                    f.pin.value = order.pin || '';
                    f.tahTaluka.value = order.tahTaluka || '';
                    f.distt.value = order.distt || '';
                    f.state.value = order.state || '';

                    // Clear items
                    var items = document.getElementById('itemsContainer');
                    if (items) items.innerHTML = '';

                    // Switch to New Order tab
                    if (window.switchEmpTab) switchEmpTab('order');

                    // Success
                    alert('✅ Reorder Loaded!\n\nName: ' + order.customerName + '\nMobile: ' + order.telNo + '\n\n📍 Address filled!\n📦 Add items and submit.');
                })
                .catch(function (err) {
                    console.error('Reorder error:', err);
                    alert('❌ Failed to load order!\n\n' + err.message);
                })
                .finally(function () {
                    btn.disabled = false;
                    btn.textContent = '🔄 Reorder';
                });
        };
        card.appendChild(btn);
    });
}, 3000);

// ==================== UNIVERSAL SUCCESS POPUP ====================
function showSuccessPopup(title, msg, icon = '✅', color = '#10b981', whatsappData = null) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-24 animate-fadeIn';

    let whatsappBtn = '';
    if (whatsappData) {
        whatsappBtn = `
            <button onclick="sendWhatsAppDirect('${whatsappData.type}', ${JSON.stringify(whatsappData.order).replace(/"/g, '&quot;')}); this.closest('.fixed').remove()" 
                class="w-full py-3.5 rounded-xl font-bold text-white shadow-lg bg-green-500 hover:bg-green-600 hover:scale-105 transition-all flex items-center justify-center gap-2 mb-3">
                ${WHATSAPP_ICON} Send WhatsApp Confirmation
            </button>
        `;
    }

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100">
            <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg" style="background:${color}20; color:${color}">
                ${icon}
            </div>
            <h3 class="text-2xl font-black text-gray-800 mb-3">${title}</h3>
            <p class="text-gray-500 font-medium mb-8 leading-relaxed">${msg.replace(/\n/g, '<br>')}</p>
            ${whatsappBtn}
            <button onclick="this.closest('.fixed').remove()" class="w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all" style="background:${color}">
                Continue
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Helper for direct WhatsApp redirect
function sendWhatsAppDirect(type, order) {
    if (typeof whatsappTemplates !== 'undefined' && whatsappTemplates[type]) {
        const msg = whatsappTemplates[type](order);
        const url = `https://wa.me/91${order.telNo}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    } else {
        alert('WhatsApp template not found - Opening generic chat');
        window.open(`https://wa.me/91${order.telNo}`, '_blank');
    }
}

function showWarningPopup(title, msg) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-24 animate-fadeIn';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100 border-4 border-amber-400">
            <div class="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner text-amber-600">
                ⚠️
            </div>
            <h3 class="text-2xl font-black text-gray-800 mb-3">${title}</h3>
            <p class="text-gray-500 font-medium mb-8 leading-relaxed">${msg.replace(/\n/g, '<br>')}</p>
            <button onclick="this.closest('.fixed').remove()" class="w-full bg-amber-500 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-amber-200 hover:bg-amber-600 hover:scale-105 transition-all">
                Theek Hai
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// ==================== SAVE ORDER REMARK (VERIFICATION) ====================
async function saveOrderRemark(orderId) {
    const textarea = document.getElementById(`remark-${orderId}`);
    if (!textarea) {
        console.error('❌ Textarea not found for orderId:', orderId);
        alert('Error: Remark field not found!');
        return;
    }

    const remark = textarea.value.trim();
    console.log('📝 Saving remark for order:', orderId);
    console.log('Remark text:', remark);
    console.log('Current user:', currentUser);

    try {
        const requestBody = {
            remark,
            remarkBy: currentUser.id
        };
        console.log('Request body:', requestBody);

        const remarkURL = `${API_URL}/orders/${orderId}/remark`;
        console.log('🌐 Fetch URL:', remarkURL);
        console.log('API_URL:', API_URL);
        console.log('orderId:', orderId);

        const res = await fetch(remarkURL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Response data:', data);

        if (data.success) {
            showSuccessPopup(
                'Remark Saved! 📝',
                `Remark successfully save ho gaya!`,
                '📝',
                '#f59e0b'
            );
            setTimeout(() => {
                if (typeof loadDeptOrders === 'function') {
                    loadDeptOrders();
                }
            }, 1000);
        } else {
            console.error('❌ API returned error:', data.message);
            showMessage('❌ ' + data.message, 'error', 'deptMessage');
        }
    } catch (e) {
        console.error('❌ Error saving remark:', e);
        showMessage('❌ Failed to save remark: ' + e.message, 'error', 'deptMessage');
    }
}

// ==================== SHIPROCKET FUNCTIONS ====================
function showShiprocketModal() {
    document.getElementById('shiprocketModal').classList.remove('hidden');
    loadShiprocketStatus();
}

async function loadShiprocketStatus() {
    try {
        const res = await fetch(`${API_URL}/shiprocket/config`);
        const data = await res.json();
        if (data.success) {
            const config = data.config;
            document.getElementById('shiprocketStatus').innerHTML = `
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full ${config.hasToken ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center text-white text-lg">
                                ${config.hasToken ? '✓' : '○'}
                            </div>
                            <div>
                                <p class="font-bold text-gray-800">${config.enabled ? 'Connected' : 'Not Configured'}</p>
                                <p class="text-xs text-gray-500">${config.apiEmail || 'No email configured'}</p>
                            </div>
                        </div>
                    `;
        }
    } catch (e) {
        console.error('Error loading Shiprocket status', e);
    }
}

async function testShiprocket() {
    try {
        const res = await fetch(`${API_URL}/shiprocket/test`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            showSuccessPopup('Connection Successful! 🎉', 'Shiprocket is connected and working!', '🚀', '#f97316');
            loadShiprocketStatus();
        } else {
            alert('❌ ' + (data.message || 'Connection failed'));
        }
    } catch (e) {
        alert('❌ Error: ' + e.message);
    }
}

async function generateShiprocketAWB() {
    const orderId = document.getElementById('shiprocketOrderId').value.trim();
    if (!orderId) return alert('Please Enter order ID');

    const resultDiv = document.getElementById('awbResult');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = '<p class="text-gray-500">⏳ Generating AWB...</p>';

    try {
        const res = await fetch(`${API_URL}/shiprocket/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
        });
        const data = await res.json();

        if (data.success) {
            resultDiv.innerHTML = `
                        <div class="space-y-2">
                            <p class="text-green-600 font-bold text-lg">✅ AWB Generated!</p>
                            <div class="bg-green-50 p-3 rounded-lg">
                                <p class="text-xs font-bold text-gray-500 uppercase">AWB Number</p>
                                <p class="text-xl font-black text-green-700 font-mono">${data.awb}</p>
                            </div>
                            <div class="bg-blue-50 p-3 rounded-lg">
                                <p class="text-xs font-bold text-gray-500 uppercase">Courier</p>
                                <p class="text-lg font-bold text-blue-700">${data.courier}</p>
                            </div>
                        </div>
                    `;
            showSuccessPopup('AWB Generated! 📦', `AWB: ${data.awb}\nCourier: ${data.courier}`, '📦', '#3b82f6');
        } else {
            resultDiv.innerHTML = `<p class="text-red-600 font-bold">❌ ${data.message}</p>`;
        }
    } catch (e) {
        resultDiv.innerHTML = `<p class="text-red-600 font-bold">❌ Error: ${e.message}</p>`;
    }
}

async function trackShiprocket() {
    const awb = document.getElementById('shiprocketAWB').value.trim();
    if (!awb) return alert('Please enter AWB number');

    const resultDiv = document.getElementById('trackingResult');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = '<p class="text-gray-500">⏳ Fetching tracking...</p>';

    try {
        const res = await fetch(`${API_URL}/shiprocket/track/${awb}`);
        const data = await res.json();

        if (data.success && data.tracking) {
            const track = data.tracking;
            resultDiv.innerHTML = `
                        <div class="space-y-2">
                            <p class="text-purple-600 font-bold text-lg">📍 Tracking Info</p>
                            <pre class="bg-gray-50 p-4 rounded-lg text-xs overflow-auto">${JSON.stringify(track, null, 2)}</pre>
                        </div>
                    `;
        } else {
            resultDiv.innerHTML = `<p class="text-red-600 font-bold">❌ ${data.message || 'Tracking not available'}</p>`;
        }
    } catch (e) {
        resultDiv.innerHTML = `<p class="text-red-600 font-bold">❌ Error: ${e.message}</p>`;
    }
}

// ==================== DISPATCH WITH SHIPROCKET ====================
async function dispatchWithShiprocket(orderId, order = null) {
    if (!orderId) return alert('Order ID missing!');
    currentDispatchOrder = order;

    // STEP 1: Box Size Selection
    showBoxSizeSelection(orderId);
}

function showBoxSizeSelection(orderId) {
    const boxSizePopup = document.createElement('div');
    boxSizePopup.id = 'boxSizePopup';
    boxSizePopup.innerHTML = `
                <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-center;">
                    <div style="background: white; padding: 30px; border-radius: 20px; max-width: 400px; width: 90%;">
                        <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #f97316;">📦 Select Box Size</h3>
                        <div style="display: grid; gap: 10px; margin-bottom: 20px;">
                            <button onclick="selectBoxSizeAndFetchCouriers('${orderId}', 'small')" style="padding: 15px; border: 2px solid #ddd; border-radius: 12px; background: white; cursor: pointer; font-weight: bold; transition: all 0.2s;" onmouseover="this.style.borderColor='#f97316'; this.style.background='#fff7ed'" onmouseout="this.style.borderColor='#ddd'; this.style.background='white'">
                                📦 Small (16×16×5 cm, 0.5 kg)
                            </button>
                            <button onclick="selectBoxSizeAndFetchCouriers('${orderId}', 'medium')" style="padding: 15px; border: 2px solid #ddd; border-radius: 12px; background: white; cursor: pointer; font-weight: bold; transition: all 0.2s;" onmouseover="this.style.borderColor='#f97316'; this.style.background='#fff7ed'" onmouseout="this.style.borderColor='#ddd'; this.style.background='white'">
                                📦 Medium (20×16×8 cm, 1 kg)
                            </button>
                            <button onclick="selectBoxSizeAndFetchCouriers('${orderId}', 'large')" style="padding: 15px; border: 2px solid #ddd; border-radius: 12px; background: white; cursor: pointer; font-weight: bold; transition: all 0.2s;" onmouseover="this.style.borderColor='#f97316'; this.style.background='#fff7ed'" onmouseout="this.style.borderColor='#ddd'; this.style.background='white'">
                                📦 Large (24×18×10 cm, 1.5 kg)
                            </button>
                        </div>
                        <button onclick="document.getElementById('boxSizePopup').remove()" style="width: 100%; padding: 12px; background: #e5e7eb; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">Cancel</button>
                    </div>
                </div>
            `;
    document.body.appendChild(boxSizePopup);
}

// STEP 2: Skip Courier Fetch, directly push (modified for "Push & Sync")
window.selectBoxSizeAndFetchCouriers = async function (orderId, boxSize) {
    document.getElementById('boxSizePopup').remove();

    const boxSizes = {
        small: { length: 16, breadth: 16, height: 5, weight: 0.5 },
        medium: { length: 20, breadth: 16, height: 8, weight: 1.0 },
        large: { length: 24, breadth: 18, height: 10, weight: 1.5 }
    };
    const selectedDimensions = boxSizes[boxSize];

    if (confirm(`📦 Selected: ${boxSize.toUpperCase()}\n\nIs order ko Shiprocket par push karein?`)) {
        // Direct Push to Shiprocket (Auto mode in backend)
        selectCourierAndDispatch(orderId, boxSize, selectedDimensions, null, 'Auto (Push Only)');
    }
};

// STEP 3: Show Courier Selection (DEPRECATED for Push & Sync)
function showCourierSelection(orderId, boxSize, dimensions, couriers) {
    // This function is skipped in the new flow
}

// STEP 4: Dispatch with selected courier
// STEP 4: Submit to Shiprocket (Direct Push)
window.selectCourierAndDispatch = async function (orderId, boxSize, dimensions, courierId, courierName) {
    if (document.getElementById('courierPopup')) document.getElementById('courierPopup').remove();

    // Show pushing status
    const loadingPopup = document.createElement('div');
    loadingPopup.innerHTML = `
                <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-center;">
                    <div style="background: white; padding: 30px; border-radius: 20px; text-align: center;">
                        <p style="font-size: 24px; margin-bottom: 10px;">🚀</p>
                        <p style="font-weight: bold; color: #f97316;">Pushing to Shiprocket...</p>
                        <p style="font-size: 12px; color: #999; margin-top: 5px;">Box: ${boxSize.toUpperCase()}</p>
                    </div>
                </div>
            `;
    document.body.appendChild(loadingPopup);

    try {
        const payload = {
            orderId: orderId,
            dimensions: dimensions
        };

        const res = await fetch(`${API_URL}/shiprocket/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        loadingPopup.remove();

        if (data.success) {
            const whatsappData = currentDispatchOrder ? { type: 'dispatched', order: { ...currentDispatchOrder, tracking: { courier: 'Shiprocket', trackingId: 'Generating...' } } } : null;

            showSuccessPopup(
                'Order Pushed to Shiprocket! 🚀',
                `\nOrder has been created on Shiprocket.\nAWB will be auto-synced in a few moments...`,
                '📦',
                '#3b82f6',
                whatsappData
            );

            currentDispatchOrder = null;

            setTimeout(() => {
                loadDeptOrders();
                loadDispatchHistory();
            }, 1500);

            // AUTO-SYNC AWB: Poll Shiprocket for AWB after 1 minute
            console.log('⏰ Auto-sync scheduled for', orderId);
            setTimeout(() => autoSyncAWB(orderId), 60000); // Wait 1 minute
        } else {
            alert('❌ Push Error: ' + (data.message || 'Failed to push order'));
        }
    } catch (e) {
        loadingPopup.remove();
        console.error('Shiprocket push error:', e);
        alert('❌ Error: ' + e.message);
    }
};

// Auto-sync AWB for a specific order
async function autoSyncAWB(orderId, retryCount = 0) {
    const maxRetries = 3;

    try {
        console.log(`🔄 Auto-syncing AWB for ${orderId} (attempt ${retryCount + 1}/${maxRetries + 1})`);

        const res = await fetch(`${API_URL}/shiprocket/sync-order/${orderId}`, { method: 'POST' });
        const data = await res.json();

        if (data.success && data.awb) {
            console.log(`✅ AWB synced for ${orderId}: ${data.awb}`);

            // Refresh orders to show updated AWB
            loadDeptOrders();
            loadDispatchHistory();

            // Show subtle notification
            showSuccessPopup(
                'AWB Updated! 📦',
                `Order ${orderId}\nAWB: ${data.awb}`,
                '✅',
                '#10b981'
            );

            // AUTO-TRACK: Track shipment after 30 minutes (pickup completion time)
            console.log(`⏰ Auto-track scheduled for ${orderId} in 30 minutes`);
            setTimeout(() => trackSingleOrder(orderId), 30 * 60 * 1000); // 30 minutes
        } else if (retryCount < maxRetries) {
            // Retry after 15 seconds
            console.log(`⏰ AWB not ready yet, retrying in 15 seconds...`);
            setTimeout(() => autoSyncAWB(orderId, retryCount + 1), 15000);
        } else {
            console.log(`⚠️ AWB not available after ${maxRetries + 1} attempts. Use manual sync.`);
        }
    } catch (error) {
        console.error('Auto-sync error:', error);
    }
}

// Track single order shipment
async function trackSingleOrder(orderId) {
    try {
        console.log(`🔍 Tracking order ${orderId}...`);

        const res = await fetch(`${API_URL}/shiprocket/track-order/${orderId}`, { method: 'POST' });
        const data = await res.json();

        if (data.success && data.currentStatus) {
            console.log(`📍 Tracking updated for ${orderId}: ${data.currentStatus}`);

            // Refresh orders to show updated tracking
            loadDeptOrders();
            loadDispatchHistory();

            // Show notification if status is significant
            if (data.currentStatus.toLowerCase().includes('out for delivery')) {
                showSuccessPopup(
                    'Out for Delivery! 🚚',
                    `Order ${orderId}\n${data.currentStatus}`,
                    '📦',
                    '#f59e0b'
                );
            } else if (data.delivered) {
                showSuccessPopup(
                    'Delivered! ✅',
                    `Order ${orderId}\nSuccessfully delivered`,
                    '🎉',
                    '#10b981'
                );
            }
        }
    } catch (error) {
        console.error('Track order error:', error);
    }
}

// Sync All AWB Numbers
async function syncAllAWB() {
    if (!confirm('📦 Sync AWB numbers from Shiprocket for all dispatched orders?')) {
        return;
    }

    try {
        // Show loading popup
        const loadingPopup = document.createElement('div');
        loadingPopup.innerHTML = `
            <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 20px; text-align: center;">
                    <p style="font-size: 24px; margin-bottom: 10px;">🔄</p>
                    <p style="font-weight: bold; color: #f97316;">Syncing AWB Numbers...</p>
                    <p style="font-size: 12px; color: #999; margin-top: 5px;">Please wait</p>
                </div>
            </div>
        `;
        document.body.appendChild(loadingPopup);

        const res = await fetch(`${API_URL}/shiprocket/sync-all`, { method: 'POST' });
        const data = await res.json();

        loadingPopup.remove();

        if (data.success) {
            showSuccessPopup(
                'AWB Sync Complete! ✅',
                `Synced: ${data.synced || 0}\nTotal Orders: ${data.total || 0}`,
                '📦',
                '#10b981'
            );

            // Refresh orders
            loadDispatchedOrders();
            loadDispatchHistory();
        } else {
            alert('❌ Sync Failed: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Sync AWB error:', error);
        alert('❌ Error: ' + error.message);
    }
}

// Sync Shiprocket Status
async function syncShiprocketStatus() {
    const btn = document.getElementById('btnSyncShiprocket');
    const originalText = btn.innerHTML;

    try {
        btn.innerHTML = '⏳ Syncing...';
        btn.disabled = true;

        const res = await fetch(`${API_URL}/shiprocket/sync-all`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            alert(`Sync Complete! ${data.message}`);
            loadDeptOrders(); // Refresh list to show updated AWBs
            loadDispatchHistory(); // Update stats
        } else {
            alert('Sync Failed: ' + data.message);
        }

    } catch (e) {
        console.error(e);
        alert('Sync Error: ' + e.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ==================== EMPLOYEE EDIT FUNCTIONS ====================
function showEditEmployeeModal(empId, name) {
    document.getElementById('editEmpOldId').value = empId;
    document.getElementById('editEmpNewId').value = empId;
    document.getElementById('editEmpName').value = name;
    document.getElementById('editEmpPass').value = ''; // Clean password field

    document.getElementById('editEmployeeModal').classList.remove('hidden');
}

async function saveEmployeeChanges() {
    try {
        const oldId = document.getElementById('editEmpOldId').value;
        const newId = document.getElementById('editEmpNewId').value.trim();
        const newName = document.getElementById('editEmpName').value.trim();
        const newPassword = document.getElementById('editEmpPass').value.trim();

        if (!newId || !newName) return alert('Name aur ID required hain!');

        const btn = event?.target?.closest('button');
        const originalText = btn ? btn.innerHTML : 'Save';
        if (btn) { btn.innerHTML = '⏳ Saving...'; btn.disabled = true; }

        const res = await fetch(`${API_URL}/employees/${oldId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newId, name: newName, password: newPassword })
        });

        // Robust JSON handling
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await res.json();
            if (data.success) {
                showSuccessPopup('Employee Updated Successfully! ✅', 'Details have been updated and orders synced.', '👤', '#f97316');
                closeModal('editEmployeeModal');
                closeModal('employeeProfileModal');
                loadEmployees(); // Reload list
            } else {
                alert(data.message || 'Update failed!');
            }
        } else {
            const text = await res.text();
            console.error('Non-JSON response:', text);
            alert(`Server Error (${res.status}): Server ne JSON ki jagah HTML bheja hai. Technical issue ho sakti hai.`);
        }

        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
    } catch (e) {
        console.error(e);
        alert('Error: ' + e.message);
    }
}

function filterDeptOrdersHeader(query) {
    const q = query.toLowerCase();

    if (currentDeptType === 'verification') {
        const inputs = ['verificationPendingSearch', 'verificationUnverifiedSearch', 'verificationHistorySearch'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = q;
        });

        const activeTab = document.querySelector('#navGroupVerification .tab-active');
        if (activeTab) {
            if (activeTab.id === 'deptTabPending') loadDeptOrders();
            else if (activeTab.id === 'deptTabUnverified') filterVerificationUnverified();
            else if (activeTab.id === 'deptTabHistory') loadVerificationHistory();
            else if (activeTab.id === 'deptTabCancelled') loadVerificationCancelled();
        }
    } else if (currentDeptType === 'dispatch') {
        const inputs = ['dispatchReadySearch', 'dispatchedSearch', 'dispatchHistorySearch', 'dispatchMobileSearch'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = q;
        });

        const activeTab = document.querySelector('#navGroupDispatch .tab-active');
        if (activeTab) {
            if (activeTab.id === 'deptTabReady') loadDeptOrders();
            else if (activeTab.id === 'deptTabRequests') loadDeliveryRequests();
            else if (activeTab.id === 'deptTabDispatched') loadDispatchedOrders();
            else if (activeTab.id === 'deptTabDispatchHistory') loadDispatchHistory();
        }
    } else if (currentDeptType === 'delivery') {
        const inputs = ['deliveryMobileSearch'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = q;
        });

        const activeTab = document.querySelector('#navGroupDelivery .tab-active');
        if (activeTab) {
            if (activeTab.id === 'deptTabOutForDelivery') loadDeliveryOrders();
            else if (activeTab.id === 'deptTabDelivered') loadDeliveredOrders();
            else if (activeTab.id === 'deptTabFailed') loadFailedDeliveries();
        }
    }
}

// Note: openEditOrderModal, calculateEditCOD, and submitEditOrder functions are defined at line 4387+
