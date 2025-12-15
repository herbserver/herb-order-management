
// Script Block 1

        window.onerror = function (msg, url, line, col, error) {
            alert('JS Error: ' + msg + '\nLine: ' + line + '\nCol: ' + col + '\nError: ' + (error ? error.stack : 'no stack'));
            // Also try to show in the login message area if possible
            const logDiv = document.getElementById('loginMessage');
            if (logDiv) {
                logDiv.innerHTML = '❌ JS Error: ' + msg;
                logDiv.classList.remove('hidden');
            }
        };

        // Automatically detect server address
        const protocol = window.location.protocol.startsWith('http') ? window.location.protocol : 'http:';
        const hostname = window.location.hostname || 'localhost';

        const API_URL = `${protocol}//${hostname}/api`; // Clean URL: http://herbonnaturals/api

        console.log('Connecting to API at:', API_URL);
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
        }

            ;

        // ==================== SESSION MANAGEMENT ====================

        // Health Check
        async function checkServerConnection() {
            try {
                console.log('📡 Checking server connection...');
                const response = await fetch(`${API_URL}/health`);
                const data = await response.json();
                if (data.success) {
                    console.log('✅ Server Connected:', data.time);
                    const msgDiv = document.getElementById('loginMessage');
                    if (msgDiv) {
                        msgDiv.innerHTML = '✅ System Online & Connected';
                        msgDiv.className = 'mb-4 p-3 rounded-xl text-sm bg-green-100 text-green-700 text-center block';
                        msgDiv.classList.remove('hidden');
                        setTimeout(() => msgDiv.classList.add('hidden'), 3000);
                    }
                }
            } catch (error) {
                console.error('❌ Server Disconnected:', error);
                const msgDiv = document.getElementById('loginMessage');
                if (msgDiv) {
                    msgDiv.innerHTML = '⚠️ <strong>SERVER DISCONNECTED</strong><br>Calculations and Login will not work.<br>Please ensure server is running.';
                    msgDiv.className = 'mb-4 p-3 rounded-xl text-sm bg-red-100 text-red-700 text-center block';
                    msgDiv.classList.remove('hidden');
                }
            }
        }

        // Run connection check immediately
        checkServerConnection();

        function saveSession() {
            const session = {
                user: currentUser, type: currentUserType, deptType: currentDeptType
            }

                ;
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

            el.className = `mb-4 p-3 rounded-xl text-sm ${type === 'success' ? 'bg-green-100 text-green-700' : type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`;
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
            document.getElementById('loginTabEmployee').classList.add('text-gray-600');
            document.getElementById('loginTabDept').classList.add('text-gray-600');
            document.getElementById('loginTabAdmin').classList.add('text-gray-600');

            if (tab === 'employee') {
                document.getElementById('employeeLoginForm').classList.remove('hidden');
                document.getElementById('loginTabEmployee').classList.add('tab-active');
                document.getElementById('loginTabEmployee').classList.remove('text-gray-600');
            }

            else if (tab === 'department') {
                document.getElementById('departmentLoginForm').classList.remove('hidden');
                document.getElementById('loginTabDept').classList.add('tab-active');
                document.getElementById('loginTabDept').classList.remove('text-gray-600');
            }

            else {
                document.getElementById('adminLoginForm').classList.remove('hidden');
                document.getElementById('loginTabAdmin').classList.add('tab-active');
                document.getElementById('loginTabAdmin').classList.remove('text-gray-600');
            }
        }

        function setDeptType(type) {
            currentDeptType = type;

            if (type === 'verification') {
                document.getElementById('deptTypeVerify').classList.add('bg-blue-500', 'text-white');
                document.getElementById('deptTypeVerify').classList.remove('bg-gray-200', 'text-gray-700');
                document.getElementById('deptTypeDispatch').classList.remove('bg-purple-500', 'text-white');
                document.getElementById('deptTypeDispatch').classList.add('bg-gray-200', 'text-gray-700');
            }

            else {
                document.getElementById('deptTypeDispatch').classList.add('bg-purple-500', 'text-white');
                document.getElementById('deptTypeDispatch').classList.remove('bg-gray-200', 'text-gray-700');
                document.getElementById('deptTypeVerify').classList.remove('bg-blue-500', 'text-white');
                document.getElementById('deptTypeVerify').classList.add('bg-gray-200', 'text-gray-700');
            }
        }

        // ==================== SCREEN MANAGEMENT ====================
        function showLoginScreen() {
            document.querySelectorAll('#app > div').forEach(d => d.classList.add('hidden'));
            document.getElementById('loginScreen').classList.remove('hidden');
        }

        function showRegisterScreen() {
            document.querySelectorAll('#app > div').forEach(d => d.classList.add('hidden'));
            document.getElementById('registerScreen').classList.remove('hidden');
        }

        function showResetScreen() {
            document.querySelectorAll('#app > div').forEach(d => d.classList.add('hidden'));
            document.getElementById('resetScreen').classList.remove('hidden');
        }

        function showEmployeePanel() {
            document.querySelectorAll('#app > div').forEach(d => d.classList.add('hidden'));
            document.getElementById('employeePanel').classList.remove('hidden');
            document.getElementById('empNameDisplay').textContent = currentUser.name + ' (' + currentUser.id + ')';
            initOrderForm();
            loadMyOrders();
        }

        function showDepartmentPanel() {
            document.querySelectorAll('#app > div').forEach(d => d.classList.add('hidden'));
            document.getElementById('departmentPanel').classList.remove('hidden');
            document.getElementById('deptIdDisplay').textContent = currentUser.id;

            if (currentDeptType === 'verification') {
                document.getElementById('deptPanelTitle').textContent = '📍 Verification Department';
                document.getElementById('verificationDeptContent').classList.remove('hidden');
                document.getElementById('dispatchDeptContent').classList.add('hidden');
            }

            else {
                document.getElementById('deptPanelTitle').textContent = '📦 Dispatch Department';
                document.getElementById('verificationDeptContent').classList.add('hidden');
                document.getElementById('dispatchDeptContent').classList.remove('hidden');
                loadDeliveryRequests();
            }

            loadDeptOrders();
            // Load Statistics
            if (window.loadDepartmentStats) window.loadDepartmentStats();
        }

        function showAdminPanel() {
            document.querySelectorAll('#app > div').forEach(d => d.classList.add('hidden'));
            document.getElementById('adminPanel').classList.remove('hidden');
            loadAdminData();
        }

        // ==================== AUTH FUNCTIONS ====================
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
                    showEmployeePanel();
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
                    showMessage('Password reset ho gaya! Ab login karein.', 'success', 'resetMessage');
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

            // Date (YYYY-MM-DD)
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yyyy = now.getFullYear();
            document.querySelector('[name="date"]').value = `${yyyy}-${mm}-${dd}`;

            // Time (HH:MM)
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            document.querySelector('[name="time"]').value = `${hh}:${min}`;
        }

        function updateAddress() {
            const form = document.getElementById('orderForm');

            let hNo = form.hNo.value.trim();
            if (hNo && !isNaN(hNo)) hNo = 'House No ' + hNo;
            else if (hNo) hNo = hNo;

            const parts = [hNo,
                form.blockGaliNo.value.trim(),
                form.villColony.value.trim(),
                form.landMark.value.trim() ? "Landmark: " + form.landMark.value.trim() : "",
                form.po.value.trim() ? "PO: " + form.po.value.trim() : "",
                form.tahTaluka.value.trim(),
                form.distt.value.trim(),
                form.state.value.trim(),
                form.pin.value.trim() ? "PIN: " + form.pin.value.trim() : ""
            ].filter(v => v);

            form.address.value = parts.join(', ');
        }

        async function fetchPincodeDetails(pincode) {
            const form = document.getElementById('orderForm');
            const pinInput = form.pin;
            const postOfficeSelect = form.postOffice;

            // Remove previous states
            pinInput.classList.remove('pin-loading', 'field-error', 'field-success');

            if (pincode.length !== 6) {
                // Clear auto-filled fields if PIN is incomplete
                if (pincode.length === 0) {
                    form.state.value = '';
                    form.distt.value = '';
                    form.tahTaluka.value = '';
                    form.state.classList.remove('field-success');
                    form.distt.classList.remove('field-success');

                    // Clear Post Office dropdown
                    postOfficeSelect.innerHTML = '<option value="">Select Post Office</option>';
                }
                return;
            }

            // Show loading state
            pinInput.classList.add('pin-loading');

            try {
                const res = await fetch(`${API_URL}/pincode/${pincode}`);
                const data = await res.json();

                pinInput.classList.remove('pin-loading');

                if (data[0].Status === "Success") {
                    const postOffices = data[0].PostOffice;
                    const firstOffice = postOffices[0];

                    // Auto-fill fields from first post office
                    form.state.value = firstOffice.State;
                    form.distt.value = firstOffice.District;
                    form.tahTaluka.value = firstOffice.Block;

                    // Populate Post Office dropdown
                    postOfficeSelect.innerHTML = '<option value="">Select Post Office</option>';
                    postOffices.forEach(office => {
                        const option = document.createElement('option');
                        option.value = office.Name;
                        option.textContent = `${office.Name} (${office.Region})`;
                        postOfficeSelect.appendChild(option);
                    });

                    // Add change listener to Post Office dropdown
                    postOfficeSelect.onchange = function () {
                        if (this.value) {
                            form.po.value = this.value;
                            updateAddress();
                        }
                    };

                    // Highlight auto-filled fields with success state
                    pinInput.classList.add('field-success');
                    form.state.classList.add('field-success');
                    form.distt.classList.add('field-success');
                    form.tahTaluka.classList.add('field-success');
                    postOfficeSelect.classList.add('field-success');

                    // Remove success highlight after 2 seconds
                    setTimeout(() => {
                        form.state.classList.remove('field-success');
                        form.distt.classList.remove('field-success');
                        form.tahTaluka.classList.remove('field-success');
                        postOfficeSelect.classList.remove('field-success');
                    }, 2000);

                    updateAddress();
                    showMessage(`✅ PIN verified! ${postOffices.length} Post Offices found`, 'success', 'empMessage');
                } else {
                    pinInput.classList.add('field-error');
                    postOfficeSelect.innerHTML = '<option value="">No Post Offices found</option>';
                    showMessage('❌ Invalid PIN code! Please check.', 'error', 'empMessage');
                }
            }

            catch (e) {
                console.error("Pincode fetch error", e);
                pinInput.classList.remove('pin-loading');
                pinInput.classList.add('field-error');
                postOfficeSelect.innerHTML = '<option value="">Error loading</option>';
                showMessage('⚠️ PIN code verification failed. Please enter manually.', 'error', 'empMessage');
            }
        }

        // Reverse PIN Code Lookup - Find PIN by State/District
        async function findPinCode() {
            const form = document.getElementById('orderForm');
            const state = form.state.value.trim();
            const district = form.distt.value.trim();

            if (!state || !district) {
                return showMessage('⚠️ Pehle State aur District select karein!', 'error', 'empMessage');
            }

            // Show loading
            document.getElementById('pinList').innerHTML = '<p class="text-center text-gray-500 py-4">🔍 Searching PIN codes...</p>';
            document.getElementById('pinFinderModal').classList.remove('hidden');

            try {
                // Use local postoffice search API (searching by district)
                const res = await fetch(`${API_URL}/postoffice/${district}`);
                const data = await res.json();

                if (data[0].Status === "Success") {
                    const postOffices = data[0].PostOffice;

                    // Filter by state (case insensitive)
                    const filtered = postOffices.filter(po =>
                        po.State.toLowerCase() === state.toLowerCase()
                    );

                    if (filtered.length === 0) {
                        document.getElementById('pinList').innerHTML =
                            '<p class="text-center text-red-500 py-4">❌ Koi PIN code nahi mila is State/District ke liye</p>';
                        return;
                    }

                    // Group by PIN code
                    const pinGroups = {};
                    filtered.forEach(po => {
                        if (!pinGroups[po.Pincode]) {
                            pinGroups[po.Pincode] = [];
                        }
                        pinGroups[po.Pincode].push(po);
                    });

                    // Display PIN codes
                    let html = '<div class="space-y-2">';
                    Object.keys(pinGroups).sort().forEach(pin => {
                        const offices = pinGroups[pin];
                        const officeNames = offices.map(o => o.Name).join(', ');

                        html += `
                            <div class="border-2 rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition"
                                onclick="selectPinCode('${pin}')">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <p class="font-bold text-blue-600 text-lg">${pin}</p>
                                        <p class="text-sm text-gray-600">${officeNames}</p>
                                        <p class="text-xs text-gray-400">${offices[0].District}, ${offices[0].State}</p>
                                    </div>
                                    <button type="button" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">
                                        Select
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                    html += `<p class="text-center text-gray-500 text-sm mt-4">✅ ${Object.keys(pinGroups).length} PIN codes found</p>`;

                    document.getElementById('pinList').innerHTML = html;
                } else {
                    document.getElementById('pinList').innerHTML =
                        '<p class="text-center text-red-500 py-4">❌ Koi data nahi mila. District name check karein.</p>';
                }
            } catch (e) {
                console.error('PIN search error:', e);
                document.getElementById('pinList').innerHTML =
                    '<p class="text-center text-red-500 py-4">⚠️ Error occurred. Please try again.</p>';
            }
        }

        // Select PIN code from finder
        function selectPinCode(pin) {
            const form = document.getElementById('orderForm');
            form.pin.value = pin;
            closeModal('pinFinderModal');
            // Trigger fetch to populate PO list
            fetchPincodeDetails(pin);
        }

        // Find PIN by Village + District (Local API)
        async function findPinByVillage() {
            const form = document.getElementById('orderForm');
            const village = form.villColony.value.trim();
            const district = form.distt.value.trim();

            if (!village) {
                return showMessage('⚠️ Pehle Village/Colony enter karein!', 'error', 'empMessage');
            }

            // Show loading
            document.getElementById('pinList').innerHTML = '<p class="text-center text-gray-500 py-4">🔍 Searching in Local Database...</p>';
            document.getElementById('pinFinderModal').classList.remove('hidden');

            try {
                // Construct URL
                let url = `${API_URL}/search-pincode?q=${encodeURIComponent(village)}`;
                if (district) {
                    url += `&district=${encodeURIComponent(district)}`;
                }

                const res = await fetch(url);
                const data = await res.json();

                if (data.success && data.results.length > 0) {
                    const results = data.results;

                    // Group by PIN code (Local API returns structured data)
                    let html = '<div class="space-y-2">';
                    results.forEach(group => {
                        const officeNames = group.offices.join(', ');

                        html += `
                            <div class="border-2 rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition"
                                onclick="selectLocalPinCode('${group.pincode}', '${group.state}', '${group.district}', '${group.taluk}')">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <p class="font-bold text-blue-600 text-lg">${group.pincode}</p>
                                        <p class="text-sm text-gray-600">${officeNames}</p>
                                        <p class="text-xs text-gray-400">${group.district}, ${group.state}</p>
                                    </div>
                                    <button type="button" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">
                                        Select
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                    html += `<p class="text-center text-gray-500 text-sm mt-4">✅ ${results.length} PIN codes found</p>`;

                    document.getElementById('pinList').innerHTML = html;
                } else {
                    document.getElementById('pinList').innerHTML =
                        '<p class="text-center text-red-500 py-4">❌ Koi match nahi mila. Village spelling check karein.</p>';
                }
            } catch (e) {
                console.error('Village search error:', e);
                document.getElementById('pinList').innerHTML =
                    '<p class="text-center text-red-500 py-4">⚠️ Error occurred. Please try again.</p>';
            }
        }

        function selectLocalPinCode(pin, state, district, taluk) {
            const form = document.getElementById('orderForm');
            form.pin.value = pin;
            form.state.value = state;
            form.distt.value = district;
            form.tahTaluka.value = taluk;

            closeModal('pinFinderModal');
            // Trigger fetch to populate PO list
            fetchPincodeDetails(pin);
        }

        // ==================== POST OFFICE AUTOCOMPLETE ====================
        let postOfficeTimeout;

        async function handlePostOfficeInput(postOffice) {
            const suggestionsBox = document.getElementById('postOfficeSuggestions');

            clearTimeout(postOfficeTimeout);

            // Hide suggestions if input is too short
            if (postOffice.length < 2) {
                suggestionsBox.classList.add('hidden');
                return;
            }

            postOfficeTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`${API_URL}/autocomplete/village?q=${encodeURIComponent(postOffice)}`);
                    const data = await res.json();

                    if (data.success && data.suggestions.length > 0) {
                        // Display suggestions
                        let html = '';
                        data.suggestions.forEach(suggestion => {
                            // Highlight matching part
                            const index = suggestion.toLowerCase().indexOf(postOffice.toLowerCase());
                            const before = suggestion.substring(0, index);
                            const matched = suggestion.substring(index, index + postOffice.length);
                            const after = suggestion.substring(index + postOffice.length);

                            html += `
                                <div class="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition"
                                    onclick="selectPostOffice('${suggestion.replace(/'/g, "\\'")}')">
                                    <span class="text-gray-700">${before}</span><span class="font-bold text-blue-600">${matched}</span><span class="text-gray-700">${after}</span>
                                </div>
                            `;
                        });

                        suggestionsBox.innerHTML = html;
                        suggestionsBox.classList.remove('hidden');
                    } else {
                        suggestionsBox.classList.add('hidden');
                    }
                } catch (e) {
                    console.error('Post Office autocomplete error:', e);
                    suggestionsBox.classList.add('hidden');
                }
            }, 300);
        }

        // Select post office from suggestions
        async function selectPostOffice(postOffice) {
            const form = document.getElementById('orderForm');
            form.po.value = postOffice;
            document.getElementById('postOfficeSuggestions').classList.add('hidden');

            // Auto-search for PIN based on post office name
            try {
                const res = await fetch(`${API_URL}/postoffice/${encodeURIComponent(postOffice)}`);
                const data = await res.json();

                if (data[0] && data[0].Status === "Success") {
                    const postOffices = data[0].PostOffice;

                    if (postOffices.length > 0) {
                        const firstPO = postOffices[0];

                        // Auto-fill all fields including PIN
                        form.pin.value = firstPO.Pincode;
                        form.state.value = firstPO.State;
                        form.distt.value = firstPO.District;
                        form.tahTaluka.value = firstPO.Block;

                        // Populate Post Office dropdown
                        await fetchPincodeDetails(firstPO.Pincode);

                        showMessage(`✅ Post Office found! PIN: ${firstPO.Pincode}`, 'success', 'empMessage');
                    }
                }
            } catch (e) {
                console.error('Auto-search error:', e);
            }
        }

        // ==================== VILLAGE AUTOCOMPLETE (Old - Keep for 🔍 button) ====================
        let villageTimeout;

        async function handleVillageInput(village) {
            const suggestionsBox = document.getElementById('villageSuggestions');

            clearTimeout(villageTimeout);

            // Hide suggestions if input is too short
            if (village.length < 2) {
                suggestionsBox.classList.add('hidden');
                return;
            }

            villageTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`${API_URL}/autocomplete/village?q=${encodeURIComponent(village)}`);
                    const data = await res.json();

                    if (data.success && data.suggestions.length > 0) {
                        // Display suggestions
                        let html = '';
                        data.suggestions.forEach(suggestion => {
                            // Highlight matching part
                            const index = suggestion.toLowerCase().indexOf(village.toLowerCase());
                            const before = suggestion.substring(0, index);
                            const matched = suggestion.substring(index, index + village.length);
                            const after = suggestion.substring(index + village.length);

                            html += `
                                <div class="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition"
                                    onclick="selectVillage('${suggestion.replace(/'/g, "\\'")}')">
                                    <span class="text-gray-700">${before}</span><span class="font-bold text-blue-600">${matched}</span><span class="text-gray-700">${after}</span>
                                </div>
                            `;
                        });

                        suggestionsBox.innerHTML = html;
                        suggestionsBox.classList.remove('hidden');
                    } else {
                        suggestionsBox.classList.add('hidden');
                    }
                } catch (e) {
                    console.error('Village autocomplete error:', e);
                    suggestionsBox.classList.add('hidden');
                }
            }, 300);
        }

        // Select village from suggestions
        async function selectVillage(village) {
            const form = document.getElementById('orderForm');
            form.villColony.value = village;
            document.getElementById('villageSuggestions').classList.add('hidden');

            // Auto-search for PIN based on village name
            try {
                const res = await fetch(`${API_URL}/postoffice/${encodeURIComponent(village)}`);
                const data = await res.json();

                if (data[0] && data[0].Status === "Success") {
                    const postOffices = data[0].PostOffice;

                    if (postOffices.length > 0) {
                        // Group by PIN
                        const pinGroups = {};
                        postOffices.forEach(po => {
                            if (!pinGroups[po.Pincode]) {
                                pinGroups[po.Pincode] = {
                                    pincode: po.Pincode,
                                    state: po.State,
                                    district: po.District,
                                    taluk: po.Block
                                };
                            }
                        });

                        const uniquePins = Object.keys(pinGroups);

                        // If only one PIN found, auto-fill everything!
                        if (uniquePins.length === 1) {
                            const pin = uniquePins[0];
                            const details = pinGroups[pin];

                            form.pin.value = pin;
                            form.state.value = details.state;
                            form.distt.value = details.district;
                            form.tahTaluka.value = details.taluk;

                            // Populate Post Office dropdown
                            await fetchPincodeDetails(pin);

                            showMessage(`✅ Village found! PIN: ${pin}`, 'success', 'empMessage');
                        } else {
                            // Multiple PINs found, show message
                            showMessage(`⚠️ ${uniquePins.length} PINs found for this village. Click 🔍 to select.`, 'info', 'empMessage');
                        }
                    }
                }
            } catch (e) {
                console.error('Auto-search error:', e);
            }
        }

        // ==================== TALUKA AUTOCOMPLETE ====================
        let talukaTimeout;

        async function handleTalukaInput(taluka) {
            const suggestionsBox = document.getElementById('talukaSuggestions');

            clearTimeout(talukaTimeout);

            // Hide suggestions if input is too short
            if (taluka.length < 2) {
                suggestionsBox.classList.add('hidden');
                return;
            }

            talukaTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`${API_URL}/autocomplete/taluka?q=${encodeURIComponent(taluka)}`);
                    const data = await res.json();

                    if (data.success && data.suggestions.length > 0) {
                        // Display suggestions
                        let html = '';
                        data.suggestions.forEach(suggestion => {
                            // Highlight matching part
                            const index = suggestion.toLowerCase().indexOf(taluka.toLowerCase());
                            const before = suggestion.substring(0, index);
                            const matched = suggestion.substring(index, index + taluka.length);
                            const after = suggestion.substring(index + taluka.length);

                            html += `
                                <div class="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition"
                                    onclick="selectTaluka('${suggestion.replace(/'/g, "\\'")}')">
                                    <span class="text-gray-700">${before}</span><span class="font-bold text-blue-600">${matched}</span><span class="text-gray-700">${after}</span>
                                </div>
                            `;
                        });

                        suggestionsBox.innerHTML = html;
                        suggestionsBox.classList.remove('hidden');
                    } else {
                        suggestionsBox.classList.add('hidden');
                    }
                } catch (e) {
                    console.error('Taluka autocomplete error:', e);
                    suggestionsBox.classList.add('hidden');
                }
            }, 300);
        }

        // Select taluka from suggestions
        function selectTaluka(taluka) {
            const form = document.getElementById('orderForm');
            form.tahTaluka.value = taluka;
            document.getElementById('talukaSuggestions').classList.add('hidden');
        }

        // ==================== DISTRICT AUTOCOMPLETE ====================
        let districtTimeout;
        // District autocomplete - Query local database API

        async function handleDistrictInput(district) {
            const suggestionsBox = document.getElementById('districtSuggestions');
            const form = document.getElementById('orderForm');

            clearTimeout(districtTimeout);

            // Hide if too short
            if (district.length < 2) {
                suggestionsBox.classList.add('hidden');
                return;
            }

            districtTimeout = setTimeout(async () => {
                try {
                    // Query local pincode database
                    const res = await fetch(`${API_URL}/postoffice/${encodeURIComponent(district)}`);
                    const data = await res.json();

                    if (data[0] && data[0].Status === "Success" && data[0].PostOffice.length > 0) {
                        // Extract unique districts with correct state
                        const districtMap = new Map();

                        data[0].PostOffice.forEach(po => {
                            const dist = po.District;
                            const state = po.State;

                            if (dist && state && !districtMap.has(dist)) {
                                districtMap.set(dist, state);
                            }
                        });

                        if (districtMap.size > 0) {
                            let html = '';
                            let count = 0;

                            // Show matching districts
                            for (const [dist, state] of districtMap) {
                                if (count >= 10) break;

                                // Highlight match
                                const index = dist.toLowerCase().indexOf(district.toLowerCase());
                                if (index === -1) continue;

                                const before = dist.substring(0, index);
                                const matched = dist.substring(index, index + district.length);
                                const after = dist.substring(index + district.length);

                                html += `
                                    <div class="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition"
                                        onclick="selectDistrict('${dist.replace(/'/g, "\\'")}', '${state.replace(/'/g, "\\'")}')">
                                        <div>
                                            <span class="text-gray-700">${before}</span><span class="font-bold text-blue-600">${matched}</span><span class="text-gray-700">${after}</span>
                                        </div>
                                        <div class="text-xs text-gray-500">📍 ${state}</div>
                                    </div>
                                `;
                                count++;
                            }

                            if (html) {
                                suggestionsBox.innerHTML = html;
                                suggestionsBox.classList.remove('hidden');
                            } else {
                                suggestionsBox.classList.add('hidden');
                            }
                        } else {
                            suggestionsBox.classList.add('hidden');
                        }
                    } else {
                        suggestionsBox.classList.add('hidden');
                    }
                } catch (e) {
                    console.error('District autocomplete error:', e);
                    suggestionsBox.classList.add('hidden');
                }
            }, 300);
        }

        // Select district and show Explorer
        async function selectDistrict(district, state) {
            const form = document.getElementById('orderForm');
            form.distt.value = district;
            form.state.value = state;
            document.getElementById('districtSuggestions').classList.add('hidden');

            // Open Explorer Modal
            openDistrictExplorer(district, state);
        }

        async function openDistrictExplorer(district, state) {
            document.getElementById('districtExplorerTitle').textContent = `📍 ${district}, ${state}`;
            document.getElementById('districtExplorerModal').classList.remove('hidden');
            document.getElementById('talukasList').innerHTML = '<p class="text-gray-500">Loading...</p>';
            document.getElementById('postOfficesList').innerHTML = '<p class="text-gray-500 p-4">👈 Click a taluka to see post offices</p>';

            try {
                const res = await fetch(`${API_URL}/postoffice/${encodeURIComponent(district)}`);
                const data = await res.json();

                if (data[0] && data[0].Status === "Success") {
                    // Use all post offices from API response
                    const postOffices = data[0].PostOffice;

                    if (postOffices.length === 0) {
                        document.getElementById('talukasList').innerHTML = '<p class="text-red-500">No data found</p>';
                        return;
                    }

                    // Helper to normalize Taluka names
                    const normalizeName = (name) => {
                        name = name.toLowerCase().trim();
                        if (name.includes('jand') || name === 'jhanda') return 'Jhandaha';
                        if (name.includes('mahu')) return 'Mahua';
                        if (name.includes('sahdei') || name.includes('s buz') || name.includes('sahdai')) return 'Sahdei Buzurg';
                        if (name.includes('lalgan')) return 'Lalganj';
                        if (name.includes('goraul') || name.includes('goroul')) return 'Goroul';
                        if (name.includes('belsar')) return 'Paterhi Belsar';

                        // Capitalize first letter
                        return name.charAt(0).toUpperCase() + name.slice(1);
                    };

                    // Group by Taluka (using normalized names)
                    const talukaMap = new Map();
                    postOffices.forEach(po => {
                        let rawName = po.Block || 'Unknown';
                        let taluka = normalizeName(rawName);

                        if (!talukaMap.has(taluka)) {
                            talukaMap.set(taluka, []);
                        }
                        talukaMap.get(taluka).push(po);
                    });

                    // Convert to array and SORT by office count (High to Low)
                    const talukaArray = Array.from(talukaMap.entries());
                    talukaArray.sort((a, b) => b[1].length - a[1].length);

                    // Show Talukas - use index instead of name
                    let html = '';
                    talukaArray.forEach(([taluka, offices], index) => {
                        html += `
                            <div class="p-3 bg-white hover:bg-blue-100 border rounded-xl cursor-pointer" 
                                onclick="showPostOfficesByIndex(${index})">
                                <div class="font-semibold">🏛️ ${taluka}</div>
                                <div class="text-xs text-gray-500">${offices.length} Post Offices</div>
                            </div>
                        `;
                    });

                    document.getElementById('talukasList').innerHTML = html;
                    window.districtDataArray = talukaArray;
                }

            } catch (e) {
                console.error(e);
                document.getElementById('talukasList').innerHTML = '<p class="text-red-500">Error</p>';
            }
        }

        // Show Post Offices by index
        function showPostOfficesByIndex(index) {
            const dataArray = window.districtDataArray;
            if (!dataArray || !dataArray[index]) return;

            const [talukaName, offices] = dataArray[index];
            if (!offices) return;

            let html = '';
            offices.forEach(po => {
                html += `
                    <div class="p-3 bg-white hover:bg-purple-100 border rounded-xl cursor-pointer"
                        onclick="selectPO('${po.Name.replace(/'/g, "\\'")}', '${po.Pincode}', '${talukaName.replace(/'/g, "\\'")}')">
                        <div class="font-semibold">📮 ${po.Name}</div>
                        <div class="text-xs text-gray-500">PIN: ${po.Pincode}</div>
                    </div>
                `;
            });

            document.getElementById('postOfficesList').innerHTML = html;

            // Auto-scroll on mobile (if screen is small)
            if (window.innerWidth < 768) {
                // Scroll to the "Post Offices" header (parent of the list)
                const poContainer = document.getElementById('postOfficesList').parentElement;
                poContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        // Select Post Office
        function selectPO(postOffice, pin, taluka) {
            const form = document.getElementById('orderForm');
            form.po.value = postOffice;
            form.pin.value = pin;
            form.tahTaluka.value = taluka;

            closeModal('districtExplorerModal');
            fetchPincodeDetails(pin);

            showMessage(`✅ ${postOffice}, PIN: ${pin}`, 'success', 'empMessage');
        }

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            const districtSuggestionsBox = document.getElementById('districtSuggestions');
            const villageSuggestionsBox = document.getElementById('villageSuggestions');
            const talukaSuggestionsBox = document.getElementById('talukaSuggestions');
            const postOfficeSuggestionsBox = document.getElementById('postOfficeSuggestions');
            const districtInput = document.querySelector('[name="distt"]');
            const villageInput = document.querySelector('[name="villColony"]');
            const talukaInput = document.querySelector('[name="tahTaluka"]');
            const poInput = document.querySelector('[name="po"]');

            // Hide district suggestions
            if (districtSuggestionsBox && districtInput &&
                !districtSuggestionsBox.contains(e.target) &&
                e.target !== districtInput) {
                districtSuggestionsBox.classList.add('hidden');
            }

            // Hide village suggestions
            if (villageSuggestionsBox && villageInput &&
                !villageSuggestionsBox.contains(e.target) &&
                e.target !== villageInput) {
                villageSuggestionsBox.classList.add('hidden');
            }

            // Hide taluka suggestions
            if (talukaSuggestionsBox && talukaInput &&
                !talukaSuggestionsBox.contains(e.target) &&
                e.target !== talukaInput) {
                talukaSuggestionsBox.classList.add('hidden');
            }

            // Hide post office suggestions
            if (postOfficeSuggestionsBox && poInput &&
                !postOfficeSuggestionsBox.contains(e.target) &&
                e.target !== poInput) {
                postOfficeSuggestionsBox.classList.add('hidden');
            }
        });

        // Common Indian Districts for autocomplete
        const COMMON_DISTRICTS = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Amritsar", "Allahabad", "Ranchi", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Mysore", "Bareilly", "Aligarh", "Moradabad", "Jalandhar", "Bhubaneswar", "Salem", "Guntur", "Bhiwandi", "Saharanpur", "Gorakhpur", "Bikaner", "Noida", "Jamshedpur", "Kochi", "Bhavnagar", "Dehradun", "Nanded", "Kolhapur", "Ajmer", "Gulbarga", "Jamnagar", "Ujjain", "Siliguri", "Jhansi", "Jammu", "Mangalore", "Erode", "Belgaum", "Tirunelveli", "Gaya", "Udaipur", "Kozhikode", "Kurnool", "Bokaro", "Bellary", "Patiala"];

        const PRODUCT_LIST = ["Herb Mix Powder", "Natural Oil", "Immunity Booster", "Hair Care Kit", "Skin Glow Cream", "Joint Pain Oil", "Diabetes Care", "Weight Loss Powder"
        ];

        function addItem() {
            const container = document.getElementById('itemsContainer');
            const div = document.createElement('div');
            div.className = 'flex gap-2';

            let options = PRODUCT_LIST.map(p => `<option value="${p}" >${p}

                    </option>`).join('');

            div.innerHTML = ` <select class="flex-1 border rounded-lg px-3 py-2 text-sm item-desc bg-white" > <option value="" >Select Product...</option> ${options}

                <option value="Other" >Other</option> </select> <input type="number" placeholder="Rate" class="w-20 border rounded-lg px-2 py-2 text-sm item-rate" oninput="calculateTotal()" > <input type="number" placeholder="Amt" class="w-20 border rounded-lg px-2 py-2 text-sm item-amount" oninput="calculateTotal()" > <button type="button" onclick="this.parentElement.remove(); calculateTotal();" class="text-red-500 font-bold px-2" >×</button> `;
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
                    input.classList.add('field-error');
                    hasError = true;

                    // Add listener to remove error on type
                    input.addEventListener('input', () => {
                        input.classList.remove('field-error');
                    }, { once: true });
                }

                else {
                    input.classList.remove('field-error');
                }
            });

            if (hasError) {
                return showMessage('❌ Kripya sabhi laal (red) marked fields bharein!', 'error', 'empMessage');
            }


            const items = [];

            document.querySelectorAll('#itemsContainer > div').forEach(div => {
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
                    showMessage(`✅ Order saved ! ID: ${data.orderId}

                    - Ab Verification Dept mein jayega`, 'success', 'empMessage');
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
                const orders = data.orders || [];

                const stats = {
                    total: orders.length,
                    pending: orders.filter(o => o.status === 'Pending').length,
                    verified: orders.filter(o => o.status === 'Address Verified').length,
                    dispatched: orders.filter(o => o.status === 'Dispatched').length,
                    delivered: orders.filter(o => o.status === 'Delivered').length
                }

                    ;

                document.getElementById('myOrdersStats').innerHTML = ` <div class="bg-gray-100 p-3 rounded-xl text-center" ><p class="text-2xl font-bold" >${stats.total}

                </p><p class="text-xs text-gray-600" >Total</p></div> <div class="bg-yellow-100 p-3 rounded-xl text-center" ><p class="text-2xl font-bold text-yellow-600" >${stats.pending}

                </p><p class="text-xs text-gray-600" >Pending</p></div> <div class="bg-blue-100 p-3 rounded-xl text-center" ><p class="text-2xl font-bold text-blue-600" >${stats.verified}

                </p><p class="text-xs text-gray-600" >Verified</p></div> <div class="bg-purple-100 p-3 rounded-xl text-center" ><p class="text-2xl font-bold text-purple-600" >${stats.dispatched}

                </p><p class="text-xs text-gray-600" >Dispatched</p></div> <div class="bg-green-100 p-3 rounded-xl text-center" ><p class="text-2xl font-bold text-green-600" >${stats.delivered}

                </p><p class="text-xs text-gray-600" >Delivered</p></div> `;

                if (orders.length === 0) {
                    document.getElementById('myOrdersList').innerHTML = '<p class="text-center text-gray-500 py-8">Koi orders nahi hain</p>';
                    return;
                }

                let html = '';

                orders.forEach(order => {
                    const tracking = order.tracking || {}

                        ;
                    const trackUrl = COURIER_URLS[tracking.courier] || '#';
                    const hasRequestedDelivery = order.deliveryRequested;

                    html += ` <div class="order-card bg-white border rounded-xl p-4" > <div class="flex justify-between items-start" > <div> <p class="font-bold text-blue-600" >${order.orderId}

                        </p> <p class="text-gray-800" >${order.customerName}

                        </p> <p class="text-sm text-gray-500" >${order.telNo}

                        </p> </div> <div class="text-right" > <span class="px-2 py-1 rounded-full text-xs font-medium ${order.status === 'Pending' ? 'status-pending' : order.status === 'Address Verified' ? 'status-verified' : order.status === 'Dispatched' ? 'status-dispatched' : 'status-delivered'}" >${order.status}

                        </span> <p class="text-lg font-bold text-red-600 mt-1" >₹${order.total}

                        </p> </div> </div> ${tracking.courier ? ` <div class="mt-3 pt-3 border-t bg-blue-50 -mx-4 -mb-4 px-4 py-3 rounded-b-xl" > <p class="text-sm font-medium" >🚚 ${tracking.courier}

                            </p> <p class="text-lg font-bold text-blue-700" >${tracking.trackingId || 'N/A'}

                            </p> <div class="flex gap-2 mt-2 flex-wrap" > <a href="${trackUrl}" target="_blank" class="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-600" >🔍 Track Now</a> <button type="button" onclick="copyTracking('${tracking.trackingId}')" class="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-gray-600" >📋 Copy</button> ${order.status === 'Dispatched' && !hasRequestedDelivery ? ` <button type="button" onclick="requestDelivery('${order.orderId}')" class="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600" >📬 Request Delivered</button> ` : ''
                            }

                            ${hasRequestedDelivery && order.status === 'Dispatched' ? ` <span class="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-lg text-xs" >⏳ Request Pending</span> ` : ''}

                            </div> </div> ` : ''
                        }

                        </div> `;
                });
                document.getElementById('myOrdersList').innerHTML = html;
            }

            catch (e) {
                console.error(e);
                document.getElementById('myOrdersList').innerHTML = '<p class="text-center text-red-500 py-8">Server se connect nahi ho paya</p>';
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
                    showMessage('✅ Delivery request bhej di gayi! Dispatch Dept approve karega.', 'success', 'empMessage');
                    loadMyOrders();
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
                let orders = data.orders || [];

                if (date) {
                    orders = orders.filter(o => o.timestamp && o.timestamp.startsWith(date));
                }

                if (orders.length === 0) {
                    document.getElementById('myHistoryList').innerHTML = '<p class="text-center text-gray-500 py-8">Koi orders nahi mile</p>';
                    return;
                }

                let html = '<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="bg-gray-100"><th class="p-2 text-left">Order ID</th><th class="p-2 text-left">Customer</th><th class="p-2 text-left">Date</th><th class="p-2 text-right">Amount</th><th class="p-2 text-center">Status</th></tr></thead><tbody>';

                orders.forEach(order => {
                    html += ` <tr class="border-b hover:bg-gray-50 cursor-pointer" onclick="viewOrder('${order.orderId}')" > <td class="p-2 font-medium text-blue-600" >${order.orderId}

                        </td> <td class="p-2" >${order.customerName}

                        </td> <td class="p-2" >${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}

                        </td> <td class="p-2 text-right font-bold" >₹${order.total || 0}

                        </td> <td class="p-2 text-center" ><span class="px-2 py-1 rounded-full text-xs ${order.status === 'Pending' ? 'status-pending' : order.status === 'Delivered' ? 'status-delivered' : order.status === 'Dispatched' ? 'status-dispatched' : 'status-verified'}" >${order.status}

                        </span></td> </tr> `;
                });
                html += '</tbody></table></div>';
                document.getElementById('myHistoryList').innerHTML = html;
            }

            catch (e) {
                console.error(e);
            }
        }

        async function loadEmpProgress() {
            try {
                const res = await fetch(`${API_URL}/orders/employee/${currentUser.id}`);
                const data = await res.json();
                let orders = data.orders || [];

                // Filter by date if selected
                const startDate = document.getElementById('empProgressStartDate').value;
                const endDate = document.getElementById('empProgressEndDate').value;

                if (startDate) {
                    orders = orders.filter(o => o.timestamp && o.timestamp >= startDate);
                }

                if (endDate) {
                    orders = orders.filter(o => o.timestamp && o.timestamp <= endDate + 'T23:59:59');
                }

                const stats = {
                    total: orders.length,
                    pending: orders.filter(o => o.status === 'Pending').length,
                    verified: orders.filter(o => o.status === 'Address Verified').length,
                    dispatched: orders.filter(o => o.status === 'Dispatched').length,
                    delivered: orders.filter(o => o.status === 'Delivered').length
                }

                    ;

                const deliveryRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0;
                const totalAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);

                document.getElementById('empProgressStats').innerHTML = ` <div class="bg-gray-100 p-4 rounded-xl text-center" > <p class="text-3xl font-bold" >${stats.total}

                </p> <p class="text-sm text-gray-600" >Total Orders</p> </div> <div class="bg-yellow-100 p-4 rounded-xl text-center" > <p class="text-3xl font-bold text-yellow-600" >${stats.pending}

                </p> <p class="text-sm text-gray-600" >Pending</p> </div> <div class="bg-purple-100 p-4 rounded-xl text-center" > <p class="text-3xl font-bold text-purple-600" >${stats.dispatched}

                </p> <p class="text-sm text-gray-600" >Dispatched</p> </div> <div class="bg-green-100 p-4 rounded-xl text-center" > <p class="text-3xl font-bold text-green-600" >${stats.delivered}

                </p> <p class="text-sm text-gray-600" >Delivered</p> </div> `;

                document.getElementById('empProgressChart').innerHTML = ` <div class="bg-white border rounded-xl p-6" > <h3 class="font-bold mb-4" >📈 Performance Metrics</h3> <div class="grid grid-cols-1 md:grid-cols-2 gap-4" > <div> <div class="flex justify-between mb-1" > <span class="text-sm font-medium" >Delivery Rate</span> <span class="text-sm font-bold text-green-600" >${deliveryRate}

                %</span> </div> <div class="w-full bg-gray-200 rounded-full h-4" > <div class="bg-green-500 h-4 rounded-full transition-all" style="width: ${deliveryRate}%" ></div> </div> </div> <div class="bg-emerald-50 p-4 rounded-xl" > <p class="text-sm text-gray-600" >Total Order Value</p> <p class="text-2xl font-bold text-emerald-600" >₹${totalAmount.toFixed(2)}

                </p> </div> </div> </div> `;

                // Orders Table
                if (orders.length > 0) {
                    let tableHtml = '<div class="bg-white border rounded-xl overflow-hidden"><table class="w-full text-sm"><thead class="bg-gray-100"><tr><th class="p-3 text-left">Order ID</th><th class="p-3 text-left">Customer</th><th class="p-3 text-right">Amount</th><th class="p-3 text-center">Status</th><th class="p-3 text-right">Date</th></tr></thead><tbody>';

                    orders.slice(0, 50).forEach(o => {
                        tableHtml += ` <tr class="border-b hover:bg-gray-50" > <td class="p-3 font-medium text-blue-600" >${o.orderId}

                            </td> <td class="p-3" >${o.customerName}

                            </td> <td class="p-3 text-right font-bold" >₹${o.total}

                            </td> <td class="p-3 text-center" ><span class="px-2 py-1 rounded-full text-xs ${o.status === 'Delivered' ? 'status-delivered' : o.status === 'Pending' ? 'status-pending' : 'status-dispatched'}" >${o.status}

                            </span></td> <td class="p-3 text-right text-xs" >${o.timestamp ? new Date(o.timestamp).toLocaleDateString() : ''}

                            </td> </tr> `;
                    });
                    tableHtml += '</tbody></table></div>';
                    document.getElementById('empProgressTable').innerHTML = tableHtml;
                }

                else {
                    document.getElementById('empProgressTable').innerHTML = '<p class="text-center text-gray-500 py-8">Koi orders nahi mile</p>';
                }
            }

            catch (e) {
                console.error(e);
                document.getElementById('empProgressStats').innerHTML = '<p class="text-center text-red-500 py-4">Data load nahi ho paya</p>';
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
            document.getElementById('dispatchSalesFileTab').classList.add('hidden');
            document.getElementById('dispatchTabSales').classList.remove('tab-active');
            document.getElementById('dispatchTabSales').classList.add('bg-white', 'text-gray-600');

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

            else if (tab === 'sales') {
                document.getElementById('dispatchSalesFileTab').classList.remove('hidden');
                document.getElementById('dispatchTabSales').classList.add('tab-active');
                document.getElementById('dispatchTabSales').classList.remove('bg-white', 'text-gray-600');
                loadSalesFileData();
            }
        }

        async function loadDeptOrders() {
            const endpoint = currentDeptType === 'verification' ? '/orders/pending' : '/orders/verified';

            try {
                const res = await fetch(`${API_URL}${endpoint}`);
                const data = await res.json();
                const orders = data.orders || [];

                const containerId = currentDeptType === 'verification' ? 'pendingVerificationList' : 'readyDispatchList';

                if (orders.length === 0) {
                    document.getElementById(containerId).innerHTML = '<p class="text-center text-gray-500 py-8">Koi orders nahi hain</p>';
                    return;
                }

                let html = '';

                orders.forEach(order => {
                    const fullAddress = `${order.address || ''}, ${order.tahTaluka || ''}, ${order.distt || ''}, ${order.state || ''} - ${order.pin || ''}`;

                    html += ` <div class="order-card bg-white border rounded-xl p-4" > <div class="flex justify-between items-start" > <div> <p class="font-bold text-blue-600" >${order.orderId}

                        </p> <p class="text-gray-800 font-medium" >${order.customerName}

                        </p> <p class="text-sm text-gray-500" >📞 ${order.telNo}

                        ${order.altNo ? '| ' + order.altNo : ''}

                        </p> <p class="text-xs text-gray-400 mt-1" >By: ${order.employee}

                        (${order.employeeId})</p> </div> <div class="text-right" > <p class="text-lg font-bold text-red-600" >₹${order.total}

                        </p> <p class="text-sm text-green-600" >COD: ₹${order.codAmount || 0}

                        </p> <p class="text-xs text-gray-500" >${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : ''}

                        </p> </div> </div> <div class="mt-3 p-3 bg-gray-50 rounded-lg text-sm" > <div class="flex justify-between items-start"> <div> <p><strong>📍 Address:</strong> ${order.address || 'N/A'}

                        </p> <p><strong>PIN:</strong> ${order.pin || 'N/A'}

                        | <strong>State:</strong> ${order.state || 'N/A'}

                        </p> ${order.landMark ? `<p > <strong>Landmark:</strong> ${order.landMark}

                            </p> ` : ''
                        }

                         </div> <button onclick="copyAddress('${fullAddress.replace(/'/g, "\\'")}', '${order.telNo}')" class="text-blue-600 hover:text-blue-800" title="Copy Address"> 📋 </button> </div> </div> <div class="mt-3 flex gap-2 flex-wrap" > <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-600" >👁️ View</button> <button type="button" onclick="openEditOrderModal('${order.orderId}')" class="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600" >✏️ Edit</button> ${currentDeptType === 'verification' ? `<button type = "button" onclick = "verifyAddress('${order.orderId}')" class="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600" >✅ Verify & Send to Dispatch</button> ` : ` <button type = "button" onclick = "openDispatchModal('${order.orderId}')" class="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600" >📦 Dispatch with Tracking</button> `}

                        </div> </div> `;
                });
                document.getElementById(containerId).innerHTML = html;
            }

            catch (e) {
                console.error(e);
            }
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
                    html += ` <div class="order-card bg-white border rounded-xl p-4 border-l-4 border-l-pink-500" > <div class="flex justify-between items-start" > <div> <p class="font-bold text-blue-600" >${req.orderId}

                        </p> <p class="text-gray-800" >${req.customerName}

                        </p> <p class="text-sm text-gray-500" >Requested by: <strong>${req.employeeName}

                        </strong> (${req.employeeId})</p> <p class="text-xs text-gray-400" >${new Date(req.requestedAt).toLocaleString()}

                        </p> </div> <div class="flex gap-2" > <button type="button" onclick="approveDelivery('${req.orderId}')" class="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600" >✅ Approve Delivered</button> </div> </div> </div> `;
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
                    const tracking = order.tracking || {};
                    const fullAddress = `${order.address || ''}, ${order.tahTaluka || ''}, ${order.distt || ''}, ${order.state || ''} - ${order.pin || ''}`;

                    html += ` <div class="order-card bg-white border rounded-xl p-4" > <div class="flex justify-between items-start" > <div> <p class="font-bold text-blue-600" >${order.orderId}

                        </p> <p class="text-gray-800" >${order.customerName}

                        </p> <p class="text-sm text-gray-500" >📞 ${order.telNo}

                        </p> </div> <div class="text-right" > <p class="text-lg font-bold text-red-600" >₹${order.total}

                        </p> <p class="text-sm text-purple-600" >🚚 ${tracking.courier || 'N/A'}

                        </p> <p class="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1" >${tracking.trackingId || 'N/A'}

                        </p> </div> </div> 
                        
                        <div class="mt-3 p-3 bg-gray-50 rounded-lg text-sm" > <div class="flex justify-between items-start"> <div> 
                        <p><strong>📍 Address:</strong> ${order.address || 'N/A'}</p> 
                        <p><strong>PIN:</strong> ${order.pin || 'N/A'} | <strong>State:</strong> ${order.state || 'N/A'}</p> 
                        </div> <button onclick="copyAddress('${fullAddress.replace(/'/g, "\\'")}', '${order.telNo}')" class="text-blue-600 hover:text-blue-800" title="Copy Address"> 📋 </button> </div> </div>

                        <div class="mt-3 flex gap-2" > <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs" >👁️ View</button> <button type="button" onclick="approveDelivery('${order.orderId}')" class="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs" >✅ Mark Delivered</button> </div> </div> `;
                });
                document.getElementById('dispatchedOrdersList').innerHTML = html;
            }

            catch (e) {
                console.error(e);
            }
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
                    showMessage('✅ Address verified! Order Dispatch Dept ko gaya.', 'success', 'deptMessage');
                    loadDeptOrders();
                }
            }

            catch (e) {
                console.error(e);
            }
        }

        async function loadDispatchHistory() {
            try {
                const res = await fetch(`${API_URL}/orders`);
                const data = await res.json();
                let orders = data.orders || [];

                // Date Filtering
                const startDate = document.getElementById('historyStartDate') ? document.getElementById('historyStartDate').value : '';
                const endDate = document.getElementById('historyEndDate') ? document.getElementById('historyEndDate').value : '';

                if (startDate) {
                    orders = orders.filter(o => {
                        const orderDate = new Date(o.timestamp).toISOString().split('T')[0];
                        return orderDate >= startDate;
                    });
                }

                if (endDate) {
                    orders = orders.filter(o => {
                        const orderDate = new Date(o.timestamp).toISOString().split('T')[0];
                        return orderDate <= endDate;
                    });
                }

                orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                if (orders.length === 0) {
                    document.getElementById('dispatchHistoryList').innerHTML = '<p class="text-center text-gray-500 py-8">Koi orders nahi hain is date range mein</p>';
                    return;
                }

                let html = '';

                orders.forEach(order => {
                    html += ` <div class="order-card bg-white border rounded-xl p-4" > <div class="flex justify-between items-start" > <div> <p class="font-bold text-blue-600" >${order.orderId}

                        </p> <p class="text-gray-800 font-medium" >${order.customerName}

                        </p> <p class="text-sm text-gray-500" >📞 ${order.telNo}

                        </p> </div> <div class="text-right" > <p class="text-lg font-bold text-red-600" >₹${order.total}

                        </p> <p class="text-xs px-2 py-1 rounded-full inline-block ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Dispatched' ? 'bg-purple-100 text-purple-700' : order.status === 'Address Verified' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}"> ${order.status} </p>
 <p class="text-xs text-gray-500 mt-1" >${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : ''}

                    </p> </div> </div> <div class="mt-3" > <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-600" >👁️ View</button> </div> </div> `;
                });
                document.getElementById('dispatchHistoryList').innerHTML = html;
            }

            catch (e) {
                console.error(e);
            }
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
                let orders = (data.orders || []).filter(o => (o.telNo && o.telNo.includes(searchValue)) || (o.altNo && o.altNo.includes(searchValue)));

                const activeTabContent = document.querySelector('[id^="dispatch"][id$="Tab"]:not(.hidden)');
                const listId = activeTabContent.querySelector('[id$="List"]').id;

                if (orders.length === 0) {
                    document.getElementById(listId).innerHTML = '<p class="text-center text-gray-500 py-8">Koi orders nahi mile is mobile number se</p>';
                    return;
                }

                let html = '';

                orders.forEach(order => {
                    html += ` <div class="order-card bg-white border rounded-xl p-4 border-l-4 border-l-green-500" > <div class="flex justify-between items-start" > <div> <p class="font-bold text-blue-600" >${order.orderId}

                        </p> <p class="text-gray-800" >${order.customerName}

                        </p> <p class="text-sm text-gray-500 font-mono bg-green-50 inline-block px-2 py-1 rounded" >📞 ${order.telNo}

                        </p> </div> <div class="text-right" > <p class="text-lg font-bold text-red-600" >₹${order.total}

                        </p> <p class="text-xs" >${order.status}

                        </p> </div> </div> <div class="mt-3" > <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs" >👁️ View</button> </div> </div> `;
                });
                document.getElementById(listId).innerHTML = html;
            }

            catch (e) {
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
                    showMessage('✅ Order Delivered mark ho gaya!', 'success', 'deptMessage');
                    loadDeliveryRequests();
                    loadDispatchedOrders();
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
                    itemsHtml += ` <div class="flex gap-2 edit-item-row" > <input type="text" value="${item.description}" class="flex-1 border rounded-lg px-3 py-2 text-sm edit-item-desc" > <input type="number" value="${item.rate}" class="w-20 border rounded-lg px-2 py-2 text-sm edit-item-rate" > <input type="number" value="${item.amount}" class="w-20 border rounded-lg px-2 py-2 text-sm edit-item-amount" oninput="updateEditTotal()" > <button type="button" onclick="this.parentElement.remove(); updateEditTotal();" class="text-red-500 font-bold px-2" >×</button> </div> `;
                });

                document.getElementById('editOrderModalContent').innerHTML = ` <form id="editOrderForm" class="space-y-4" > <input type="hidden" id="editOrderId" value="${orderId}" > <div class="grid grid-cols-1 md:grid-cols-2 gap-4" > <div> <label class="block text-sm font-medium mb-1" >Customer Name *</label> <input type="text" id="editCustomerName" value="${order.customerName}" required class="w-full border-2 rounded-xl px-4 py-2" > </div> <div> <label class="block text-sm font-medium mb-1" >Tel No. *</label> <input type="tel" id="editTelNo" value="${order.telNo}" required class="w-full border-2 rounded-xl px-4 py-2" > </div> </div> <div class="grid grid-cols-2 md:grid-cols-4 gap-3" > <div> <label class="block text-xs font-medium mb-1" >H.NO.</label> <input type="text" id="editHNo" value="${order.hNo || ''}" class="w-full border rounded-lg px-3 py-2 text-sm" > </div> <div> <label class="block text-xs font-medium mb-1" >BLOCK/GALI</label> <input type="text" id="editBlockGaliNo" value="${order.blockGaliNo || ''}" class="w-full border rounded-lg px-3 py-2 text-sm" > </div> <div> <label class="block text-xs font-medium mb-1" >VILL/COLONY</label> <input type="text" id="editVillColony" value="${order.villColony || ''}" class="w-full border rounded-lg px-3 py-2 text-sm" > </div> <div> <label class="block text-xs font-medium mb-1" >P.O.</label> <input type="text" id="editPo" value="${order.po || ''}" class="w-full border rounded-lg px-3 py-2 text-sm" > </div> </div> <div class="grid grid-cols-2 md:grid-cols-4 gap-3" > <div> <label class="block text-xs font-medium mb-1" >TAH/TALUKA</label> <input type="text" id="editTahTaluka" value="${order.tahTaluka || ''}" class="w-full border rounded-lg px-3 py-2 text-sm" > </div> <div> <label class="block text-xs font-medium mb-1" >DISTT.</label> <input type="text" id="editDistt" value="${order.distt || ''}" class="w-full border rounded-lg px-3 py-2 text-sm" > </div> <div> <label class="block text-xs font-medium mb-1" >STATE</label> <input type="text" id="editState" value="${order.state || ''}" class="w-full border rounded-lg px-3 py-2 text-sm" > </div> <div> <label class="block text-xs font-medium mb-1" >PIN</label> <input type="text" id="editPin" value="${order.pin || ''}" class="w-full border rounded-lg px-3 py-2 text-sm" > </div> </div> <div class="grid grid-cols-2 gap-3" > <div> <label class="block text-xs font-medium mb-1" >LANDMARK</label> <input type="text" id="editLandMark" value="${order.landMark || ''}" class="w-full border rounded-lg px-3 py-2 text-sm" > </div> <div> <label class="block text-xs font-medium mb-1" >ALT NO.</label> <input type="tel" id="editAltNo" value="${order.altNo || ''}" class="w-full border rounded-lg px-3 py-2 text-sm" > </div> </div> <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-200" > <div class="flex justify-between items-center mb-3" > <label class="font-bold text-emerald-700" >🛒 ITEMS</label> <button type="button" onclick="addEditItem()" class="bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm" >+ Add Item</button> </div> <div id="editItemsContainer" class="space-y-2" > ${itemsHtml}

                </div> <div class="mt-3 pt-3 border-t border-emerald-300 flex justify-between font-bold text-lg" > <span>Total:</span> <span id="editTotalAmount" class="text-red-600" >₹${order.total || 0}

                </span> </div> </div> <div class="grid grid-cols-2 gap-3" > <div> <label class="block text-sm font-medium mb-1" >Advance</label> <input type="number" id="editAdvance" value="${order.advance || 0}" oninput="updateEditCOD()" class="w-full border-2 rounded-xl px-4 py-2" > </div> <div> <label class="block text-sm font-medium mb-1" >COD Amount</label> <input type="number" id="editCodAmount" value="${order.codAmount || 0}" readonly class="w-full border-2 rounded-xl px-4 py-2 bg-red-50 text-red-700 font-bold" > </div> </div> <div class="flex gap-3" > <button type="button" onclick="closeModal('editOrderModal')" class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium" >Cancel</button> <button type="button" onclick="saveEditOrder()" class="flex-1 bg-orange-600 text-white py-3 rounded-xl font-medium hover:bg-orange-700" >💾 Save Changes</button> </div> </form> `;

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
            div.className = 'flex gap-2 edit-item-row';
            div.innerHTML = ` <input type="text" placeholder="Product" class="flex-1 border rounded-lg px-3 py-2 text-sm edit-item-desc" > <input type="number" placeholder="Rate" class="w-20 border rounded-lg px-2 py-2 text-sm edit-item-rate" > <input type="number" placeholder="Amt" class="w-20 border rounded-lg px-2 py-2 text-sm edit-item-amount" oninput="updateEditTotal()" > <button type="button" onclick="this.parentElement.remove(); updateEditTotal();" class="text-red-500 font-bold px-2" >×</button> `;
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
                    showMessage('✅ Order updated successfully!', 'success', 'deptMessage');
                    loadDeptOrders();
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

                // Display in current active admin tab
                const activeTabContent = document.querySelector('[id^="admin"][id$="Tab"]:not(.hidden)');

                if (orders.length === 0) {
                    activeTabContent.innerHTML = '<p class="text-center text-gray-500 py-8">Koi orders nahi mile is mobile number se</p>';
                    return;
                }

                let html = '<div class="space-y-3">';

                orders.forEach(order => {
                    html += ` <div class="order-card bg-white border-2 border-green-500 rounded-xl p-4" > <div class="flex justify-between items-start" > <div> <p class="font-bold text-blue-600" >${order.orderId}

                        </p> <p class="text-gray-800" >${order.customerName}

                        </p> <p class="text-sm text-gray-500 font-mono bg-green-50 inline-block px-2 py-1 rounded mt-1" >📞 ${order.telNo}

                        </p> </div> <div class="text-right" > <p class="text-lg font-bold text-red-600" >₹${order.total}

                        </p> <p class="text-xs px-2 py-1 rounded-full inline-block ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Dispatched' ? 'bg-purple-100 text-purple-700' : order.status === 'Address Verified' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}"> ${order.status} </p>
 </div> </div> <div class="mt-3 flex gap-2" > <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs" >👁️ View</button> <button type="button" onclick="openEditOrderModal('${order.orderId}')" class="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs" >✏️ Edit</button> </div> </div> `;
                });
                html += '</div>';
                activeTabContent.innerHTML = html;
            }

            catch (e) {
                console.error(e);
            }
        }

        // ==================== ADMIN PANEL ====================
        function switchAdminTab(tab) {
            document.querySelectorAll('[id^="admin"][id$="Tab"]').forEach(t => t.classList.add('hidden'));

            document.querySelectorAll('[id^="adminTab"]').forEach(b => {
                b.classList.remove('tab-active');
                b.classList.add('bg-white');
            });

            document.getElementById(`admin${tab.charAt(0).toUpperCase() + tab.slice(1)}Tab`).classList.remove('hidden');

            document.getElementById(`adminTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('tab-active');

            document.getElementById(`adminTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.remove('bg-white');

            if (tab === 'employees') loadEmployees();
            if (tab === 'departments') loadDepartments();
            if (tab === 'history') loadAdminHistory();
            if (tab === 'progress') loadAdminProgress();
            if (tab === 'sales') loadSalesFileData('admin');
        }

        async function loadAdminData() {
            try {
                const pending = await (await fetch(`${API_URL}/orders/pending`)).json();
                const verified = await (await fetch(`${API_URL}/orders/verified`)).json();
                const dispatched = await (await fetch(`${API_URL}/orders/dispatched`)).json();
                const delivered = await (await fetch(`${API_URL}/orders/delivered`)).json();

                document.getElementById('pendingCount').textContent = pending.orders.length;
                document.getElementById('verifiedCount').textContent = verified.orders.length;
                document.getElementById('dispatchedCount').textContent = dispatched.orders.length;
                document.getElementById('deliveredCount').textContent = delivered.orders.length;

                renderAdminOrders('Pending', pending.orders, 'adminPendingTab');
                renderAdminOrders('Verified', verified.orders, 'adminVerifiedTab');
                renderAdminOrders('Dispatched', dispatched.orders, 'adminDispatchedTab');
                renderAdminOrders('Delivered', delivered.orders, 'adminDeliveredTab');
            }

            catch (e) {
                console.error(e);
            }
        }

        function renderAdminOrders(status, orders, containerId) {
            const container = document.getElementById(containerId);

            if (orders.length === 0) {
                container.innerHTML = `<p class="text-center text-gray-500 py-8" >Koi ${status}

                orders nahi hain</p>`;
                return;
            }

            let html = '<div class="space-y-3">';

            orders.forEach(order => {
                const tracking = order.tracking || {}

                    ;

                html += ` <div class="order-card bg-white border rounded-xl p-4" > <div class="flex flex-wrap justify-between items-start gap-4" > <div class="flex-1 min-w-[200px]" > <div class="flex items-center gap-2" > <p class="font-bold text-blue-600" >${order.orderId}

                    </p> <span class="px-2 py-0.5 rounded-full text-xs font-medium ${status === 'Pending' ? 'status-pending' : status === 'Verified' ? 'status-verified' : status === 'Dispatched' ? 'status-dispatched' : 'status-delivered'}" >${order.status}

                    </span> </div> <p class="text-gray-800 font-medium" >${order.customerName}

                    </p> <p class="text-sm text-gray-500" >${order.telNo}

                    </p> <p class="text-xs text-gray-400" >By: ${order.employee}

                    (${order.employeeId})</p> </div> <div class="text-right" > <p class="text-xl font-bold text-red-600" >₹${order.total}

                    </p> <p class="text-xs text-gray-500" >${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : ''}

                    </p> ${tracking.courier ? `<p class="text-xs text-purple-600 mt-1" >🚚 ${tracking.courier}

                        : ${tracking.trackingId}

                        </p> ` : ''
                    }

                    </div> </div> <div class="mt-3 flex flex-wrap gap-2" > <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-600" >👁️ View</button> <button type="button" onclick="openEditOrderModal('${order.orderId}')" class="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-orange-600" >✏️ Edit</button> ${status === 'Pending' ? `<button type = "button" onclick = "verifyAddress('${order.orderId}')" class="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600" >✅ Verify</button> ` : ''
                    }

                    ${status === 'Verified' ? `<button type = "button" onclick = "openDispatchModal('${order.orderId}')" class="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-purple-600" >📦 Dispatch</button> ` : ''
                    }

                    <button type="button" onclick="deleteOrder('${order.orderId}')" class="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-600" >🗑️ Delete</button> </div> </div> `;
            });
            html += '</div>';
            container.innerHTML = html;
        }

        async function loadEmployees() {
            try {
                const res = await fetch(`${API_URL}/employees`);
                const data = await res.json();
                const employees = data.employees || [];

                if (employees.length === 0) {
                    document.getElementById('adminEmployeesTab').innerHTML = '<p class="text-center text-gray-500 py-8">Koi employees nahi hain</p>';
                    return;
                }

                let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';

                employees.forEach(emp => {
                    html += ` <div class="bg-white border rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer" onclick="viewEmployeeProfile('${emp.id}')" > <div class="flex items-center gap-3" > <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl font-bold text-indigo-600" > ${emp.name.charAt(0).toUpperCase()}

                        </div> <div> <p class="font-bold text-gray-800" >${emp.name}

                        </p> <p class="text-sm text-gray-500" >${emp.id}

                        </p> </div> </div> <div class="mt-4 grid grid-cols-4 gap-2 text-center" > <div class="bg-gray-100 rounded-lg p-2" > <p class="text-lg font-bold" >${emp.totalOrders}

                        </p> <p class="text-xs text-gray-500" >Total</p> </div> <div class="bg-yellow-100 rounded-lg p-2" > <p class="text-lg font-bold text-yellow-600" >${emp.pendingOrders}

                        </p> <p class="text-xs text-gray-500" >Pending</p> </div> <div class="bg-purple-100 rounded-lg p-2" > <p class="text-lg font-bold text-purple-600" >${emp.dispatchedOrders}

                        </p> <p class="text-xs text-gray-500" >Dispatched</p> </div> <div class="bg-green-100 rounded-lg p-2" > <p class="text-lg font-bold text-green-600" >${emp.deliveredOrders}

                        </p> <p class="text-xs text-gray-500" >Delivered</p> </div> </div> </div> `;
                });
                html += '</div>';
                document.getElementById('adminEmployeesTab').innerHTML = html;
            }

            catch (e) {
                console.error(e);
            }
        }

        async function viewEmployeeProfile(empId) {
            try {
                const res = await fetch(`${API_URL}/employees/${empId}`);
                const data = await res.json();
                const emp = data.employee;
                const orders = data.orders || [];
                const stats = data.stats;

                let ordersHtml = orders.slice(0, 20).map(o => ` <tr class="border-b hover:bg-gray-50" > <td class="p-2 font-medium text-blue-600" >${o.orderId}

                    </td> <td class="p-2" >${o.customerName}

                    </td> <td class="p-2 text-right" >₹${o.total}

                    </td> <td class="p-2 text-center" ><span class="px-2 py-0.5 rounded-full text-xs ${o.status === 'Delivered' ? 'status-delivered' : o.status === 'Pending' ? 'status-pending' : 'status-dispatched'}" >${o.status}

                    </span></td> <td class="p-2 text-right text-xs text-gray-500" >${o.timestamp ? new Date(o.timestamp).toLocaleDateString() : ''}

                    </td> </tr> `).join('');

                document.getElementById('employeeProfileContent').innerHTML = ` <div class="flex items-center gap-4 mb-6" > <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600" > ${emp.name.charAt(0).toUpperCase()}

                </div> <div> <h3 class="text-xl font-bold" >${emp.name}

                </h3> <p class="text-gray-500" >${emp.id}

                </p> </div> </div> <div class="grid grid-cols-5 gap-3 mb-6" > <div class="bg-gray-100 rounded-xl p-4 text-center" > <p class="text-2xl font-bold" >${stats.total}

                </p> <p class="text-xs text-gray-600" >Total</p> </div> <div class="bg-yellow-100 rounded-xl p-4 text-center" > <p class="text-2xl font-bold text-yellow-600" >${stats.pending}

                </p> <p class="text-xs text-gray-600" >Pending</p> </div> <div class="bg-blue-100 rounded-xl p-4 text-center" > <p class="text-2xl font-bold text-blue-600" >${stats.verified}

                </p> <p class="text-xs text-gray-600" >Verified</p> </div> <div class="bg-purple-100 rounded-xl p-4 text-center" > <p class="text-2xl font-bold text-purple-600" >${stats.dispatched}

                </p> <p class="text-xs text-gray-600" >Dispatched</p> </div> <div class="bg-green-100 rounded-xl p-4 text-center" > <p class="text-2xl font-bold text-green-600" >${stats.delivered}

                </p> <p class="text-xs text-gray-600" >Delivered</p> </div> </div> <div class="bg-blue-50 rounded-xl p-4 mb-6" > <p class="text-sm" ><strong>This Month Orders:</strong> ${stats.thisMonth}

                </p> </div> <h4 class="font-bold mb-3" >📋 Order History (Last 20)</h4> <div class="overflow-x-auto" > <table class="w-full text-sm" > <thead><tr class="bg-gray-100" ><th class="p-2 text-left" >Order ID</th><th class="p-2 text-left" >Customer</th><th class="p-2 text-right" >Amount</th><th class="p-2 text-center" >Status</th><th class="p-2 text-right" >Date</th></tr></thead> <tbody>${ordersHtml || '<tr><td colspan="5" class="p-4 text-center text-gray-500">Koi orders nahi</td></tr>'}

                </tbody> </table> </div> `;
                document.getElementById('employeeProfileModal').classList.remove('hidden');
            }

            catch (e) {
                console.error(e);
            }
        }

        async function loadDepartments() {
            try {
                const res = await fetch(`${API_URL}/departments`);
                const data = await res.json();
                const departments = data.departments || [];

                if (departments.length === 0) {
                    document.getElementById('adminDepartmentsTab').innerHTML = '<p class="text-center text-gray-500 py-8">Koi departments nahi hain. "Register Department" button use karein.</p>';
                    return;
                }

                let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';

                departments.forEach(dept => {
                    html += ` <div class="bg-white border rounded-xl p-4" > <div class="flex items-center gap-3 mb-3" > <div class="w-12 h-12 ${dept.type === 'verification' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'} rounded-full flex items-center justify-center text-xl" > ${dept.type === 'verification' ? '📍' : '📦'}

                        </div> <div> <p class="font-bold text-gray-800" >${dept.name}

                        </p> <p class="text-sm text-gray-500" >${dept.id}

                        </p> <p class="text-xs ${dept.type === 'verification' ? 'text-blue-600' : 'text-purple-600'}" >${dept.type === 'verification' ? 'Verification Dept' : 'Dispatch Dept'}

                        </p> </div> </div> <button type="button" onclick="openEditDeptModal('${dept.id}', '${dept.name}')" class="w-full bg-orange-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-orange-600" >✏️ Edit</button> </div> `;
                });
                html += '</div>';
                document.getElementById('adminDepartmentsTab').innerHTML = html;
            }

            catch (e) {
                console.error(e);
            }
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
            }

            catch (e) {
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
                    headers: {
                        'Content-Type': 'application/json'
                    }

                    ,
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

                    showMessage(`✅ Department fully updated ! New ID: ${newId}`, 'success', 'adminMessage');
                    loadDepartments();
                }

                else {
                    // If registration failed, try to restore old one
                    alert(data.message || 'Update failed! Try again.');
                }
            }

            catch (e) {
                console.error(e);
                alert('Server error!');
            }
        }

        async function deleteDepartment() {
            const deptId = document.getElementById('editDeptOldId').value;

            if (!confirm(`Department "${deptId}" permanently delete karna hai? Ye action undo nahi hoga !`)) {
                return;
            }

            try {
                const res = await fetch(`${API_URL}/departments/${deptId}`, {
                    method: 'DELETE'
                });
                const data = await res.json();

                if (data.success) {
                    closeModal('editDeptModal');
                    showMessage('🗑️ Department deleted!', 'success', 'adminMessage');
                    loadDepartments();
                }

                else {
                    alert(data.message || 'Delete failed!');
                }
            }

            catch (e) {
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

                let html = ` <div class="flex flex-wrap gap-3 mb-4" > <input type="date" id="adminHistoryDate" onchange="filterAdminHistory()" class="border-2 rounded-xl px-4 py-2" > <select id="adminHistoryEmployee" onchange="filterAdminHistory()" class="border-2 rounded-xl px-4 py-2" > <option value="" >All Employees</option> ${employees.map(e => `<option value = "${e}" > ${e}

                        </option> `).join('')
                    }

                </select> <select id="adminHistoryStatus" onchange="filterAdminHistory()" class="border-2 rounded-xl px-4 py-2" > <option value="" >All Status</option> <option value="Pending" >Pending</option> <option value="Address Verified" >Verified</option> <option value="Dispatched" >Dispatched</option> <option value="Delivered" >Delivered</option> </select> </div> <div id="adminHistoryList" ></div> `;
                document.getElementById('adminHistoryTab').innerHTML = html;
                renderAdminHistoryTable(orders);
            }

            catch (e) {
                console.error(e);
            }
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
            }

            catch (e) {
                console.error(e);
            }
        }

        function renderAdminHistoryTable(orders) {
            if (orders.length === 0) {
                document.getElementById('adminHistoryList').innerHTML = '<p class="text-center text-gray-500 py-8">Koi orders nahi mile</p>';
                return;
            }

            let html = '<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="bg-gray-100"><th class="p-2 text-left">Order ID</th><th class="p-2 text-left">Employee</th><th class="p-2 text-left">Customer</th><th class="p-2 text-right">Amount</th><th class="p-2 text-center">Status</th><th class="p-2 text-right">Date</th><th class="p-2 text-center">Action</th></tr></thead><tbody>';

            orders.forEach(o => {
                html += ` <tr class="border-b hover:bg-gray-50" > <td class="p-2 font-medium text-blue-600" >${o.orderId}

                    </td> <td class="p-2" >${o.employee}

                    </td> <td class="p-2" >${o.customerName}

                    </td> <td class="p-2 text-right font-bold" >₹${(o.total || 0).toFixed(2)}

                    </td> <td class="p-2 text-center" ><span class="px-2 py-0.5 rounded-full text-xs ${o.status === 'Delivered' ? 'status-delivered' : o.status === 'Pending' ? 'status-pending' : 'status-dispatched'}" >${o.status}

                    </span></td> <td class="p-2 text-right text-xs" >${o.timestamp ? new Date(o.timestamp).toLocaleDateString() : ''}

                    </td> <td class="p-2 text-center" ><button type="button" onclick="viewOrder('${o.orderId}')" class="text-indigo-600 hover:underline text-xs" >View</button></td> </tr> `;
            });
            html += '</tbody></table></div>';
            document.getElementById('adminHistoryList').innerHTML = html;
        }

        async function loadAdminProgress() {
            try {
                let url = `${API_URL}/orders`;
                const res = await fetch(url);
                const data = await res.json();
                let orders = data.orders || [];

                // Apply filters
                const startDate = document.getElementById('adminProgressStartDate').value;
                const endDate = document.getElementById('adminProgressEndDate').value;
                const employee = document.getElementById('adminProgressEmployee').value;
                const status = document.getElementById('adminProgressStatus').value;

                if (startDate) orders = orders.filter(o => o.timestamp && o.timestamp >= startDate);
                if (endDate) orders = orders.filter(o => o.timestamp && o.timestamp <= endDate + 'T23:59:59');
                if (employee) orders = orders.filter(o => o.employeeId === employee);
                if (status) orders = orders.filter(o => o.status === status);

                // Populate employee dropdown
                const employees = [...new Set(orders.map(o => o.employeeId))];
                const empSelect = document.getElementById('adminProgressEmployee');

                if (empSelect.options.length === 1) {
                    employees.forEach(e => {
                        const option = document.createElement('option');
                        option.value = e;
                        option.textContent = e;
                        empSelect.appendChild(option);
                    });
                }

                // Calculate stats
                const stats = {
                    total: orders.length,
                    pending: orders.filter(o => o.status === 'Pending').length,
                    verified: orders.filter(o => o.status === 'Address Verified').length,
                    dispatched: orders.filter(o => o.status === 'Dispatched').length,
                    delivered: orders.filter(o => o.status === 'Delivered').length
                }

                    ;

                const deliveryRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0;
                const totalAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);

                document.getElementById('adminProgressStats').innerHTML = ` <div class="bg-gray-100 p-4 rounded-xl text-center" > <p class="text-3xl font-bold" >${stats.total}

                </p> <p class="text-sm text-gray-600" >Total Orders</p> </div> <div class="bg-yellow-100 p-4 rounded-xl text-center" > <p class="text-3xl font-bold text-yellow-600" >${stats.pending}

                </p> <p class="text-sm text-gray-600" >Pending</p> </div> <div class="bg-purple-100 p-4 rounded-xl text-center" > <p class="text-3xl font-bold text-purple-600" >${stats.dispatched}

                </p> <p class="text-sm text-gray-600" >Dispatched</p> </div> <div class="bg-green-100 p-4 rounded-xl text-center" > <p class="text-3xl font-bold text-green-600" >${stats.delivered}

                </p> <p class="text-sm text-gray-600" >Delivered</p> </div> `;

                document.getElementById('adminProgressChart').innerHTML = ` <div class="bg-white border rounded-xl p-6" > <h3 class="font-bold mb-4" >📈 Overall Performance</h3> <div class="grid grid-cols-1 md:grid-cols-2 gap-4" > <div> <div class="flex justify-between mb-1" > <span class="text-sm font-medium" >Delivery Rate</span> <span class="text-sm font-bold text-green-600" >${deliveryRate}

                %</span> </div> <div class="w-full bg-gray-200 rounded-full h-4" > <div class="bg-green-500 h-4 rounded-full transition-all" style="width: ${deliveryRate}%" ></div> </div> </div> <div class="bg-emerald-50 p-4 rounded-xl" > <p class="text-sm text-gray-600" >Total Business Value</p> <p class="text-2xl font-bold text-emerald-600" >₹${totalAmount.toFixed(2)}

                </p> </div> </div> </div> `;

                // Employee-wise breakdown
                if (orders.length > 0) {
                    const empStats = {}

                        ;

                    orders.forEach(o => {
                        if (!empStats[o.employeeId]) {
                            empStats[o.employeeId] = {
                                name: o.employee, total: 0, delivered: 0
                            }

                                ;
                        }

                        empStats[o.employeeId].total++;
                        if (o.status === 'Delivered') empStats[o.employeeId].delivered++;
                    });

                    let tableHtml = '<div class="bg-white border rounded-xl overflow-hidden"><h3 class="font-bold p-4 bg-gray-50">Employee-wise Performance</h3><table class="w-full text-sm"><thead class="bg-gray-100"><tr><th class="p-3 text-left">Employee</th><th class="p-3 text-center">Total</th><th class="p-3 text-center">Delivered</th><th class="p-3 text-center">Rate</th></tr></thead><tbody>';

                    Object.entries(empStats).forEach(([id, stat]) => {
                        const rate = stat.total > 0 ? ((stat.delivered / stat.total) * 100).toFixed(1) : 0;

                        tableHtml += ` <tr class="border-b hover:bg-gray-50" > <td class="p-3 font-medium" >${stat.name}

                            (${id})</td> <td class="p-3 text-center font-bold" >${stat.total}

                            </td> <td class="p-3 text-center text-green-600 font-bold" >${stat.delivered}

                            </td> <td class="p-3 text-center" ><span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium" >${rate}

                            %</span></td> </tr> `;
                    });
                    tableHtml += '</tbody></table></div>';
                    document.getElementById('adminProgressTable').innerHTML = tableHtml;
                }

                else {
                    document.getElementById('adminProgressTable').innerHTML = '<p class="text-center text-gray-500 py-8">Koi data nahi mila</p>';
                }
            }

            catch (e) {
                console.error(e);
                document.getElementById('adminProgressStats').innerHTML = '<p class="text-center text-red-500 py-4">Data load nahi ho paya</p>';
            }
        }

        // ==================== SHARED FUNCTIONS ====================
        async function viewOrder(orderId) {
            try {
                const res = await fetch(`${API_URL}/orders/${orderId}`);
                const data = await res.json();
                const order = data.order;

                const tracking = order.tracking || {}

                    ;

                let itemsHtml = (order.items || []).map(i => `<tr><td class="p-1" >${i.description}

                    </td><td class="p-1 text-right" >₹${i.rate}

                    </td><td class="p-1 text-right font-bold" >₹${i.amount}

                    </td></tr>`).join('');

                document.getElementById('orderModalContent').innerHTML = ` <div class="grid grid-cols-1 md:grid-cols-2 gap-6" > <div> <h4 class="font-bold text-gray-700 mb-3" >👤 Customer Info</h4> <p><strong>Name:</strong> ${order.customerName}

                </p> <p><strong>Tel:</strong> ${order.telNo}

                </p> <p><strong>Alt:</strong> ${order.altNo || 'N/A'}

                </p> <p><strong>Treatment:</strong> ${order.treatment || 'N/A'}

                </p> <h4 class="font-bold text-gray-700 mt-4 mb-3" >📍 Address</h4> <p class="text-sm bg-gray-100 p-3 rounded-lg" >${order.address || 'N/A'}

                </p> <p class="text-xs text-gray-500 mt-1" >PIN: ${order.pin || 'N/A'}

                | State: ${order.state || 'N/A'}

                </p> ${order.landMark ? `<p class="text-xs text-gray-500" > Landmark: ${order.landMark}

                    </p> ` : ''
                    }

                </div> <div> <h4 class="font-bold text-gray-700 mb-3" >📦 Order Info</h4> <p><strong>Order ID:</strong> ${order.orderId}

                </p> <p><strong>Status:</strong> <span class="px-2 py-0.5 rounded-full text-xs ${order.status === 'Delivered' ? 'status-delivered' : order.status === 'Pending' ? 'status-pending' : order.status === 'Dispatched' ? 'status-dispatched' : 'status-verified'}" >${order.status}

                </span></p> <p><strong>Employee:</strong> ${order.employee}

                (${order.employeeId})</p> <p><strong>Date:</strong> ${order.date || 'N/A'}

                | <strong>Time:</strong> ${order.time || 'N/A'}

                </p> <p><strong>Type:</strong> ${order.orderType}

                </p> ${tracking.courier ? ` <div class="bg-purple-50 p-3 rounded-lg mt-3" > <p><strong>🚚 Courier:</strong> ${tracking.courier}

                    </p> <p><strong>Tracking:</strong> <span class="font-mono bg-white px-2 py-1 rounded" >${tracking.trackingId || 'N/A'}

                    </span></p> </div> ` : ''
                    }

                </div> </div> <h4 class="font-bold text-gray-700 mt-6 mb-3" >🛒 Items</h4> <table class="w-full text-sm border rounded-lg overflow-hidden" > <thead class="bg-gray-100" ><tr><th class="p-2 text-left" >Product</th><th class="p-2 text-right" >Rate</th><th class="p-2 text-right" >Amount</th></tr></thead> <tbody>${itemsHtml}

                </tbody> </table> <div class="mt-4 bg-emerald-50 p-4 rounded-lg" > <div class="flex justify-between" ><span>Total:</span><span class="font-bold" >₹${order.total}

                </span></div> <div class="flex justify-between" ><span>Advance:</span><span>₹${order.advance || 0}

                </span></div> <div class="flex justify-between text-lg font-bold text-red-600" ><span>COD:</span><span>₹${order.codAmount || 0}

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

        async function exportAllOrders() {
            try {
                const res = await fetch(`${API_URL}/orders`);
                const data = await res.json();
                const orders = data.orders || [];

                if (orders.length === 0) return alert('Koi orders nahi hain!');

                // Proper CSV Headers
                const headers = [
                    'Order ID', 'Date', 'Employee', 'Employee ID', 'Customer Name',
                    'Phone', 'Email', 'Products', 'Total (₹)', 'Advance (₹)', 'COD (₹)',
                    'H.No', 'Block/Gali', 'Village/Colony', 'Landmark', 'P.O.',
                    'Tah/Taluka', 'District', 'State', 'PIN', 'Treatment',
                    'Order Type', 'Status', 'Courier', 'Tracking ID'
                ];

                // Build CSV rows
                const csvRows = [headers.join(',')];

                orders.forEach(o => {
                    const t = o.tracking || {};

                    // Combine all products into one string
                    const items = o.items || [];
                    const productsStr = items.map(i => `${i.product} (₹${i.rate}×${i.amt})`).join('; ');

                    // Build row with proper escaping
                    const row = [
                        `"${o.orderId || ''}"`,
                        `"${o.date || (o.timestamp ? new Date(o.timestamp).toLocaleDateString('en-IN') : '')}"`,
                        `"${o.employee || ''}"`,
                        `"${o.employeeId || ''}"`,
                        `"${(o.customerName || '').replace(/"/g, '""')}"`,
                        `"${o.telNo || ''}"`,
                        `"${o.email || ''}"`,
                        `"${productsStr.replace(/"/g, '""')}"`,
                        `${o.total || 0}`,
                        `${o.advance || 0}`,
                        `${o.codAmount || 0}`,
                        `"${(o.hNo || '').replace(/"/g, '""')}"`,
                        `"${(o.blockGali || '').replace(/"/g, '""')}"`,
                        `"${(o.villColony || '').replace(/"/g, '""')}"`,
                        `"${(o.landMark || '').replace(/"/g, '""')}"`,
                        `"${(o.po || '').replace(/"/g, '""')}"`,
                        `"${(o.tahTaluka || '').replace(/"/g, '""')}"`,
                        `"${(o.distt || '').replace(/"/g, '""')}"`,
                        `"${(o.state || '').replace(/"/g, '""')}"`,
                        `"${o.pin || ''}"`,
                        `"${(o.treatment || '').replace(/"/g, '""')}"`,
                        `"${o.orderType || 'NEW'}"`,
                        `"${o.status || 'Pending'}"`,
                        `"${t.courier || ''}"`,
                        `"${t.trackingId || ''}"`
                    ];

                    csvRows.push(row.join(','));
                });

                // Add UTF-8 BOM for Excel compatibility
                const csvContent = '\uFEFF' + csvRows.join('\n');

                // Create and download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Orders_Export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                alert(`✅ ${orders.length} orders exported successfully!`);

            } catch (e) {
                console.error('Export error:', e);
                alert('❌ Export failed!');
            }
        }

        // ==================== INIT ====================
        document.addEventListener('DOMContentLoaded', () => {
            // Load session
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

                const fullAddress = `${order.address || ''}

                ,
                ${order.distt || ''}

                ,
                ${order.state || ''}

                - ${order.pin || ''}`;

                document.getElementById('orderDetailContent').innerHTML = ` <div class="space-y-5"><!-- Order Header with Gradient --><div class="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white"><div class="flex justify-between items-start"><div><h4 class="text-2xl font-bold mb-2">📦 ${order.orderId}

                </h4><div class="inline-block px-4 py-1 rounded-full text-sm font-semibold ${order.status === 'Delivered' ? 'bg-green-400 text-green-900' : order.status === 'Dispatched' ? 'bg-purple-400 text-purple-900' : order.status === 'Address Verified' ? 'bg-blue-300 text-blue-900' : 'bg-yellow-400 text-yellow-900'}">${order.status}</div>
 </div><div class="text-right"><p class="text-3xl font-bold">₹${order.total || 0}

            </p><p class="text-sm opacity-90">${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : ''}

            </p></div></div></div><!-- Customer Details with Icon --><div class="bg-white border-2 border-gray-100 p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow"><div class="flex items-center gap-3 mb-3"><div class="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl">👤 </div><h5 class="text-lg font-bold text-gray-800">Customer Details</h5></div><div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"><p class="flex items-center gap-2"><span class="font-semibold text-gray-600">Name:</span><span class="text-gray-800">${order.customerName}

            </span></p><p class="flex items-center gap-2"><span class="font-semibold text-gray-600">Tel:</span><span class="text-gray-800 font-mono">${order.telNo}

            </span></p>${order.altNo ? `<p class="flex items-center gap-2" ><span class="font-semibold text-gray-600">Alt:</span><span class="text-gray-800 font-mono">${order.altNo}</span></p> ` : ''}

            <p class="flex items-center gap-2"><span class="font-semibold text-gray-600">Type:</span><span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">${order.orderType || 'NEW'}</span></p></div></div><!-- Address with Icon --><div class="bg-white border-2 border-gray-100 p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow"><div class="flex items-center gap-3 mb-3"><div class="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-600 rounded-full flex items-center justify-center text-white text-xl">📍 </div><h5 class="text-lg font-bold text-gray-800">Delivery Address</h5></div><p class="text-gray-700 leading-relaxed">${fullAddress}

            </p>${order.landMark ? `<p class="mt-2 text-sm text-gray-600" > <strong>Landmark:</strong>${order.landMark}

                </p> ` : ''
                    }

            </div><!-- Items with Modern Table --><div class="bg-white border-2 border-gray-100 p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow"><div class="flex items-center gap-3 mb-4"><div class="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center text-white text-xl">🛒 </div><h5 class="text-lg font-bold text-gray-800">Order Items</h5></div><div class="space-y-2">${order.items && order.items.length > 0 ? order.items.map((item, idx) => ` <div class="flex justify-between items-center p-3 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} rounded-lg" > <div class="flex-1" > <p class="font-medium text-gray-800" >${item.description}

                    </p> <p class="text-xs text-gray-500" >${item.quantity}

                    × ₹${item.price}

                    </p> </div> <p class="font-bold text-gray-900" >₹${item.quantity * item.price}

                    </p> </div> `).join('') : '<p class="text-sm text-gray-500 text-center py-4">No items</p>'
                    }

            </div><div class="mt-4 pt-4 border-t-2 border-gray-200"><div class="flex justify-between items-center mb-2"><span class="text-gray-600">Subtotal:</span><span class="font-semibold">₹${order.total || 0}

            </span></div><div class="flex justify-between items-center mb-2"><span class="text-gray-600">COD Amount:</span><span class="font-semibold text-green-600">₹${order.codAmount || 0}

            </span></div><div class="flex justify-between items-center text-lg font-bold"><span>Total:</span><span class="text-red-600">₹${order.total || 0}

            </span></div><p class="text-sm text-gray-500 mt-2">Payment: <span class="font-semibold">${order.paymentMode || 'COD'}

            </span></p></div></div>${order.tracking ? ` <div class="bg-gradient-to-r from-purple-500 to-indigo-600 p-5 rounded-2xl shadow-lg text-white" ><div class="flex items-center gap-3 mb-3"><div class="text-2xl">🚚</div><h5 class="text-lg font-bold">Tracking Information</h5></div><div class="grid grid-cols-1 md:grid-cols-2 gap-3"><p><strong>Courier:</strong>${order.tracking.courier}

                </p><p><strong>Tracking ID:</strong><span class="font-mono bg-white/20 px-2 py-1 rounded">${order.tracking.trackingId}

                </span></p></div></div> ` : ''
                    }

            <!-- Map Section (Premium Style) --><div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-lg border-2 border-blue-200"><div class="flex items-center gap-3 mb-4"><div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">🗺️ </div><h5 class="text-xl font-bold text-gray-800">Location Verification</h5></div><div id="orderDetailMap" class="w-full h-96 rounded-xl border-4 border-white shadow-xl overflow-hidden bg-gray-100"><p class="text-center p-10 text-gray-500">Loading map...</p></div></div><!-- Footer Info --><div class="bg-gray-50 p-4 rounded-xl text-xs text-gray-600 border border-gray-200"><p><strong>Created by:</strong>${order.employee}

            (${order.employeeId})</p>${order.verifiedBy ? `<p > <strong>Verified by:</strong>${order.verifiedBy}

                </p> ` : ''
                    }

            ${order.dispatchedBy ? `<p > <strong>Dispatched by:</strong>${order.dispatchedBy}

                </p> ` : ''
                    }

            </div></div>`;

                // Show modal
                document.getElementById('orderDetailModal').classList.remove('hidden');

                // Initialize map after modal is visible
                setTimeout(() => {
                    initOrderMap(fullAddress);
                }

                    , 300);
            }

            catch (e) {
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
            const mapDiv = document.getElementById(`map-${orderId}`);

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


        // ==================== NEW UTILS (GLOBAL) ====================

        window.copyAddress = function (address, mobile) {
            const textToCopy = `Address: ${address}\nMobile: ${mobile}`;
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Show toast or temporary message
                alert('✅ Address Copied!');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('Copy failed');
            });
        };

        window.exportDispatchOrders = async function () {
            try {
                // Determine which orders to export based on active tab
                let endpoint = '';
                const activeTab = document.querySelector('[id^="dispatchTab"].tab-active').id;

                if (activeTab === 'dispatchTabReady') endpoint = '/orders/verified'; // Ready to dispatch
                else if (activeTab === 'dispatchTabDispatched') endpoint = '/orders/dispatched';
                else if (activeTab === 'dispatchTabRequests') endpoint = '/delivery-requests';
                else if (activeTab === 'dispatchTabHistory') endpoint = '/orders'; // Full history (might be large)
                else return alert('Please select a tab first');

                const res = await fetch(`${API_URL}${endpoint}`);
                const data = await res.json();
                let orders = data.orders || data.requests || [];

                // Apply Date Filter only for History Tab
                if (activeTab === 'dispatchTabHistory') {
                    const startDate = document.getElementById('historyStartDate') ? document.getElementById('historyStartDate').value : '';
                    const endDate = document.getElementById('historyEndDate') ? document.getElementById('historyEndDate').value : '';

                    if (startDate) {
                        orders = orders.filter(o => {
                            const orderDate = new Date(o.timestamp).toISOString().split('T')[0];
                            return orderDate >= startDate;
                        });
                    }

                    if (endDate) {
                        orders = orders.filter(o => {
                            const orderDate = new Date(o.timestamp).toISOString().split('T')[0];
                            return orderDate <= endDate;
                        });
                    }
                }

                if (orders.length === 0) return alert('No orders to export!');

                // Simplified CSV for Dispatch
                const headers = ['Order ID', 'Date', 'Customer', 'Mobile', 'Address', 'State', 'PIN', 'Amount (₹)', 'COD (₹)', 'Items', 'Status', 'Courier', 'Tracking'];
                const csvRows = [headers.join(',')];

                orders.forEach(o => {
                    const fullAddress = `${o.address || ''}, ${o.tahTaluka || ''}, ${o.distt || ''}, ${o.state || ''} - ${o.pin || ''}`;
                    const items = (o.items || []).map(i => `${i.product} x${i.quantity}`).join('; ');
                    const t = o.tracking || {};

                    const row = [
                        `"${o.orderId}"`,
                        `"${o.date || new Date(o.timestamp).toLocaleDateString()}"`,
                        `"${(o.customerName || '').replace(/"/g, '""')}"`,
                        `"${o.telNo}"`,
                        `"${fullAddress.replace(/"/g, '""')}"`,
                        `"${o.state}"`,
                        `"${o.pin}"`,
                        `${o.total}`,
                        `${o.codAmount || 0}`,
                        `"${items.replace(/"/g, '""')}"`,
                        `"${o.status}"`,
                        `"${t.courier || ''}"`,
                        `"${t.trackingId || ''}"`
                    ];
                    csvRows.push(row.join(','));
                });

                const csvContent = '\uFEFF' + csvRows.join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Dispatch_Export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                a.remove();

            } catch (e) {
                console.error(e);
                alert('Export failed!');
            }
        };

        window.loadDepartmentStats = async function () {
            try {
                // Fetch all orders to calculate stats locally
                const res = await fetch(`${API_URL}/orders`);
                const data = await res.json();
                const orders = data.orders || [];

                const now = new Date();
                const todayStr = now.toLocaleDateString();

                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toLocaleDateString();

                // Start of week (Sunday)
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);

                let todayCount = 0;
                let yesterdayCount = 0;
                let weekCount = 0;

                orders.forEach(o => {
                    let targetDate = null;
                    let isValid = false;

                    if (currentDeptType === 'verification') {
                        // Check if verified by THIS department (or any verified if generic)
                        if (o.status === 'Address Verified' || o.status === 'Dispatched' || o.status === 'Delivered') {
                            if (o.verifiedAt) {
                                targetDate = new Date(o.verifiedAt);
                                isValid = true;
                            }
                        }
                    }
                    else if (currentDeptType === 'dispatch') {
                        // Check dispatched status
                        if (o.status === 'Dispatched' || o.status === 'Delivered') {
                            const t = o.tracking || {};
                            if (t.dispatchedAt) {
                                targetDate = new Date(t.dispatchedAt);
                                isValid = true;
                            }
                        }
                    }

                    if (isValid && targetDate) {
                        // Compare dates
                        const dateStr = targetDate.toLocaleDateString();

                        if (dateStr === todayStr) todayCount++;
                        if (dateStr === yesterdayStr) yesterdayCount++;
                        if (targetDate >= startOfWeek) weekCount++;
                    }
                });

                // Update UI
                if (currentDeptType === 'verification') {
                    if (document.getElementById('statsVerifyToday')) {
                        document.getElementById('statsVerifyToday').textContent = todayCount;
                        document.getElementById('statsVerifyYesterday').textContent = yesterdayCount;
                        document.getElementById('statsVerifyWeek').textContent = weekCount;
                    }
                } else {
                    if (document.getElementById('statsDispatchToday')) {
                        document.getElementById('statsDispatchToday').textContent = todayCount;
                        document.getElementById('statsDispatchYesterday').textContent = yesterdayCount;
                        document.getElementById('statsDispatchWeek').textContent = weekCount;
                    }
                }

            } catch (e) {
                console.error("Stats Error:", e);
            }
        };

        // Global variable to store sales data
        window.salesFileData = null;

        window.loadSalesFileData = async function (mode = 'dispatch') {
            const containerId = mode === 'admin' ? 'adminSalesFileContainer' : 'salesFileContainer';
            const container = document.getElementById(containerId);
            if (!container) return;

            // If data already exists, just render
            if (window.salesFileData) {
                renderSalesTable(window.salesFileData, containerId);
                return;
            }

            try {
                container.innerHTML = '<div class="flex flex-col items-center justify-center py-10"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div><p>Loading Sales Data...</p></div>';

                const res = await fetch(`${API_URL}/sales-data`);

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Server Error ${res.status}`);
                }

                const response = await res.json();

                if (!response.success) throw new Error(response.message);

                window.salesFileData = response.data || [];

                if (window.salesFileData.length === 0) {
                    container.innerHTML = '<p class="text-center text-gray-500 p-8">Excel file khali hai.</p>';
                } else {
                    renderSalesTable(window.salesFileData, containerId);
                }

            } catch (e) {
                console.error('Sales Data Load Error:', e);
                container.innerHTML = `<div class="text-center p-8 bg-red-50 rounded-xl border border-red-100">
                    <p class="text-red-500 font-bold mb-2">Error loading data</p>
                    <p class="text-sm text-gray-600 mb-4 animate-pulse">${e.message}</p>
                    ${e.message.includes('Server Error') || e.message.includes('Unexpected') ? '<p class="text-xs bg-yellow-100 p-2 rounded text-yellow-800">💡 Please restart the server to fix this.</p>' : ''}
                </div>`;
            }
        };

        window.searchSalesData = function (query, mode) {
            const containerId = mode === 'admin' ? 'adminSalesFileContainer' : 'salesFileContainer';
            const container = document.getElementById(containerId);
            if (!window.salesFileData) return;

            const searchTerm = query.trim().toLowerCase();

            if (!searchTerm) {
                renderSalesTable(window.salesFileData, containerId);
                return;
            }

            // Search in all fields
            const filtered = window.salesFileData.filter(row => {
                return Object.values(row).some(val =>
                    String(val).toLowerCase().includes(searchTerm)
                );
            });

            if (filtered.length === 0) {
                container.innerHTML = '<div class="text-center py-10 animate-fadeIn"><p class="text-xl">🔍</p><p class="text-gray-500 mt-2">No matching record found.</p></div>';
            } else if (filtered.length === 1) {
                // Show Detailed Card for single result (System Panel Style)
                renderSalesCard(filtered[0], containerId);
            } else {
                renderSalesTable(filtered, containerId);
            }
        };

        // Column Mapping based on User's Excel Structure
        const KEY_MAPPING = {
            'HERB ON NATURALS CUSTOMER LIST FOR THE YEAR JULY 2023': 'Order ID',
            '__EMPTY': 'Customer Name',
            '__EMPTY_1': 'Mobile',
            '__EMPTY_2': 'Address',
            '__EMPTY_6': 'Dt. Of Ord.',
            '__EMPTY_7': 'Product',
            '__EMPTY_8': 'Qty',
            '__EMPTY_9': 'Amount',
            'ORDERS OF A PARTICULAR DATE & THEIR STATUS': 'Status',
            '__EMPTY_10': 'Agent Name',
            '__EMPTY_13': 'Courier Service',
            '__EMPTY_14': 'Invoice Date',
            '__EMPTY_11': 'Remark',
            'DELIVERED IN A PARICULAR DATE': 'Dt. Of Delivery' // Ensure exact match
        };

        function getLabel(key) {
            // Try exact match
            if (KEY_MAPPING[key]) return KEY_MAPPING[key];

            // Try trimmed match
            const trimmed = key.trim();
            if (KEY_MAPPING[trimmed]) return KEY_MAPPING[trimmed];

            return key;
        }

        function formatExcelDate(input) {
            // Force conversion to number
            const serial = parseFloat(input);

            // Check if it's a valid number and looks like an Excel date
            if (!serial || isNaN(serial) || serial < 40000 || serial > 60000) return input;

            try {
                // Excel base date is Dec 30, 1899
                const utc_days = Math.floor(serial - 25569);
                const utc_value = utc_days * 86400;
                const date_info = new Date(utc_value * 1000);

                const fractional_day = serial - Math.floor(serial) + 0.0000001;
                const total_seconds = Math.floor(86400 * fractional_day);
                const seconds = total_seconds % 60;
                total_seconds -= seconds;

                const hours = Math.floor(total_seconds / (60 * 60));
                const minutes = Math.floor(total_seconds / 60) % 60;

                const d = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
                return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            } catch (e) {
                return input;
            }
        }

        function renderSalesTable(data, containerId) {
            const container = document.getElementById(containerId);
            const headers = Object.keys(data[0]);

            let html = '<div class="animate-fadeIn"><table class="w-full text-sm text-left"><thead class="bg-gray-100 text-gray-700 uppercase font-medium"><tr>';
            headers.forEach(h => html += `<th class="px-6 py-3 whitespace-nowrap">${getLabel(h)}</th>`);
            html += '</tr></thead><tbody class="divide-y divide-gray-200">';

            data.slice(0, 100).forEach(row => {
                html += '<tr class="hover:bg-gray-50 bg-white transition-colors">';
                headers.forEach(h => {
                    let val = row[h] !== undefined ? row[h] : '';
                    let label = getLabel(h).toLowerCase(); // Check lowercase

                    // Apply date formatting for known date columns (Date or Dt.)
                    if (label.includes('date') || label.includes('dt.')) val = formatExcelDate(val);

                    html += `<td class="px-6 py-4 whitespace-nowrap text-gray-800">${val}</td>`;
                });
                html += '</tr>';
            });

            html += '</tbody></table>';
            if (data.length > 100) html += `<p class="text-center text-xs text-gray-500 p-2">Showing first 100 of ${data.length} records</p>`;
            html += '</div>';

            container.innerHTML = html;
        }

        function renderSalesCard(data, containerId) {
            const container = document.getElementById(containerId);
            const entries = Object.entries(data);

            // Extract core fields for Header
            const name = data['__EMPTY'] || 'Customer';
            const id = data['HERB ON NATURALS CUSTOMER LIST FOR THE YEAR JULY 2023'] || 'N/A';
            const mobile = data['__EMPTY_1'] || '';
            const address = data['__EMPTY_2'] || '';

            let html = `
                <div class="max-w-3xl mx-auto bg-white rounded-2xl border border-blue-200 shadow-xl overflow-hidden animate-scaleIn">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
                        <div>
                            <h3 class="text-xl font-bold">📂 ${name}</h3>
                            <div class="flex gap-4 mt-1 opacity-90 text-sm">
                                <span class="font-mono">ID: ${id}</span>
                                <span>📱 ${mobile}</span>
                            </div>
                        </div>
                        <div class="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                            <span class="text-3xl">👤</span>
                        </div>
                    </div>
                    
                    <!-- Body Grid -->
                    <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50">
                        ${entries.map(([key, value]) => {
                if (value === undefined || value === null || value === '') return '';
                let labelRaw = getLabel(key);
                let label = labelRaw.toLowerCase();
                let displayValue = value;

                // Format Dates (case insensitive check)
                if (label.includes('date') || label.includes('dt.')) {
                    displayValue = formatExcelDate(value);
                }
                // Highlight Status
                if (label === 'status') {
                    displayValue = `<span class="px-2 py-1 rounded bg-blue-100 text-blue-800 font-bold">${value}</span>`;
                }

                return `
                            <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">${labelRaw}</p>
                                <p class="text-gray-800 font-medium break-words">${displayValue}</p>
                            </div>
                        `}).join('')}
                    </div>

                    <!-- Footer -->
                    <div class="bg-gray-50 p-4 border-t flex justify-end gap-3">
                         <button onclick="copyAddress('${(address).replace(/'/g, "\\'")}', '${mobile}')" class="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors">
                            📋 Copy Address
                        </button>
                        <button onclick="renderSalesTable(window.salesFileData, '${containerId}')" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
                            ⬅️ Back to List
                        </button>
                    </div>
                </div>
            `;
            container.innerHTML = html;
        }

        window.copyAddress = function (address, mobile) {
            const text = `Address: ${address}\nMobile: ${mobile}`;
            navigator.clipboard.writeText(text).then(() => {
                alert('Address & Mobile copied to clipboard! 📋');
            }).catch(err => {
                console.error('Copy failed', err);
                alert('Copy failed!');
            });
        };

    
