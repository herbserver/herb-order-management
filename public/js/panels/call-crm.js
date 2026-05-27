// ==================== CALL CRM PANEL LOGIC ====================

// State for Call CRM
var callCrmState = {
    currentPage: 1,
    filters: {
        type: 'all',
        date: '',
        phone: ''
    },
    itemsPerPage: 15
};

// ==================== MAIN ENTRY POINT ====================
function loadCallCRM() {
    console.log('📞 Call CRM Panel Loaded');
    loadCallStats();
    loadCallLogs(1);
    loadMissedCalls();
}

// ==================== STATS ====================
async function loadCallStats() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/calls/stats', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();

        if (data.success) {
            const stats = data.stats || {};

            const totalEl = document.getElementById('callStatTotal');
            if (totalEl) totalEl.innerText = stats.totalToday || 0;

            const answeredEl = document.getElementById('callStatAnswered');
            if (answeredEl) answeredEl.innerText = stats.answeredToday || 0;

            const missedEl = document.getElementById('callStatMissed');
            if (missedEl) missedEl.innerText = stats.missedToday || 0;

            const callbackEl = document.getElementById('callStatCallbacks');
            if (callbackEl) callbackEl.innerText = stats.pendingCallbacks || 0;
        }
    } catch (e) {
        console.error('📞 Call stats error:', e);
    }
}

