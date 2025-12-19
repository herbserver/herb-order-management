// Production: Using Render server
const API_URL = '/api';

// DEBUG: Confirm file load
console.log('App.js Loaded Successfully');
// alert('System Update: New Features Loaded! ✅'); 

const ADMIN_PASS = 'admin123';

// Session variables
let currentUser = null;
let currentUserType = null;
let currentDeptType = 'verification';

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

    el.className = `mb-4 p-3 rounded-xl text-sm ${type === 'success' ? 'bg-green-100 text-green-700' : type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
        }

            `;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
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
    if (typeof initializeAutoTracking === 'function') {
        initializeAutoTracking();
    }
}

function showDepartmentPanel() {
    document.querySelectorAll('#app> div').forEach(d => d.classList.add('hidden'));
    document.getElementById('departmentPanel').classList.remove('hidden');
    document.getElementById('deptIdDisplay').textContent = currentUser.id;

    const exportBtn = document.getElementById('deptExportBtn');

    // Hide all department content sections
    document.getElementById('verificationDeptContent').classList.add('hidden');
    document.getElementById('dispatchDeptContent').classList.add('hidden');
    if (document.getElementById('deliveryDeptContent')) {
        document.getElementById('deliveryDeptContent').classList.add('hidden');
    }

    if (currentDeptType === 'verification') {
        document.getElementById('deptPanelTitle').textContent = '📍 Verification Department';
        document.getElementById('verificationDeptContent').classList.remove('hidden');
        if (exportBtn) exportBtn.classList.add('hidden');
    } else if (currentDeptType === 'dispatch') {
        document.getElementById('deptPanelTitle').textContent = '📦 Dispatch Department';
        document.getElementById('dispatchDeptContent').classList.remove('hidden');
        if (exportBtn) exportBtn.classList.remove('hidden');
        loadDeliveryRequests();
    } else if (currentDeptType === 'delivery') {
        document.getElementById('deptPanelTitle').textContent = '🚚 Delivery Department';
        if (document.getElementById('deliveryDeptContent')) {
            document.getElementById('deliveryDeptContent').classList.remove('hidden');
        }
        if (exportBtn) exportBtn.classList.add('hidden');
        // Load delivery specific data
        if (typeof loadDeliveryOrders === 'function') loadDeliveryOrders();
    }

    loadDeptOrders();
    // Start auto-tracking for Out for Delivery alerts
    if (typeof initializeAutoTracking === 'function') {
        initializeAutoTracking();
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
    if (typeof initializeAutoTracking === 'function') {
        initializeAutoTracking();
    }
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
                name, employeeId: id, password: pass
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

    // Proper case function (First Letter Capital, Rest Small)
    const properCase = (str) => {
        if (!str) return '';
        return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    let hNo = form.hNo.value.trim();
    let village = form.villColony.value.trim();

    // Format house number
    if (hNo && !isNaN(hNo)) {
        hNo = 'H.No ' + hNo;
    }

    // Combine House No + Village together
    let houseVillage = '';
    if (hNo && village) {
        houseVillage = `${hNo}, Village ${properCase(village)}`;
    } else if (hNo) {
        houseVillage = hNo;
    } else if (village) {
        houseVillage = `Village ${properCase(village)}`;
    }

    const parts = [
        houseVillage,
        form.blockGaliNo.value.trim() ? properCase(form.blockGaliNo.value.trim()) : "",
        form.landMark.value.trim() ? "Landmark: " + properCase(form.landMark.value.trim()) : "",
        form.po.value.trim() ? "PO: " + properCase(form.po.value.trim()) : "",
        properCase(form.tahTaluka.value.trim()),
        properCase(form.distt.value.trim()),
        properCase(form.state.value.trim()),
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

let villageTimeout;
async function handleVillageInput(query) {
    const suggestionsBox = document.getElementById('villageSuggestions');
    clearTimeout(villageTimeout);

    if (query.length < 3) {
        suggestionsBox.classList.add('hidden');
        return;
    }

    villageTimeout = setTimeout(async () => {
        try {
            // Search both Post Office and District/Taluka APIs as fallback
            // Using /api/postoffice/:query as it gives full details
            const res = await fetch(`${API_URL}/postoffice/${encodeURIComponent(query)}`);
            const data = await res.json();

            if (data[0] && data[0].Status === "Success" && data[0].PostOffice) {
                const results = data[0].PostOffice;

                let html = '';
                results.slice(0, 15).forEach(item => {
                    html += `
                             <li class="px-4 py-2 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-none text-sm"
                                 onclick="selectVillage('${item.Name.replace(/'/g, "\\'")}', '${item.Pincode}', '${item.District.replace(/'/g, "\\'")}', '${item.State.replace(/'/g, "\\'")}', '${item.Block.replace(/'/g, "\\'")}')">
                                 <div class="font-bold text-gray-800">${item.Name}</div>
                                 <div class="text-xs text-gray-500 flex gap-2">
                                     <span>📍 ${item.District}, ${item.State}</span>
                                     <span class="bg-gray-100 px-1 rounded text-gray-600">${item.Pincode}</span>
                                 </div>
                             </li>`;
                });

                suggestionsBox.innerHTML = html;
                suggestionsBox.classList.remove('hidden');
            } else {
                suggestionsBox.classList.add('hidden');
            }
        } catch (e) {
            console.error('Village search error:', e);
        }
    }, 300);
}

function selectVillage(name, pin, district, state, block) {
    const form = document.getElementById('orderForm');
    form.villColony.value = name; // Set village name
    form.po.value = name; // Often village is PO
    form.pin.value = pin;
    form.distt.value = district;
    form.state.value = state;
    form.tahTaluka.value = block;

    document.getElementById('villageSuggestions').classList.add('hidden');
    updateAddress();
}

const PRODUCT_LIST = [
    { name: "Naskhol Capsule", price: 1190 },
    { name: "Nadi Yog Capsule", price: 1499 },
    { name: "Herb On Vedic Plus Capsule", price: 1199 },
    { name: "Pain Over Capsule", price: 996 },
    { name: "Herb On Naturals Herbal Tea", price: 1860 },
    { name: "Pangasic Oil", price: 800 }
];

function addItem() {
    const container = document.getElementById('itemsContainer');
    const div = document.createElement('div');
    // Changed from flex to grid for responsive layout
    div.className = 'grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 mb-2';

    let options = PRODUCT_LIST.map(p => `<option value="${p.name}" data-price="${p.price}">${p.name}</option>`).join('');

    div.innerHTML = ` 
            <select class="col-span-12 md:col-span-6 border rounded-lg px-3 py-2 text-sm item-desc bg-white outline-none focus:border-emerald-500 transition-colors" 
                onchange="const price = this.options[this.selectedIndex].getAttribute('data-price'); if(price) { this.parentElement.querySelector('.item-rate').value = price; this.parentElement.querySelector('.item-amount').value = price; calculateTotal(); }"> 
                <option value="">Select Product...</option> 
                ${options}
                <option value="Other">Other</option> 
            </select> 
            <input type="number" placeholder="Rate" class="col-span-5 md:col-span-2 border rounded-lg px-2 py-2 text-sm item-rate outline-none focus:border-emerald-500" oninput="calculateTotal()"> 
            <input type="number" placeholder="Amt" class="col-span-5 md:col-span-3 border rounded-lg px-2 py-2 text-sm item-amount outline-none focus:border-emerald-500" oninput="calculateTotal()"> 
            <button type="button" onclick="this.parentElement.remove(); calculateTotal();" class="col-span-2 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors">×</button> `;
    container.appendChild(div);
}

function calculateTotal() {
    let total = 0;

    document.querySelectorAll('.item-amount').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('totalAmount').textContent = '₹' + total.toFixed(2);
    calculateCOD();
    return total;
}

function calculateCOD() {
    const total = parseFloat(document.getElementById('totalAmount').textContent.replace('₹', '')) || 0;
    const advance = parseFloat(document.querySelector('[name="advance"]').value) || 0;
    const cod = Math.max(0, total - advance);
    document.querySelector('[name="codAmount"]').value = cod.toFixed(2);
}

async function saveOrder() {
    const form = document.getElementById('orderForm');
    const customerName = form.customerName.value.trim();
    const telNo = form.telNo.value.trim();

    if (!customerName || !telNo) {
        return showMessage('Customer Name aur Tel No. required hai!', 'error', 'empMessage');
    }

    if (telNo.length !== 10) {
        return showMessage('Mobile Number 10 digit ka hona chahiye!', 'error', 'empMessage');
    }

    // Enhanced Validation: Check ALL required fields
    let hasError = false;
    const inputs = form.querySelectorAll('input[required], select[required]');

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('border-red-500', 'bg-red-50');
            hasError = true;

            // Add listener to remove error on type
            input.addEventListener('input', () => {
                input.classList.remove('border-red-500', 'bg-red-50');
            });
        }

        else {
            input.classList.remove('border-red-500', 'bg-red-50');
        }
    });

    if (hasError) {
        return showMessage('Kripya sabhi laal (red) fields bharein!', 'error', 'empMessage');
    }

    if (telNo.length !== 10) {
        document.querySelector('input[name="telNo"]').classList.add('border-red-500');
        return showMessage('Mobile Number 10 digit ka hona chahiye!', 'error', 'empMessage');
    }

    const items = [];

    document.querySelectorAll('#itemsContainer> div').forEach(div => {
        const desc = div.querySelector('.item-desc').value.trim();
        const rate = div.querySelector('.item-rate').value;
        const amount = div.querySelector('.item-amount').value;

        if (desc) items.push({
            description: desc, rate: parseFloat(rate) || 0, amount: parseFloat(amount) || 0
        });
    });

    if (items.length === 0) {
        return showMessage('Kam se kam ek item add karein!', 'error', 'empMessage');
    }

    const total = items.reduce((sum, item) => sum + item.amount, 0);

    const orderData = {
        employeeId: currentUser.id,
        employee: currentUser.name,
        customerName,
        address: form.address.value,
        hNo: form.hNo.value,
        blockGaliNo: form.blockGaliNo.value,
        villColony: form.villColony.value,
        po: form.po.value,
        tahTaluka: form.tahTaluka.value,
        distt: form.distt.value,
        state: form.state.value,
        pin: form.pin.value,
        landMark: form.landMark.value,
        treatment: form.treatment.value,
        date: form.date.value,
        time: form.time.value,
        telNo,
        altNo: form.altNo.value,
        orderType: form.orderType.value,
        items,
        total: total,
        advance: parseFloat(form.advance.value) || 0,
        codAmount: parseFloat(form.codAmount.value) || 0
    }

        ;

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }

            ,
            body: JSON.stringify(orderData)
        });
        const data = await res.json();

        if (data.success) {
            // Show beautiful success popup
            const popup = document.createElement('div');
            popup.innerHTML = `
                        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-center; animation: fadeIn 0.3s;">
                            <div style="background: white; border-radius: 24px; padding: 40px; max-width: 400px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.4s;">
                                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-center; animation: scaleIn 0.5s;">
                                    <span style="font-size: 48px;">✅</span>
                                </div>
                                <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">Order Saved!</h2>
                                <p style="font-size: 18px; font-weight: 600; color: #10b981; margin-bottom: 8px;">Order ID: ${data.orderId}</p>
                                <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">Order successfully Verification Department mein chala gaya</p>
                                <button onclick="this.closest('div[style*=fixed]').remove()" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 32px; border-radius: 12px; font-weight: bold; font-size: 16px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                    Got It! 👍
                                </button>
                            </div>
                        </div>
                        <style>
                            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                            @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                            @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
                        </style>
                    `;
            document.body.appendChild(popup);

            // Auto close after 5 seconds
            setTimeout(() => {
                popup.remove();
            }, 5000);

            form.reset();
            initOrderForm();
        }

        else {
            showMessage(data.message || 'Order save nahi hua!', 'error', 'empMessage');
        }
    }

    catch (e) {
        console.error('Save order error:', e);
        showMessage('Server se connect nahi ho paya! Check karo server chal raha hai?', 'error', 'empMessage');
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
            delivered: orders.filter(o => o.status === 'Delivered').length
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
                                ${order.orderType === 'REORDER' ?
                    '<span class="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200">REORDER</span>' : ''}
                            </div>
                            <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[180px]" title="${order.customerName}">
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

                 <!-- Footer Actions -->
                <div class="p-3 bg-gray-50/50 border-t border-gray-100 grid grid-cols-1 gap-2">
                    <button type="button" onclick="viewOrder('${order.orderId}')" 
                        class="w-full bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2">
                        <span>👁️</span> View Details
                    </button>
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
function copyTracking(trackingId) {
    navigator.clipboard.writeText(trackingId);
    alert('Tracking ID copied: ' + trackingId);
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
                             <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Order #${order.orderId}
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

    document.getElementById('dispatchTabReady').classList.remove('tab-active');
    document.getElementById('dispatchTabReady').classList.add('bg-white', 'text-gray-600');
    document.getElementById('dispatchTabRequests').classList.remove('tab-active');
    document.getElementById('dispatchTabRequests').classList.add('bg-white', 'text-gray-600');
    document.getElementById('dispatchTabDispatched').classList.remove('tab-active');
    document.getElementById('dispatchTabDispatched').classList.add('bg-white', 'text-gray-600');
    document.getElementById('dispatchTabHistory').classList.remove('tab-active');
    document.getElementById('dispatchTabHistory').classList.add('bg-white', 'text-gray-600');

    if (tab === 'ready') {
        document.getElementById('dispatchReadyTab').classList.remove('hidden');
        document.getElementById('dispatchTabReady').classList.add('tab-active');
        document.getElementById('dispatchTabReady').classList.remove('bg-white', 'text-gray-600');
        loadDeptOrders();
    }

    else if (tab === 'requests') {
        document.getElementById('dispatchRequestsTab').classList.remove('hidden');
        document.getElementById('dispatchTabRequests').classList.add('tab-active');
        document.getElementById('dispatchTabRequests').classList.remove('bg-white', 'text-gray-600');
        loadDeliveryRequests();
    }

    else if (tab === 'dispatched') {
        document.getElementById('dispatchDispatchedTab').classList.remove('hidden');
        document.getElementById('dispatchTabDispatched').classList.add('tab-active');
        document.getElementById('dispatchTabDispatched').classList.remove('bg-white', 'text-gray-600');
        loadDispatchedOrders();
    }

    else if (tab === 'history') {
        document.getElementById('dispatchHistoryTab').classList.remove('hidden');
        document.getElementById('dispatchTabHistory').classList.add('tab-active');
        document.getElementById('dispatchTabHistory').classList.remove('bg-white', 'text-gray-600');
        loadDispatchHistory();
    }
}

// Delivery Department Tab Switching
function switchDeliveryTab(tab) {
    document.getElementById('deliveryOutForDeliveryTab').classList.add('hidden');
    document.getElementById('deliveryDeliveredTab').classList.add('hidden');
    document.getElementById('deliveryFailedTab').classList.add('hidden');
    document.getElementById('deliveryPerformanceTab').classList.add('hidden');

    document.getElementById('deliveryTabOutForDelivery').classList.remove('tab-active');
    document.getElementById('deliveryTabOutForDelivery').classList.add('bg-white', 'text-gray-600');
    document.getElementById('deliveryTabDelivered').classList.remove('tab-active');
    document.getElementById('deliveryTabDelivered').classList.add('bg-white', 'text-gray-600');
    document.getElementById('deliveryTabFailed').classList.remove('tab-active');
    document.getElementById('deliveryTabFailed').classList.add('bg-white', 'text-gray-600');
    document.getElementById('deliveryTabPerformance').classList.remove('tab-active');
    document.getElementById('deliveryTabPerformance').classList.add('bg-white', 'text-gray-600');

    if (tab === 'outfordelivery') {
        document.getElementById('deliveryOutForDeliveryTab').classList.remove('hidden');
        document.getElementById('deliveryTabOutForDelivery').classList.add('tab-active');
        document.getElementById('deliveryTabOutForDelivery').classList.remove('bg-white', 'text-gray-600');
        loadDeliveryOrders();
    }
    else if (tab === 'delivered') {
        document.getElementById('deliveryDeliveredTab').classList.remove('hidden');
        document.getElementById('deliveryTabDelivered').classList.add('tab-active');
        document.getElementById('deliveryTabDelivered').classList.remove('bg-white', 'text-gray-600');
        loadDeliveredOrders();
    }
    else if (tab === 'failed') {
        document.getElementById('deliveryFailedTab').classList.remove('hidden');
        document.getElementById('deliveryTabFailed').classList.add('tab-active');
        document.getElementById('deliveryTabFailed').classList.remove('bg-white', 'text-gray-600');
        loadFailedDeliveries();
    }
    else if (tab === 'performance') {
        document.getElementById('deliveryPerformanceTab').classList.remove('hidden');
        document.getElementById('deliveryTabPerformance').classList.add('tab-active');
        document.getElementById('deliveryTabPerformance').classList.remove('bg-white', 'text-gray-600');
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
        const orders = data.orders || [];

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const todayCount = orders.filter(o => o.deliveredAt && o.deliveredAt.split('T')[0] === todayStr).length;
        const yesterdayCount = orders.filter(o => o.deliveredAt && o.deliveredAt.split('T')[0] === yesterdayStr).length;
        const weekCount = orders.filter(o => o.deliveredAt && new Date(o.deliveredAt) >= lastWeek).length;

        document.getElementById('statsDeliveryToday').textContent = todayCount;
        document.getElementById('statsDeliveryYesterday').textContent = yesterdayCount;
        document.getElementById('statsDeliveryWeek').textContent = weekCount;

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
                        <span class="text-xs text-gray-400">📅 ${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}</span>
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

        // Sort orders by date - oldest first (FIFO for easier verification priority)
        orders.sort((a, b) => {
            const dateA = new Date(a.timestamp || 0);
            const dateB = new Date(b.timestamp || 0);
            return dateA - dateB; // Ascending order (oldest first)
        });

        const containerId = currentDeptType === 'verification' ? 'pendingVerificationList' : 'readyDispatchList';

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

// Generate order card HTML
function generateOrderCardHTML(order) {
    return `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-100 flex flex-col h-full">
                <!-- Card Header -->
                <div class="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white relative">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-blue-400 rounded-bl-full opacity-5 pointer-events-none"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md border border-blue-200 uppercase tracking-wide">
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
                             <p class="text-sm text-gray-600 leading-snug line-clamp-4 capitalize" title="${order.address}" style="text-transform: capitalize;">
                                ${order.address || 'No Address Provided'}
                             </p>
                             <button onclick="copyAddress('${order.address}')" class="mt-1 text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1">
                                📋 Copy Address
                             </button>
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
                        <span class="text-xs text-gray-400">📅 ${(() => {
            if (!order.timestamp) return 'N/A';
            const days = Math.floor((Date.now() - new Date(order.timestamp)) / 86400000);
            if (days === 0) return 'Today';
            if (days === 1) return 'Yesterday';
            if (days < 7) return days + ' days ago';
            if (days < 30) return Math.floor(days / 7) + ' weeks ago';
            return Math.floor(days / 30) + ' months ago';
        })()} (${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : ''}) ⏰ ${order.timestamp ? new Date(order.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        <span class="text-xs text-gray-300">•</span>
                        <span class="text-xs text-gray-400">By: <span class="font-extrabold text-emerald-700">${order.employee} (${order.employeeId})</span></span>
                    </div>

                </div>

                ${currentDeptType === 'verification' ? `
                <!-- Verification Remark Section -->
                <div class="border-t border-yellow-200 bg-yellow-50/50 p-3 space-y-2">
                    ${order.verificationRemark ? `
                    <div class="bg-yellow-100 border border-yellow-300 rounded-lg p-2">
                        <p class="text-xs font-bold text-yellow-700 mb-1">📝 Saved Remark:</p>
                        <p class="text-xs text-gray-700 leading-relaxed">${order.verificationRemark.text}</p>
                        <p class="text-xs text-yellow-600 mt-1">
                            Added ${new Date(order.verificationRemark.addedAt).toLocaleString()}
                        </p>
                    </div>
                    ` : ''}
                    <textarea id="remark-${order.orderId}" placeholder="Add remark/note about this order..."
                        class="w-full text-xs border-2 border-yellow-300 rounded-lg px-3 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none resize-none font-medium"
                        rows="2">${order.verificationRemark?.text || ''}</textarea>
                    <button type="button" onclick="saveOrderRemark('${order.orderId}')"
                        class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg text-xs font-bold transition-colors shadow-sm">
                        💾 Save Remark
                    </button>
                </div>
                ` : ''}

                <!-- Footer Actions -->
                <div class="p-4 bg-gray-50 border-t border-gray-100 grid gap-2">
                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" onclick="showMap('${order.orderId}', '${(order.address || '').replace(/'/g, "\\'") + ' ' + (order.pin || '')}')" 
                            class="bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1">
                            📍 Locate
                        </button>
                        <button type="button" onclick="viewOrder('${order.orderId}')" 
                            class="bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1">
                            👁️ Details
                        </button>
                    </div>

                    ${currentDeptType === 'verification'
            ? `<div class="grid grid-cols-2 gap-2 mt-1">
                               <button type="button" onclick="verifyAddress('${order.orderId}')" 
                                    class="bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-emerald-600 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1">
                                    ✅ VERIFY
                               </button>
                               <button type="button" onclick="markAsUnverified('${order.orderId}')" 
                                    class="bg-amber-100 text-amber-700 border border-amber-200 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-200 transition-colors flex items-center justify-center gap-1">
                                    ⏸️ HOLD
                               </button>
                           </div>
                           
                           <!-- Cancel Button - NEW FEATURE -->
                           <button type="button" onclick="cancelOrder('${order.orderId}')" 
                                class="bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all mt-2 flex items-center justify-center gap-1">
                                ❌ CANCEL ORDER
                           </button>
                           
                           <!-- Courier Suggest Section - NEW FEATURE -->
                           <div class="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                                <label class="text-xs font-bold text-purple-700 block">📦 Suggest Courier for Dispatch:</label>
                                <select id="courierSelect_${order.orderId}" 
                                    class="w-full border-2 border-purple-300 rounded-lg px-3 py-2 text-xs focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none">
                                    <option value="">Select Courier</option>
                                    <option value="Delhivery">Delhivery</option>
                                    <option value="BlueDart">BlueDart</option>
                                    <option value="DTDC">DTDC</option>
                                    <option value="Ecom Express">Ecom Express</option>
                                    <option value="Shiprocket">Shiprocket</option>
                                    <option value="India Post">India Post</option>
                                </select>
                                <button type="button" onclick="suggestCourier('${order.orderId}')" 
                                    class="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1">
                                    📦 Suggest to Dispatch
                                </button>
                           </div>
                           
                           <button type="button" onclick="openEditOrderModal('${order.orderId}')" 
                                class="w-full text-xs font-medium text-gray-400 hover:text-gray-600 py-1 transition-colors">
                                Edit Order Details
                           </button>`
            : `
                             ${order.courierSuggestion && order.courierSuggestion.suggestedCourier ? `
                                 <!-- Courier Suggestion Display for Dispatch - NEW FEATURE -->
                                 <div class="mb-3 p-3 bg-purple-100 border-l-4 border-purple-500 rounded-lg">
                                     <p class="font-bold text-purple-700 text-sm mb-1">💡 Verification Suggestion:</p>
                                     <p class="text-lg font-bold text-purple-900">${order.courierSuggestion.suggestedCourier}</p>
                                     <p class="text-xs text-purple-600 mt-1">
                                         Suggested by ${order.courierSuggestion.suggestedBy} • 
                                         ${new Date(order.courierSuggestion.suggestedAt).toLocaleDateString()}
                                     </p>
                                     ${order.courierSuggestion.suggestionNote ? `
                                         <p class="text-xs italic text-purple-700 mt-1 border-t border-purple-200 pt-1">
                                             Note: ${order.courierSuggestion.suggestionNote}
                                         </p>
                                     ` : ''}
                                 </div>
                             ` : ''}
                             
                             <div class="grid grid-cols-2 gap-2">
                                 <button type="button" onclick="dispatchWithShiprocket('${order.orderId}')" 
                                     class="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                     🚀 via Shiprocket
                                 </button>
                                 <button type="button" onclick="openDispatchModal('${order.orderId}')" 
                                     class="bg-purple-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-purple-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                 📦 DISPATCH ORDER
                            </button>`
        }
                </div>
                
                <!-- Embedded Map Container -->
                <div id="map-${order.orderId}" class="hidden h-64 w-full bg-gray-100 border-t border-gray-200 relative animate-fadeIn"></div>
            </div>`;
}

async function loadDeliveryRequests() {
    try {
        const res = await fetch(`${API_URL}/delivery-requests`);
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
        const data = await res.json();
        const orders = data.orders || [];

        if (orders.length === 0) {
            document.getElementById('dispatchedOrdersList').innerHTML = '<p class="text-center text-gray-500 py-8">Koi dispatched orders nahi hain</p>';
            return;
        }

        let html = '';

        orders.forEach(order => {
            const tracking = order.tracking || {}

                ;

            html += ` <div class="order-card bg-white border rounded-xl p-4"> <div class="flex justify-between items-start"> <div> <p class="font-bold text-blue-600">${order.orderId}

                        </p> <p class="text-gray-800">${order.customerName}

                        </p> <p class="text-sm text-gray-500">📞 ${order.telNo}

                        </p> </div> <div class="text-right"> <p class="text-lg font-bold text-red-600">₹${order.total}

                        </p> <p class="text-sm text-purple-600">🚚 ${tracking.courier || 'N/A'
                }

                        </p> <p class="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1">${tracking.trackingId || 'N/A'
                }

                        </p> </div> </div> <div class="mt-3 flex gap-2"> <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs">👁️ View</button> <button type="button" onclick="approveDelivery('${order.orderId}')" class="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs">✅ Mark Delivered</button> </div> </div> `;
        });
        document.getElementById('dispatchedOrdersList').innerHTML = html;
    }

    catch (e) {
        console.error(e);
    }
}

// Copy Address Function
function copyAddress(address) {
    if (!address || address === 'No Address Provided') {
        alert('No address to copy!');
        return;
    }

    navigator.clipboard.writeText(address).then(() => {
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

async function verifyAddress(orderId) {
    if (!confirm('Address verify karke Dispatch Department ko bhejni hai?')) return;

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/verify`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }

            ,
            body: JSON.stringify({
                verifiedBy: currentUser.id
            })
        });
        const data = await res.json();

        if (data.success) {
            showSuccessPopup(
                'Address Verified! ✅',
                `Order ${orderId} successfully verified!\n\nAb yeh Dispatch Department mein chala gaya hai.`,
                '✅',
                '#10b981'
            );
            setTimeout(() => loadDeptOrders(), 1000);
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


async function loadDispatchHistory() {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        let orders = data.orders || [];

        // Filter for Dispatched/Delivered only for this view
        orders = orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered');

        // CALCULATE STATS
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const countToday = orders.filter(o => new Date(o.dispatchedAt || o.timestamp).toDateString() === today.toDateString()).length;
        const countYesterday = orders.filter(o => new Date(o.dispatchedAt || o.timestamp).toDateString() === yesterday.toDateString()).length;
        const countWeek = orders.filter(o => new Date(o.dispatchedAt || o.timestamp) >= lastWeek).length;

        document.getElementById('statsDispatchToday').textContent = countToday;
        document.getElementById('statsDispatchYesterday').textContent = countYesterday;
        document.getElementById('statsDispatchWeek').textContent = countWeek;

        // FILTERS
        const search = document.getElementById('dispatchHistorySearch').value.toLowerCase();
        const startDate = document.getElementById('dispatchHistoryStart').value;
        const endDate = document.getElementById('dispatchHistoryEnd').value;

        if (search) {
            orders = orders.filter(o =>
                o.customerName.toLowerCase().includes(search) ||
                o.telNo.includes(search) ||
                o.orderId.toLowerCase().includes(search)
            );
        }

        if (startDate) {
            orders = orders.filter(o => new Date(o.dispatchedAt || o.timestamp) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59);
            orders = orders.filter(o => new Date(o.dispatchedAt || o.timestamp) <= end);
        }

        // Sort by Dispatched Date
        orders.sort((a, b) => new Date(b.dispatchedAt || b.timestamp) - new Date(a.dispatchedAt || a.timestamp));

        const list = document.getElementById('dispatchHistoryList');

        if (orders.length === 0) {
            list.innerHTML = `
                        <div class="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p class="text-4xl mb-3">🔍</p>
                            <p class="text-gray-500 font-medium">No results found</p>
                            <button onclick="resetDispatchHistoryFilters()" class="text-blue-500 font-bold mt-2 hover:underline">Clear Filters</button>
                        </div>`;
            return;
        }

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
        orders.forEach(order => {
            const isDelivered = order.status === 'Delivered';
            const statusColor = isDelivered ? 'green' : 'purple';
            const statusIcon = isDelivered ? '✅' : '🚚';

            html += `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-${statusColor}-100 flex flex-col h-full bg-white">
                <!-- Card Header -->
                <div class="p-5 border-b border-${statusColor}-50 bg-gradient-to-r from-${statusColor}-50/50 to-white relative">
                     <div class="absolute top-0 right-0 w-24 h-24 bg-${statusColor}-400 rounded-bl-full opacity-5 pointer-events-none"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                             <div class="flex items-center gap-2 mb-1">
                                <span class="bg-${statusColor}-100 text-${statusColor}-700 text-xs font-bold px-2 py-0.5 rounded-md border border-${statusColor}-200 uppercase tracking-wide">
                                    ${order.orderId}
                                </span>
                            </div>
                            <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[180px]" title="${order.customerName}">
                                ${order.customerName}
                            </h3>
                        </div>
                        <div class="text-right">
                             <p class="text-xl font-black text-gray-800 tracking-tight">₹${order.total}</p>
                             <span class="bg-${statusColor}-100 text-${statusColor}-700 px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 mt-1">
                                ${statusIcon} ${order.status}
                             </span>
                        </div>
                    </div>
                </div>

                 <!-- Card Body -->
                <div class="p-5 space-y-4 flex-grow bg-white/60">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-${statusColor}-50 flex items-center justify-center text-${statusColor}-600 flex-shrink-0">
                            📞
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Contact</p>
                            <p class="text-sm font-semibold text-gray-700 font-mono">${order.telNo}</p>
                        </div>
                    </div>

                    ${order.tracking && order.tracking.trackingId ? `
                    <div class="flex items-start gap-3">
                         <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                             🧾
                         </div>
                         <div>
                             <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Tracking</p>
                             <div class="flex items-center gap-2">
                                <p class="text-sm font-mono font-bold text-blue-700 tracking-wide">${order.tracking.trackingId}</p>
                                <button onclick="copyTracking('${order.tracking.trackingId}')" class="text-xs text-gray-400 hover:text-blue-600">📋</button>
                             </div>
                         </div>
                    </div>
                    ` : ''}

                    <div class="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <span class="text-xs text-gray-400">
                            <span class="block text-gray-300 text-[10px] uppercase font-bold">Dispatched On</span>
                            ${order.dispatchedAt ? new Date(order.dispatchedAt).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="p-4 bg-${statusColor}-50/30 border-t border-${statusColor}-100 flex justify-between items-center">
                    <button type="button" onclick="viewOrder('${order.orderId}')" 
                        class="bg-white border border-${statusColor}-200 text-${statusColor}-700 hover:bg-${statusColor}-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-2">
                        👁️ View Details
                    </button>
                    ${order.tracking && order.tracking.trackingId ? `
                     <button onclick="trackOrder('${order.orderId}')" class="text-xs text-blue-600 font-bold hover:underline">
                        Track Shipment ➝
                     </button>
                    ` : ''}
                </div>
            </div>`;
        });
        html += '</div>'; // Close Grid
        list.innerHTML = html;

    } catch (e) {
        console.error(e);
    }
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
                    ` : ''}
                     ${activeTab === 'requests' ? `
                    <button type="button" onclick="openDispatchModal('${order.orderId}')" 
                        class="bg-pink-500 text-white flex-1 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-pink-600 transition-colors">
                        📦 Dispatch
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


function openDispatchModal(orderId) {
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
            showMessage('✅ Order dispatched with tracking!', 'success', 'deptMessage');
            loadDeptOrders();
        }
    }

    catch (e) {
        console.error(e);
    }
}

async function approveDelivery(orderId) {
    if (!confirm('Order ko Delivered mark karna hai?')) return;

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/deliver`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }

            ,
            body: JSON.stringify({
                approvedBy: currentUser.id
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
        const res = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await res.json();
        const order = data.order;

        document.getElementById('editOrderIdDisplay').textContent = orderId;

        let itemsHtml = '';

        (order.items || []).forEach((item, idx) => {
            itemsHtml += ` <div class="flex gap-2 edit-item-row"> <input type="text" value="${item.description}" class="flex-1 border rounded-lg px-3 py-2 text-sm edit-item-desc"> <input type="number" value="${item.rate}" class="w-20 border rounded-lg px-2 py-2 text-sm edit-item-rate"> <input type="number" value="${item.amount}" class="w-20 border rounded-lg px-2 py-2 text-sm edit-item-amount" oninput="updateEditTotal()"> <button type="button" onclick="this.parentElement.remove(); updateEditTotal();" class="text-red-500 font-bold px-2">×</button> </div> `;
        });

        document.getElementById('editOrderModalContent').innerHTML = ` <form id="editOrderForm" class="space-y-4"> <input type="hidden" id="editOrderId" value="${orderId}"> <div class="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label class="block text-sm font-medium mb-1">Customer Name *</label> <input type="text" id="editCustomerName" value="${order.customerName}" required class="w-full border-2 rounded-xl px-4 py-2"> </div> <div> <label class="block text-sm font-medium mb-1">Tel No. *</label> <input type="tel" id="editTelNo" value="${order.telNo}" required class="w-full border-2 rounded-xl px-4 py-2"> </div> </div> <div class="grid grid-cols-2 md:grid-cols-4 gap-3"> <div> <label class="block text-xs font-medium mb-1">H.NO.</label> <input type="text" id="editHNo" value="${order.hNo || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"> </div> <div> <label class="block text-xs font-medium mb-1">BLOCK/GALI</label> <input type="text" id="editBlockGaliNo" value="${order.blockGaliNo || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"> </div> <div> <label class="block text-xs font-medium mb-1">VILL/COLONY</label> <input type="text" id="editVillColony" value="${order.villColony || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"> </div> <div> <label class="block text-xs font-medium mb-1">P.O.</label> <input type="text" id="editPo" value="${order.po || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"> </div> </div> <div class="grid grid-cols-2 md:grid-cols-4 gap-3"> <div> <label class="block text-xs font-medium mb-1">TAH/TALUKA</label> <input type="text" id="editTahTaluka" value="${order.tahTaluka || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"> </div> <div> <label class="block text-xs font-medium mb-1">DISTT.</label> <input type="text" id="editDistt" value="${order.distt || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"> </div> <div> <label class="block text-xs font-medium mb-1">STATE</label> <input type="text" id="editState" value="${order.state || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"> </div> <div> <label class="block text-xs font-medium mb-1">PIN</label> <input type="text" id="editPin" value="${order.pin || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"> </div> </div> <div class="grid grid-cols-2 gap-3"> <div> <label class="block text-xs font-medium mb-1">LANDMARK</label> <input type="text" id="editLandMark" value="${order.landMark || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"> </div> <div> <label class="block text-xs font-medium mb-1">ALT NO.</label> <input type="tel" id="editAltNo" value="${order.altNo || ''}" class="w-full border rounded-lg px-3 py-2 text-sm"> </div> </div> <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-200"> <div class="flex justify-between items-center mb-3"> <label class="font-bold text-emerald-700">🛒 ITEMS</label> <button type="button" onclick="addEditItem()" class="bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm">+ Add Item</button> </div> <div id="editItemsContainer" class="space-y-2"> ${itemsHtml}

                </div> <div class="mt-3 pt-3 border-t border-emerald-300 flex justify-between font-bold text-lg"> <span>Total:</span> <span id="editTotalAmount" class="text-red-600">₹${order.total || 0
            }

                </span> </div> </div> <div class="grid grid-cols-2 gap-3"> <div> <label class="block text-sm font-medium mb-1">Advance</label> <input type="number" id="editAdvance" value="${order.advance || 0}" oninput="updateEditCOD()" class="w-full border-2 rounded-xl px-4 py-2"> </div> <div> <label class="block text-sm font-medium mb-1">COD Amount</label> <input type="number" id="editCodAmount" value="${order.codAmount || 0}" readonly class="w-full border-2 rounded-xl px-4 py-2 bg-red-50 text-red-700 font-bold"> </div> </div> <div class="flex gap-3"> <button type="button" onclick="closeModal('editOrderModal')" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium">Cancel</button> <button type="button" onclick="saveEditOrder()" class="flex-1 bg-orange-600 text-white py-3 rounded-xl font-medium hover:bg-orange-700">💾 Save Changes</button> </div> </form> `;

        document.getElementById('editOrderModal').classList.remove('hidden');
    }

    catch (e) {
        console.error(e);
        alert('Order load nahi hua!');
    }
}

function addEditItem() {
    const container = document.getElementById('editItemsContainer');
    const div = document.createElement('div');
    // Responsive Grid Layout
    div.className = 'grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 mb-2 edit-item-row';
    div.innerHTML = ` 
            <input type="text" placeholder="Product" class="col-span-12 md:col-span-6 border rounded-lg px-3 py-2 text-sm edit-item-desc outline-none focus:border-emerald-500"> 
            <input type="number" placeholder="Rate" class="col-span-5 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-rate outline-none focus:border-emerald-500"> 
            <input type="number" placeholder="Amt" class="col-span-5 md:col-span-3 border rounded-lg px-2 py-2 text-sm edit-item-amount outline-none focus:border-emerald-500" oninput="updateEditTotal()"> 
            <button type="button" onclick="this.parentElement.remove(); updateEditTotal();" class="col-span-2 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors">×</button> `;
    container.appendChild(div);
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
    const orderId = document.getElementById('editOrderId').value;

    const items = [];

    document.querySelectorAll('.edit-item-row').forEach(row => {
        const desc = row.querySelector('.edit-item-desc').value.trim();
        const rate = row.querySelector('.edit-item-rate').value;
        const amount = row.querySelector('.edit-item-amount').value;

        if (desc) items.push({
            description: desc, rate: parseFloat(rate) || 0, amount: parseFloat(amount) || 0
        });
    });

    const total = items.reduce((sum, item) => sum + item.amount, 0);

    // Build address
    const addressParts = [document.getElementById('editHNo').value,
    document.getElementById('editBlockGaliNo').value,
    document.getElementById('editVillColony').value,
    document.getElementById('editPo').value,
    document.getElementById('editTahTaluka').value,
    document.getElementById('editDistt').value,
    document.getElementById('editState').value,
    document.getElementById('editPin').value].filter(v => v.trim());

    const updateData = {
        customerName: document.getElementById('editCustomerName').value.trim(),
        telNo: document.getElementById('editTelNo').value.trim(),
        altNo: document.getElementById('editAltNo').value.trim(),
        hNo: document.getElementById('editHNo').value,
        blockGaliNo: document.getElementById('editBlockGaliNo').value,
        villColony: document.getElementById('editVillColony').value,
        po: document.getElementById('editPo').value,
        tahTaluka: document.getElementById('editTahTaluka').value,
        distt: document.getElementById('editDistt').value,
        state: document.getElementById('editState').value,
        pin: document.getElementById('editPin').value,
        landMark: document.getElementById('editLandMark').value,
        address: addressParts.join(', '),
        items,
        total,
        advance: parseFloat(document.getElementById('editAdvance').value) || 0,
        codAmount: parseFloat(document.getElementById('editCodAmount').value) || 0,
        editedBy: currentUser.id,
        editedAt: new Date().toISOString()
    }

        ;

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`, {

            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }

            ,
            body: JSON.stringify(updateData)
        });
        const data = await res.json();

        if (data.success) {
            closeModal('editOrderModal');
            showSuccessPopup(
                'Order Updated! ✏️',
                `Order ${updateData.orderId} successfully update ho gaya!`,
                '✏️',
                '#3b82f6'
            );
            setTimeout(() => loadDeptOrders(), 1000);
        }

        else {
            alert(data.message || 'Update failed!');
        }
    }

    catch (e) {
        console.error(e);
        alert('Server error!');
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
            html += ` <div class="glass-card p-4 border-l-4 ${order.status === 'Pending' ? 'border-red-500' : order.status === 'Address Verified' ? 'border-blue-500' : order.status === 'Dispatched' ? 'border-purple-500' : 'border-green-500'}"> 
                        <div class="flex justify-between items-start"> 
                            <div> 
                                <p class="font-bold text-gray-800">${order.orderId}</p> 
                                <p class="text-sm text-gray-600">${order.customerName} - ${order.telNo}</p> 
                                <p class="text-xs text-gray-500 mt-1">Date: ${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}</p> 
                            </div> 
                            <div class="text-right"> 
                                <p class="font-bold text-gray-800">₹${order.total}</p> 
                                <span class="px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'Pending' ? 'bg-red-100 text-red-700' : order.status === 'Address Verified' ? 'bg-blue-100 text-blue-700' : order.status === 'Dispatched' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}">${order.status}</span> 
                            </div> 
                        </div> 
                        <div class="mt-3 flex gap-2 flex-wrap"> 
                            <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-600">👁️ View</button> 
                            <button type="button" onclick="openEditOrderModal('${order.orderId}')" class="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-orange-600">✏️ Edit</button> 
                            ${order.status === 'Address Verified' ? `<button type="button" onclick="openDispatchModal('${order.orderId}')" class="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-purple-600">📦 Dispatch</button>` : ''}
                            <button type="button" onclick="deleteOrder('${order.orderId}')" class="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-600">🗑️ Delete</button> 
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

    // Deactivate all buttons
    const buttons = document.querySelectorAll('[id^="adminTab"]');
    buttons.forEach(el => {
        el.classList.remove('tab-active');
        el.classList.add('bg-white');
    });

    contentEl.classList.remove('hidden');

    if (buttonEl) {
        buttonEl.classList.add('tab-active');
        buttonEl.classList.remove('bg-white');
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

    updateAdminBadges();
}

async function updateAdminBadges() {
    try {
        const pending = await (await fetch(`${API_URL}/orders/pending`)).json();
        const verified = await (await fetch(`${API_URL}/orders/verified`)).json();
        const dispatched = await (await fetch(`${API_URL}/orders/dispatched`)).json();
        const delivered = await (await fetch(`${API_URL}/orders/delivered`)).json();

        if (document.getElementById('pendingCount')) document.getElementById('pendingCount').textContent = pending.orders ? pending.orders.length : 0;
        if (document.getElementById('verifiedCount')) document.getElementById('verifiedCount').textContent = verified.orders ? verified.orders.length : 0;
        if (document.getElementById('dispatchedCount')) document.getElementById('dispatchedCount').textContent = dispatched.orders ? dispatched.orders.length : 0;
        if (document.getElementById('deliveredCount')) document.getElementById('deliveredCount').textContent = delivered.orders ? delivered.orders.length : 0;
    } catch (e) { console.error('Badge update failed', e); }
}

function calculateAndRenderStats(orders, todayId, yesterdayId, weekId, dateField) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const countToday = orders.filter(o => {
        const d = o[dateField] ? new Date(o[dateField]) : new Date(o.timestamp);
        return d.toDateString() === today.toDateString();
    }).length;

    const countYesterday = orders.filter(o => {
        const d = o[dateField] ? new Date(o[dateField]) : new Date(o.timestamp);
        return d.toDateString() === yesterday.toDateString();
    }).length;

    const countWeek = orders.filter(o => {
        const d = o[dateField] ? new Date(o[dateField]) : new Date(o.timestamp);
        return d >= lastWeek;
    }).length;

    const tEl = document.getElementById(todayId);
    if (tEl) tEl.textContent = countToday;
    const yEl = document.getElementById(yesterdayId);
    if (yEl) yEl.textContent = countYesterday;
    const wEl = document.getElementById(weekId);
    if (wEl) wEl.textContent = countWeek;
}

// GENERIC LOAD FUNCTION FOR ADMIN TABS
async function loadAdminStatusTab(status, listId, searchId, startId, endId, statsIds, dateField) {
    try {
        let res;
        const endpointMap = {
            'Pending': '/orders/pending',
            'Address Verified': '/orders/verified',
            'Dispatched': '/orders/dispatched',
            'Delivered': '/orders/delivered'
        };

        res = await fetch(`${API_URL}${endpointMap[status]}`);
        const data = await res.json();
        let orders = data.orders || [];

        calculateAndRenderStats(orders, statsIds[0], statsIds[1], statsIds[2], dateField);

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

        if (orders.length === 0) {
            container.innerHTML = `
                        <div class="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p class="text-4xl mb-3">📭</p>
                            <p class="text-gray-500 font-medium">No ${status} orders found</p>
                        </div>`;
            return;
        }

        let themeColor = 'blue';
        if (status === 'Pending') themeColor = 'red';
        if (status === 'Dispatched') themeColor = 'purple';
        if (status === 'Delivered') themeColor = 'green';

        let html = '';
        orders.forEach(order => {
            const tracking = order.tracking || {};
            const dateDisplay = order[dateField] ? new Date(order[dateField]).toLocaleDateString() : (order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A');

            html += `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-${themeColor}-100 flex flex-col h-full bg-white">
                <!-- Card Header -->
                <div class="p-5 border-b border-${themeColor}-50 bg-gradient-to-r from-${themeColor}-50/50 to-white relative">
                     <div class="absolute top-0 right-0 w-24 h-24 bg-${themeColor}-400 rounded-bl-full opacity-5 pointer-events-none"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                             <div class="flex items-center gap-2 mb-1">
                                <span class="bg-${themeColor}-100 text-${themeColor}-700 text-xs font-bold px-2 py-0.5 rounded-md border border-${themeColor}-200 uppercase tracking-wide">
                                    ${order.orderId}
                                </span>
                            </div>
                            <h3 class="font-bold text-gray-800 text-lg leading-tight truncate max-w-[180px]" title="${order.customerName}">
                                ${order.customerName}
                            </h3>
                        </div>
                        <div class="text-right">
                             <p class="text-xl font-black text-gray-800 tracking-tight">₹${order.total}</p>
                             <span class="bg-${themeColor}-100 text-${themeColor}-700 px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 mt-1">
                                ${status}
                             </span>
                        </div>
                    </div>
                </div>

                 <!-- Card Body -->
                <div class="p-5 space-y-4 flex-grow bg-white/60">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-${themeColor}-50 flex items-center justify-center text-${themeColor}-600 flex-shrink-0">
                            📞
                        </div>
                        <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Contact</p>
                            <p class="text-sm font-semibold text-gray-700 font-mono">${order.telNo}</p>
                             ${order.altNo ? `<p class="text-xs text-gray-500 font-mono mt-0.5">Alt: ${order.altNo}</p>` : ''}
                        </div>
                    </div>

                    ${tracking.trackingId ? `
                    <div class="flex items-start gap-3">
                         <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                             🧾
                         </div>
                         <div>
                             <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Tracking</p>
                             <div class="flex items-center gap-2">
                                <p class="text-sm font-mono font-bold text-blue-700 tracking-wide">${tracking.trackingId}</p>
                                <button onclick="copyTracking('${tracking.trackingId}')" class="text-xs text-gray-400 hover:text-blue-600">📋</button>
                             </div>
                             ${tracking.courier ? `<p class="text-xs text-gray-500 mt-0.5">${tracking.courier}</p>` : ''}
                         </div>
                    </div>
                    ` : ''}

                    <div class="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <span class="text-xs text-gray-400">
                            <span class="block text-gray-300 text-[10px] uppercase font-bold">Date</span>
                            ${dateDisplay}
                        </span>
                        ${order.employee ? `
                        <span class="text-gray-300">•</span>
                        <span class="text-xs text-gray-400">
                             <span class="block text-gray-300 text-[10px] uppercase font-bold">By</span>
                            <span class="font-extrabold text-emerald-700">${order.employee}</span>
                        </span>` : ''}
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="p-3 bg-${themeColor}-50/30 border-t border-${themeColor}-100 grid grid-cols-2 gap-2">
                     <button type="button" onclick="viewOrder('${order.orderId}')" 
                        class="bg-white border border-${themeColor}-200 text-${themeColor}-700 hover:bg-${themeColor}-50 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                        <span>👁️</span> View
                    </button>
                    
                    ${status === 'Address Verified' ? `
                    <button type="button" onclick="openDispatchModal('${order.orderId}')" 
                        class="bg-purple-600 text-white py-2 rounded-xl text-xs font-bold shadow-md hover:bg-purple-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                        <span>📦</span> Dispatch
                    </button>
                    ` : ''}

                     ${status === 'Pending' ? `
                    <button type="button" onclick="openEditOrderModal('${order.orderId}')" 
                        class="bg-orange-100 text-orange-700 border border-orange-200 py-2 rounded-xl text-xs font-bold hover:bg-orange-200 transition-colors flex items-center justify-center gap-2">
                        <span>✏️</span> Edit
                    </button>
                    ` : ''}
                    
                     <button type="button" onclick="deleteOrder('${order.orderId}')" 
                        class="col-span-2 bg-red-50 text-red-600 border border-red-100 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                        <span>🗑️</span> Delete Order
                    </button>
                </div>
            </div>`;
        });
        container.innerHTML = html;

    } catch (e) { console.error('Error loading admin tab', e); }
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

function resetAdminFilters(type) {
    const capType = type.charAt(0).toUpperCase() + type.slice(1);
    if (document.getElementById(`admin${capType}Search`)) document.getElementById(`admin${capType}Search`).value = '';
    if (document.getElementById(`admin${capType}StartDate`)) document.getElementById(`admin${capType}StartDate`).value = '';
    if (document.getElementById(`admin${capType}EndDate`)) document.getElementById(`admin${capType}EndDate`).value = '';

    if (type === 'pending') loadAdminPending();
    else if (type === 'verified') loadAdminVerified();
    else if (type === 'dispatched') loadAdminDispatched();
    else if (type === 'delivered') loadAdminDelivered();
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
                    
                    <button class="w-full mt-4 bg-indigo-50 text-indigo-600 font-bold py-2 rounded-xl text-xs hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                        <span>📊</span> View Performance
                    </button>
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
                            <p class="opacity-80 font-mono text-sm bg-indigo-500/30 inline-block px-3 py-1 rounded-lg border border-indigo-400/30">${emp.id}</p>
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
        const res = await fetch(`${API_URL}/departments`);
        const data = await res.json();
        const departments = data.departments || [];

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
            const isVerification = dept.type === 'verification';
            const themeColor = isVerification ? 'blue' : 'purple';
            const icon = isVerification ? '📍' : '📦';
            const label = isVerification ? 'Verification Dept' : 'Dispatch Dept';

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
                    <div class="flex items-center gap-2 mb-4">
                        <span class="text-gray-400 text-xs font-bold uppercase tracking-wider">ID</span>
                        <span class="font-mono text-sm bg-gray-50 px-2 py-0.5 rounded border border-gray-100 text-gray-600">${dept.id}</span>
                    </div>

                    <button type="button" onclick="openEditDeptModal('${dept.id}', '${dept.name}')" 
                        class="w-full bg-${themeColor}-50 text-${themeColor}-600 border border-${themeColor}-100 font-bold py-2.5 rounded-xl text-sm hover:bg-${themeColor}-100 transition-colors flex items-center justify-center gap-2">
                        <span>✏️</span> Manage Department
                    </button>
                </div>
            </div>`;
        });
        html += '</div>';
        document.getElementById('adminDepartmentsTab').innerHTML = html;
    } catch (e) { console.error(e); }
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
                                ${employees.map(e => `<option value="${e}">${e}</option>`).join('')}
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
                    <td class="px-6 py-4 font-medium text-gray-700">${o.employee}</td>
                    <td class="px-6 py-4 text-gray-600 max-w-[150px] truncate" title="${o.customerName}">${o.customerName}</td>
                    <td class="px-6 py-4 text-right font-bold text-gray-800">₹${(o.total || 0).toFixed(2)}</td>
                    <td class="px-6 py-4 text-center">
                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusClass}">${o.status}</span>
                    </td>
                    <td class="px-6 py-4 text-right text-xs text-gray-400 font-mono">
                        ${o.timestamp ? new Date(o.timestamp).toLocaleDateString() : ''}
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button type="button" onclick="viewOrder('${o.orderId}')" 
                        class="text-indigo-600 hover:text-indigo-800 font-bold text-xs hover:underline">
                        View
                        </button>
                    </td>
                </tr>`;
    });
    html += '</tbody></table></div>';
    document.getElementById('adminHistoryList').innerHTML = html;
}

async function loadAdminProgress() {
    // Render basic structure with filters
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
                </div>
            </div>

            <div id="adminProgressStatsContainer">
                <!-- Stats will be loaded here -->
                <div class="animate-pulse space-y-4">
                    <div class="h-32 bg-gray-100 rounded-2xl"></div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="h-64 bg-gray-100 rounded-2xl"></div>
                        <div class="h-64 bg-gray-100 rounded-2xl"></div>
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
            opt.textContent = e.name;
            select.appendChild(opt);
        });
    } catch (e) { console.error('Error loading employees for filter', e); }

    // Initial Filter Call
    filterAdminProgress();
}

async function filterAdminProgress() {
    try {
        const startDate = document.getElementById('adminProgressStartDate').value;
        const endDate = document.getElementById('adminProgressEndDate').value;
        const employeeId = document.getElementById('adminProgressEmployee').value;

        // Fetch data (optimized: fetch all and filter client side for smooth UX, or fetch filtered from server if API supports)
        // Assuming we fetch all history for stats
        const res = await fetch(`${API_URL}/admin/history`);
        const data = await res.json();
        let orders = data.orders || [];

        // Filter
        if (startDate) orders = orders.filter(o => o.timestamp >= startDate);
        if (endDate) orders = orders.filter(o => o.timestamp <= endDate + 'T23:59:59');
        if (employeeId) orders = orders.filter(o => o.employeeId === employeeId);

        // Calculate Stats
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0;

        // Status Breakdown
        const pending = orders.filter(o => o.status === 'Pending').length;
        const verified = orders.filter(o => o.status === 'Address Verified').length;
        const dispatched = orders.filter(o => o.status === 'Dispatched').length;
        const delivered = orders.filter(o => o.status === 'Delivered').length;

        // Employee Breakdown (if no employee selected, show top performers)
        // If employee selected, show their specific stats breakdown logic could be added here

        // Render Stats Container
        const statsHtml = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="glass-card p-6 bg-white border border-indigo-100 flex items-center justify-between">
                         <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
                            <p class="text-3xl font-black text-gray-800">₹${totalRevenue.toLocaleString()}</p>
                         </div>
                         <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl">💰</div>
                    </div>
                     <div class="glass-card p-6 bg-white border border-blue-100 flex items-center justify-between">
                         <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Orders</p>
                            <p class="text-3xl font-black text-gray-800">${totalOrders}</p>
                         </div>
                         <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-2xl">📦</div>
                    </div>
                     <div class="glass-card p-6 bg-white border border-green-100 flex items-center justify-between">
                         <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Order Value</p>
                            <p class="text-3xl font-black text-gray-800">₹${avgOrderValue}</p>
                         </div>
                         <div class="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 text-2xl">📊</div>
                    </div>
                     <div class="glass-card p-6 bg-white border border-purple-100 flex items-center justify-between">
                         <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Conversion Rate</p>
                            <p class="text-3xl font-black text-gray-800">${totalOrders > 0 ? ((delivered / totalOrders) * 100).toFixed(1) : 0}%</p>
                         </div>
                         <div class="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 text-2xl">📈</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Status Distribution -->
                    <div class="glass-card p-6 bg-white">
                        <h4 class="font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">🥧</span>
                            Status Breakdown
                        </h4>
                        <div class="space-y-4">
                            <div>
                                <div class="flex justify-between text-sm font-bold text-gray-600 mb-1">
                                    <span>Pending</span>
                                    <span>${pending} (${totalOrders > 0 ? ((pending / totalOrders) * 100).toFixed(1) : 0}%)</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div class="bg-red-500 h-2.5 rounded-full" style="width: ${totalOrders > 0 ? (pending / totalOrders) * 100 : 0}%"></div>
                                </div>
                            </div>
                             <div>
                                <div class="flex justify-between text-sm font-bold text-gray-600 mb-1">
                                    <span>Address Verified</span>
                                    <span>${verified} (${totalOrders > 0 ? ((verified / totalOrders) * 100).toFixed(1) : 0}%)</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                     <div class="bg-blue-500 h-2.5 rounded-full" style="width: ${totalOrders > 0 ? (verified / totalOrders) * 100 : 0}%"></div>
                                </div>
                            </div>
                             <div>
                                <div class="flex justify-between text-sm font-bold text-gray-600 mb-1">
                                    <span>Dispatched</span>
                                    <span>${dispatched} (${totalOrders > 0 ? ((dispatched / totalOrders) * 100).toFixed(1) : 0}%)</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                     <div class="bg-purple-500 h-2.5 rounded-full" style="width: ${totalOrders > 0 ? (dispatched / totalOrders) * 100 : 0}%"></div>
                                </div>
                            </div>
                             <div>
                                <div class="flex justify-between text-sm font-bold text-gray-600 mb-1">
                                    <span>Delivered</span>
                                    <span>${delivered} (${totalOrders > 0 ? ((delivered / totalOrders) * 100).toFixed(1) : 0}%)</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                     <div class="bg-green-500 h-2.5 rounded-full" style="width: ${totalOrders > 0 ? (delivered / totalOrders) * 100 : 0}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;

        document.getElementById('adminProgressStatsContainer').innerHTML = statsHtml;

    } catch (e) {
        console.error('Error filtering progress', e);
    }
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
            const rate = i.rate || i.price || 0;
            const qty = i.quantity || i.qty || 0;
            const total = i.amount || i.total || (rate * qty) || 0;

            return `<tr>
                        <td class="p-2">${name}</td>
                        <td class="p-2 text-right">₹${rate}</td>
                        <td class="p-2 text-center">${qty}</td>
                        <td class="p-2 text-right font-bold">₹${total}</td>
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

                </div> </div> <h4 class="font-bold text-gray-700 mt-6 mb-3">🛒 Items</h4> <div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"> <thead class="bg-gray-100"><tr><th class="p-2 text-left">ITEM</th><th class="p-2 text-right">RATE</th><th class="p-2 text-center">QTY</th><th class="p-2 text-right">TOTAL</th></tr></thead> <tbody>${itemsHtml}

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
    if (!confirm('Order delete karna hai? Ye action undo nahi hoga!')) return;

    try {
        await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'DELETE'
        });
        showMessage('Order deleted!', 'success', 'adminMessage');
        loadAdminData();
    }

    catch (e) {
        console.error(e);
    }
}

function showRegisterDeptModal() {
    document.getElementById('newDeptName').value = '';
    document.getElementById('newDeptId').value = '';
    document.getElementById('newDeptPass').value = '';
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
                name, deptId: id, password: pass, deptType: type
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

async function exportAllOrders() {
    try {
        showMessage('⏳ Generating Excel file...', 'success', 'adminMessage');

        // Fetch all raw data from server
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();

        if (!data.success || !data.orders) throw new Error('Failed to fetch orders');

        const orders = data.orders;

        // Map to Schema
        const exportData = orders.map((order, index) => {
            let address = order.address || '';
            // Format address if it's an object
            if (typeof address === 'object' && address !== null) {
                address = `${address.houseNo || ''}, ${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;
            }

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
                "Address": address,
                "Add1": "", // Placeholder
                "Add2": "", // Placeholder
                "Add3": "", // Placeholder
                "Order Date": formatDate(order.timestamp),
                "Delivered Date": order.status === 'Delivered' ? formatDate(order.deliveryDate) : '',
                "Product Name": productNames,
                "Delivery Status": "On Way",
                "Amount Rs.": order.total || 0,
                "Advance Payment": 0,
                "Payment Method": order.paymentMode || 'COD',
                "Agent": order.employee || '',
                "Order Type": order.orderType || 'New',
                "Invoice Date": formatDate(order.timestamp),
                "Delivered by": order.dispatchedBy || '',
                "AWB Number": order.tracking ? (order.tracking.trackingId || '') : '',
                "RTO Status": order.rtoStatus || ''
            };
        });

        // Generate Worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Orders");

        // Download File
        const fileName = `HerbOnNaturals_Orders_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        showMessage('✅ Excel file downloaded!', 'success', 'adminMessage');

    } catch (e) {
        console.error(e);
        alert('Export failed! ' + e.message);
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
                <div class="flex flex-col h-full bg-gray-50">
                    <!-- Full Bleed Header with Gradient -->
                    <div class="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white relative flex-shrink-0 rounded-t-2xl">
                        <!-- Close Button -->
                        <button onclick="closeModal('orderDetailModal')" class="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-all z-20">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <div class="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4 pointer-events-none">
                            <svg class="w-40 h-40" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" /><path fill-rule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clip-rule="evenodd" /></svg>
                        </div>
                        
                        <div class="flex justify-between items-start relative z-10 pr-10">
                            <div>
                                <h4 class="text-3xl font-bold mb-2 font-mono tracking-wide shadow-black drop-shadow-md">${order.orderId}</h4>
                                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${order.status === 'Delivered' ? 'bg-white text-emerald-700' :
                order.status === 'Dispatched' ? 'bg-white text-purple-700' :
                    order.status === 'Address Verified' ? 'bg-white text-blue-700' :
                        'bg-white text-yellow-700'
            }">${order.status}</span>
                            </div>
                            <div class="text-right">
                                <p class="text-4xl font-bold drop-shadow-md">₹${order.total || 0}</p>
                                <p class="text-sm opacity-90 font-medium">${order.timestamp ? new Date(order.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Scrollable Body Content -->
                    <div class="p-4 sm:p-6 space-y-6 overflow-y-auto">
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <!-- Customer Details Card -->
                            <div class="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group">
                                <div class="absolute top-0 right-0 bg-blue-50 text-blue-600 px-3 py-1 rounded-bl-xl rounded-tr-xl text-xs font-bold">CUSTOMER</div>
                                <div class="flex items-center gap-3 mb-3">
                                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-lg shadow-sm group-hover:scale-110 transition-transform">👤</div>
                                    <div>
                                        <h5 class="text-base font-bold text-gray-800">${order.customerName}</h5>
                                        <p class="text-xs text-gray-500 font-mono">ID: ${order.customerName.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 1000)}</p>
                                    </div>
                                </div>
                                <div class="space-y-1.5 text-sm">
                                    <p class="flex items-center gap-2"><span class="w-16 text-gray-500 font-medium text-xs">Phone:</span> <span class="text-gray-900 font-mono font-bold">${order.telNo}</span></p>
                                    ${order.altNo ? `<p class="flex items-center gap-2"><span class="w-16 text-gray-500 font-medium text-xs">Alt Phone:</span> <span class="text-gray-900 font-mono">${order.altNo}</span></p>` : ''}
                                    <p class="flex items-center gap-2"><span class="w-16 text-gray-500 font-medium text-xs">Type:</span> <span class="px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold text-gray-700">${order.orderType || 'NEW'}</span></p>
                                </div>
                            </div>

                            <!-- Delivery Address Card -->
                            <div class="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group">
                                <div class="absolute top-0 right-0 bg-orange-50 text-orange-600 px-3 py-1 rounded-bl-xl rounded-tr-xl text-xs font-bold">DELIVERY</div>
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-lg shadow-sm group-hover:scale-110 transition-transform">📍</div>
                                        <h5 class="text-base font-bold text-gray-800">Address</h5>
                                    </div>
                                    <button type="button" onclick="copyTracking(this.getAttribute('data-addr'))" data-addr="${fullAddress.replace(/"/g, '&quot;')}" class="text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors hover:bg-blue-100">
                                        <span>📋</span> COPY
                                    </button>
                                </div>
                                <p class="text-gray-700 text-sm leading-relaxed border-l-4 border-orange-200 pl-3 py-1 line-clamp-3 hover:line-clamp-none">
                                    ${fullAddress}
                                </p>
                                ${order.landMark ? `<div class="mt-2 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-1.5 rounded-lg"><span class="text-orange-500">🚩</span> <strong>Landmark:</strong> ${order.landMark}</div>` : ''}
                            </div>
                        </div>

                        <!-- Items List (Invoice Style) -->
                        <div class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div class="bg-white px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h5 class="font-bold text-gray-700 flex items-center gap-2">🛒 <span class="text-sm">ORDER ITEMS</span></h5>
                                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200">${order.items ? order.items.length : 0} Items</span>
                            </div>
                            <div class="p-0 overflow-x-auto">
                                ${order.items && order.items.length > 0 ?
                `<table class="w-full text-sm">
                                        <thead class="bg-gray-50/50 text-gray-500 text-xs uppercase text-left">
                                            <tr>
                                                <th class="px-5 py-3 font-medium">Item</th>
                                                <th class="px-5 py-3 text-right font-medium">Rate</th>
                                                <th class="px-5 py-3 text-right font-medium">Qty</th>
                                                <th class="px-5 py-3 text-right font-medium">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-100">
                                            ${order.items.map(item => `
                                                <tr class="hover:bg-gray-50 transition-colors">
                                                    <td class="px-5 py-3 font-medium text-gray-800">${item.description}</td>
                                                    <td class="px-5 py-3 text-right text-gray-500">₹${item.price}</td>
                                                    <td class="px-5 py-3 text-right text-gray-500">x${item.quantity}</td>
                                                    <td class="px-5 py-3 text-right font-bold text-gray-800">₹${item.quantity * item.price}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>`
                : '<div class="p-8 text-center text-gray-400">No items found</div>'
            }
                            </div>
                            
                            <!-- Detailed Totals -->
                            <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                <div class="flex flex-col gap-1 ml-auto w-full md:w-1/2">
                                    <div class="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span class="font-medium">₹${order.total || 0}</span>
                                    </div>
                                    <div class="flex justify-between text-sm text-gray-600">
                                        <span>Advance Paid</span>
                                        <span class="font-medium text-green-600">- ₹${order.advance || 0}</span>
                                    </div>
                                    <div class="border-t border-gray-300 my-2"></div>
                                    <div class="flex justify-between text-lg font-bold text-gray-900">
                                        <span>COD Payable</span>
                                        <span class="text-red-600">₹${order.codAmount || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tracking Info (Purple) -->
                        ${order.tracking && order.tracking.courier ? `
                        <div class="bg-purple-50 border border-purple-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xl">🚚</div>
                                <div>
                                    <p class="text-xs text-purple-600 font-bold uppercase mb-1">Via ${order.tracking.courier}</p>
                                    <p class="text-xl font-bold text-gray-800 font-mono tracking-wide">${order.tracking.trackingId || 'N/A'}</p>
                                </div>
                            </div>
                            <button onclick="copyTracking('${order.tracking.trackingId}')" class="bg-white border border-purple-200 text-purple-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all">
                                Track ↗
                            </button>
                        </div>
                        ` : ''}

                        <!-- Map Section -->
                        <div class="bg-white border border-gray-200 p-1 rounded-2xl shadow-sm">
                            <div id="orderDetailMap" class="w-full h-64 rounded-xl bg-gray-100 overflow-hidden relative">
                                <div class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                    <span class="animate-pulse">Loading Map...</span>
                                </div>
                            </div>
                        </div>

                        <!-- Footer Meta -->
                        <div class="flex flex-wrap gap-4 text-xs text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-200 justify-center">
                            <span class="flex items-center gap-1">👨‍💻 Created: <strong class="text-emerald-700">${order.employee}</strong> (${order.employeeId})</span>
                            ${order.verifiedBy ? `<span class="hidden md:inline">|</span> <span class="flex items-center gap-1">✅ Verified: <strong>${order.verifiedBy}</strong></span>` : ''}
                            ${order.dispatchedBy ? `<span class="hidden md:inline">|</span> <span class="flex items-center gap-1">📦 Dispatched: <strong>${order.dispatchedBy}</strong></span>` : ''}
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


// ==================== RECREATED loadDeptOrders with Date Filters ====================
async function loadDeptOrders() {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        let orders = data.orders || [];

        // 1. Filter Pending
        orders = orders.filter(o => o.status === 'Pending');

        // 2. Date Filter
        const startDate = document.getElementById('verifyPendingStartDate')?.value;
        const endDate = document.getElementById('verifyPendingEndDate')?.value;

        if (startDate) {
            orders = orders.filter(o => {
                const d = new Date(o.timestamp);
                const s = new Date(startDate);
                return d >= s;
            });
        }
        if (endDate) {
            orders = orders.filter(o => {
                const d = new Date(o.timestamp);
                const e = new Date(endDate);
                e.setHours(23, 59, 59, 999);
                return d <= e;
            });
        }

        // Sort Oldest First for processing
        orders.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const list = document.getElementById('pendingVerificationList');
        if (!list) return;

        if (orders.length === 0) {
            list.innerHTML = `
                <div class="col-span-full text-center py-12 bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-100">
                    <p class="text-4xl mb-3">✅</p>
                    <p class="text-gray-500 font-medium">No pending orders found</p>
                    <p class="text-xs text-gray-400 mt-1">Great job clearing the queue!</p>
                </div>`;
            return;
        }

        let html = '';
        orders.forEach(order => {
            html += `
             <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-blue-100 flex flex-col h-full bg-white">
                <div class="p-5 border-b border-blue-50 bg-gradient-to-r from-blue-50/50 to-white relative">
                     <div class="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                        <span class="text-6xl text-blue-500">📄</span>
                     </div>
                     <div class="flex justify-between items-start relative z-10">
                        <div>
                             <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md border border-blue-200 uppercase tracking-wide">
                                ${order.orderId}
                             </span>
                            <h3 class="font-bold text-gray-800 text-lg mt-2 leading-tight">${order.customerName}</h3>
                        </div>
                        <div class="text-right">
                             <p class="text-xl font-black text-gray-800">₹${order.total}</p>
                             <p class="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                ${new Date(order.timestamp).toLocaleDateString()}
                             </p>
                        </div>
                    </div>
                </div>
                <div class="p-5 bg-white/60 flex-grow">
                     <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                            📞
                        </div>
                        <div>
                             <p class="text-xs text-gray-400 font-bold uppercase">Contact</p>
                             <p class="font-mono font-bold text-gray-700 text-lg">${order.telNo}</p>
                        </div>
                     </div>
                     
                     <div class="flex gap-2 mt-auto pt-2">
                        <button onclick="viewOrder('${order.orderId}')" class="flex-1 bg-white border-2 border-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm hover:border-gray-200 hover:bg-gray-50 transition-all">View Details</button>
                        <button onclick="openVerificationModal('${order.orderId}')" class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-200 transition-all transform active:scale-95">
                            Verify Now ➝
                        </button>
                     </div>
                </div>
             </div>`;
        });
        list.innerHTML = html;

    } catch (e) { console.error('Error loading dept orders', e); }
}

// ==================== VERIFICATION DEPARTMENT TABS ====================
function switchVerificationTab(tab) {
    document.getElementById('verificationPendingTab').classList.add('hidden');
    document.getElementById('verificationUnverifiedTab').classList.add('hidden');
    document.getElementById('verificationHistoryTab').classList.add('hidden');

    document.getElementById('verificationTabPending').classList.remove('tab-active');
    document.getElementById('verificationTabPending').classList.add('bg-white', 'text-gray-600');
    document.getElementById('verificationTabUnverified').classList.remove('tab-active');
    document.getElementById('verificationTabUnverified').classList.add('bg-white', 'text-gray-600');
    document.getElementById('verificationTabHistory').classList.remove('tab-active');
    document.getElementById('verificationTabHistory').classList.add('bg-white', 'text-gray-600');
    if (document.getElementById('verificationTabCancelled')) {
        document.getElementById('verificationTabCancelled').classList.remove('tab-active');
        document.getElementById('verificationTabCancelled').classList.add('bg-white', 'text-gray-600');
    }

    if (tab === 'pending') {
        document.getElementById('verificationPendingTab').classList.remove('hidden');
        document.getElementById('verificationTabPending').classList.add('tab-active');
        document.getElementById('verificationTabPending').classList.remove('bg-white', 'text-gray-600');
        loadDeptOrders();
    } else if (tab === 'unverified') {
        document.getElementById('verificationUnverifiedTab').classList.remove('hidden');
        document.getElementById('verificationTabUnverified').classList.add('tab-active');
        document.getElementById('verificationTabUnverified').classList.remove('bg-white', 'text-gray-600');
        loadVerificationUnverified();
    } else if (tab === 'history') {
        document.getElementById('verificationHistoryTab').classList.remove('hidden');
        document.getElementById('verificationTabHistory').classList.add('tab-active');
        document.getElementById('verificationTabHistory').classList.remove('bg-white', 'text-gray-600');
        loadVerificationHistory();
    } else if (tab === 'cancelled') {
        // Cancelled tab doesn't have its own tab div, it's a section in verification history
        document.getElementById('verificationHistoryTab').classList.remove('hidden');
        if (document.getElementById('verificationTabCancelled')) {
            document.getElementById('verificationTabCancelled').classList.add('tab-active');
            document.getElementById('verificationTabCancelled').classList.remove('bg-white', 'text-gray-600');
        }
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

        // Filter for Verified only for this view
        orders = orders.filter(o => o.status === 'Address Verified');

        // CALCULATE STATS
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        // Note: using verifiedAt if available, otherwise fallback to timestamp
        const countToday = orders.filter(o => {
            const date = o.verifiedAt ? new Date(o.verifiedAt) : new Date(o.timestamp);
            return date.toDateString() === today.toDateString();
        }).length;

        const countYesterday = orders.filter(o => {
            const date = o.verifiedAt ? new Date(o.verifiedAt) : new Date(o.timestamp);
            return date.toDateString() === yesterday.toDateString();
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

        orders.sort((a, b) => new Date(b.verifiedAt || b.timestamp) - new Date(a.verifiedAt || a.timestamp));

        if (orders.length === 0) {
            document.getElementById('verificationHistoryList').innerHTML = `
                <div class="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p class="text-4xl mb-3">📂</p>
                    <p class="text-gray-500 font-medium">No history found matching filters</p>
                </div>`;
            return;
        }

        let html = '';

        orders.forEach(order => {
            html += `
            <div class="glass-card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group border border-purple-100 flex flex-col h-full bg-slate-50">
                <!-- Card Header -->
                <div class="p-4 border-b border-purple-50 bg-gradient-to-r from-purple-50/50 to-white relative">
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                             <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Order #${order.orderId}
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

                <!-- Footer Actions -->
                <div class="p-4 flex gap-2 items-center justify-between border-t border-purple-100">
                    <div class="text-xs text-gray-500">
                        <span class="block text-gray-400 text-[10px] uppercase font-bold">Verified On</span>
                        ${order.verifiedAt ? new Date(order.verifiedAt).toLocaleDateString() : 'N/A'}
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
                                         <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Order #${order.orderId}</p>
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
// Restored switchEmpTab and Added Cancelled Tab Logic
window.switchEmpTab = function (tab) {
    // Hide all contents
    ['empOrderTab', 'empTrackingTab', 'empHistoryTab', 'empProgressTab', 'empCancelledTab'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Reset buttons
    const btns = ['empTabOrder', 'empTabTracking', 'empTabHistory', 'empTabProgress', 'empTabCancelled'];
    btns.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('tab-active');
            el.querySelector('span')?.classList.remove('scale-110');
            el.classList.add('text-gray-500');
            el.classList.remove('bg-white', 'text-gray-800'); // Ensure active styles removed
        }
    });

    let contentId = 'empOrderTab';
    let btnId = 'empTabOrder';

    if (tab === 'tracking') { contentId = 'empTrackingTab'; btnId = 'empTabTracking'; if (typeof loadMyOrders === 'function') loadMyOrders(); }
    else if (tab === 'history') { contentId = 'empHistoryTab'; btnId = 'empTabHistory'; if (typeof loadMyHistory === 'function') loadMyHistory(); }
    else if (tab === 'progress') { contentId = 'empProgressTab'; btnId = 'empTabProgress'; if (typeof loadEmpProgress === 'function') loadEmpProgress(); }
    else if (tab === 'cancelled') { contentId = 'empCancelledTab'; btnId = 'empTabCancelled'; loadCancelledOrders(); }

    const content = document.getElementById(contentId);
    const btn = document.getElementById(btnId);

    if (content) content.classList.remove('hidden');
    if (btn) {
        btn.classList.add('tab-active');
        btn.classList.remove('text-gray-500');
        btn.querySelector('span')?.classList.add('scale-110');
    }
};

async function loadCancelledOrders() {
    if (!currentUser || !currentUser.id) return;

    try {
        const res = await fetch(`${API_URL}/employees/${currentUser.id}`);
        const data = await res.json();

        // Filter for cancelled orders - Assuming status is 'Cancelled'
        const orders = (data.orders || []).filter(o => o.status === 'Cancelled');

        const list = document.getElementById('cancelledOrdersList');
        if (!list) return;

        if (orders.length === 0) {
            list.innerHTML = `
                <div class="col-span-full text-center py-12 bg-red-50/50 rounded-2xl border-2 border-dashed border-red-100">
                    <p class="text-4xl mb-3">✅</p>
                    <p class="text-gray-500 font-medium">No cancelled orders found</p>
                    <p class="text-xs text-gray-400">Good job keeping cancellations low!</p>
                </div>`;
            return;
        }

        let html = '';
        orders.forEach(order => {
            html += `
            <div class="bg-white border border-red-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div class="h-1 bg-red-500 w-full"></div>
                <div class="p-5">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md mb-2 inline-block">Order #${order.orderId}</span>
                            <h3 class="font-bold text-gray-800 text-lg">${order.customerName}</h3>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-gray-900">₹${order.total}</p>
                            <p class="text-xs text-gray-400">${new Date(order.timestamp).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <div class="bg-red-50 p-4 rounded-xl border border-red-100">
                        <div class="flex items-start gap-3">
                            <span class="text-xl">⚠️</span>
                            <div>
                                <p class="text-xs font-bold text-red-800 uppercase tracking-wide mb-1">Cancellation Reason</p>
                                <p class="text-sm text-red-700 italic">"${order.cancellationReason || 'Reason not specified'}"</p>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                        <button onclick="viewOrder('${order.orderId}')" class="text-red-500 text-xs font-bold hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                            View Details
                        </button>
                    </div>
                </div>
            </div>`;
        });
        list.innerHTML = html;

    } catch (e) {
        console.error('Error loading cancelled orders', e);
        const list = document.getElementById('cancelledOrdersList');
        if (list) list.innerHTML = '<div class="text-red-500 text-center">Failed to load cancelled orders</div>';
    }
}
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
function showSuccessPopup(title, message, icon = '✅', color = '#10b981') {
    const popup = document.createElement('div');
    popup.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s;">
            <div style="background: white; border-radius: 24px; padding: 40px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.4s;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${color}, ${color}dd); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; animation: scaleIn 0.5s;">
                    <span style="font-size: 48px;">${icon}</span>
                </div>
                <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">${title}</h2>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px; line-height: 1.5;">${message}</p>
                <button onclick="this.closest('div[style*=fixed]').remove()" style="background: linear-gradient(135deg, ${color}, ${color}dd); color: white; border: none; padding: 12px 32px; border-radius: 12px; font-weight: bold; font-size: 16px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    Got It! 👍
                </button>
            </div>
        </div>
        <style>
            @keyframes fadeIn {from {opacity: 0; } to {opacity: 1; } }
            @keyframes slideUp {from {transform: translateY(30px); opacity: 0; } to {transform: translateY(0); opacity: 1; } }
            @keyframes scaleIn {from {transform: scale(0); } to {transform: scale(1); } }
        </style>
        `;
    document.body.appendChild(popup);

    // Auto close after 4 seconds
    setTimeout(() => {
        if (popup.parentNode) popup.remove();
    }, 4000);
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
async function dispatchWithShiprocket(orderId) {
    if (!orderId) return alert('Order ID missing!');

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

// STEP 2: Fetch Couriers after box selection
window.selectBoxSizeAndFetchCouriers = async function (orderId, boxSize) {
    document.getElementById('boxSizePopup').remove();

    const boxSizes = {
        small: { length: 16, breadth: 16, height: 5, weight: 0.5 },
        medium: { length: 20, breadth: 16, height: 8, weight: 1.0 },
        large: { length: 24, breadth: 18, height: 10, weight: 1.5 }
    };
    const selectedDimensions = boxSizes[boxSize];

    // Show loading
    const loadingPopup = document.createElement('div');
    loadingPopup.id = 'courierLoadingPopup';
    loadingPopup.innerHTML = `
        <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-center;">
            <div style="background: white; padding: 30px; border-radius: 20px; text-align: center;">
                <p style="font-size: 24px; margin-bottom: 10px;">⏳</p>
                <p style="font-weight: bold; color: #f97316;">Checking available couriers...</p>
            </div>
        </div>
        `;
    document.body.appendChild(loadingPopup);

    try {
        // Fetch available couriers
        const res = await fetch(`${API_URL}/shiprocket/check-serviceability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, dimensions: selectedDimensions })
        });
        const data = await res.json();

        loadingPopup.remove();

        if (data.success && data.couriers && data.couriers.length > 0) {
            showCourierSelection(orderId, boxSize, selectedDimensions, data.couriers);
        } else {
            // No couriers? Try automatic dispatch anyway
            if (confirm('No courier list available. Try automatic courier selection?')) {
                selectCourierAndDispatch(orderId, boxSize, selectedDimensions, null, 'Auto');
            }
        }
    } catch (e) {
        loadingPopup.remove();
        if (confirm('Error fetching couriers. Try automatic dispatch?')) {
            selectCourierAndDispatch(orderId, boxSize, selectedDimensions, null, 'Auto');
        } else {
            alert('❌ Error: ' + e.message);
        }
    }
};

// STEP 3: Show Courier Selection
function showCourierSelection(orderId, boxSize, dimensions, couriers) {
    const courierPopup = document.createElement('div');
    courierPopup.id = 'courierPopup';

    let couriersHTML = couriers.map(courier => {
        const stars = '⭐'.repeat(Math.round(courier.rating));
        return `
        <button onclick="selectCourierAndDispatch('${orderId}', '${boxSize}', ${JSON.stringify(dimensions).replace(/" /g, '&quot;')}, ${courier.id}, '${courier.name}')"
        style="padding: 15px; border: 2px solid #ddd; border-radius: 12px; background: white; cursor: pointer; text-align: left; transition: all 0.2s; width: 100%;"
        onmouseover="this.style.borderColor='#f97316'; this.style.background='#fff7ed'; this.style.transform='translateY(-2px)'"
                        onmouseout="this.style.borderColor='#ddd'; this.style.background='white'; this.style.transform='translateY(0)'">
        <div style="display: flex; justify-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: bold; font-size: 16px; color: #1f2937;">${courier.name}</span>
            <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">₹${courier.rate}</span>
        </div>
        <div style="display: flex; gap: 15px; font-size: 13px; color: #6b7280;">
            <span>${stars} ${courier.rating.toFixed(1)}</span>
            <span>📅 ${courier.edd} days</span>
            ${courier.cod ? '<span style="color: #10b981;">✅ COD</span>' : ''}
        </div>
    </button>
`;
    }).join('');

    // Add automatic option at top
    const autoOption = `
    <button onclick="selectCourierAndDispatch('${orderId}', '${boxSize}', ${JSON.stringify(dimensions).replace(/"/g, '&quot;')}, null, 'Shiprocket Auto-Select')"
style="padding: 15px; border: 2px solid #f97316; border-radius: 12px; background: linear-gradient(to right, #f97316, #ea580c); color: white; cursor: pointer; text-align: center; transition: all 0.2s; width: 100%; font-weight: bold; margin-bottom: 15px;">
                    ⚡ Let Shiprocket Choose Best Courier(Recommended)
                </button >
    `;

    courierPopup.innerHTML = `
    < div style = "position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-center; padding: 20px;" >
        <div style="background: white; padding: 30px; border-radius: 20px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;">
            <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 8px; color: #f97316;">🚚 Select Courier Partner</h3>
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 20px;">Choose manually or let Shiprocket auto-select</p>
            ${autoOption}
            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-bottom: 15px;">
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 10px;">Manual Selection (sorted by rating):</p>
                <div style="display: grid; gap: 10px;">
                    ${couriersHTML}
                </div>
            </div>
            <button onclick="document.getElementById('courierPopup').remove()"
                style="width: 100%; padding: 12px; background: #e5e7eb; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
                Cancel
            </button>
        </div>
                </div >
    `;
    document.body.appendChild(courierPopup);
}

// STEP 4: Dispatch with selected courier (with fallback)
window.selectCourierAndDispatch = async function (orderId, boxSize, dimensions, courierId, courierName) {
    if (document.getElementById('courierPopup')) {
        document.getElementById('courierPopup').remove();
    }

    // Show final loading
    const loadingPopup = document.createElement('div');
    loadingPopup.innerHTML = `
    < div style = "position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-center;" >
        <div style="background: white; padding: 30px; border-radius: 20px; text-align: center;">
            <p style="font-size: 24px; margin-bottom: 10px;">⏳</p>
            <p style="font-weight: bold; color: #f97316;">Generating AWB via ${courierName}...</p>
            <p style="font-size: 12px; color: #999; margin-top: 5px;">Box: ${boxSize.toUpperCase()}</p>
        </div>
                </div >
    `;
    document.body.appendChild(loadingPopup);

    try {
        const payload = {
            orderId: orderId,
            dimensions: dimensions
        };

        // Add courier ID only if manually selected
        if (courierId) {
            payload.courierId = courierId;
        }

        const res = await fetch(`${API_URL} /shiprocket/create - order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        loadingPopup.remove();

        if (data.success) {
            showSuccessPopup(
                'Order Dispatched via Shiprocket! 🚀',
                `AWB: ${data.awb} \nCourier: ${data.courier} \nBox: ${boxSize.toUpperCase()} \n\nOrder dispatched successfully!`,
                '📦',
                '#f97316'
            );

            setTimeout(() => {
                if (typeof loadDeptOrders === 'function') loadDeptOrders();
                if (typeof loadDispatchedOrders === 'function') loadDispatchedOrders();
            }, 1500);
        } else {
            // If manual courier failed, offer automatic retry
            if (courierId && confirm(`${courierName} failed: ${data.message} \n\nTry with automatic courier selection ? `)) {
                selectCourierAndDispatch(orderId, boxSize, dimensions, null, 'Auto-Retry');
            } else {
                alert('❌ Shiprocket Error: ' + (data.message || 'Failed to generate AWB'));
            }
        }
    } catch (e) {
        loadingPopup.remove();
        console.error('Shiprocket dispatch error:', e);
        alert('❌ Error: ' + e.message);
    }
};

// STEP 3: Show Courier Selection
function showCourierSelection(orderId, boxSize, dimensions, couriers) {
    const courierPopup = document.createElement('div');
    courierPopup.id = 'courierPopup';

    let couriersHTML = couriers.map(courier => {
        const stars = '⭐'.repeat(Math.round(courier.rating));
        return `
    <button onclick="selectCourierAndDispatch('${orderId}', '${boxSize}', ${JSON.stringify(dimensions).replace(/"/g, '&quot;')}, ${courier.id}, '${courier.name}')"
style="padding: 15px; border: 2px solid #ddd; border-radius: 12px; background: white; cursor: pointer; text-align: left; transition: all 0.2s; width: 100%;"
onmouseover = "this.style.borderColor='#f97316'; this.style.background='#fff7ed'; this.style.transform='translateY(-2px)'"
onmouseout = "this.style.borderColor='#ddd'; this.style.background='white'; this.style.transform='translateY(0)'" >
                        <div style="display: flex; justify-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-weight: bold; font-size: 16px; color: #1f2937;">${courier.name}</span>
                            <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">₹${courier.rate}</span>
                        </div>
                        <div style="display: flex; gap: 15px; font-size: 13px; color: #6b7280;">
                            <span>${stars} ${courier.rating.toFixed(1)}</span>
                            <span>📅 ${courier.edd} days</span>
                            ${courier.cod ? '<span style="color: #10b981;">✅ COD</span>' : ''}
                        </div>
                    </button >
    `;
    }).join('');

    courierPopup.innerHTML = `
    < div style = "position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-center; padding: 20px;" >
        <div style="background: white; padding: 30px; border-radius: 20px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;">
            <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 8px; color: #f97316;">🚚 Select Courier Partner</h3>
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 20px;">Sorted by best rating</p>
            <div style="display: grid; gap: 10px; margin-bottom: 15px;">
                ${couriersHTML}
            </div>
            <button onclick="document.getElementById('courierPopup').remove()"
                style="width: 100%; padding: 12px; background: #e5e7eb; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
                Cancel
            </button>
        </div>
                </div >
    `;
    document.body.appendChild(courierPopup);
}

// STEP 4: Dispatch with selected courier
window.selectCourierAndDispatch = async function (orderId, boxSize, dimensions, courierId, courierName) {
    document.getElementById('courierPopup').remove();

    // Show final loading
    const loadingPopup = document.createElement('div');
    loadingPopup.innerHTML = `
    < div style = "position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-center;" >
        <div style="background: white; padding: 30px; border-radius: 20px; text-align: center;">
            <p style="font-size: 24px; margin-bottom: 10px;">⏳</p>
            <p style="font-weight: bold; color: #f97316;">Generating AWB via ${courierName}...</p>
            <p style="font-size: 12px; color: #999; margin-top: 5px;">Box: ${boxSize.toUpperCase()}</p>
        </div>
                </div >
    `;
    document.body.appendChild(loadingPopup);

    try {
        const res = await fetch(`${API_URL} /shiprocket/create - order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: orderId,
                dimensions: dimensions,
                courierId: courierId
            })
        });
        const data = await res.json();

        loadingPopup.remove();

        if (data.success) {
            showSuccessPopup(
                'Order Dispatched via Shiprocket! 🚀',
                `AWB: ${data.awb} \nCourier: ${data.courier} \nBox: ${boxSize.toUpperCase()} \n\nOrder dispatched successfully!`,
                '📦',
                '#f97316'
            );

            setTimeout(() => {
                if (typeof loadDeptOrders === 'function') loadDeptOrders();
                if (typeof loadDispatchedOrders === 'function') loadDispatchedOrders();
            }, 1500);
        } else {
            alert('❌ Shiprocket Error: ' + (data.message || 'Failed to generate AWB'));
        }
    } catch (e) {
        loadingPopup.remove();
        console.error('Shiprocket dispatch error:', e);
        alert('❌ Error: ' + e.message);
    }
};