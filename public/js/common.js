// ==================== COMMON UTILITIES ====================
// Shared across Admin, Employee, and Department pages

// API Configuration
// If API_URL is defined in HTML, use it, else default
if (typeof API_URL === 'undefined') {
    var API_URL = '/api';
}

// ==================== SESSION MANAGEMENT ====================
let currentUser = null;

function saveSession(user, type, deptType) {
    const session = {
        user: user,
        type: type,
        deptType: deptType || 'verification'
    };
    localStorage.setItem('herb_session', JSON.stringify(session));
}

function loadSession() {
    try {
        const session = JSON.parse(localStorage.getItem('herb_session'));
        if (session && session.user) {
            currentUser = session.user;
            return session;
        }
    } catch (e) { }
    return null;
}

function clearSession() {
    localStorage.removeItem('herb_session');
    currentUser = null;
}

function logout() {
    clearSession();
    window.location.href = '/login';
}

function checkAuth(requiredRole) {
    const session = loadSession();
    if (!session) {
        // If not on login page, redirect
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
        return false;
    }

    // Role Redirects
    if (requiredRole && session.type !== requiredRole) {
        if (session.type === 'admin') window.location.href = '/admin';
        else if (session.type === 'employee') window.location.href = '/employee';
        else if (session.type === 'department') window.location.href = '/department';
        return false;
    }

    // If on login page but already logged in, redirect
    if (window.location.pathname.includes('/login')) {
        if (session.type === 'admin') window.location.href = '/admin';
        else if (session.type === 'employee') window.location.href = '/employee';
        else if (session.type === 'department') window.location.href = '/department';
    }

    return true;
}

// ==================== UI HELPERS ====================
function showMessage(msg, type, elementId) {
    const el = document.getElementById(elementId) || document.getElementById('adminMessage'); // Fallback
    if (!el) {
        alert(msg); // Ultimate fallback
        return;
    }

    el.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border animate-fadeIn ${type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
            type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                'bg-blue-50 border-blue-200 text-blue-700'
        }`;
    el.innerHTML = `<div class="flex items-center gap-3">
        <span class="text-2xl">${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
        <p class="font-bold">${msg}</p>
    </div>`;

    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function showSuccessPopup(title, msg, icon, color) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100">
            <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg" style="background:${color}20; color:${color}">
                ${icon}
            </div>
            <h3 class="text-2xl font-black text-gray-800 mb-3">${title}</h3>
            <p class="text-gray-500 font-medium mb-8 leading-relaxed">${msg.replace(/\n/g, '<br>')}</p>
            <button onclick="this.closest('.fixed').remove()" class="w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all" style="background:${color}">
                Continue
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// ==================== COPY FUNCTIONS ====================
function copyTracking(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => showMessage('Copied: ' + text, 'success'))
            .catch(err => console.error('Copy failed', err));
    } else {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showMessage('Copied: ' + text, 'success');
        } catch (err) {
            prompt("Copy manually:", text);
        }
        document.body.removeChild(textArea);
    }
}

// ==================== ORDER VIEW LOGIC (Shared) ====================
async function viewOrder(orderId) {
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await res.json();
        if (!data.success) { alert('Order not found'); return; }

        const order = data.order;
        const tracking = order.tracking || {};

        const fullAddress = `${order.address || ''}, ${order.distt || ''}, ${order.state || ''} - ${order.pin || ''}`;

        // Generate Items HTML
        let itemsHtml = (order.items || []).map(i => {
            // ... (Item generation logic similar to original app.js)
            return `<tr>
                <td class="p-2">${i.description || i.product}</td>
                <td class="p-2 text-right">₹${i.rate || i.price}</td>
                <td class="p-2 text-center">x${i.quantity || i.qty}</td>
                <td class="p-2 text-right font-bold">₹${(i.quantity || 1) * (i.rate || 0)}</td>
           </tr>`;
        }).join('');

        // Populate Modal (Assuming modals.ejs structure exists)
        const modalContent = document.getElementById('orderModalContent') || document.getElementById('orderDetailContent'); // Support both ID versions if changed
        if (modalContent) {
            modalContent.innerHTML = `
           <div class="flex flex-col h-full bg-gray-50">
                <div class="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white relative rounded-t-2xl">
                     <button onclick="closeModal('orderDetailModal')" class="absolute top-4 right-4 text-white p-2">✕</button>
                     <h4 class="text-2xl font-bold">Order #${order.orderId}</h4>
                     <p class="text-sm opacity-90">${order.status} | ₹${order.total}</p>
                </div>
                <div class="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                     <!-- Customer & Address -->
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-white p-4 rounded-xl border">
                            <h5 class="font-bold text-gray-700 mb-2">Customer</h5>
                            <p class="font-bold text-lg">${order.customerName}</p>
                            <p class="font-mono">${order.telNo}</p>
                        </div>
                        <div class="bg-white p-4 rounded-xl border">
                             <div class="flex justify-between">
                                <h5 class="font-bold text-gray-700 mb-2">Address</h5>
                                <button onclick="copyTracking('${fullAddress.replace(/'/g, "\\'")}')" class="text-blue-500 text-xs font-bold">COPY</button>
                             </div>
                             <p class="text-sm text-gray-600">${fullAddress}</p>
                        </div>
                     </div>
                     
                     <!-- Items -->
                     <div class="bg-white rounded-xl border overflow-hidden">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50"><tr><th class="p-3 text-left">Item</th><th class="p-3 text-right">Total</th></tr></thead>
                            <tbody>${itemsHtml}</tbody>
                        </table>
                     </div>

                     <!-- Footer -->
                     <div class="text-center text-xs text-gray-400">
                        Created by: ${order.employee} (${order.employeeId})
                     </div>
                </div>
           </div>`;

            document.getElementById('orderDetailModal').classList.remove('hidden');
        }
    } catch (e) { console.error(e); alert('Error loading order details'); }
}