// ==================== CALL LOGS ====================
async function loadCallLogs(page) {
    if (page === undefined || page === null) page = 1;
    callCrmState.currentPage = page;

    // Read filter values from UI
    const typeFilter = document.getElementById('callFilterType');
    const dateFilter = document.getElementById('callFilterDate');
    const phoneFilter = document.getElementById('callFilterPhone');

    if (typeFilter) callCrmState.filters.type = typeFilter.value || 'all';
    if (dateFilter) callCrmState.filters.date = dateFilter.value || '';
    if (phoneFilter) callCrmState.filters.phone = phoneFilter.value || '';

    try {
        const token = localStorage.getItem('token');
        let url = `/api/calls?page=${page}&limit=${callCrmState.itemsPerPage}`;

        if (callCrmState.filters.type && callCrmState.filters.type !== 'all') {
            url += `&type=${encodeURIComponent(callCrmState.filters.type)}`;
        }
        if (callCrmState.filters.date) {
            url += `&date=${encodeURIComponent(callCrmState.filters.date)}`;
        }
        if (callCrmState.filters.phone) {
            url += `&phone=${encodeURIComponent(callCrmState.filters.phone)}`;
        }

        const res = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();

        const container = document.getElementById('callLogsTableBody');
        if (!container) return;

        const calls = data.calls || [];
        const totalItems = data.pagination ? data.pagination.total : calls.length;
        const totalPages = Math.ceil(totalItems / callCrmState.itemsPerPage) || 1;

        if (calls.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-12 text-gray-400 font-bold">
                        <div class="flex flex-col items-center gap-2">
                            <span class="text-4xl">📞</span>
                            <span>No call logs found</span>
                        </div>
                    </td>
                </tr>`;
            // Clear pagination
            const paginationContainer = document.getElementById('callLogsPagination');
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        container.innerHTML = calls.map(call => {
            const typeInfo = getCallTypeInfo(call.type);
            const statusBadge = getCallStatusBadge(call.status);
            const outcomeBadge = call.outcome ? getCallOutcomeBadge(call.outcome) : '<span class="text-gray-400 text-xs">—</span>';

            return `
                <tr class="hover:bg-indigo-50/30 transition-colors border-b border-slate-50">
                    <td class="px-4 py-3 text-xs font-mono font-bold text-gray-500">${formatCallTime(call.startTime || call.timestamp)}</td>
                    <td class="px-4 py-3">
                        <div class="flex flex-col">
                            <span class="font-bold text-gray-800 text-sm font-mono">${call.phone || '—'}</span>
                            ${call.phone ? `<button onclick="loadCustomer360('${call.phone}')" class="text-[10px] text-indigo-500 font-bold hover:underline text-left mt-0.5">View Profile →</button>` : ''}
                        </div>
                    </td>
                    <td class="px-4 py-3 text-sm font-bold text-gray-700 truncate max-w-[140px]" title="${call.customerName || ''}">${call.customerName || '<span class="text-gray-400">Unknown</span>'}</td>
                    <td class="px-4 py-3">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${typeInfo.classes}">
                            ${typeInfo.icon} ${typeInfo.label}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-xs font-bold text-gray-600 font-mono">${formatCallDuration(call.duration)}</td>
                    <td class="px-4 py-3">${statusBadge}</td>
                    <td class="px-4 py-3">${outcomeBadge}</td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-1.5">
                            <button onclick="viewCallDetail('${call._id}')" class="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-colors" title="View Details">
                                📋 Details
                            </button>
                            <button onclick="promptAddCallNote('${call._id}')" class="bg-violet-50 text-violet-600 hover:bg-violet-100 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-colors" title="Add Note">
                                📝
                            </button>
                            ${call.callbackRequired ? `
                            <button onclick="markCallbackDone('${call._id}')" class="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-colors" title="Mark Callback Done">
                                ✅
                            </button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Render pagination
        const paginationContainer = document.getElementById('callLogsPagination');
        if (paginationContainer) {
            renderCallPagination(paginationContainer, page, totalPages);
        }

    } catch (e) {
        console.error('📞 Call logs error:', e);
        const container = document.getElementById('callLogsTableBody');
        if (container) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-red-500 font-bold">Failed to load call logs</td>
                </tr>`;
        }
    }
}

// ==================== MISSED CALLS ====================
async function loadMissedCalls() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/calls/missed', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();

        const container = document.getElementById('missedCallsList');
        if (!container) return;

        const calls = data.calls || [];

        if (calls.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <span class="text-3xl block mb-2">✅</span>
                    <span class="font-bold text-sm">No missed calls pending callback</span>
                </div>`;
            return;
        }

        container.innerHTML = calls.map(call => `
            <div class="flex items-center justify-between bg-white border border-red-100 rounded-xl p-4 hover:shadow-md transition-all group">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-lg">❌</div>
                    <div>
                        <p class="font-bold text-gray-800">${call.phone || 'Unknown'}</p>
                        <p class="text-xs text-gray-500">${call.customerName || 'Unknown Customer'}</p>
                        <p class="text-[10px] text-red-400 font-bold mt-0.5">Missed at ${formatCallTime(call.startTime || call.timestamp)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="loadCustomer360('${call.phone}')" class="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
                        <span>👤</span> Profile
                    </button>
                    <button onclick="initiateCallback('${call.phone}')" class="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                        <span>📞</span> Call Back
                    </button>
                    <button onclick="markCallbackDone('${call._id}')" class="bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
                        <span>✅</span> Done
                    </button>
                </div>
            </div>
        `).join('');

    } catch (e) {
        console.error('📞 Missed calls error:', e);
    }
}

// ==================== CALL DETAIL MODAL ====================
async function viewCallDetail(callId) {
    if (!callId) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/calls/${callId}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();

        if (!data.success || !data.call) {
            showToast('Call details not found', 'error');
            return;
        }

        const call = data.call;
        const typeInfo = getCallTypeInfo(call.type);
        const notes = call.notes || [];
        const orders = data.orders || [];
        const allCalls = data.allCalls || [];
        const summary = data.customerSummary || { ltv: 0, totalOrders: 0, deliveredOrders: 0 };
        const address = data.latestAddress || {};

        // -- COL 1: IVR & Call Details --
        const outcomeOptions = [
            { value: '', label: 'Select Outcome...' },
            { value: 'order_placed', label: '🛒 Order Placed' },
            { value: 'inquiry', label: '❓ Inquiry' },
            { value: 'complaint', label: '😤 Complaint' },
            { value: 'feedback', label: '⭐ Feedback' },
            { value: 'follow_up', label: '📋 Follow Up' },
            { value: 'no_response', label: '📵 No Response' },
            { value: 'callback_scheduled', label: '📅 Callback Scheduled' },
            { value: 'other', label: '📌 Other' }
        ];
        const outcomeOptionsHtml = outcomeOptions.map(opt =>
            `<option value="${opt.value}" ${call.outcome === opt.value ? 'selected' : ''}>${opt.label}</option>`
        ).join('');

        const notesHtml = notes.length > 0 ? notes.map(note => `
            <div class="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-2">
                <p class="text-sm text-gray-800">${note.text || ''}</p>
                <div class="flex items-center justify-between mt-2">
                    <span class="text-[10px] text-gray-400 font-bold">${note.addedBy || 'System'}</span>
                    <span class="text-[10px] text-gray-400 font-mono">${note.timestamp ? formatCallTime(note.timestamp) : ''}</span>
                </div>
            </div>
        `).join('') : '<p class="text-gray-400 text-sm py-2">No notes yet</p>';

        // -- COL 2: WhatsApp & Fulfillment --
        const latestOrder = orders.length > 0 ? orders[0] : null;

        // -- COL 3: Customer Details --
        // Orders (Medicine Details) HTML
        const ordersHtml = orders.length > 0 ? `
            <div class="max-h-40 overflow-y-auto pr-2 wa-scrollbar">
                ${orders.map(o => `
                    <div class="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-2 cursor-pointer hover:bg-indigo-50/50 transition-colors" onclick="viewOrder('${o.orderId}')">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-xs font-black text-indigo-600">#${o.orderId || '—'}</span>
                            <span class="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-gray-200 text-gray-600">${o.status || '—'}</span>
                        </div>
                        <div class="text-[10px] text-gray-500 font-medium truncate">${o.items ? o.items.map(i=>i.name).join(', ') : 'No items'}</div>
                        <div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/50">
                            <span class="text-[9px] font-bold text-gray-400">${o.timestamp ? new Date(o.timestamp).toLocaleDateString('en-IN') : ''}</span>
                            <span class="text-xs font-black text-gray-800">₹${o.total || 0}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '<p class="text-gray-400 text-xs py-2">No past orders</p>';

        // Call History (Every Detail of Call)
        const callsHtml = allCalls.length > 0 ? `
            <div class="max-h-48 overflow-y-auto pr-2 wa-scrollbar mt-2 border-l-2 border-slate-100 pl-3">
                ${allCalls.map(c => `
                    <div class="relative mb-3 last:mb-0 cursor-pointer group" onclick="viewCallDetail('${c._id}')">
                        <div class="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors"></div>
                        <p class="text-[10px] font-bold text-slate-500">${formatCallTime(c.startTime || c.timestamp)}</p>
                        <p class="text-xs font-medium text-slate-700 mt-0.5">Duration: ${formatCallDuration(c.duration)} • <span class="capitalize text-indigo-600 font-semibold">${c.outcome || c.status}</span></p>
                    </div>
                `).join('')}
            </div>
        ` : '<p class="text-gray-400 text-xs py-2">No call history</p>';


        // Create modal container if not exists
        let modal = document.getElementById('unifiedCrmModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'unifiedCrmModal';
            modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[10002] flex items-center justify-center p-4';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="bg-white rounded-3xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl animate-fadeIn overflow-hidden border border-white/20">
                <!-- Header -->
                <div class="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 p-4 sm:p-6 text-white shrink-0 flex items-center justify-between relative shadow-md">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl shadow-inner border border-white/10">
                            ${typeInfo.icon}
                        </div>
                        <div>
                            <h3 class="text-2xl font-black tracking-tight">${call.phone || 'Unknown Caller'}</h3>
                            <p class="text-indigo-200 text-xs font-bold uppercase tracking-wider mt-0.5">Unified CRM • ${typeInfo.label} Call</p>
                        </div>
                    </div>
                    <button onclick="closeModal('unifiedCrmModal')" class="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 hover:rotate-90 rounded-full transition-all text-white backdrop-blur-sm border border-white/10 shadow-sm">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <!-- 3-Column Grid Body -->
                <div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 flex-1 overflow-y-auto bg-slate-50/50">
                    
                    <!-- COLUMN 1: IVR & Call Details -->
                    <div class="p-6 bg-white space-y-6">
                        <div>
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span class="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center text-sm">📞</span> 
                                Current Call Details
                            </h4>
                            
                            <div class="grid grid-cols-2 gap-3 mb-4">
                                <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                                    <p class="text-base font-black text-slate-700">${formatCallDuration(call.duration)}</p>
                                </div>
                                <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <p class="text-base font-black text-slate-700 capitalize">${call.status || '—'}</p>
                                </div>
                            </div>

                            ${call.dtmfInput ? `
                            <div class="bg-amber-50 rounded-xl p-3 border border-amber-100 mb-4">
                                <p class="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1">IVR DTMF Input</p>
                                <p class="text-lg font-black text-amber-700 tracking-widest">${call.dtmfInput}</p>
                            </div>` : ''}

                            ${call.recordingUrl ? `
                            <div class="mb-5">
                                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Call Recording</p>
                                <audio controls class="w-full h-10 rounded-xl bg-slate-50">
                                    <source src="${call.recordingUrl}" type="audio/mpeg">
                                </audio>
                            </div>` : ''}
                        </div>

                        <!-- Feedback Form -->
                        <div class="pt-2 border-t border-dashed border-slate-200">
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 mt-4">Call Feedback & Notes</h4>
                            <div class="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 mb-4">
                                <label class="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Outcome</label>
                                <select id="crmOutcome_${callId}" onchange="updateCallOutcome('${callId}', this.value)"
                                    class="w-full p-2.5 border-2 border-indigo-100 rounded-lg text-sm font-bold text-slate-700 focus:border-indigo-400 outline-none bg-white transition-all">
                                    ${outcomeOptionsHtml}
                                </select>
                            </div>

                            <div class="mb-4">
                                <textarea id="crmNote_${callId}" rows="2" placeholder="Add quick note..."
                                    class="w-full p-3 border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-400 outline-none transition-all resize-none"></textarea>
                                <button onclick="addCallNoteFromCrm('${callId}')"
                                    class="mt-2 w-full bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all shadow-md">
                                    Save Note
                                </button>
                            </div>

                            <div class="max-h-32 overflow-y-auto pr-1 wa-scrollbar">
                                ${notesHtml}
                            </div>
                        </div>
                    </div>

                    <!-- COLUMN 2: WhatsApp Marketing & Fulfillment -->
                    <div class="p-6 bg-slate-50/50 space-y-6">
                        <div>
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span class="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center text-sm">💬</span> 
                                WhatsApp Marketing
                            </h4>
                            
                            <div class="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm mb-6">
                                <p class="text-[10px] text-slate-500 font-bold mb-3">Quick Actions Template</p>
                                <div class="grid grid-cols-3 gap-2">
                                    <button onclick="sendWATemplate('${call.phone}', 'yes')" class="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-100 py-3 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 group">
                                        <span class="text-lg group-hover:scale-110 transition-transform">✅</span> Yes
                                    </button>
                                    <button onclick="sendWATemplate('${call.phone}', 'no')" class="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-100 py-3 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 group">
                                        <span class="text-lg group-hover:scale-110 transition-transform">❌</span> No
                                    </button>
                                    <button onclick="sendWATemplate('${call.phone}', 'call')" class="bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white border border-blue-100 py-3 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 group">
                                        <span class="text-lg group-hover:scale-110 transition-transform">☎️</span> Call
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span class="w-6 h-6 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center text-sm">🚚</span> 
                                Fulfillment Status
                            </h4>
                            
                            <div class="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                                ${latestOrder ? `
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-xs font-bold text-slate-500">Latest Order #${latestOrder.orderId}</span>
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">${latestOrder.status}</span>
                                    </div>
                                    <div class="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden flex">
                                        <!-- Simple visual progress based on status -->
                                        <div class="h-full ${latestOrder.status==='Delivered'?'w-full bg-emerald-500':
                                                           latestOrder.status==='OFD'?'w-3/4 bg-blue-500':
                                                           latestOrder.status==='Dispatched'?'w-1/2 bg-amber-500':
                                                           latestOrder.status==='Cancelled'||latestOrder.status==='RTO'?'w-full bg-rose-500':
                                                           'w-1/4 bg-slate-400'}"></div>
                                    </div>
                                    <div class="flex justify-between text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                                        <span>Ordered</span>
                                        <span>Dispatched</span>
                                        <span>Delivered</span>
                                    </div>
                                ` : '<p class="text-xs text-slate-400 font-medium py-4 text-center">No active orders</p>'}
                            </div>
                        </div>
                    </div>

                    <!-- COLUMN 3: Customer Details -->
                    <div class="p-6 bg-white space-y-6">
                        <!-- Customer Info Header -->
                        <div class="flex items-start justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 class="text-lg font-black text-slate-800">${address.customerName || call.customerName || 'Unknown Customer'}</h3>
                                <p class="text-xs font-bold text-slate-500 mt-1">${address.gender ? address.gender + ', ' : ''}${address.age ? address.age + ' Yrs' : ''}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Last Called</p>
                                <p class="text-xs font-black text-indigo-600">${allCalls.length > 0 ? formatCallTime(allCalls[0].timestamp) : '—'}</p>
                            </div>
                        </div>

                        <!-- Orders Tab (Medicine Details) -->
                        <div>
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Medicine & Orders</h4>
                            ${ordersHtml}
                        </div>

                        <!-- Reorder Action -->
                        <div class="pt-2">
                            <button onclick="bookNewOrderFromWA('${(address.customerName || call.customerName || '').replace(/'/g, "\\'")}', '${call.callerNumber}')" class="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-teal-200/50 flex justify-center items-center gap-2">
                                <span>🛒</span> Place Reorder
                            </button>
                        </div>

                        <!-- Every detail of call -->
                        <div class="pt-4 border-t border-dashed border-slate-200">
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between items-center">
                                Call History
                                <span class="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[9px]">${allCalls.length}</span>
                            </h4>
                            ${callsHtml}
                        </div>

                        <!-- Summary -->
                        <div class="pt-4 border-t border-slate-100">
                            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Account Summary</h4>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-indigo-50/50 rounded-xl p-3">
                                    <p class="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Total Orders</p>
                                    <p class="text-lg font-black text-indigo-700">${summary.totalOrders}</p>
                                </div>
                                <div class="bg-emerald-50/50 rounded-xl p-3">
                                    <p class="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Lifetime Value</p>
                                    <p class="text-lg font-black text-emerald-700">₹${summary.ltv}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        modal.style.display = '';

    } catch (e) {
        console.error('📞 Call detail error:', e);
        showToast('Failed to load call details', 'error');
    }
}

// Helper to add note from the new CRM view
async function addCallNoteFromCrm(callId) {
    const noteInput = document.getElementById(`crmNote_${callId}`);
    const noteText = noteInput ? noteInput.value.trim() : '';

    if (!noteText) {
        showToast('Please enter a note', 'warning');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/calls/${callId}/notes`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: noteText })
        });
        const data = await res.json();

        if (data.success) {
            showToast('Note added successfully', 'success');
            viewCallDetail(callId); // Refresh modal
        } else {
            showToast(data.message || 'Failed to add note', 'error');
        }
    } catch (e) {
        showToast('Failed to add note', 'error');
    }
}

