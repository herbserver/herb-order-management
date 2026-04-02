// Employee Order Notification System
// Hybrid model: realtime socket updates + polling fallback.

if (!window.orderNotificationState) {
    window.orderNotificationState = {
        initialized: false,
        interval: null,
        socket: null,
        orderMap: new Map(),
        shownAlerts: new Map()
    };
}

const ORDER_NOTIFICATION_POLL_MS = 12 * 1000;
const ORDER_NOTIFICATION_EVENT_TTL_MS = 5 * 60 * 1000;

function normalizeEmployeeId(value) {
    return String(value || '').trim().toUpperCase();
}

function getCurrentEmployeeIdSafe() {
    if (typeof currentUser === 'undefined' || !currentUser) return '';
    return normalizeEmployeeId(currentUser.id || currentUser.employeeId || '');
}

function ensureAlertRoot() {
    let root = document.getElementById('employeeOrderAlertsRoot');
    if (!root) {
        root = document.createElement('div');
        root.id = 'employeeOrderAlertsRoot';
        root.className = 'employee-order-alerts-root';
        document.body.appendChild(root);
    }
    return root;
}

function pickMessageFromStatus(previousStatus, currentStatus) {
    if (previousStatus && currentStatus && previousStatus !== currentStatus) {
        return `${previousStatus} -> ${currentStatus}`;
    }
    if (currentStatus) {
        return `Status: ${currentStatus}`;
    }
    return 'Order details updated';
}

function buildUpdateMessage(previousState, currentState) {
    if (!previousState) return 'Order details updated';

    if (previousState.status !== currentState.status) {
        return `${previousState.status || 'Unknown'} -> ${currentState.status || 'Updated'}`;
    }
    if (previousState.trackingStatus !== currentState.trackingStatus) {
        return `Tracking: ${currentState.trackingStatus || 'Updated'}`;
    }
    if (previousState.verificationRemark !== currentState.verificationRemark) {
        return 'Verification remark updated';
    }
    if (previousState.deliveryRequestedAt !== currentState.deliveryRequestedAt) {
        return 'Delivery request updated';
    }
    if (previousState.holdReason !== currentState.holdReason || previousState.holdAt !== currentState.holdAt) {
        return 'Hold details updated';
    }
    if (previousState.dispatchedAt !== currentState.dispatchedAt) {
        return 'Dispatch details updated';
    }
    if (previousState.deliveredAt !== currentState.deliveredAt) {
        return 'Delivery confirmation updated';
    }
    if (previousState.rtoAt !== currentState.rtoAt) {
        return 'RTO status updated';
    }
    if (previousState.remark !== currentState.remark) {
        return 'Order remark updated';
    }

    return 'Order details updated';
}

function getOrderState(order) {
    return {
        status: String(order?.status || ''),
        trackingStatus: String(order?.tracking?.currentStatus || ''),
        verificationRemark: String(order?.verificationRemark?.text || ''),
        deliveryRequestedAt: String(order?.deliveryRequestedAt || ''),
        holdReason: String(order?.holdDetails?.holdReason || ''),
        holdAt: String(order?.holdDetails?.holdAt || ''),
        dispatchedAt: String(order?.dispatchedAt || ''),
        deliveredAt: String(order?.deliveredAt || ''),
        rtoAt: String(order?.rtoAt || ''),
        updatedAt: String(order?.updatedAt || ''),
        remark: String(order?.remark || ''),
        deliveredBy: String(order?.deliveredBy || ''),
        rtoBy: String(order?.rtoBy || '')
    };
}

function hasStateChanged(previousState, nextState) {
    if (!previousState) return false;
    const keys = Object.keys(nextState);
    return keys.some((key) => previousState[key] !== nextState[key]);
}

function isOfdFlow(previousStatus, currentStatus, trackingStatus, deliveredBy, rtoBy) {
    const prev = String(previousStatus || '').toLowerCase();
    const curr = String(currentStatus || '').toLowerCase();
    const tracking = String(trackingStatus || '').toLowerCase();
    const by = `${deliveredBy || ''} ${rtoBy || ''}`.toLowerCase();

    if (curr.includes('out for delivery') || curr === 'delivered' || curr === 'rto') return true;
    if (prev.includes('out for delivery')) return true;
    if (tracking.includes('out for delivery')) return true;
    if (by.includes('delivery') && (curr === 'delivered' || curr === 'rto')) return true;

    return false;
}

