// ==================== DEPARTMENT PANEL LOGIC ====================

document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth('department');
    if (!user) return;

    // Set Dept Title
    const type = loadSession().deptType || 'verification';
    document.getElementById('deptTitle').innerText =
        type === 'verification' ? 'Verification Panel' :
            type === 'dispatch' ? 'Dispatch Manager' : 'Delivery Manager';

    // Initial Load
    // We reuse switch func but we might need to hide irrelevant tabs based on type
    setupDeptUI(type);
    loadDeptOrders();
});

let currentDeptType = 'verification';

function setupDeptUI(type) {
    currentDeptType = type;
    // Hide tabs not relevant to this dept type?
    // In original app, it seems all tabs were visible but content differed? 
    // Or maybe different sets of tabs.
    // For now, we load default tab.
    if (type === 'verification') {
        document.getElementById('deptTabVerification').click();
    } else if (type === 'dispatch') {
        // Find dispatch tab
        // In original app, layout might have been shared.
        // We will just default to loadDeptOrders which handles logic.
        loadDeptOrders();
    }
}

// ==================== TABS (Shared concept) ====================
// In original app, Department uses `switchDispatchTab` or `switchDeliveryTab`
// We need to implement these.

function switchDispatchTab(tab) {
    ['deptPendingTab', 'deptDispatchedTab', 'deptDispatchHistoryTab'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // reset buttons
    ['deptTabPending', 'deptTabDispatched', 'deptTabHistory'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('bg-blue-600', 'text-white');
            el.classList.add('bg-white', 'text-gray-600');
        }
    });

    // Activate
    const activeBtn = document.getElementById(tab === 'pending' ? 'deptTabPending' : tab === 'dispatched' ? 'deptTabDispatched' : 'deptTabHistory');
    if (activeBtn) {
        activeBtn.classList.remove('bg-white', 'text-gray-600');
        activeBtn.classList.add('bg-blue-600', 'text-white');
    }

    if (tab === 'pending') {
        document.getElementById('deptPendingTab').classList.remove('hidden');
        loadDeptOrders();
    } else if (tab === 'dispatched') {
        document.getElementById('deptDispatchedTab').classList.remove('hidden');
        loadDispatchedOrders(); // Logic for "In Transit"
    } else {
        document.getElementById('deptDispatchHistoryTab').classList.remove('hidden');
        loadDispatchHistory();
    }
}

// ==================== DATA LOADING ====================
async function loadDeptOrders() {
    try {
        const res = await fetch(`${API_URL}/orders`); // Needs filtering on server or here
        const data = await res.json();

        let orders = data.orders || [];
        const container = document.getElementById('deptOrdersList'); // Start with generic container

        // Filter based on Dept Type
        if (currentDeptType === 'verification') {
            orders = orders.filter(o => o.status === 'Verification Pending');
            // Sort by priority (older first)
            orders.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            container.innerHTML = orders.map(o => renderVerificationCard(o)).join('');
        }
        else if (currentDeptType === 'dispatch') {
            orders = orders.filter(o => o.status === 'Verified'); // Ready for dispatch
            container.innerHTML = orders.map(o => renderDispatchCard(o)).join('');
        }
        else if (currentDeptType === 'delivery') {
            // Delivery Logic usually handles 'Dispatched' orders
            orders = orders.filter(o => o.status === 'Dispatched');
            container.innerHTML = orders.map(o => renderDeliveryCard(o)).join('');
        }

    } catch (e) { console.error(e); }
}

