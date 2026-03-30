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
        const status = order?.status || 'Unknown';
        let statusColor = 'gray';
        if (status === 'Pending') statusColor = 'yellow';
        else if (status === 'Address Verified') statusColor = 'emerald';
        else if (status === 'Dispatched') statusColor = 'indigo';
        else if (status === 'Out For Delivery') statusColor = 'orange';
        else if (status === 'Delivered') statusColor = 'green';
        else if (status === 'On Hold') statusColor = 'amber';
        else if (status === 'Cancelled') statusColor = 'red';
        else if (status === 'RTO') statusColor = 'rose';

        const hasTracking = Boolean(order?.shiprocket?.awb || order?.tracking?.trackingId);
        const trackingId = order?.shiprocket?.awb || order?.tracking?.trackingId || '';
        const hasRequestedDelivery = order?.deliveryRequests?.some((request) => request.employeeId === currentUser?.id);
        const reorderPayload = JSON.stringify(order).replace(/'/g, '&#39;');

        let actions = `
            <button onclick="viewOrder('${escapeHtml(order?.orderId || '')}')" class="text-blue-500 text-xs font-bold hover:bg-blue-50 px-3 py-2 rounded-lg">
                View
            </button>
        `;

        if (hasTracking) {
            actions = `
                <button onclick="trackShiprocketOrder('${escapeHtml(order?.orderId || '')}', '${escapeHtml(trackingId)}')" class="text-orange-600 text-xs font-bold hover:bg-orange-50 px-3 py-2 rounded-lg mr-1">
                    Track
                </button>
                ${actions}
            `;
        }

        if (isHistory) {
            actions += `<button onclick='reorderFromHistory(${reorderPayload})' class="text-green-600 text-xs font-bold hover:bg-green-50 px-3 py-2 rounded-lg ml-2">Reorder</button>`;
        }

        return `
            <div class="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow" data-mobile="${escapeHtml(order?.telNo || order?.mobile || '')}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="text-xs font-bold text-${statusColor}-600 bg-${statusColor}-50 px-2 py-1 rounded-lg mb-1 inline-block">${escapeHtml(status)}</span>
                        <h4 class="font-bold text-gray-800">${escapeHtml(order?.customerName || '')}</h4>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-sm">Rs ${escapeHtml(order?.total || 0)}</p>
                        <p class="text-xs text-gray-400">${order?.timestamp ? escapeHtml(new Date(order.timestamp).toLocaleDateString()) : ''}</p>
                    </div>
                </div>
                ${order?.remark ? `<div class="bg-yellow-50 border border-yellow-100 p-2 rounded-lg mb-3 text-xs text-yellow-800"><strong>Remark:</strong> ${escapeHtml(order.remark)}</div>` : ''}
                <p class="text-xs text-gray-500 mb-3 truncate">${escapeHtml(order?.address || '')}</p>
                ${status === 'Dispatched' && !hasRequestedDelivery ? `
                    <div class="mb-3">
                        <button type="button" onclick="requestDelivery('${escapeHtml(order?.orderId || '')}')" class="text-xs bg-pink-50 text-pink-600 px-3 py-2 rounded-lg font-bold hover:bg-pink-100 transition-colors">
                            Request Delivery
                        </button>
                    </div>
                ` : ''}
                ${hasRequestedDelivery && status === 'Dispatched' ? `
                    <div class="mb-3">
                        <span class="text-[10px] bg-pink-100 text-pink-700 px-2 py-1 rounded-lg font-bold">Request Pending</span>
                    </div>
                ` : ''}
                ${['Dispatched', 'Delivered', 'Out For Delivery'].includes(status) ? getTrackingStatusBadge(order) : ''}
                <div class="flex justify-between items-center border-t border-gray-100 pt-3 mt-3">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-mono text-gray-400">#${escapeHtml(order?.orderId || '')}</span>
                        <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(order).replace(/"/g, '&quot;')})" class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 shadow-sm transition-all" title="Send WhatsApp">
                            W
                        </button>
                    </div>
                    <div>${actions}</div>
                </div>
            </div>
        `;
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
