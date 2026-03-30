// Auto Tracking System - Checks for Out for Delivery status
// Use window object to avoid duplicate declaration errors
if (!window.trackingInterval) {
    window.trackingInterval = null;
}
if (!window.notifiedOrders) {
    window.notifiedOrders = new Set(); // Track which orders we've already notified about
}

// Initialize auto tracking when admin/dispatch panel loads
function initializeAutoTracking() {
    // Clear existing interval
    if (window.trackingInterval) {
        clearInterval(window.trackingInterval);
    }

    console.log('🔔 Auto-tracking initialized - checking every 30 minutes (backup mode)');
    console.log('📡 Primary updates via Shiprocket webhook');

    // Check immediately
    checkForOutForDelivery();

    // Then check every 30 minutes (backup only, webhook is primary)
    window.trackingInterval = setInterval(checkForOutForDelivery, 30 * 60 * 1000);
}

// Check all dispatched orders for "Out for Delivery" status
async function checkForOutForDelivery() {
    try {
        console.log('📦 Checking for Out for Delivery orders...');

        const res = await fetch(`${API_URL}/orders/dispatched`);
        const data = await res.json();
        let orders = data.orders || [];

        // Filter for employee's own orders if logged in as employee
        if (typeof currentUserType !== 'undefined' && currentUserType === 'employee') {
            if (typeof currentUser !== 'undefined' && currentUser.id) {
                orders = orders.filter(o => o.employeeId === currentUser.id);
                console.log(`📦 Checking ${orders.length} orders for employee ${currentUser.id}`);
            }
        }

        let requestCount = 0;
        const maxRequestsPerBatch = 10; // Limit to 10 requests per check

        for (const order of orders) {
            // Stop if we've hit the batch limit
            if (requestCount >= maxRequestsPerBatch) {
                console.log(`⏸️ Batch limit reached (${maxRequestsPerBatch}). Remaining orders will be checked next cycle.`);
                break;
            }

            const awb = order.shiprocket?.awb || order.tracking?.trackingId;
            const courier = order.tracking?.courier || order.shiprocket?.courierName || 'Shiprocket';

            if (awb) {
                // Skip if already notified
                if (window.notifiedOrders.has(order.orderId)) {
                    continue;
                }

                try {
                    let trackRes;
                    let trackData;

                    if (courier.toLowerCase().includes('india post') || courier.toLowerCase().includes('speed post')) {
                        console.log(`📮 Scraping India Post for ${order.orderId} (${awb})`);
                        trackRes = await fetch(`${API_URL}/orders/track-indiapost/${order.orderId}`, { method: 'POST' });
                        trackData = await trackRes.json();
                    } else if (courier.toLowerCase().includes('blue') || courier.toLowerCase().includes('bluedart') || courier.toLowerCase().includes('blue dart')) {
                        console.log(`📦 Scraping BlueDart for ${order.orderId} (${awb})`);
                        trackRes = await fetch(`${API_URL}/orders/track-bluedart/${order.orderId}`, { method: 'POST' });
                        trackData = await trackRes.json();
                    } else {
                        // Standard Shiprocket tracking
                        trackRes = await fetch(`${API_URL}/shiprocket/track/${awb}`);
                        const resJson = await trackRes.json();
                        if (resJson.success && resJson.tracking) {
                            trackData = {
                                success: true,
                                status: resJson.tracking.currentStatus,
                                location: resJson.tracking.location,
                                tracking: resJson.tracking
                            };
                        }
                    }

                    // Check for rate limiting (only for Shiprocket)
                    if (trackRes && trackRes.status === 429) {
                        console.warn('⚠️ Rate limit hit. Stopping batch and will retry next cycle.');
                        break;
                    }

                    if (trackData && trackData.success) {
                        const status = trackData.status || '';
                        requestCount++;

                        // Check if Out for Delivery
                        if (status.toLowerCase().includes('out for delivery')) {
                            // Mark as notified
                            window.notifiedOrders.add(order.orderId);

                            // Show alert
                            showOutForDeliveryAlert(order, trackData);

                            // Status is already updated in the track-indiapost route, but for Shiprocket we might need it
                            if (!courier.toLowerCase().includes('india post')) {
                                await fetch(`${API_URL}/orders/${order.orderId}/update-tracking`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ tracking: { currentStatus: status, location: trackData.location } })
                                });
                            }
                        }
                    }
                } catch (trackError) {
                    console.error(`Error tracking ${order.orderId}:`, trackError.message);
                }

                // Wait between requests to be gentle
                await new Promise(resolve => setTimeout(resolve, courier.toLowerCase().includes('india post') ? 5000 : 3000));
            }
        }

        console.log(`✅ Batch complete. Checked ${requestCount} orders.`);

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

    // Show visual alert on page - Responsive design
    const alertHTML = `
    <div id="ofdAlert-${order.orderId}" class="ofd-alert-container">
        <div class="ofd-alert-content">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <span class="ofd-emoji">🚚</span>
                <div style="flex: 1;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: bold;">Out for Delivery!</h3>
                    <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Call customer now</p>
                </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 12px; margin-bottom: 12px;">
                <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold;">${order.orderId}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;">👤 ${order.customerName}</p>
                <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold;">📞 ${order.telNo}</p>
                <p style="margin: 0; font-size: 11px; opacity: 0.8;">📍 ${tracking.location || 'N/A'}</p>
            </div>
            
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <a href="tel:${order.telNo}" style="flex: 1; min-width: 120px; background: white; color: #d97706; text-decoration: none; padding: 12px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 14px;">
                    📞 Call Now
                </a>
                <button onclick="dismissAlert('${order.orderId}')" style="flex: 1; min-width: 120px; background: rgba(255,255,255,0.2); color: white; border: 2px solid white; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
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

// Add CSS animations and responsive styles
const style = document.createElement('style');
style.textContent = `
    /* Mobile-first: Center top positioning */
    .ofd-alert-container {
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        width: 95%;
        max-width: 400px;
        animation: slideInDown 0.5s;
    }
    
    .ofd-alert-content {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        border: 3px solid #fbbf24;
    }
    
    .ofd-emoji {
        font-size: 40px;
    }
    
    /* Desktop: Right side positioning */
    @media (min-width: 768px) {
        .ofd-alert-container {
            top: 20px;
            left: auto;
            right: 20px;
            transform: none;
            width: auto;
            max-width: 420px;
            animation: slideInRight 0.5s;
        }
        
        .ofd-alert-content {
            padding: 24px;
        }
        
        .ofd-emoji {
            font-size: 48px;
        }
    }
    
    /* Animations */
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