// ==================== VERIFICATION FUNCTIONS ====================
function renderVerificationCard(o) {
    return `
    <div class="bg-white border rounded-xl p-4 hover:shadow-lg transition-all">
        <div class="flex justify-between items-start mb-3">
            <div>
                <span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">New</span>
                <h4 class="font-bold text-lg text-gray-800 mt-1">${o.customerName}</h4>
                <p class="text-xs text-gray-500">${new Date(o.timestamp).toLocaleString()}</p>
            </div>
            <div class="text-right">
                <p class="font-bold text-xl text-emerald-600">₹${o.total}</p>
            </div>
        </div>
        
        <div class="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-3 space-y-1">
            <p>📍 ${o.address}</p>
            <p>📞 ${o.telNo}</p>
        </div>
        
        <div class="mb-3">
            <textarea id="remark-${o.orderId}" placeholder="Add remark..." class="w-full text-sm p-2 border rounded-lg h-20">${o.remark || ''}</textarea>
        </div>
        
        <div class="grid grid-cols-2 gap-2">
            <button onclick="saveOrderRemark('${o.orderId}')" class="bg-gray-100 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-200">Save Remark</button>
            <button onclick="viewOrder('${o.orderId}')" class="bg-blue-50 text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-100">View Details</button>
        </div>
        <div class="grid grid-cols-2 gap-2 mt-2">
            <button onclick="verifyAddress('${o.orderId}')" class="bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600">✅ Approve</button>
            <button onclick="cancelOrder('${o.orderId}')" class="bg-red-50 text-red-500 font-bold py-2 rounded-lg hover:bg-red-100">❌ Cancel</button>
        </div>
    </div>`;
}

async function verifyAddress(orderId) {
    if (!confirm('Mark this order as Verified?')) return;
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/verify`, { method: 'POST' }); // Assume endpoint exists
        const data = await res.json();
        if (data.success) {
            showSuccessPopup('Verified', 'Order marked as Verified', '✅', '#10b981');
            loadDeptOrders();
        } else alert(data.message);
    } catch (e) { alert(e.message); }
}

async function cancelOrder(orderId) {
    const reason = prompt("Enter cancellation reason:");
    if (!reason) return;

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason, cancelledBy: currentUser.id })
        });
        const data = await res.json();
        if (data.success) {
            showSuccessPopup('Cancelled', 'Order cancelled successfully', '🛑', '#ef4444');
            loadDeptOrders();
        }
    } catch (e) { }
}

async function saveOrderRemark(orderId) {
    const val = document.getElementById(`remark-${orderId}`).value;
    try {
        await fetch(`${API_URL}/orders/${orderId}/remark`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remark: val, remarkBy: currentUser.id })
        });
        showSuccessPopup('Saved', 'Remark updated', '📝', '#F59E0B');
    } catch (e) { }
}

// ==================== DISPATCH FUNCTIONS ====================
function renderDispatchCard(o) {
    return `
    <div class="bg-white border rounded-xl p-4">
        <div class="flex justify-between items-center mb-4">
           <h4 class="font-bold">${o.customerName}</h4>
           <span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Verified</span>
        </div>
        <p class="text-sm text-gray-600 mb-4">${o.address}</p>
        <button onclick="dispatchWithShiprocket('${o.orderId}')" class="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200">
            🚀 Dispatch via Shiprocket
        </button>
    </div>`;
}

// Re-implementing simplified Shiprocket logic from app.js
async function dispatchWithShiprocket(orderId) {
    // Show Box Selection directly (Hardcoded for simplicity or load modal)
    // We created a modal in app.js, let's reuse that logic if possible.
    // Constructing HTML for Modals dynamically or assuming they exist in 'modals.ejs'
    // Actually, app.js created them dynamically.

    const div = document.createElement('div');
    div.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    div.innerHTML = `
        <div class="bg-white p-6 rounded-2xl w-96">
            <h3 class="text-xl font-bold mb-4">Select Box Size</h3>
            <div class="space-y-2">
                ${['small', 'medium', 'large'].map(s => `
                    <button onclick="selectBoxAndFetch('${orderId}', '${s}', this.closest('.fixed'))" class="w-full p-3 border rounded-xl hover:bg-orange-50 font-bold capitalize text-left">
                        📦 ${s} Box
                    </button>
                `).join('')}
            </div>
            <button onclick="this.closest('.fixed').remove()" class="mt-4 w-full p-2 bg-gray-100 rounded-lg">Cancel</button>
        </div>
    `;
    document.body.appendChild(div);
}

// Global for inline onclick access
window.selectBoxAndFetch = async (orderId, size, modal) => {
    modal.remove(); // Close box modal

    // Show Loading
    const loading = document.createElement('div');
    loading.innerHTML = '<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div class="bg-white p-8 rounded-2xl">⏳ Fetching Couriers...</div></div>';
    document.body.appendChild(loading);

    try {
        const boxSizes = {
            small: { length: 16, breadth: 16, height: 5, weight: 0.5 },
            medium: { length: 20, breadth: 16, height: 8, weight: 1.0 },
            large: { length: 24, breadth: 18, height: 10, weight: 1.5 }
        };
        const dim = boxSizes[size];

        const res = await fetch(`${API_URL}/shiprocket/check-serviceability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, dimensions: dim })
        });
        const data = await res.json();

        loading.remove();

        if (data.success && data.couriers.length > 0) {
            showCourierList(orderId, dim, data.couriers);
        } else {
            if (confirm('No couriers found. Try Auto-Dispatch?')) {
                finalDispatch(orderId, dim, null);
            }
        }
    } catch (e) {
        loading.remove(); alert('Error: ' + e.message);
    }
}