// WhatsApp Template Dummy Sender (Integration ready)
function sendWATemplate(phone, type) {
    showToast(`WhatsApp '\${type}' template triggered for \${phone}`, 'success');
    // Actual API integration goes here
}

// ==================== ADD NOTE ====================
async function addCallNote(callId) {
    const noteInput = document.getElementById(`callNoteInput_${callId}`);
    const noteText = noteInput ? noteInput.value.trim() : '';

    if (!noteText) {
        showToast('Please enter a note', 'warning');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/calls/${callId}/notes`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: noteText })
        });
        const data = await res.json();

        if (data.success) {
            showToast('Note added successfully', 'success');
            // Refresh the detail modal
            viewCallDetail(callId);
        } else {
            showToast(data.message || 'Failed to add note', 'error');
        }
    } catch (e) {
        console.error('📞 Add note error:', e);
        showToast('Failed to add note', 'error');
    }
}

// Prompt-based note adder for inline action button
function promptAddCallNote(callId) {
    const noteText = prompt('Enter call note:');
    if (!noteText || !noteText.trim()) return;

    const token = localStorage.getItem('token');
    fetch(`/api/calls/${callId}/notes`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: noteText.trim() })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Note added successfully', 'success');
        } else {
            showToast(data.message || 'Failed to add note', 'error');
        }
    })
    .catch(e => {
        console.error('📞 Add note error:', e);
        showToast('Failed to add note', 'error');
    });
}

// ==================== UPDATE OUTCOME ====================
async function updateCallOutcome(callId, outcome) {
    if (!outcome) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/calls/${callId}/outcome`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ outcome: outcome })
        });
        const data = await res.json();

        if (data.success) {
            showToast('Call outcome updated', 'success');
            loadCallLogs(callCrmState.currentPage);
        } else {
            showToast(data.message || 'Failed to update outcome', 'error');
        }
    } catch (e) {
        console.error('📞 Update outcome error:', e);
        showToast('Failed to update outcome', 'error');
    }
}