function buildAlertPayload(order, previousState, source) {
    const currentState = getOrderState(order);
    const previousStatus = previousState?.status || '';
    const currentStatus = currentState.status || '';
    const ofdFlow = isOfdFlow(
        previousStatus,
        currentStatus,
        currentState.trackingStatus,
        currentState.deliveredBy,
        currentState.rtoBy
    );

    const priority = ofdFlow ? 'high' : 'normal';

    const signature = [
        currentState.status,
        currentState.trackingStatus,
        currentState.verificationRemark,
        currentState.deliveryRequestedAt,
        currentState.holdReason,
        currentState.holdAt,
        currentState.dispatchedAt,
        currentState.deliveredAt,
        currentState.rtoAt,
        currentState.updatedAt,
        currentState.remark
    ].join('|');

    return {
        id: `${order.orderId}-${currentStatus}-${currentState.updatedAt || currentState.deliveredAt || Date.now()}`,
        orderId: String(order.orderId || ''),
        employeeId: normalizeEmployeeId(order.employeeId),
        customerName: String(order.customerName || ''),
        previousStatus,
        currentStatus,
        trackingStatus: currentState.trackingStatus,
        signature,
        source: source || 'polling',
        priority,
        message: buildUpdateMessage(previousState, currentState)
    };
}

function cleanupShownAlerts() {
    const now = Date.now();
    const shown = window.orderNotificationState.shownAlerts;
    for (const [key, timestamp] of shown.entries()) {
        if (now - timestamp > ORDER_NOTIFICATION_EVENT_TTL_MS) {
            shown.delete(key);
        }
    }
}

function shouldShowAlert(alertPayload) {
    cleanupShownAlerts();
    const key = `${alertPayload.orderId}|${alertPayload.signature || `${alertPayload.currentStatus}|${alertPayload.trackingStatus}|${alertPayload.message}`}`;
    if (window.orderNotificationState.shownAlerts.has(key)) {
        return false;
    }

    window.orderNotificationState.shownAlerts.set(key, Date.now());
    return true;
}

function playOrderNotificationSound(priority) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const beepCount = priority === 'high' ? 3 : 1;
        const baseFrequency = priority === 'high' ? 880 : 620;

        for (let i = 0; i < beepCount; i++) {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = baseFrequency + i * 35;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(priority === 'high' ? 0.28 : 0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.25);
            }, i * 240);
        }
    } catch (error) {
        console.error('Order notification sound error:', error);
    }
}

function showBrowserOrderNotification(alertPayload) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const title = alertPayload.priority === 'high'
        ? 'High Alert: OFD/Delivery Update'
        : 'Order Update';
    const body = `${alertPayload.orderId} - ${alertPayload.message}`;

    new Notification(title, {
        body,
        icon: '/icon.png',
        requireInteraction: alertPayload.priority === 'high'
    });
}

function dismissOrderAlert(alertId) {
    const alertNode = document.getElementById(alertId);
    if (!alertNode) return;

    alertNode.classList.add('is-hiding');
    setTimeout(() => {
        alertNode.remove();
    }, 220);
}

