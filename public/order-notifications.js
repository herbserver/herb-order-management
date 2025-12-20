// Order Status Update Notification System
// Checks for order status updates and shows notifications to employees

if (!window.orderNotificationInterval) {
    window.orderNotificationInterval = null;
}
if (!window.lastKnownStatuses) {
    window.lastKnownStatuses = new Map(); // Track order statuses
}

// Initialize notification system for employees
function initializeOrderNotifications() {
    // Only for employees
    if (typeof currentUserType === 'undefined' || currentUserType !== 'employee') {
        return;
    }

    // Clear existing interval
    if (window.orderNotificationInterval) {
        clearInterval(window.orderNotificationInterval);
    }

    console.log('🔔 Order notifications initialized - checking every 2 minutes');

    // Check immediately
    checkOrderUpdates();

    // Then check every 2 minutes
    window.orderNotificationInterval = setInterval(checkOrderUpdates, 2 * 60 * 1000);
}

// Check for order status updates
async function checkOrderUpdates() {
    try {
        if (typeof currentUser === 'undefined' || !currentUser.id) {
            return;
        }

        console.log('📦 Checking for order updates...');

        const res = await fetch(`${API_URL}/orders/employee/${currentUser.id}`);
        const data = await res.json();
        const orders = data.orders || [];

        for (const order of orders) {
            const orderId = order.orderId;
            const currentStatus = order.status;
            const lastKnownStatus = window.lastKnownStatuses.get(orderId);

            // If we have a previous status and it changed
            if (lastKnownStatus && lastKnownStatus !== currentStatus) {
                console.log(`✨ Status change detected: ${orderId} - ${lastKnownStatus} → ${currentStatus}`);
                showOrderUpdateNotification(order, lastKnownStatus, currentStatus);
            }

            // Update the status in our map
            window.lastKnownStatuses.set(orderId, currentStatus);
        }

    } catch (error) {
        console.error('Error checking order updates:', error);
    }
}

// Show notification for order status update
function showOrderUpdateNotification(order, oldStatus, newStatus) {
    // Play notification sound
    playNotificationSound();

    // Browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('📦 Order Update!', {
            body: `${order.orderId} - ${newStatus}`,
            icon: '/favicon.ico',
            requireInteraction: false
        });
    }

    // Determine message and color based on new status
    let emoji = '📦';
    let color = '#3b82f6';
    let message = '';

    if (newStatus === 'Address Verified') {
        emoji = '✅';
        color = '#10b981';
        message = 'Address verify ho gaya! Ready for dispatch.';
    } else if (newStatus === 'Dispatched') {
        emoji = '🚚';
        color = '#8b5cf6';
        message = 'Order dispatch ho gaya! Tracking available.';
    } else if (newStatus === 'Delivered') {
        emoji = '🎉';
        color = '#22c55e';
        message = 'Order deliver ho gaya!';
    } else if (newStatus === 'On Hold') {
        emoji = '⏸️';
        color = '#f59e0b';
        message = 'Order hold pe rakha gaya hai.';
    } else if (newStatus === 'Cancelled') {
        emoji = '❌';
        color = '#ef4444';
        message = 'Order cancel ho gaya.';
    } else {
        message = `Status updated: ${newStatus}`;
    }

    // Show visual notification popup
    const alertHTML = `
    <div id="orderAlert-${order.orderId}" class="order-alert-container">
        <div class="order-alert-content" style="background: linear-gradient(135deg, ${color}, ${adjustColor(color, -20)});">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <span style="font-size: 40px;">${emoji}</span>
                <div style="flex: 1;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: white;">Order Update!</h3>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">${order.orderId}</p>
                </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 12px; margin-bottom: 12px;">
                <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: bold; color: white;">
                    ${oldStatus} → ${newStatus}
                </p>
                <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.95);">
                    ${message}
                </p>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button onclick="viewOrder('${order.orderId}')" 
                    style="flex: 1; background: white; color: ${color}; border: none; padding: 10px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer;">
                    👁️ View Order
                </button>
                <button onclick="dismissOrderAlert('${order.orderId}')" 
                    style="flex: 1; background: rgba(255,255,255,0.2); color: white; border: 2px solid white; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
                    ✓ Dismiss
                </button>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertHTML);

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
        dismissOrderAlert(order.orderId);
    }, 30 * 1000);

    // Refresh order list if on employee panel
    if (typeof loadMyOrders === 'function') {
        setTimeout(() => loadMyOrders(), 1000);
    }
}

// Dismiss order alert
function dismissOrderAlert(orderId) {
    const alert = document.getElementById(`orderAlert-${orderId}`);
    if (alert) {
        alert.style.animation = 'fadeOut 0.3s';
        setTimeout(() => alert.remove(), 300);
    }
}

// Play notification sound
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Play 2 beeps
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 600;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            }, i * 300);
        }
    } catch (error) {
        console.error('Sound error:', error);
    }
}

// Helper to adjust color brightness
function adjustColor(color, amount) {
    const clamp = (num) => Math.min(Math.max(num, 0), 255);
    const num = parseInt(color.replace('#', ''), 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Add CSS for order alerts
const style = document.createElement('style');
style.textContent = `
    /* Order notification styling */
    .order-alert-container {
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        width: 95%;
        max-width: 400px;
        animation: slideInDown 0.4s;
    }
    
    .order-alert-content {
        color: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    }
    
    /* Desktop positioning */
    @media (min-width: 768px) {
        .order-alert-container {
            top: 20px;
            left: auto;
            right: 20px;
            transform: none;
            animation: slideInRight 0.4s;
        }
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideInDown {
        from {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Order notification system loaded');
