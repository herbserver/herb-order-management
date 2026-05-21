(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getItemsPerPage() {
        if (typeof paginationConfig !== 'undefined' && typeof paginationConfig.getItemsPerPage === 'function') {
            return paginationConfig.getItemsPerPage();
        }

        const stored = Number(window.localStorage.getItem('emp_items_per_page') || 12);
        return Number.isFinite(stored) && stored >= 0 ? stored : 12;
    }

    function setItemsPerPage(value) {
        if (typeof paginationConfig !== 'undefined' && typeof paginationConfig.setItemsPerPage === 'function') {
            paginationConfig.setItemsPerPage(value);
            return;
        }

        window.localStorage.setItem('emp_items_per_page', String(value));
    }

    function paginate(items, page, limit) {
        if (!limit || limit <= 0) {
            return {
                items,
                totalItems: items.length,
                totalPages: items.length ? 1 : 0,
                currentPage: 1
            };
        }

        const totalItems = items.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / limit));
        const currentPage = Math.min(Math.max(1, page || 1), totalPages);
        const startIndex = (currentPage - 1) * limit;

        return {
            items: items.slice(startIndex, startIndex + limit),
            totalItems,
            totalPages,
            currentPage
        };
    }

    function filterCardGrid(selector, query) {
        const normalized = (query || '').toLowerCase().trim();
        const cards = document.querySelectorAll(selector);

        cards.forEach((card) => {
            if (!normalized) {
                card.style.display = '';
                return;
            }

            const mobile = (card.getAttribute('data-mobile') || '').toLowerCase();
            const text = (card.textContent || '').toLowerCase();
            card.style.display = mobile.includes(normalized) || text.includes(normalized) ? '' : 'none';
        });
    }

    function generatePageNumbers(currentPage, totalPages, fetchFuncName) {
        const pages = [];
        const maxVisible = 3;

        let startPage = Math.max(1, currentPage - 1);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let page = startPage; page <= endPage; page += 1) {
            const activeClass = page === currentPage ? 'bg-emerald-500 text-white' : 'text-gray-700 hover:bg-gray-50';
            pages.push(`
                <button
                    onclick="${fetchFuncName}(${page})"
                    class="w-10 h-10 text-sm font-medium rounded-md ${activeClass}">
                    ${page}
                </button>
            `);
        }

        return pages.join('');
    }

    function renderPaginationControls(container, currentPage, totalPages, fetchFuncName, totalItems) {
        if (!container || totalPages <= 1) {
            return;
        }

        const currentLimit = getItemsPerPage();
        const shownEnd = currentLimit > 0 ? Math.min(currentPage * currentLimit, totalItems) : totalItems;
        const shownStart = totalItems === 0 ? 0 : ((currentPage - 1) * (currentLimit > 0 ? currentLimit : totalItems)) + 1;

        const wrapper = document.createElement('div');
        wrapper.className = 'col-span-full mt-8';
        wrapper.innerHTML = `
            <div class="flex justify-center mb-4">
                <div class="flex items-center gap-2 text-sm">
                    <label class="text-gray-600 font-medium">Items per page:</label>
                    <select
                        onchange="handleEmpItemsChange('${fetchFuncName}', this.value)"
                        class="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none bg-white cursor-pointer">
                        <option value="10" ${currentLimit === 10 ? 'selected' : ''}>10</option>
                        <option value="25" ${currentLimit === 25 ? 'selected' : ''}>25</option>
                        <option value="50" ${currentLimit === 50 ? 'selected' : ''}>50</option>
                        <option value="100" ${currentLimit === 100 ? 'selected' : ''}>100</option>
                        <option value="0" ${currentLimit === 0 ? 'selected' : ''}>All</option>
                    </select>
                </div>
            </div>
            <div class="flex justify-center items-center gap-2">
                <button
                    onclick="${fetchFuncName}(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}
                    class="px-4 py-2 text-sm font-medium rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}">
                    Previous
                </button>
                ${generatePageNumbers(currentPage, totalPages, fetchFuncName)}
                <button
                    onclick="${fetchFuncName}(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}
                    class="px-4 py-2 text-sm font-medium rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}">
                    Next
                </button>
            </div>
            <div class="text-center text-sm text-gray-500 mt-3">
                Showing ${shownStart}-${shownEnd} of ${totalItems} orders
            </div>
        `;

        container.appendChild(wrapper);
    }

    function handleEmpItemsChange(fetchFuncName, selectedValue) {
        const nextLimit = Number(selectedValue || 12);
        setItemsPerPage(nextLimit);

        if (typeof window[fetchFuncName] === 'function') {
            window[fetchFuncName](1);
        }
    }

    function getTrackingStatusBadge(order) {
        const shiprocketAwb = order?.shiprocket?.awb;
        const manualAwb = order?.tracking?.trackingId;
        const awb = shiprocketAwb || manualAwb;

        if (!awb) {
            return '';
        }

        const courier = order?.shiprocket?.courierName || order?.tracking?.courier || 'Manual';
        const currentStatus = order?.tracking?.currentStatus || 'In Transit';

        let badgeColor = 'blue';
        if (/delivered/i.test(currentStatus)) badgeColor = 'green';
        else if (/out for delivery/i.test(currentStatus)) badgeColor = 'purple';
        else if (/transit/i.test(currentStatus)) badgeColor = 'yellow';

        return `
            <div class="mt-3 p-3 bg-gradient-to-r from-${badgeColor}-50 to-white border border-${badgeColor}-200 rounded-xl">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-xs font-bold text-${badgeColor}-700 uppercase tracking-wide">Tracking Info</p>
                    <span class="bg-${badgeColor}-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        ${escapeHtml(currentStatus)}
                    </span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                        <p class="text-gray-500 font-medium mb-0.5">AWB Number:</p>
                        <div class="flex items-center gap-1">
                            <p class="font-mono font-bold text-gray-800 text-[11px] truncate">${escapeHtml(awb)}</p>
                            <button onclick="copyTracking('${escapeHtml(awb)}')" class="text-${badgeColor}-600 hover:text-${badgeColor}-800 transition-colors" title="Copy AWB">
                                Copy
                            </button>
                        </div>
                    </div>
                    <div>
                        <p class="text-gray-500 font-medium mb-0.5">Courier:</p>
                        <p class="font-bold text-${badgeColor}-700 text-[11px]">${escapeHtml(courier)}</p>
                    </div>
                </div>
                ${order?.tracking?.lastUpdate ? `
                    <div class="text-[10px] text-gray-600 italic border-t border-${badgeColor}-100 pt-2 mt-1">
                        ${escapeHtml(order.tracking.lastUpdate)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    function renderEmpOrderCard(order, isHistory) {
        const o = order;
        const status = o?.status || 'Unknown';
        
        // Dynamic status map for premium visual design
        const statusMap = {
            'Pending': { color: 'amber', bg: 'from-amber-500 to-yellow-500', badge: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500', glow: 'shadow-amber-100' },
            'Address Verified': { color: 'emerald', bg: 'from-emerald-500 to-teal-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500', glow: 'shadow-emerald-100' },
            'Dispatched': { color: 'indigo', bg: 'from-indigo-500 to-blue-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100', dot: 'bg-indigo-500', glow: 'shadow-indigo-100' },
            'Delivered': { color: 'green', bg: 'from-green-500 to-emerald-500', badge: 'bg-green-50 text-green-700 border-green-100', dot: 'bg-green-500', glow: 'shadow-green-100' },
            'On Hold': { color: 'orange', bg: 'from-orange-500 to-amber-500', badge: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500', glow: 'shadow-orange-100' },
            'Cancelled': { color: 'rose', bg: 'from-rose-500 to-red-500', badge: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500', glow: 'shadow-rose-100' },
            'Returned': { color: 'slate', bg: 'from-slate-500 to-gray-500', badge: 'bg-slate-50 text-slate-700 border-slate-100', dot: 'bg-slate-500', glow: 'shadow-slate-100' },
            'RTO': { color: 'rose', bg: 'from-rose-500 to-red-500', badge: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500', glow: 'shadow-rose-100' }
        };
        const config = statusMap[status] || { color: 'slate', bg: 'from-slate-500 to-gray-500', badge: 'bg-slate-50 text-slate-700 border-slate-100', dot: 'bg-slate-500', glow: 'shadow-slate-100' };

        const hasRequestedDelivery = o?.deliveryRequests?.some((request) => request.employeeId === currentUser?.id);

        const displayDate = o?.timestamp ? new Date(o.timestamp).toLocaleDateString() : '';
        const displayTime = o?.timestamp ? new Date(o.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

        const hasTracking = Boolean(o?.shiprocket?.awb || o?.tracking?.trackingId);
        const trackingId = o?.shiprocket?.awb || o?.tracking?.trackingId || '';

        // Initials avatar
        const initials = String(o?.customerName || 'C').trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();

        // Icon SVGs
        const phoneIcon = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>`;
        const locationIcon = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

        const reorderPayload = JSON.stringify(o).replace(/'/g, '&#39;');

        return `
        <div class="relative overflow-hidden hover:scale-[1.01] hover:shadow-2xl transition-all duration-500 bg-white border border-slate-100 rounded-3xl flex flex-col h-full group" style="box-shadow: 0 10px 30px -10px rgba(148, 163, 184, 0.12), 0 1px 3px rgba(148, 163, 184, 0.04);" data-mobile="${escapeHtml(o?.telNo || o?.mobile || '')}">
            <!-- Premium Left Active Tag & Gradient Glow -->
            <div class="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${config.bg} rounded-l-full"></div>
            
            <!-- Card Header -->
            <div class="px-5 pt-5 pb-4 flex justify-between items-center z-10 pl-6">
                <div class="flex items-center gap-2">
                    <span class="bg-slate-50 border border-slate-100 text-slate-700 px-3 py-1 rounded-xl font-black text-[10px] tracking-widest shadow-sm font-mono uppercase">#${escapeHtml(o?.orderId || '')}</span>
                    <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(o).replace(/"/g, '&quot;')})" 
                        class="w-8 h-8 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white hover:scale-110 active:scale-95 shadow-sm transition-all duration-300" title="Send WhatsApp">
                        ${WHATSAPP_ICON}
                    </button>
                    ${(o?.orderType === 'REORDER' || o?.orderType === 'Reorder') ? `<span class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest shadow-sm uppercase">REORDER</span>` : ''}
                </div>
                <div class="flex flex-col items-end">
                    <span class="text-[9px] text-slate-400 font-bold tracking-wide leading-none uppercase">Amount</span>
                    <span class="text-base font-black text-slate-800 mt-1">₹${escapeHtml(o?.total || 0)}</span>
                </div>
            </div>

            <!-- Profile & Status Banner -->
            <div class="px-5 pb-4 flex items-center gap-3.5 pl-6">
                <!-- Avatar circle -->
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${config.bg} text-white font-black text-sm flex items-center justify-center shadow-md ${config.glow} shrink-0 relative group-hover:rotate-3 transition-transform duration-300">
                    ${initials}
                    <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 ${config.dot} border border-white rounded-full animate-pulse shadow-sm"></span>
                </div>
                <div class="min-w-0 flex-1">
                    <h3 class="font-black text-slate-800 text-base leading-tight truncate capitalize" title="${escapeHtml(o?.customerName || '')}">${escapeHtml(o?.customerName || '')}</h3>
                    ${o?.fatherOrHusbandName ? `<p class="text-[10px] font-bold text-slate-400 mt-0.5 truncate uppercase tracking-tight">${o.gender === 'Female' ? 'W/O' : 'S/O'}: ${escapeHtml(o.fatherOrHusbandName)}</p>` : `<p class="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">Customer</p>`}
                </div>
                <div class="flex flex-col items-end shrink-0">
                    <span class="${config.badge} px-2.5 py-1 rounded-lg text-[9px] font-extrabold border uppercase tracking-wider">${escapeHtml(status)}</span>
                </div>
            </div>

            <!-- Details list -->
            <div class="px-5 pb-4 space-y-3 pl-6 flex-grow">
                <!-- Relative time Row -->
                <div class="flex flex-wrap items-center gap-2">
                    <div class="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl shadow-inner w-fit">
                        📅 <span class="text-slate-600 font-extrabold uppercase">${escapeHtml(displayDate)}</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl shadow-inner w-fit">
                        ⏰ <span class="text-slate-600 font-extrabold uppercase">${escapeHtml(displayTime)}</span>
                    </div>
                </div>

                <!-- Phone Strip -->
                <div class="flex items-center gap-2.5 bg-gradient-to-r from-blue-50/50 to-cyan-50/20 px-3.5 py-2.5 rounded-2xl border border-blue-100/50 shadow-inner group/phone hover:border-blue-200 transition-colors">
                    <span class="text-blue-500 bg-white w-7 h-7 rounded-lg flex items-center justify-center shadow-sm border border-blue-100">${phoneIcon}</span>
                    <span class="text-sm font-black font-mono tracking-wider text-blue-950">${escapeHtml(o?.telNo || o?.mobile || '')}</span>
                    ${o?.altNo ? `<span class="text-[9px] text-slate-500 font-extrabold ml-auto bg-white px-2 py-1 rounded-lg border border-slate-100">ALT: ${escapeHtml(o.altNo)}</span>` : ''}
                </div>

                <!-- Minimal Shipping Box -->
                <div class="space-y-2 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 group-hover:bg-slate-50/80 transition-colors">
                    <div class="flex items-center gap-1.5 text-indigo-500 font-black text-[9px] uppercase tracking-widest leading-none">
                        ${locationIcon} <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Delivery Address</span>
                    </div>
                    <p class="text-xs text-slate-700 font-bold leading-relaxed line-clamp-2 capitalize">
                        ${escapeHtml(o?.address || '')}
                    </p>
                    <div class="flex gap-1.5 items-center pt-1.5 border-t border-slate-200/50">
                        <span class="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg text-[9px] font-black font-mono">PIN: ${escapeHtml(o?.pin || 'N/A')}</span>
                        <span class="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg text-[9px] font-black capitalize">${escapeHtml(o?.state || 'N/A')}</span>
                        <button onclick="copyAddress('${(o?.address || '').replace(/'/g, "\\'")}')" 
                            class="text-[9px] text-blue-600 hover:text-blue-700 font-black ml-auto flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 transition-all shadow-sm">📋 COPY</button>
                    </div>
                </div>

                <!-- Tracking ID Box -->
                ${trackingId ? `
                <div class="flex items-center gap-2.5 bg-indigo-50/50 px-3.5 py-2.5 rounded-2xl border border-indigo-100 shadow-inner">
                    <span class="text-indigo-500 bg-white w-7 h-7 rounded-lg flex items-center justify-center shadow-sm border border-indigo-100">🧾</span>
                    <div class="flex-grow">
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tracking AWB</p>
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-mono font-black text-indigo-950 tracking-wider">${escapeHtml(trackingId)}</span>
                            <button onclick="copyTracking('${escapeHtml(trackingId)}')" class="text-xs text-indigo-500 hover:text-indigo-700 font-bold">📋 COPY</button>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Notes/Remarks -->
                ${o?.remark ? `
                <div class="bg-amber-50/60 border border-amber-100 p-3.5 rounded-2xl shadow-sm">
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs">💬</span>
                        <span class="text-[9px] text-amber-500 font-black uppercase tracking-widest leading-none">Your Remark</span>
                    </div>
                    <p class="text-xs text-amber-900 font-black italic mt-1.5 leading-relaxed">"${escapeHtml(o.remark)}"</p>
                </div>
                ` : ''}

                ${o?.verificationRemark && o?.verificationRemark?.text ? `
                <div class="bg-rose-50/60 border border-rose-100 p-3.5 rounded-2xl shadow-sm">
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs">⚠️</span>
                        <span class="text-[9px] text-rose-500 font-black uppercase tracking-widest leading-none">Verification Remark</span>
                    </div>
                    <p class="text-xs text-rose-900 font-black italic mt-1.5 leading-relaxed">"${escapeHtml(o.verificationRemark.text)}"</p>
                </div>
                ` : ''}

                <!-- Delivery Request Section -->
                ${status === 'Dispatched' ? `
                <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span class="text-xs text-slate-400 font-bold">Delivery Status</span>
                    ${!hasRequestedDelivery ? `
                        <button type="button" onclick="requestDelivery('${escapeHtml(o?.orderId || '')}')" class="text-xs bg-pink-50 text-pink-600 px-3 py-1.5 rounded-xl font-black border border-pink-100 hover:bg-pink-100 transition-colors shadow-sm">
                            ✋ Request Delivery
                        </button>
                    ` : `
                        <span class="text-[10px] bg-pink-100 text-pink-700 px-2.5 py-1.5 rounded-xl font-bold border border-pink-200">⏳ Req Pending</span>
                    `}
                </div>
                ` : ''}
            </div>

            <!-- Tracking Badge if Dispatched/Delivered -->
            ${['Dispatched', 'Delivered', 'Out For Delivery'].includes(status) ? getTrackingStatusBadge(o) : ''}

            <!-- Actions Footer -->
            <div class="p-4 bg-slate-50/50 border-t border-slate-100/80 space-y-2 mt-auto rounded-b-3xl">
                <button type="button" onclick="viewOrder('${escapeHtml(o?.orderId || '')}')" 
                    class="w-full bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 py-3 rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center gap-2">
                    👁️ View Details
                </button>
                ${['Pending', 'On Hold', 'Address Verified', 'Unverified'].includes(status) ? `
                <button type="button" onclick="editOrder('${escapeHtml(o?.orderId || '')}')" 
                    class="w-full bg-amber-500 border border-amber-500 text-white hover:bg-amber-600 py-3 rounded-xl text-xs font-black shadow-md shadow-amber-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                    ✏️ Edit Order
                </button>
                ` : ''}
                ${(isHistory || ['Delivered', 'Returned', 'Cancelled', 'RTO'].includes(status)) ? `
                <button onclick='reorderFromHistory(${reorderPayload})' 
                    class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg py-3 rounded-xl text-xs font-black shadow-md shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                    🔄 Reorder
                </button>
                ` : ''}
                ${trackingId ? `
                 <button type="button" onclick="trackShiprocketOrder('${escapeHtml(o?.orderId || '')}', '${escapeHtml(trackingId)}')" 
                    class="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3 rounded-xl text-xs font-black shadow-md shadow-indigo-200 hover:shadow-lg active:scale-95 transition-colors flex items-center justify-center gap-2">
                    🛰️ Track Package
                </button>
                ` : ''}
            </div>
        </div>`;
    }

    function renderProgressCards(stats) {
        const list = document.getElementById('empProgressStats');
        if (!list) {
            return;
        }

        const cards = [
            { label: 'Total Orders', value: stats.total || 0, color: 'blue' },
            { label: 'On Hold', value: stats.hold || 0, color: 'yellow' },
            { label: 'Cancelled', value: stats.cancelled || 0, color: 'red' },
            { label: 'Dispatched', value: stats.dispatched || 0, color: 'purple' },
            { label: 'Delivered', value: stats.delivered || 0, color: 'green' },
            { label: 'RTO', value: stats.rto || 0, color: 'rose' }
        ];

        const colorMap = {
            blue: 'bg-blue-50 text-blue-600 border-blue-100',
            yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
            red: 'bg-red-50 text-red-600 border-red-100',
            purple: 'bg-purple-50 text-purple-600 border-purple-100',
            green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            rose: 'bg-rose-50 text-rose-600 border-rose-100'
        };

        list.innerHTML = cards.map((card) => `
            <div class="glass-card p-4 border ${colorMap[card.color]} flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
                <div class="text-2xl font-bold mb-1">${escapeHtml(card.value)}</div>
                <div class="text-xs font-bold uppercase tracking-wider opacity-80">${escapeHtml(card.label)}</div>
            </div>
        `).join('');
    }

    panel.shared.renderers = {
        escapeHtml,
        filterCardGrid,
        generatePageNumbers,
        getItemsPerPage,
        getTrackingStatusBadge,
        handleEmpItemsChange,
        paginate,
        renderEmpOrderCard,
        renderPaginationControls,
        renderProgressCards,
        setItemsPerPage
    };

    window.generatePageNumbers = generatePageNumbers;
    window.handleEmpItemsChange = handleEmpItemsChange;
})();
