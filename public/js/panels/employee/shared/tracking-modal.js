(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });

    function byId(id) {
        return document.getElementById(id);
    }

    function ensureTrackingModal() {
        if (byId('trackingModal')) {
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'trackingModal';
        modal.className = 'hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[10020] p-4 overflow-y-auto';
        modal.innerHTML = `
            <div class="min-h-full flex items-center justify-center">
                <div class="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                    <div id="trackingHeader" class="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex justify-between items-center">
                        <div>
                            <p class="text-[11px] font-black uppercase tracking-[0.25em] text-white/70">Live Tracking</p>
                            <h3 class="text-2xl font-black text-white mt-1">Shipment Timeline</h3>
                            <p id="trackingOrderId" class="text-white/80 text-sm font-medium mt-1">Order: -</p>
                        </div>
                        <button type="button" onclick="closeEmployeeTrackingModal()" class="w-11 h-11 rounded-full bg-white/15 text-white text-2xl hover:bg-white/25 transition-colors">x</button>
                    </div>
                    <div class="p-6 lg:p-8 bg-slate-50">
                        <div class="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
                            <div class="space-y-4">
                                <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                    <div class="flex items-center gap-4 mb-4">
                                        <div id="trackingStatusIcon" class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-black">..</div>
                                        <div>
                                            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Status</p>
                                            <p id="trackingStatusText" class="text-lg font-black text-slate-800 mt-1">Fetching...</p>
                                        </div>
                                    </div>
                                    <div class="space-y-3 text-sm">
                                        <div class="flex justify-between gap-4">
                                            <span class="text-slate-500 font-medium">AWB</span>
                                            <span id="trackingAWB" class="font-mono font-bold text-slate-800 text-right">-</span>
                                        </div>
                                        <div class="flex justify-between gap-4">
                                            <span class="text-slate-500 font-medium">Courier</span>
                                            <span id="trackingCourier" class="font-bold text-slate-800 text-right">-</span>
                                        </div>
                                        <div class="flex justify-between gap-4">
                                            <span class="text-slate-500 font-medium">Location</span>
                                            <span id="trackingLocation" class="font-bold text-slate-800 text-right">-</span>
                                        </div>
                                        <div class="flex justify-between gap-4">
                                            <span class="text-slate-500 font-medium">Last Update</span>
                                            <span id="trackingLastUpdate" class="font-medium text-slate-700 text-right">-</span>
                                        </div>
                                        <div class="flex justify-between gap-4">
                                            <span class="text-slate-500 font-medium">EDD</span>
                                            <span id="trackingEDD" class="font-medium text-slate-700 text-right">-</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                    <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Shipment Details</p>
                                    <div class="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p class="text-slate-400 text-[10px] font-black uppercase tracking-wide mb-1">Origin</p>
                                            <p id="trackingOrigin" class="font-bold text-slate-700">-</p>
                                        </div>
                                        <div>
                                            <p class="text-slate-400 text-[10px] font-black uppercase tracking-wide mb-1">Destination</p>
                                            <p id="trackingDestination" class="font-bold text-slate-700">-</p>
                                        </div>
                                        <div>
                                            <p class="text-slate-400 text-[10px] font-black uppercase tracking-wide mb-1">Weight</p>
                                            <p id="trackingWeight" class="font-bold text-slate-700">-</p>
                                        </div>
                                        <div>
                                            <p class="text-slate-400 text-[10px] font-black uppercase tracking-wide mb-1">Pieces</p>
                                            <p id="trackingPieces" class="font-bold text-slate-700">-</p>
                                        </div>
                                        <div>
                                            <p class="text-slate-400 text-[10px] font-black uppercase tracking-wide mb-1">Pickup</p>
                                            <p id="trackingPickupDate" class="font-bold text-slate-700">-</p>
                                        </div>
                                        <div>
                                            <p class="text-slate-400 text-[10px] font-black uppercase tracking-wide mb-1">POD</p>
                                            <p id="trackingPOD" class="font-bold text-slate-700">-</p>
                                        </div>
                                    </div>
                                    <a id="trackingExternalLink" href="#" target="_blank" rel="noreferrer" class="mt-5 inline-flex items-center justify-center w-full px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-100 transition-colors">
                                        Open courier tracking
                                    </a>
                                </div>
                            </div>

                            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                <div class="mb-6">
                                    <div class="relative h-10">
                                        <div class="absolute top-5 left-8 right-8 h-1 bg-slate-200 rounded-full"></div>
                                        <div id="trackingProgressLine" class="absolute top-5 left-8 h-1 bg-blue-500 rounded-full transition-all duration-700" style="width:0%"></div>
                                        <div class="relative grid grid-cols-4 gap-4">
                                            <div class="flex flex-col items-center gap-2">
                                                <div id="stepIndicator1" class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-black text-slate-600">1</div>
                                                <span class="text-[10px] font-black uppercase tracking-wide text-slate-400">Booked</span>
                                            </div>
                                            <div class="flex flex-col items-center gap-2">
                                                <div id="stepIndicator2" class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-black text-slate-600">2</div>
                                                <span class="text-[10px] font-black uppercase tracking-wide text-slate-400">Transit</span>
                                            </div>
                                            <div class="flex flex-col items-center gap-2">
                                                <div id="stepIndicator3" class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-black text-slate-600">3</div>
                                                <span class="text-[10px] font-black uppercase tracking-wide text-slate-400">OFD</span>
                                            </div>
                                            <div class="flex flex-col items-center gap-2">
                                                <div id="stepIndicator4" class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-black text-slate-600">4</div>
                                                <span class="text-[10px] font-black uppercase tracking-wide text-slate-400">Done</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center justify-between mb-4">
                                    <div>
                                        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timeline</p>
                                        <p id="trackingCount" class="text-sm font-bold text-slate-600 mt-1">0 updates</p>
                                    </div>
                                </div>
                                <div id="trackingTimeline" class="min-h-[220px]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeTrackingModal();
            }
        });

        document.body.appendChild(modal);
    }

    function closeTrackingModal() {
        const modal = byId('trackingModal');
        if (!modal) {
            return;
        }

        if (typeof closeModal === 'function') {
            closeModal('trackingModal');
            return;
        }

        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    function getTrackingLink(courierName, awb) {
        const courier = String(courierName || '').toLowerCase();
        if (!awb) {
            return '#';
        }

        if (courier.includes('india post') || courier.includes('speed post')) {
            return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consignmentid=${encodeURIComponent(awb)}`;
        }

        if (courier.includes('blue')) {
            return `https://www.bluedart.com/tracking/${encodeURIComponent(awb)}`;
        }

        if (courier.includes('dtdc')) {
            return `https://www.dtdc.in/tracking.asp?strCnno=${encodeURIComponent(awb)}`;
        }

        if (courier.includes('delhivery')) {
            return `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`;
        }

        if (courier.includes('xpressbees')) {
            return `https://www.xpressbees.com/track/${encodeURIComponent(awb)}`;
        }

        if (courier.includes('ecom')) {
            return `https://www.ecomexpress.in/tracking/?awb_field=${encodeURIComponent(awb)}`;
        }

        return `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
    }

    function setProgress(step, theme) {
        const validStep = Math.min(Math.max(step, 1), 4);
        const widths = ['0%', '33%', '66%', '100%'];
        const progressLine = byId('trackingProgressLine');

        if (progressLine) {
            progressLine.style.width = widths[validStep - 1] || '0%';
            progressLine.className = `absolute top-5 left-8 h-1 rounded-full transition-all duration-700 ${theme.line}`;
        }

        for (let index = 1; index <= 4; index += 1) {
            const indicator = byId(`stepIndicator${index}`);
            if (!indicator) {
                continue;
            }

            indicator.className = index <= validStep
                ? `w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white ${theme.line}`
                : 'w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-black text-slate-600';
        }
    }

    function formatTimeline(scans, currentStatus, theme, awb) {
        if (!Array.isArray(scans) || scans.length === 0) {
            byId('trackingCount').textContent = '1 update';
            return `
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p class="text-base font-bold ${theme.text}">${escapeHtml(currentStatus || 'In Transit')}</p>
                    <p class="text-xs text-slate-500 mt-2">AWB: ${escapeHtml(awb || '-')}</p>
                </div>
            `;
        }

        byId('trackingCount').textContent = `${scans.length} updates`;
        return scans.map((scan, index) => {
            const statusLower = String(scan.status || '').toLowerCase();
            let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
            let dotClass = 'bg-slate-400';

            if (statusLower.includes('delivered') && !statusLower.includes('undelivered')) {
                badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                dotClass = 'bg-emerald-500';
            } else if (statusLower.includes('out for delivery') || statusLower.includes('ofd')) {
                badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                dotClass = 'bg-purple-500';
            } else if (statusLower.includes('transit') || statusLower.includes('shipped') || statusLower.includes('arrived') || statusLower.includes('reached')) {
                badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                dotClass = 'bg-blue-500';
            } else if (statusLower.includes('picked') || statusLower.includes('pickup') || statusLower.includes('dispatched')) {
                badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                dotClass = 'bg-amber-500';
            } else if (statusLower.includes('rto') || statusLower.includes('return') || statusLower.includes('cancel') || statusLower.includes('undelivered')) {
                badgeClass = 'bg-red-50 text-red-700 border-red-200';
                dotClass = 'bg-red-500';
            }

            let dateLabel = '';
            let timeLabel = '';
            if (scan.date) {
                const parsedDate = new Date(scan.date);
                if (!Number.isNaN(parsedDate.getTime())) {
                    dateLabel = parsedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                    timeLabel = parsedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                } else {
                    const parts = String(scan.date).split(' ');
                    dateLabel = parts[0] || String(scan.date);
                    timeLabel = parts[1] || '';
                }
            }

            return `
                <div class="relative pl-12 ${index === scans.length - 1 ? '' : 'pb-6 border-l-2 border-slate-100'}" style="margin-left:12px;">
                    <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full ${index === 0 ? 'ring-4 ring-offset-2 ring-blue-200 ' : ''}${dotClass}"></div>
                    <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm ml-2">
                        <div class="flex items-start justify-between gap-3 mb-2">
                            <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${badgeClass}">
                                ${escapeHtml(scan.status || 'Update')}
                            </span>
                            <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap">${escapeHtml(timeLabel)}</span>
                        </div>
                        <p class="text-sm font-semibold text-slate-800 leading-relaxed">${escapeHtml(scan.activity || scan.status || 'Status Update')}</p>
                        <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3">
                            <span>${escapeHtml(scan.location || 'N/A')}</span>
                            <span>${escapeHtml(dateLabel)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function showLocalTrackingFallback(orderId, awb, errorMessage) {
        try {
            const response = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}`);
            const payload = await response.json();

            if (payload.success && payload.order) {
                const order = payload.order;
                byId('trackingAWB').textContent = awb || order.tracking?.trackingId || '-';
                byId('trackingCourier').textContent = order.tracking?.courier || (order.shiprocket?.awb ? 'Shiprocket' : 'India Post');
                byId('trackingStatusIcon').textContent = 'i';
                byId('trackingStatusText').textContent = `Status: ${order.status || 'Dispatched'}`;
                byId('trackingDestination').textContent = order.city || order.state || '-';
                byId('trackingLocation').textContent = order.city || 'In Transit';
                byId('trackingTimeline').innerHTML = `
                    <div class="p-6 text-center">
                        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                            <p class="text-amber-700 font-bold text-sm mb-1">External tracking unavailable</p>
                            <p class="text-amber-600 text-[11px] leading-relaxed">Showing system record instead.</p>
                        </div>
                        <div class="text-left bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
                            <div class="mb-4">
                                <p class="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Destination Address</p>
                                <p class="text-sm font-bold text-slate-800">${escapeHtml(order.address || '')}${order.pin ? `, ${escapeHtml(order.pin)}` : ''}</p>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <p class="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Last System Status</p>
                                    <p class="text-sm font-black text-blue-600">${escapeHtml(order.status || 'Dispatched')}</p>
                                </div>
                                <div>
                                    <p class="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Phone</p>
                                    <p class="text-sm font-bold text-slate-800">${escapeHtml(order.telNo || order.mobile || '-')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                const externalLink = getTrackingLink(byId('trackingCourier').textContent, awb || order.tracking?.trackingId || '');
                byId('trackingExternalLink').href = externalLink;
                byId('trackingCount').textContent = 'Fallback';
                return;
            }
        } catch (error) {
            console.error('Local tracking fallback failed:', error);
        }

        byId('trackingStatusIcon').textContent = '!';
        byId('trackingStatusText').textContent = 'Tracking unavailable';
        byId('trackingTimeline').innerHTML = `
            <div class="p-10 text-center">
                <p class="text-red-500 font-bold mb-1">Tracking not available</p>
                <p class="text-slate-400 text-xs">${escapeHtml(errorMessage || 'Unknown error')}</p>
                <button type="button" onclick="trackShiprocketOrder('${escapeHtml(orderId)}', '${escapeHtml(awb || '')}')" class="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-100 transition-colors">
                    Retry
                </button>
            </div>
        `;
        byId('trackingCount').textContent = 'Error';
    }

    async function trackShiprocketOrder(orderId, awb) {
        ensureTrackingModal();

        let courierName = '';
        try {
            const orderResponse = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}`);
            const orderPayload = await orderResponse.json();
            if (orderPayload.success && orderPayload.order) {
                courierName = (orderPayload.order.tracking?.courier || orderPayload.order.shiprocket?.courierName || '').toLowerCase();
            }
        } catch (error) {
            console.warn('Courier detection failed:', error);
        }

        const isIndiaPost = /^[A-Z]{2}\d{9}IN$/i.test(awb || '') || courierName.includes('india post') || courierName.includes('speed post');
        const isBlueDart = courierName.includes('blue') || courierName.includes('bluedart');
        let displayCourier = 'Shiprocket';
        if (isIndiaPost) displayCourier = 'India Post';
        if (isBlueDart) displayCourier = 'BlueDart';

        byId('trackingOrderId').textContent = `Order: ${orderId}`;
        byId('trackingAWB').textContent = awb || '-';
        byId('trackingCourier').textContent = displayCourier;
        byId('trackingStatusIcon').textContent = '...';
        byId('trackingStatusText').textContent = 'Fetching...';
        byId('trackingLocation').textContent = 'Fetching...';
        byId('trackingLastUpdate').textContent = '';
        byId('trackingCount').textContent = '';
        byId('trackingTimeline').innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-slate-400">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                <p class="text-sm font-medium">Contacting ${escapeHtml(displayCourier)}...</p>
            </div>
        `;
        byId('trackingModal').classList.remove('hidden');
        byId('trackingModal').style.display = 'block';

        try {
            let response;
            if (isIndiaPost) {
                response = await fetch(`${API_URL}/orders/track-indiapost/${encodeURIComponent(orderId)}`, { method: 'POST' });
            } else if (isBlueDart) {
                response = await fetch(`${API_URL}/orders/track-bluedart/${encodeURIComponent(orderId)}`, { method: 'POST' });
            } else {
                response = await fetch(`${API_URL}/shiprocket/track/${encodeURIComponent(awb || '')}`);
            }

            const data = await response.json();
            if (!data.success || (!data.tracking && !data.allScans)) {
                await showLocalTrackingFallback(orderId, awb, data.message || 'No tracking information found');
                return;
            }

            const tracking = data.tracking || {
                awb,
                courierName: displayCourier,
                currentStatus: data.status,
                location: data.location || data.allScans?.[0]?.location || 'In Transit',
                lastUpdate: data.lastUpdate,
                origin: data.origin,
                destination: data.destination,
                delivered: data.delivered,
                allScans: (data.allScans || []).map((scan) => ({
                    status: scan.status || scan.activity,
                    activity: scan.activity || scan.status,
                    location: scan.location,
                    date: scan.date
                }))
            };

            let icon = 'BOX';
            let step = 1;
            let theme = { header: 'from-blue-600 to-indigo-600', text: 'text-blue-700', line: 'bg-blue-500' };
            const statusText = String(tracking.currentStatus || '').toLowerCase();

            if (statusText.includes('delivered')) {
                step = 4;
                icon = 'OK';
                theme = { header: 'from-emerald-600 to-teal-500', text: 'text-emerald-700', line: 'bg-emerald-500' };
            } else if (statusText.includes('out for') || statusText.includes('ofd')) {
                step = 3;
                icon = 'OFD';
                theme = { header: 'from-purple-600 to-fuchsia-500', text: 'text-purple-700', line: 'bg-purple-500' };
            } else if (statusText.includes('ship') || statusText.includes('transit') || statusText.includes('arrived') || statusText.includes('pickup') || statusText.includes('dispatched') || statusText.includes('way')) {
                step = 2;
                icon = 'GO';
                theme = { header: 'from-indigo-600 to-blue-500', text: 'text-indigo-700', line: 'bg-indigo-500' };
            } else if (statusText.includes('return') || statusText.includes('rto') || statusText.includes('cancel') || statusText.includes('undelivered')) {
                step = 1;
                icon = 'RTO';
                theme = { header: 'from-red-600 to-orange-500', text: 'text-red-700', line: 'bg-red-500' };
            }

            const header = byId('trackingHeader');
            if (header) {
                header.className = `bg-gradient-to-r ${theme.header} p-5 flex justify-between items-center`;
            }

            setProgress(step, theme);

            byId('trackingAWB').textContent = tracking.awb || awb || '-';
            byId('trackingCourier').textContent = tracking.courierName || displayCourier;
            byId('trackingStatusIcon').textContent = icon;
            byId('trackingOrigin').textContent = tracking.origin || '-';
            byId('trackingDestination').textContent = tracking.destination || data.destination || '-';
            byId('trackingWeight').textContent = tracking.weight ? `${tracking.weight} kg` : '-';
            byId('trackingPieces').textContent = tracking.packages || '-';
            byId('trackingPickupDate').textContent = tracking.pickupDate || '-';
            byId('trackingPOD').textContent = tracking.podStatus || '-';
            byId('trackingStatusText').textContent = `${data.cached ? '[CACHED] ' : ''}${tracking.currentStatus || 'In Transit'}`;
            byId('trackingLastUpdate').textContent = tracking.lastUpdate ? `Updated: ${tracking.lastUpdate}` : '-';
            byId('trackingLocation').textContent = tracking.location || 'In Transit';

            const eddNode = byId('trackingEDD');
            if (eddNode) {
                if (tracking.edd) {
                    const parsedDate = new Date(tracking.edd);
                    eddNode.textContent = Number.isNaN(parsedDate.getTime())
                        ? tracking.edd
                        : parsedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                } else {
                    eddNode.textContent = '-';
                }
            }

            byId('trackingTimeline').innerHTML = formatTimeline(tracking.allScans, tracking.currentStatus, theme, awb);
            byId('trackingExternalLink').href = getTrackingLink(tracking.courierName || displayCourier, tracking.awb || awb || '');
        } catch (error) {
            console.error('Tracking error:', error);
            await showLocalTrackingFallback(orderId, awb, error.message);
        }
    }

    function init() {
        ensureTrackingModal();
    }

    panel.shared.trackingModal = {
        close: closeTrackingModal,
        open: trackShiprocketOrder
    };

    window.closeEmployeeTrackingModal = closeTrackingModal;
    window.trackShiprocketOrder = trackShiprocketOrder;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