function showOrderUpdateNotification(alertPayload) {
    if (!alertPayload.orderId) return;
    if (!shouldShowAlert(alertPayload)) return;

    const root = ensureAlertRoot();
    const alertId = `orderAlert-${alertPayload.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const isHigh = alertPayload.priority === 'high';
    const colorClass = isHigh ? 'high' : 'normal';
    const heading = isHigh ? 'High Alert' : 'Order Update';
    const sourceLabel = alertPayload.source ? `Source: ${alertPayload.source}` : '';

    const alert = document.createElement('div');
    alert.id = alertId;
    alert.className = `employee-order-alert ${colorClass}`;
    alert.innerHTML = `
        <div class="employee-order-alert-header">
            <div class="employee-order-alert-title-wrap">
                <div class="employee-order-alert-title">${heading}</div>
                <div class="employee-order-alert-subtitle">${alertPayload.orderId}${alertPayload.customerName ? ` - ${alertPayload.customerName}` : ''}</div>
            </div>
            ${isHigh ? '<span class="employee-order-alert-pill">STICKY</span>' : ''}
        </div>
        <div class="employee-order-alert-body">
            <div>${alertPayload.message || 'Order updated'}</div>
            ${sourceLabel ? `<div class="employee-order-alert-source">${sourceLabel}</div>` : ''}
        </div>
        <div class="employee-order-alert-actions">
            <button type="button" class="employee-alert-btn employee-alert-view">View</button>
            <button type="button" class="employee-alert-btn employee-alert-close">Close</button>
        </div>
    `;

    const viewButton = alert.querySelector('.employee-alert-view');
    const closeButton = alert.querySelector('.employee-alert-close');

    if (viewButton) {
        viewButton.addEventListener('click', () => {
            if (typeof viewOrder === 'function') {
                viewOrder(alertPayload.orderId);
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            dismissOrderAlert(alertId);
        });
    }

    root.prepend(alert);

    if (!isHigh) {
        setTimeout(() => dismissOrderAlert(alertId), 18 * 1000);
    }

    playOrderNotificationSound(alertPayload.priority);
    showBrowserOrderNotification(alertPayload);
}

function handleRealtimeOrderEvent(order, source) {
    const employeeId = getCurrentEmployeeIdSafe();
    if (!employeeId || !order) return;

    const orderEmployeeId = normalizeEmployeeId(order.employeeId);
    if (!orderEmployeeId || orderEmployeeId !== employeeId) {
        return;
    }

    const previousState = window.orderNotificationState.orderMap.get(order.orderId) || null;
    const nextState = getOrderState(order);
    const changed = hasStateChanged(previousState, nextState);

    window.orderNotificationState.orderMap.set(order.orderId, nextState);

    if (!changed) return;

    const payload = buildAlertPayload(order, previousState, source || 'realtime');
    showOrderUpdateNotification(payload);
}

function setupOrderNotificationSocket() {
    const employeeId = getCurrentEmployeeIdSafe();
    if (!employeeId) return;

    if (window.orderNotificationState.socket) {
        try {
            window.orderNotificationState.socket.disconnect();
        } catch (error) {
            // ignore socket cleanup errors
        }
        window.orderNotificationState.socket = null;
    }

    if (typeof io !== 'function') {
        return;
    }

    const socket = io();
    window.orderNotificationState.socket = socket;

    socket.on('connect', () => {
        socket.emit('join-employee-room', { employeeId });
        console.log(`Order notification socket connected for ${employeeId}`);
    });

    socket.on('disconnect', () => {
        console.log('Order notification socket disconnected');
    });

    socket.on('order-updated', (order) => {
        handleRealtimeOrderEvent(order, 'socket');
    });

    socket.on('employee-order-alert', (payload) => {
        if (!payload || normalizeEmployeeId(payload.employeeId) !== employeeId) {
            return;
        }

        showOrderUpdateNotification({
            id: `${payload.orderId || 'order'}-${payload.currentStatus || ''}-${Date.now()}`,
            orderId: payload.orderId || '',
            employeeId,
            customerName: payload.customerName || '',
            previousStatus: payload.previousStatus || '',
            currentStatus: payload.currentStatus || '',
            trackingStatus: payload.trackingStatus || '',
            signature: payload.signature || `${payload.currentStatus || ''}|${payload.trackingStatus || ''}|${payload.message || ''}|${payload.updatedAt || ''}`,
            source: payload.source || 'server',
            priority: payload.priority || 'normal',
            message: payload.message || pickMessageFromStatus(payload.previousStatus, payload.currentStatus)
        });
    });
}

async function checkOrderUpdates() {
    try {
        const employeeId = getCurrentEmployeeIdSafe();
        if (!employeeId) return;

        const res = await fetch(`${API_URL}/orders/employee/${employeeId}?limit=0`);
        const data = await res.json();
        const orders = Array.isArray(data.orders) ? data.orders : [];
        const knownMap = window.orderNotificationState.orderMap;
        const seenOrderIds = new Set();

        for (const order of orders) {
            const orderId = String(order.orderId || '');
            if (!orderId) continue;
            seenOrderIds.add(orderId);

            const previousState = knownMap.get(orderId) || null;
            const nextState = getOrderState(order);
            const changed = hasStateChanged(previousState, nextState);

            knownMap.set(orderId, nextState);

            if (!window.orderNotificationState.initialized) {
                continue;
            }

            if (changed) {
                const payload = buildAlertPayload(order, previousState, 'polling');
                showOrderUpdateNotification(payload);
            }
        }

        // Remove deleted/missing orders from cache.
        for (const cachedOrderId of Array.from(knownMap.keys())) {
            if (!seenOrderIds.has(cachedOrderId)) {
                knownMap.delete(cachedOrderId);
            }
        }
    } catch (error) {
        console.error('Order update polling error:', error);
    }
}

async function initializeOrderNotifications() {
    if (typeof currentUserType === 'undefined' || currentUserType !== 'employee') {
        return;
    }

    const employeeId = getCurrentEmployeeIdSafe();
    if (!employeeId) {
        return;
    }

    if (window.orderNotificationState.interval) {
        clearInterval(window.orderNotificationState.interval);
    }

    setupOrderNotificationSocket();

    // Baseline fetch first to avoid flood on initial load.
    window.orderNotificationState.initialized = false;
    await checkOrderUpdates();
    window.orderNotificationState.initialized = true;

    window.orderNotificationState.interval = setInterval(checkOrderUpdates, ORDER_NOTIFICATION_POLL_MS);
    console.log('Order notifications initialized (polling every 12 seconds + realtime socket).');
}

function injectOrderNotificationStyles() {
    if (document.getElementById('employeeOrderNotificationStyles')) return;

    const style = document.createElement('style');
    style.id = 'employeeOrderNotificationStyles';
    style.textContent = `
        .employee-order-alerts-root {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 12000;
            width: min(92vw, 380px);
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        }

        .employee-order-alert {
            pointer-events: auto;
            border-radius: 14px;
            color: #fff;
            padding: 14px;
            box-shadow: 0 16px 34px rgba(15, 23, 42, 0.35);
            transform: translateX(0);
            opacity: 1;
            animation: orderAlertEnter 0.25s ease-out;
            border: 2px solid transparent;
        }

        .employee-order-alert.normal {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }

        .employee-order-alert.high {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            border-color: rgba(255, 255, 255, 0.5);
            animation: orderAlertEnter 0.25s ease-out, orderAlertPulse 1.4s ease-in-out infinite;
        }

        .employee-order-alert.is-hiding {
            opacity: 0;
            transform: translateX(22px);
            transition: all 0.2s ease-in;
        }

        .employee-order-alert-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 8px;
        }

        .employee-order-alert-title {
            font-size: 15px;
            font-weight: 700;
            line-height: 1.2;
        }

        .employee-order-alert-subtitle {
            font-size: 12px;
            opacity: 0.92;
            margin-top: 2px;
            line-height: 1.25;
        }

        .employee-order-alert-pill {
            font-size: 10px;
            line-height: 1;
            letter-spacing: 0.06em;
            font-weight: 700;
            border: 1px solid rgba(255, 255, 255, 0.7);
            border-radius: 999px;
            padding: 5px 7px;
            align-self: flex-start;
            background: rgba(255, 255, 255, 0.12);
        }

        .employee-order-alert-body {
            background: rgba(255, 255, 255, 0.14);
            border-radius: 10px;
            padding: 8px 10px;
            font-size: 12px;
            line-height: 1.35;
            margin-bottom: 10px;
        }

        .employee-order-alert-source {
            opacity: 0.86;
            margin-top: 4px;
            font-size: 11px;
        }

        .employee-order-alert-actions {
            display: flex;
            gap: 8px;
        }

        .employee-alert-btn {
            flex: 1;
            border: none;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            padding: 8px 10px;
            cursor: pointer;
        }

        .employee-alert-view {
            background: #fff;
            color: #0f172a;
        }

        .employee-alert-close {
            background: rgba(255, 255, 255, 0.16);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.7);
        }

        @keyframes orderAlertEnter {
            from {
                opacity: 0;
                transform: translateX(24px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes orderAlertPulse {
            0%, 100% {
                box-shadow: 0 16px 34px rgba(15, 23, 42, 0.35);
            }
            50% {
                box-shadow: 0 18px 36px rgba(220, 38, 38, 0.45);
            }
        }

        @media (max-width: 768px) {
            .employee-order-alerts-root {
                left: 10px;
                right: 10px;
                width: auto;
            }
        }
    `;

    document.head.appendChild(style);
}

injectOrderNotificationStyles();

if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

window.initializeOrderNotifications = initializeOrderNotifications;
window.dismissOrderAlert = dismissOrderAlert;

console.log('Employee order notification module loaded.');