function showCourierList(orderId, dim, couriers) {
    const div = document.createElement('div');
    div.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    div.innerHTML = `
        <div class="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto p-6">
            <h3 class="font-bold text-xl mb-4">Select Courier</h3>
            <button onclick="finalDispatch('${orderId}', ${JSON.stringify(dim).replace(/"/g, "&quot;")}, null, this.closest('.fixed'))" 
                class="w-full p-4 mb-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl">
                ⚡ Auto Select (Recommended)
            </button>
            <div class="space-y-2">
                ${couriers.map(c => `
                    <button onclick="finalDispatch('${orderId}', ${JSON.stringify(dim).replace(/"/g, "&quot;")}, ${c.id}, this.closest('.fixed'))"
                        class="w-full p-3 border rounded-xl hover:bg-gray-50 text-left">
                        <div class="flex justify-between font-bold"><span>${c.name}</span><span>₹${c.rate}</span></div>
                        <div class="text-xs text-gray-500">Rating: ${c.rating} | Est: ${c.edd} days</div>
                    </button>
                `).join('')}
            </div>
            <button onclick="this.closest('.fixed').remove()" class="w-full mt-4 p-3 bg-gray-100 rounded-xl font-bold">Cancel</button>
        </div>
    `;
    document.body.appendChild(div);
}

window.finalDispatch = async (orderId, dim, courierId, modal) => {
    if (modal) modal.remove();

    // Loading
    const loading = document.createElement('div');
    loading.innerHTML = '<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div class="bg-white p-6 rounded-2xl text-center"><p class="text-4xl mb-2">🚀</p><p>Generating AWB...</p></div></div>';
    document.body.appendChild(loading);

    try {
        const payload = { orderId, dimensions: dim };
        if (courierId) payload.courierId = courierId;

        const res = await fetch(`${API_URL}/shiprocket/create-order`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const data = await res.json();

        loading.remove();

        if (data.success) {
            showSuccessPopup('Dispatched!', `AWB: ${data.awb}\nCourier: ${data.courier}`, '🚚', '#3b82f6');
            loadDeptOrders(); // Refresh list
        } else {
            alert('Shiprocket Error: ' + data.message);
        }
    } catch (e) { loading.remove(); alert(e.message); }
}

// Global Exports
window.verifyAddress = verifyAddress;
window.cancelOrder = cancelOrder;
window.saveOrderRemark = saveOrderRemark;
window.dispatchWithShiprocket = dispatchWithShiprocket;
window.loadDeptOrders = loadDeptOrders;
window.switchDispatchTab = switchDispatchTab;