// ==================== MARK CALLBACK DONE ====================
async function markCallbackDone(callId) {
    if (!confirm('Mark this callback as done?')) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/calls/${callId}/callback-done`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();

        if (data.success) {
            showToast('Callback marked as done ✅', 'success');
            loadCallStats();
            loadCallLogs(callCrmState.currentPage);
            loadMissedCalls();
        } else {
            showToast(data.message || 'Failed to update callback', 'error');
        }
    } catch (e) {
        console.error('📞 Callback done error:', e);
        showToast('Failed to mark callback done', 'error');
    }
}

// ==================== CUSTOMER 360 ====================
async function loadCustomer360(phone) {
    if (!phone) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/calls/customer/${encodeURIComponent(phone)}/360`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();

        if (!data.success) {
            showToast('Customer profile not found', 'error');
            return;
        }

        const customer = data.customer || {};
        const summary = customer.summary || {};
        const orders = customer.orders || [];
        const calls = customer.calls || [];

        // Build orders table
        const ordersTableHtml = orders.length > 0 ? `
            <div class="overflow-x-auto rounded-xl border border-gray-100">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                            <th class="px-4 py-3 text-left">Order ID</th>
                            <th class="px-4 py-3 text-left">Date</th>
                            <th class="px-4 py-3 text-right">Total</th>
                            <th class="px-4 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        ${orders.map(o => `
                            <tr class="hover:bg-indigo-50/30 transition-colors cursor-pointer" onclick="viewOrder('${o.orderId}')">
                                <td class="px-4 py-2.5 font-mono font-bold text-indigo-600 text-xs">${o.orderId || '—'}</td>
                                <td class="px-4 py-2.5 text-xs text-gray-500 font-mono">${o.timestamp ? new Date(o.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                                <td class="px-4 py-2.5 text-xs font-black text-gray-800 text-right">₹${o.total || 0}</td>
                                <td class="px-4 py-2.5 text-center">
                                    <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gray-100 text-gray-600">${o.status || '—'}</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : '<p class="text-gray-400 text-sm text-center py-4">No orders found</p>';

        // Build calls table
        const callsTableHtml = calls.length > 0 ? `
            <div class="overflow-x-auto rounded-xl border border-gray-100">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                            <th class="px-4 py-3 text-left">Time</th>
                            <th class="px-4 py-3 text-left">Type</th>
                            <th class="px-4 py-3 text-left">Duration</th>
                            <th class="px-4 py-3 text-center">Outcome</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        ${calls.map(c => {
                            const ti = getCallTypeInfo(c.type);
                            return `
                            <tr class="hover:bg-indigo-50/30 transition-colors cursor-pointer" onclick="viewCallDetail('${c._id}')">
                                <td class="px-4 py-2.5 text-xs text-gray-500 font-mono">${formatCallTime(c.startTime || c.timestamp)}</td>
                                <td class="px-4 py-2.5">
                                    <span class="inline-flex items-center gap-1 text-[10px] font-black ${ti.classes} px-2 py-0.5 rounded-full">${ti.icon} ${ti.label}</span>
                                </td>
                                <td class="px-4 py-2.5 text-xs font-bold text-gray-600 font-mono">${formatCallDuration(c.duration)}</td>
                                <td class="px-4 py-2.5 text-center text-[10px] font-bold text-gray-500 capitalize">${c.outcome || '—'}</td>
                            </tr>
                        `;}).join('')}
                    </tbody>
                </table>
            </div>
        ` : '<p class="text-gray-400 text-sm text-center py-4">No call history</p>';

        // Status breakdown
        const statusBreakdown = summary.statusBreakdown || {};
        const breakdownHtml = Object.keys(statusBreakdown).length > 0 ? `
            <div class="flex flex-wrap gap-2">
                ${Object.entries(statusBreakdown).map(([status, count]) => `
                    <span class="px-3 py-1.5 bg-gray-100 rounded-lg text-[10px] font-black text-gray-600 border border-gray-200 uppercase tracking-wider">
                        ${status}: <span class="text-gray-800">${count}</span>
                    </span>
                `).join('')}
            </div>
        ` : '';

        // Create or reuse modal
        let modal = document.getElementById('customer360Modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'customer360Modal';
            modal.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-[10003] flex items-center justify-center p-4';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
                <!-- Header -->
                <div class="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white rounded-t-3xl relative">
                    <button onclick="closeModal('customer360Modal')" class="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                            👤
                        </div>
                        <div>
                            <h3 class="text-2xl font-black">${customer.name || phone}</h3>
                            <p class="text-white/70 text-sm font-bold font-mono">${phone}</p>
                        </div>
                    </div>
                </div>

                <!-- Summary Stats -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 -mt-4">
                    <div class="bg-white border-2 border-indigo-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all">
                        <p class="text-2xl font-black text-indigo-600">${summary.totalOrders || 0}</p>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Orders</p>
                    </div>
                    <div class="bg-white border-2 border-violet-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all">
                        <p class="text-2xl font-black text-violet-600">${summary.totalCalls || 0}</p>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Calls</p>
                    </div>
                    <div class="bg-white border-2 border-emerald-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all">
                        <p class="text-2xl font-black text-emerald-600">₹${(summary.totalSpent || 0).toLocaleString()}</p>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Spent</p>
                    </div>
                    <div class="bg-white border-2 border-amber-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all">
                        <p class="text-2xl font-black text-amber-600">${summary.medicines || 0}</p>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Medicines</p>
                    </div>
                </div>

                <!-- Body -->
                <div class="px-6 pb-6 space-y-6">
                    ${breakdownHtml ? `
                    <div>
                        <h4 class="text-sm font-black text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>📊</span> Status Breakdown
                        </h4>
                        ${breakdownHtml}
                    </div>` : ''}

                    <!-- Recent Orders -->
                    <div>
                        <h4 class="text-sm font-black text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>📦</span> Recent Orders
                        </h4>
                        ${ordersTableHtml}
                    </div>

                    <!-- Recent Calls -->
                    <div>
                        <h4 class="text-sm font-black text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>📞</span> Recent Calls
                        </h4>
                        ${callsTableHtml}
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        modal.style.display = '';

    } catch (e) {
        console.error('📞 Customer 360 error:', e);
        showToast('Failed to load customer profile', 'error');
    }
}

// ==================== HELPERS ====================

function formatCallDuration(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
}

function formatCallTime(isoDate) {
    if (!isoDate) return '—';
    try {
        const d = new Date(isoDate);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();

        const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

        if (isToday) {
            return timeStr;
        }

        const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        return `${dateStr}, ${timeStr}`;
    } catch (e) {
        return '—';
    }
}

function getCallTypeInfo(type) {
    const types = {
        'incoming': {
            icon: '📞',
            label: 'Incoming',
            classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        },
        'missed': {
            icon: '❌',
            label: 'Missed',
            classes: 'bg-red-50 text-red-700 border border-red-200'
        },
        'outgoing': {
            icon: '📤',
            label: 'Outgoing',
            classes: 'bg-blue-50 text-blue-700 border border-blue-200'
        }
    };
    return types[type] || { icon: '📞', label: type || 'Unknown', classes: 'bg-gray-50 text-gray-700 border border-gray-200' };
}

function getCallStatusBadge(status) {
    const statusMap = {
        'answered': { classes: 'bg-emerald-50 text-emerald-700 border border-emerald-100', label: 'Answered' },
        'missed': { classes: 'bg-red-50 text-red-700 border border-red-100', label: 'Missed' },
        'busy': { classes: 'bg-amber-50 text-amber-700 border border-amber-100', label: 'Busy' },
        'no_answer': { classes: 'bg-orange-50 text-orange-700 border border-orange-100', label: 'No Answer' },
        'voicemail': { classes: 'bg-purple-50 text-purple-700 border border-purple-100', label: 'Voicemail' },
        'failed': { classes: 'bg-gray-50 text-gray-700 border border-gray-100', label: 'Failed' }
    };
    const info = statusMap[status] || { classes: 'bg-gray-50 text-gray-600 border border-gray-100', label: status || '—' };
    return `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${info.classes}">${info.label}</span>`;
}

function getCallOutcomeBadge(outcome) {
    const outcomeMap = {
        'order_placed': { icon: '🛒', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
        'inquiry': { icon: '❓', classes: 'bg-blue-50 text-blue-700 border border-blue-100' },
        'complaint': { icon: '😤', classes: 'bg-red-50 text-red-700 border border-red-100' },
        'feedback': { icon: '⭐', classes: 'bg-amber-50 text-amber-700 border border-amber-100' },
        'follow_up': { icon: '📋', classes: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
        'no_response': { icon: '📵', classes: 'bg-gray-50 text-gray-700 border border-gray-100' },
        'callback_scheduled': { icon: '📅', classes: 'bg-violet-50 text-violet-700 border border-violet-100' },
        'other': { icon: '📌', classes: 'bg-slate-50 text-slate-700 border border-slate-100' }
    };
    const info = outcomeMap[outcome] || { icon: '📌', classes: 'bg-gray-50 text-gray-600 border border-gray-100' };
    const label = outcome ? outcome.replace(/_/g, ' ') : '—';
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${info.classes}">${info.icon} ${label}</span>`;
}

function initiateCallback(phone) {
    if (!phone) return;
    // Open tel: link for native dialer
    window.open(`tel:${phone}`, '_self');
}

// ==================== PAGINATION ====================
function renderCallPagination(container, currentPage, totalPages) {
    if (!container) return;
    container.innerHTML = `
        <div class="flex justify-center items-center gap-4 mt-4">
            <button onclick="loadCallLogs(${currentPage - 1})"
                class="px-4 py-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} text-sm font-bold transition-colors"
                ${currentPage === 1 ? 'disabled' : ''}>
                ← Previous
            </button>
            <span class="text-sm font-black text-gray-600">Page ${currentPage} of ${totalPages}</span>
            <button onclick="loadCallLogs(${currentPage + 1})"
                class="px-4 py-2 rounded-lg border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} text-sm font-bold transition-colors"
                ${currentPage === totalPages ? 'disabled' : ''}>
                Next →
            </button>
        </div>
    `;
}

// ==================== FILTER HELPERS ====================
function applyCallFilters() {
    loadCallLogs(1);
}

function resetCallFilters() {
    const typeFilter = document.getElementById('callFilterType');
    const dateFilter = document.getElementById('callFilterDate');
    const phoneFilter = document.getElementById('callFilterPhone');

    if (typeFilter) typeFilter.value = 'all';
    if (dateFilter) dateFilter.value = '';
    if (phoneFilter) phoneFilter.value = '';

    callCrmState.filters = { type: 'all', date: '', phone: '' };
    loadCallLogs(1);
}

// ==================== INCOMING CALL NOTIFICATION ====================
function showIncomingCallNotification(data) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-[20001] animate-bounce';
    notification.id = 'incomingCallNotification_' + Date.now();

    const phone = data.phone || data.callerNumber || 'Unknown';
    const name = data.customerName || data.callerName || '';

    notification.innerHTML = `
        <div class="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white rounded-2xl shadow-2xl p-5 min-w-[320px] border-2 border-white/20">
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-2xl animate-pulse">
                        📞
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-white/60 uppercase tracking-widest">Incoming Call</p>
                        <p class="text-lg font-black">${phone}</p>
                        ${name ? `<p class="text-sm text-white/80 font-bold">${name}</p>` : ''}
                    </div>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="text-white/60 hover:text-white transition-colors ml-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="flex gap-2 mt-4">
                <button onclick="loadCustomer360('${phone}'); this.closest('.fixed').remove();"
                    class="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5">
                    👤 View Profile
                </button>
                <button onclick="this.closest('.fixed').remove()"
                    class="bg-white/10 hover:bg-white/20 text-white/80 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                    Dismiss
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 15 seconds
    setTimeout(() => {
        const el = document.getElementById(notification.id);
        if (el) {
            el.classList.remove('animate-bounce');
            el.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => el.remove(), 500);
        }
    }, 15000);
}

// ==================== SOCKET.IO REAL-TIME EVENTS ====================
if (typeof io !== 'undefined') {
    const socket = io();
    
    socket.on('connect', () => {
        try {
            const currentUserStr = localStorage.getItem('currentUser');
            if (currentUserStr) {
                const user = JSON.parse(currentUserStr);
                const empId = user.employeeId || user.id;
                if (empId) {
                    socket.emit('join-employee-room', { employeeId: empId });
                }
            }
        } catch (e) {}
    });

    socket.on('voicell:call', (data) => {
        // Show incoming call notification toast
        showIncomingCallNotification(data);
        // Refresh call list if on call CRM tab
        if (!document.getElementById('adminCallcrmTab')?.classList.contains('hidden')) {
            loadCallStats();
            loadCallLogs();
        }
    });
}

// ==================== GLOBAL EXPORTS ====================
window.loadCallCRM = loadCallCRM;
window.loadCallStats = loadCallStats;
window.loadCallLogs = loadCallLogs;
window.loadMissedCalls = loadMissedCalls;
window.viewCallDetail = viewCallDetail;
window.addCallNote = addCallNote;
window.promptAddCallNote = promptAddCallNote;
window.updateCallOutcome = updateCallOutcome;
window.markCallbackDone = markCallbackDone;
window.loadCustomer360 = loadCustomer360;
window.formatCallDuration = formatCallDuration;
window.formatCallTime = formatCallTime;
window.showIncomingCallNotification = showIncomingCallNotification;
window.applyCallFilters = applyCallFilters;
window.resetCallFilters = resetCallFilters;
window.initiateCallback = initiateCallback;
