// Auto Tracking System - Checks for Out for Delivery status
let trackingInterval = null;
let notifiedOrders = new Set(); // Track which orders we've already notified about

// Initialize auto tracking when admin/dispatch panel loads
function initializeAutoTracking() {
    // Clear existing interval
    if (trackingInterval) {
        clearInterval(trackingInterval);
    }

    console.log('🔔 Auto-tracking initialized - checking every 5 minutes');

    // Check immediately
    checkForOutForDelivery();

    // Then check every 5 minutes
    trackingInterval = setInterval(checkForOutForDelivery, 5 * 60 * 1000);
}

// Check all dispatched orders for "Out for Delivery" status
async function checkForOutForDelivery() {
    try {
        console.log('📦 Checking for Out for Delivery orders...');

        const res = await fetch(`${API_URL}/orders/dispatched`);
        const data = await res.json();
        const orders = data.orders || [];

        for (const order of orders) {
            if (order.shiprocket && order.shiprocket.awb) {
                const awb = order.shiprocket.awb;

                // Skip if already notified
                if (notifiedOrders.has(order.orderId)) {
                    continue;
                }

                // Get latest tracking
                const trackRes = await fetch(`${API_URL}/shiprocket/track/${awb}`);
                const trackData = await trackRes.json();

                if (trackData.success && trackData.tracking) {
                    const status = trackData.tracking.currentStatus || '';

                    // Check if Out for Delivery
                    if (status.toLowerCase().includes('out for delivery')) {
                        // Mark as notified
                        notifiedOrders.add(order.orderId);

                        // Show alert
                        showOutForDeliveryAlert(order, trackData.tracking);

                        // Update order in background
                        await fetch(`${API_URL}/orders/${order.orderId}/update-tracking`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ awb: awb })
                        });
                    }
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

    } catch (error) {
        console.error('Error checking tracking:', error);
    }
}

// Show Out for Delivery alert with sound
function showOutForDeliveryAlert(order, tracking) {
    // Play sound
    playAlertSound();

    // Request browser notification permission if not granted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚚 Out for Delivery!', {
            body: `${order.orderId} - ${order.customerName}\nTel: ${order.telNo}`,
            icon: '/favicon.ico',
            requireInteraction: true
        });
    }

    // Show visual alert on page
    const alertHTML = `
    <div id="ofdAlert-${order.orderId}" style="position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px; animation: slideInRight 0.5s;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border-radius: 16px; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); border: 3px solid #fbbf24;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <span style="font-size: 48px;">🚚</span>
                <div>
                    <h3 style="margin: 0; font-size: 20px; font-weight: bold;">Out for Delivery!</h3>
                    <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Call customer now</p>
                </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.2); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${order.orderId}</p>
                <p style="margin: 0 0 4px 0; font-size: 14px;">👤 ${order.customerName}</p>
                <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: bold;">📞 ${order.telNo}</p>
                <p style="margin: 0; font-size: 12px; opacity: 0.8;">📍 ${tracking.location || 'N/A'}</p>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <a href="tel:${order.telNo}" style="flex: 1; background: white; color: #d97706; text-decoration: none; padding: 12px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 14px;">
                    📞 Call Now
                </a>
                <button onclick="dismissAlert('${order.orderId}')" style="flex: 1; background: rgba(255,255,255,0.2); color: white; border: 2px solid white; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
                    ✓ Dismiss
                </button>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertHTML);

    // Auto-dismiss after 2 minutes if not manually dismissed
    setTimeout(() => {
        dismissAlert(order.orderId);
    }, 2 * 60 * 1000);
}

// Play alert sound
function playAlertSound() {
    // Create audio context for beep sound
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Play 3 beeps
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800; // Frequency in Hz
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }, i * 400);
        }
    } catch (error) {
        console.error('Sound error:', error);
    }
}

// Dismiss alert
function dismissAlert(orderId) {
    const alert = document.getElementById(`ofdAlert-${orderId}`);
    if (alert) {
        alert.style.animation = 'fadeOut 0.3s';
        setTimeout(() => alert.remove(), 300);
    }
}

// Request notification permission on page load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
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
