// ==========================================
// EMPLOYEE CTI (Live Screen Pop) INTEGRATION
// ==========================================

let ctiSocket = null;

document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if Socket.io is loaded
    if (typeof io !== 'undefined') {
        initEmployeeCTI();
    } else {
        console.warn('Socket.io not loaded. CTI Screen Pop disabled.');
    }
});

function initEmployeeCTI() {
    // Attempt to connect to socket
    try {
        ctiSocket = io();
        
        ctiSocket.on('connect', () => {
            try {
                const currentUserStr = localStorage.getItem('currentUser');
                if (currentUserStr) {
                    const user = JSON.parse(currentUserStr);
                    const empId = user.employeeId || user.id;
                    if (empId) {
                        ctiSocket.emit('join-employee-room', { employeeId: empId });
                    }
                }
            } catch (e) {}
        });
        
        ctiSocket.on('voicell:call', (data) => {
            const currentEmployee = normalizeEmployeeUser(window.currentUser);
            if (!currentEmployee) return;

            // Server already routed to correct employee room, so just show it!
            showLiveScreenPop(data);
        });
        
    } catch (e) {
        console.error('Error initializing Employee CTI:', e);
    }
}

async function showLiveScreenPop(callData) {
    // 1. Play ringing sound
    playRingingSound();

    // 2. Fetch Customer 360 data
    let customer360 = null;
    try {
        // Find if this customer has any previous orders or details
        const res = await fetch(`${API_URL}/orders/customer/${callData.callerNumber}`);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.orders) {
                customer360 = data.orders;
            }
        }
    } catch (e) {
        console.error('Error fetching Customer 360 for CTI:', e);
    }

    // Calculate LTV
    let totalValue = 0;
    let orderCount = 0;
    if (customer360 && customer360.length > 0) {
        orderCount = customer360.length;
        totalValue = customer360.reduce((sum, o) => {
            if (o.status !== 'Cancelled' && o.status !== 'RTO') {
                return sum + (Number(o.totalAmount || o.amount) || 0);
            }
            return sum;
        }, 0);
    }

    // 3. Render the UI
    const modalHtml = `
        <div id="ctiIncomingModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-fadeIn p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 animate-slideUp">
                
                <!-- Header (Animated Gradient) -->
                <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 p-6 relative overflow-hidden text-center">
                    <!-- Ripple animation -->
                    <div class="absolute inset-0 opacity-20">
                        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-ping" style="animation-duration: 2s;"></div>
                    </div>
                    
                    <div class="relative z-10 flex flex-col items-center">
                        <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border-4 border-white/30 mb-3 shadow-lg">
                            <span class="text-4xl">☎️</span>
                        </div>
                        <h2 class="text-white text-2xl font-black tracking-wide drop-shadow-md">Incoming Call</h2>
                        <p class="text-indigo-100 font-mono text-lg tracking-wider mt-1 opacity-90">${callData.callerNumber}</p>
                    </div>
                </div>

                <!-- Customer Details Body -->
                <div class="p-6 bg-slate-50">
                    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h3 class="text-lg font-bold text-slate-800">${callData.customerName || 'Unknown Customer'}</h3>
                                <p class="text-sm text-slate-500 font-medium">${orderCount > 0 ? 'Returning Customer' : 'New Caller'}</p>
                            </div>
                            ${totalValue > 5000 ? '<span class="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md border border-amber-200">⭐ VIP</span>' : ''}
                        </div>

                        <div class="grid grid-cols-2 gap-3 mt-4">
                            <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p class="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Orders</p>
                                <p class="text-lg font-black text-slate-700">${orderCount}</p>
                            </div>
                            <div class="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                <p class="text-[10px] uppercase font-bold text-emerald-500 mb-1">Lifetime Value</p>
                                <p class="text-lg font-black text-emerald-700">₹${totalValue}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Latest Order Context -->
                    ${customer360 && customer360.length > 0 ? `
                    <div class="bg-blue-50/50 rounded-xl p-3 border border-blue-100 mb-6">
                        <p class="text-xs font-bold text-blue-600 mb-1">Last Order Status</p>
                        <div class="flex justify-between items-center">
                            <p class="text-sm font-semibold text-slate-700 truncate mr-2">${customer360[0].items ? customer360[0].items.join(', ') : 'Unknown Items'}</p>
                            <span class="text-xs font-bold px-2 py-1 bg-white rounded shadow-sm border border-slate-200">${customer360[0].status}</span>
                        </div>
                    </div>
                    ` : '<div class="text-center text-slate-400 text-sm italic mb-6">No previous order history found.</div>'}

                    <!-- Actions -->
                    <div class="flex gap-3 mb-4">
                        <button onclick="dismissCtiModal()" class="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors">
                            Dismiss
                        </button>
                        <button onclick="openCtiCustomerProfile('${callData.callerNumber}')" class="flex-[2] py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all flex justify-center items-center gap-2">
                            <span>📋</span> Open Profile
                        </button>
                    </div>

                    <!-- Quick Feedback -->
                    <div class="pt-4 border-t border-slate-200">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span>📝</span> Quick Call Feedback
                        </p>
                        <div class="space-y-3">
                            <select id="ctiOutcome_${callData.callId}" class="w-full p-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-indigo-400 outline-none bg-white transition-all">
                                <option value="inquiry">❓ General Inquiry</option>
                                <option value="order_placed">🛒 Order Placed</option>
                                <option value="complaint">😤 Complaint</option>
                                <option value="feedback">⭐ Feedback</option>
                                <option value="follow_up">📋 Follow Up Needed</option>
                                <option value="no_response">📵 No Response / Disconnected</option>
                                <option value="other">📌 Other</option>
                            </select>
                            
                            <textarea id="ctiNote_${callData.callId}" rows="2" placeholder="Add any quick notes about the call..." class="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-400 outline-none transition-all resize-none"></textarea>
                            
                            <button onclick="submitCtiFeedback('${callData.callId}', this)" class="w-full bg-slate-800 text-white py-3 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all shadow-md">
                                Save Details to CRM
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Append to body
    const existing = document.getElementById('ctiIncomingModal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function submitCtiFeedback(callId, btn) {
    if (!callId) return;
    
    const outcomeSelect = document.getElementById(`ctiOutcome_${callId}`);
    const noteTextarea = document.getElementById(`ctiNote_${callId}`);
    const outcome = outcomeSelect ? outcomeSelect.value : 'inquiry';
    const note = noteTextarea ? noteTextarea.value.trim() : '';

    if (!note && outcome === 'inquiry') {
        alert('Please select a specific outcome or add a note before saving.');
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Saving...';
    btn.disabled = true;

    try {
        const token = localStorage.getItem('token');
        
        // 1. Update Outcome
        await fetch(`/api/calls/${callId}/outcome`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ outcome })
        });

        // 2. Add Note (if any)
        if (note) {
            await fetch(`/api/calls/${callId}/notes`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: note })
            });
        }

        // Show Success
        btn.innerHTML = '✅ Saved Successfully';
        btn.classList.replace('bg-slate-800', 'bg-emerald-600');
        btn.classList.replace('hover:bg-slate-700', 'hover:bg-emerald-500');
        
        // Auto dismiss after 2 seconds
        setTimeout(() => {
            dismissCtiModal();
        }, 2000);

    } catch (e) {
        console.error('Feedback save error:', e);
        alert('Error saving feedback. Please try again.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function dismissCtiModal() {
    const modal = document.getElementById('ctiIncomingModal');
    if (modal) {
        modal.classList.add('opacity-0', 'scale-95');
        setTimeout(() => modal.remove(), 200);
    }
}

function openCtiCustomerProfile(phone) {
    dismissCtiModal();
    // Pre-fill global search and trigger search
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
        searchInput.value = phone;
        // Assuming globalSearch logic handles this or we can trigger enter
        searchInput.dispatchEvent(new Event('input'));
        setTimeout(() => {
            searchInput.focus();
            const e = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, keyCode: 13, key: "Enter" });
            searchInput.dispatchEvent(e);
        }, 100);
    }
}

function playRingingSound() {
    try {
        // Use a base64 tiny beep sound if no audio file is available, 
        // or a standard browser beep.
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'); // dummy base64 for now, relying on notification sounds.
        // audio.play().catch(e => console.log('Audio autoplay blocked'));
    } catch (e) {}
}
