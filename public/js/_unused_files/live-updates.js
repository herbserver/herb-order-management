// Real-Time Order Updates using Server-Sent Events (SSE)

let eventSource = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;

// Initialize live updates
function initializeLiveUpdates() {
    connectToSSE();
    console.log('📡 Live updates initialized');
}

// Connect to Server-Sent Events
function connectToSSE() {
    if (eventSource) {
        eventSource.close();
    }

    try {
        eventSource = new EventSource(`${API_URL}/events/orders`);

        eventSource.onopen = function () {
            console.log('✅ Live connection established');
            reconnectAttempts = 0;
            showLiveIndicator(true);
        };

        eventSource.onmessage = function (event) {
            try {
                const data = JSON.parse(event.data);
                handleLiveUpdate(data);
            } catch (error) {
                console.error('Parse error:', error);
            }
        };

        eventSource.onerror = function (error) {
            console.warn('❌ Live connection error');
            showLiveIndicator(false);

            eventSource.close();

            // Retry connection
            if (reconnectAttempts < MAX_RECONNECT) {
                reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                console.log(`Retrying in ${delay / 1000}s...`);
                setTimeout(connectToSSE, delay);
            }
        };

    } catch (error) {
        console.error('SSE init error:', error);
    }
}

// Handle live update
function handleLiveUpdate(data) {
    const { event, order } = data;

    switch (event) {
        case 'connected':
            console.log('📡', data.message);
            break;

        case 'heartbeat':
            // Just keeps connection alive
            break;

        case 'order_created':
            onOrderCreated(order);
            break;

        case 'order_updated':
            onOrderUpdated(order);
            break;

        case 'order_verified':
            onOrderStatusChange(order, 'verified');
            break;

        case 'order_dispatched':
            onOrderStatusChange(order, 'dispatched');
            break;

        case 'order_delivered':
            onOrderStatusChange(order, 'delivered');
            break;

        default:
            console.log('Unknown event:', event);
    }
}

// Event handlers
function onOrderCreated(order) {
    showNotification('📦 New Order', `${order.orderId} created by ${order.employee}`);
    playNotificationSound();

    // Refresh order list if user is on relevant page
    if (typeof loadOrders === 'function') {
        loadOrders();
    }
    if (typeof loadDeptOrders === 'function') {
        loadDeptOrders();
    }
}

function onOrderUpdated(order) {
    console.log('Order updated:', order.orderId);

    // Refresh specific order if visible
    if (typeof refreshOrderCard === 'function') {
        refreshOrderCard(order.orderId);
    }
}

function onOrderStatusChange(order, status) {
    const messages = {
        verified: `✅ ${order.orderId} verified`,
        dispatched: `🚚 ${order.orderId} dispatched`,
        delivered: `🎉 ${order.orderId} delivered`
    };

    showNotification('Status Update', messages[status]);
    playNotificationSound();

    // Refresh lists
    if (typeof loadOrders === 'function') {
        loadOrders();
    }
    if (typeof loadDeptOrders === 'function') {
        loadDeptOrders();
    }
}

// Show desktop notification
function showNotification(title, message) {
    // Check browser notification permission
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/icon.png',
            badge: '/icon.png'
        });
    }

    // Show in-app notification
    showInAppNotification(title, message);
}

// In-app notification toast
function showInAppNotification(title, message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-white border-2 border-green-500 rounded-xl p-4 shadow-2xl z-50 animate-slide-in';
    toast.style.cssText = 'max-width: 300px; animation: slideIn 0.3s ease-out';

    toast.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0">
                📱
            </div>
            <div class="flex-1">
                <div class="font-bold text-gray-800">${title}</div>
                <div class="text-sm text-gray-600">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                ×
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Play notification sound
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        // Silently fail if audio not available
    }
}

// Show/hide live indicator
function showLiveIndicator(connected) {
    let indicator = document.getElementById('liveIndicator');

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'liveIndicator';
        indicator.className = 'fixed bottom-4 left-4 px-3 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg z-40';
        document.body.appendChild(indicator);
    }

    if (connected) {
        indicator.className = 'fixed bottom-4 left-4 px-3 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg z-40 bg-green-500 text-white';
        indicator.innerHTML = '<span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> Live';
    } else {
        indicator.className = 'fixed bottom-4 left-4 px-3 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg z-40 bg-gray-400 text-white';
        indicator.innerHTML = '<span class="w-2 h-2 bg-white rounded-full"></span> Reconnecting...';
    }
}

// Request notification permission on page load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Auto-start live updates
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLiveUpdates);
} else {
    initializeLiveUpdates();
}

// Close connection on page unload
window.addEventListener('beforeunload', () => {
    if (eventSource) {
        eventSource.close();
    }
});

console.log('✅ Live updates module loaded');
