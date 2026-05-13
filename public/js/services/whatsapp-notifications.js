// WhatsApp Notification Center
// Centralized queue system for sending customer notifications

if (!window.whatsappQueue) {
    window.whatsappQueue = [];
}

// Helper to get items list for message
function getItemsList(order) {
    if (Array.isArray(order.items) && order.items.length > 0) {
        return order.items.map(i => `  ▸ ${i.description || 'Item'}${i.qty ? ' x ' + i.qty : ''}`).join('\n');
    } else if (typeof order.items === 'string' && order.items.trim().length > 0) {
        return order.items.split(',').map(s => `  ▸ ${s.trim()}`).join('\n');
    }
    return '  ▸ Details not available';
}

// Function to auto-send message via Meta API
async function autoSendMetaMessage(type, order) {
    const templateMapping = {
        'booked': 'order_confirm',
        'verified': 'address_verify',
        'dispatched': 'order_dispatch',
        'out_for_delivery': 'out_for_delivery',
        'delivered': 'delivered'
    };

    const templateName = templateMapping[type];
    if (!templateName) {
        console.log(`No Meta template mapped for type: ${type}`);
        return;
    }

    // Prepare parameters based on template
    let parameters = [];
    if (type === 'booked' || type === 'verified') {
        parameters = [
            order.customerName,
            order.orderId,
            String(order.total || 0),
            String(order.advance || 0),
            String(order.codAmount || order.cod || 0),
            getItemsList(order)
        ];
    } else if (type === 'dispatched') {
        parameters = [
            order.customerName,
            order.orderId,
            order.shiprocket?.awb || order.tracking?.trackingId || 'Processing',
            order.shiprocket?.courierName || order.tracking?.courier || 'Processing',
            String(order.total || 0),
            String(order.codAmount || order.cod || 0),
            getItemsList(order)
        ];
    } else if (type === 'out_for_delivery') {
        parameters = [
            order.customerName,
            order.orderId,
            String(order.codAmount || order.cod || 0),
            getItemsList(order)
        ];
    } else if (type === 'delivered') {
        parameters = [
            order.customerName,
            order.orderId,
            getItemsList(order)
        ];
    }

    try {
        const response = await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: order.telNo,
                templateName: templateName,
                parameters: parameters
            })
        });

        const result = await response.json();
        if (result.success) {
            console.log(`✅ Auto-sent WhatsApp message for ${type}`);
            alert(`WhatsApp Sent Successfully! Response: ${JSON.stringify(result)}`);
            // Mark as sent in queue if found
            const notif = window.whatsappQueue.find(n => n.order.orderId === order.orderId && n.type === type);
            if (notif) {
                notif.sent = true;
                notif.sentAt = new Date().toISOString();
                saveWhatsAppQueue();
                updateNotificationBadge();
            }
        } else {
            console.error(`❌ Failed to auto-send WhatsApp:`, result.message);
            alert(`WhatsApp Send Failed: ${JSON.stringify(result)}`);
        }
    } catch (error) {
        console.error(`❌ Error in auto-send WhatsApp:`, error);
        alert(`WhatsApp Error: ${error.message}`);
    }
}

// Message Templates - Hinglish Version
// Use var with check to avoid duplicate declaration if common.js loads first
if (typeof whatsappTemplates === 'undefined') {
    var whatsappTemplates = {
        booked: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

नमस्ते *${order.customerName}* जी! 🙏

✅ आपका *Order* confirm हो गया है!

📦 *ORDER DETAILS*
▸ Order No: *${order.orderId}*
▸ Total Amount: *Rs. ${order.total || 0}*
▸ Advance Paid: Rs. ${order.advance || 0}
▸ COD Amount: *Rs. ${order.codAmount || order.cod || 0}*
▸ Items:
${getItemsList(order)}

📞 हमारी team जल्दी ही आपको call करेगी address verify करने के लिए।

⚠️ *IMPORTANT*
🚫 Product मिलने से पहले OTP share न करें!

_Team Herb On Naturals_ 💚
🌐 herbonnaturals.in`,

        verified: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

नमस्ते *${order.customerName}* जी! 🙏

✅ आपका Order *VERIFY* हो गया है!

📦 *ORDER: ${order.orderId}*

💰 *PAYMENT INFO*
▸ Total: Rs. ${order.total || 0}
▸ Paid: Rs. ${order.advance || 0}
▸ COD: *Rs. ${order.codAmount || order.cod || 0}*
▸ Items:
${getItemsList(order)}

📦 Order packing हो रहा है। Tracking details जल्दी मिलेंगे!

🔐 *याद रखें*
🚫 Product check किए बिना OTP share न करें!

_Team Herb On Naturals_ 💚`,

        dispatched: (order) => `🌿 HERB ON NATURALS 🌿
_______

नमस्ते ${order.customerName} जी! 🙏

🚚 आपका Order DISPATCH हो गया है!

📦 ORDER: ${order.orderId}

📍 TRACKING INFO
▸ AWB No: ${order.shiprocket?.awb || order.tracking?.trackingId || 'Processing'}
▸ Courier: ${order.shiprocket?.courierName || order.tracking?.courier || 'Processing'}

💰 PAYMENT
▸ Total: Rs. ${order.total || 0}
▸ COD: Rs. ${order.codAmount || order.cod || 0}
▸ Items:
${getItemsList(order)}

📋 ज़रूरी बातें
📱 Phone ON रखें
💵 COD amount ready रखें

Team Herb On Naturals 💚`,

        out_for_delivery: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

नमस्ते *${order.customerName}* जी! 🙏

🏃 *आज DELIVERY होगी!*

📦 Order: *${order.orderId}*
💵 COD: *Rs. ${order.codAmount || order.cod || 0}*
▸ Items:
${getItemsList(order)}

🏠 आज आपका parcel आने वाला है, कृपया available रहें।

⚠️ *याद रखें*
👀 पहले Product check करें, फिर OTP दें!

_Team Herb On Naturals_ 💚`,

        delivered: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

नमस्ते *${order.customerName}* जी! 🙏

🎉 *Order DELIVER हो गया!*

📦 Order: ${order.orderId}
▸ Items:
${getItemsList(order)}

🙏 हमारे साथ shopping करने के लिए धन्यवाद!

⭐ हमें उम्मीद है कि आपको products पसंद आएंगे। अपना feedback ज़रूर share करें - यह हमारे लिए बहुत important है!

🛒 दोबारा shopping करें: herbonnaturals.in

_Warm regards,_ 💚
_Team Herb On Naturals_`
    };
}

// Helper functions
function getCompanyName() {
    return "Herb On Naturals\nhttps://herbonnaturals.in/";
}

function getTrackingLink(order) {
    if (order.shiprocket?.awb) {
        const courier = order.shiprocket.courierName?.toLowerCase() || '';

        const trackingUrls = {
            'delhivery': `https://www.delhivery.com/track/package/${order.shiprocket.awb}`,
            'bluedart': `https://www.bluedart.com/tracking/${order.shiprocket.awb}`,
            'dtdc': `https://www.dtdc.in/tracking/${order.shiprocket.awb}`,
            'default': `https://shiprocket.co/tracking/${order.shiprocket.awb}`
        };

        for (const [key, url] of Object.entries(trackingUrls)) {
            if (courier.includes(key)) {
                return `Track करें: ${url}`;
            }
        }
        return `Track करें: ${trackingUrls.default}`;
    }
    return '';
}

// Add notification to queue
function addWhatsAppNotification(type, order) {
    const notification = {
        id: Date.now() + '_' + order.orderId,
        type: type,
        order: order,
        message: whatsappTemplates[type](order),
        phone: order.telNo,
        timestamp: new Date().toISOString(),
        sent: false
    };

    window.whatsappQueue.push(notification);
    saveWhatsAppQueue();
    updateNotificationBadge();
    playWhatsAppAlert();
    console.log('📱 WhatsApp notification added:', notification.id);
    
    // Auto-send via Meta API
    autoSendMetaMessage(type, order);
}

// Save queue to localStorage
function saveWhatsAppQueue() {
    try {
        localStorage.setItem('whatsappQueue', JSON.stringify(window.whatsappQueue));
    } catch (e) {
        console.error('Error saving queue:', e);
    }
}

// Load queue from localStorage
function loadWhatsAppQueue() {
    try {
        const saved = localStorage.getItem('whatsappQueue');
        if (saved) {
            window.whatsappQueue = JSON.parse(saved);
            updateNotificationBadge();
        }
    } catch (e) {
        console.error('Error loading queue:', e);
    }
}

// Load all historical verified/dispatched orders into queue
async function loadHistoricalOrders() {
    try {
        console.log('📥 Loading historical orders...');

        // Get all orders
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        const orders = data.orders || [];

        // Filter verified and dispatched orders that haven't been sent
        const eligibleOrders = orders.filter(order => {
            // Check if already in queue
            const alreadyInQueue = window.whatsappQueue.some(n => n.order.orderId === order.orderId);
            if (alreadyInQueue) return false;

            // Include verified and dispatched orders
            return order.status === 'Address Verified' || order.status === 'Dispatched';
        });

        console.log(`Found ${eligibleOrders.length} historical orders to add`);

        // Add to queue
        eligibleOrders.forEach(order => {
            const notificationType = order.status === 'Address Verified' ? 'verified' : 'dispatched';

            const notification = {
                id: Date.now() + '_' + order.orderId + '_historical',
                type: notificationType,
                order: order,
                message: whatsappTemplates[notificationType](order),
                phone: order.telNo,
                timestamp: new Date().toISOString(),
                sent: false,
                historical: true // Mark as historical
            };

            window.whatsappQueue.push(notification);
        });

        saveWhatsAppQueue();
        updateNotificationBadge();

        alert(`✅ ${eligibleOrders.length} historical orders loaded!\n\nOpen WhatsApp Center to send messages.`);

    } catch (error) {
        console.error('Error loading historical orders:', error);
        alert('❌ Error loading historical orders. Please try again.');
    }
}

// Update notification badge
function updateNotificationBadge() {
    const pending = window.whatsappQueue.filter(n => !n.sent).length;
    const badge = document.getElementById('whatsappBadge');

    if (badge) {
        if (pending > 0) {
            badge.textContent = pending;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Play alert sound
function playWhatsAppAlert() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        console.error('Sound error:', error);
    }
}

// Open WhatsApp Notification Center
function openWhatsAppCenter() {
    let pending = window.whatsappQueue.filter(n => !n.sent);
    let sent = window.whatsappQueue.filter(n => n.sent);

    // Filter messages by department
    const deptAllowedTypes = {
        'employee': ['booked'],
        'verification': ['verified'],
        'dispatch': ['dispatched'],
        'delivery': ['out_for_delivery', 'delivered']
    };

    const currentDept = window.currentDeptType;
    
    if (currentDept && deptAllowedTypes[currentDept]) {
        const allowed = deptAllowedTypes[currentDept];
        pending = pending.filter(n => allowed.includes(n.type));
        sent = sent.filter(n => allowed.includes(n.type));
    }

    let html = `
    <div id="whatsappCenter" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick="if(event.target.id==='whatsappCenter') closeWhatsAppCenter()">
        <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onclick="event.stopPropagation()">
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <span class="text-2xl">📱</span>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold">WhatsApp Notification Center</h2>
                            <p class="text-green-100 text-sm">Pending Messages: ${pending.length}</p>
                        </div>
                    </div>
                    <button onclick="closeWhatsAppCenter()" class="text-white hover:bg-white/20 rounded-full p-2 transition">
                        <span class="text-2xl">×</span>
                    </button>
                </div>
            </div>
            
            <!-- Tabs -->
            <div class="border-b">
                <div class="flex">
                    <button onclick="switchWhatsAppTab('pending')" id="tabPending" class="flex-1 px-6 py-3 font-bold border-b-2 border-green-500 bg-green-50 text-green-700">
                        Pending (${pending.length})
                    </button>
                    <button onclick="switchWhatsAppTab('sent')" id="tabSent" class="flex-1 px-6 py-3 font-bold text-gray-600 hover:bg-gray-50">
                        Sent (${sent.length})
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="p-6 overflow-y-auto max-h-[60vh]">
                <div id="pendingMessages">
                    ${pending.length === 0 ?
            '<div class="text-center py-12"><p class="text-gray-400 text-lg">✅ No pending messages</p></div>' :
            pending.map(n => renderNotificationCard(n)).join('')
        }
                </div>
                <div id="sentMessages" class="hidden">
                    ${sent.map(n => renderNotificationCard(n)).join('')}
                </div>
            </div>
            
            <!-- Footer Actions -->
            ${pending.length > 0 ? `
            <div class="border-t p-4 bg-gray-50">
                <button onclick="sendAllPending()" class="w-full bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition flex items-center justify-center gap-2">
                    <span>📱</span> Send All ${pending.length} Messages
                </button>
            </div>
            ` : ''}
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
}

// Render notification card
function renderNotificationCard(notification) {
    const typeColors = {
        verified: 'green',
        dispatched: 'purple',
        out_for_delivery: 'orange',
        delivered: 'blue'
    };

    const typeEmojis = {
        verified: '✅',
        dispatched: '🚚',
        out_for_delivery: '🏃',
        delivered: '🎉'
    };

    const color = typeColors[notification.type] || 'gray';
    const emoji = typeEmojis[notification.type] || '📦';

    return `
    <div class="border-2 border-${color}-200 rounded-xl p-4 mb-4 hover:shadow-lg transition bg-${color}-50/30">
        <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-${color}-500 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                ${emoji}
            </div>
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                    <span class="font-bold text-gray-800">${notification.order.orderId}</span>
                    <span class="text-sm text-gray-500">→ ${notification.order.customerName}</span>
                    <span class="text-xs bg-${color}-100 text-${color}-700 px-2 py-1 rounded-full font-bold">${notification.type.toUpperCase()}</span>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-3 mb-3 text-sm whitespace-pre-wrap font-mono text-gray-700">
${notification.message}
                </div>
                <div class="flex gap-2">
                    <button onclick="sendSingleMessage('${notification.id}')" 
                        class="flex-1 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                        ${notification.sent ? 'disabled' : ''}>
                        <span>📱</span> ${notification.sent ? 'Sent ✓' : 'Send Now'}
                    </button>
                    ${!notification.sent ? `
                    <button onclick="removeNotification('${notification.id}')" 
                        class="bg-red-100 text-red-600 font-bold py-2 px-4 rounded-lg hover:bg-red-200 transition">
                        ×
                    </button>
                    ` : ''}
                </div>
            </div>
        </div>
    </div>
    `;
}

// Send single message
function sendSingleMessage(notificationId) {
    const notification = window.whatsappQueue.find(n => n.id === notificationId);
    if (!notification || notification.sent) return;

    // Open WhatsApp with message
    const url = `https://wa.me/91${notification.phone}?text=${encodeURIComponent(notification.message)}`;
    window.open(url, '_blank');

    // Mark as sent
    notification.sent = true;
    notification.sentAt = new Date().toISOString();

    saveWhatsAppQueue();
    updateNotificationBadge();

    // Refresh display
    closeWhatsAppCenter();
    setTimeout(() => openWhatsAppCenter(), 500);
}

// Send all pending
function sendAllPending() {
    const pending = window.whatsappQueue.filter(n => !n.sent);

    if (confirm(`Send ${pending.length} WhatsApp messages?`)) {
        pending.forEach((notification, index) => {
            setTimeout(() => {
                sendSingleMessage(notification.id);
            }, index * 1000); // 1 second delay between each
        });
    }
}

// Remove notification
function removeNotification(notificationId) {
    if (confirm('Remove this notification?')) {
        window.whatsappQueue = window.whatsappQueue.filter(n => n.id !== notificationId);
        saveWhatsAppQueue();
        updateNotificationBadge();
        closeWhatsAppCenter();
        setTimeout(() => openWhatsAppCenter(), 300);
    }
}

// Switch tabs
function switchWhatsAppTab(tab) {
    document.getElementById('tabPending').className = 'flex-1 px-6 py-3 font-bold text-gray-600 hover:bg-gray-50';
    document.getElementById('tabSent').className = 'flex-1 px-6 py-3 font-bold text-gray-600 hover:bg-gray-50';

    if (tab === 'pending') {
        document.getElementById('tabPending').className = 'flex-1 px-6 py-3 font-bold border-b-2 border-green-500 bg-green-50 text-green-700';
        document.getElementById('pendingMessages').classList.remove('hidden');
        document.getElementById('sentMessages').classList.add('hidden');
    } else {
        document.getElementById('tabSent').className = 'flex-1 px-6 py-3 font-bold border-b-2 border-blue-500 bg-blue-50 text-blue-700';
        document.getElementById('pendingMessages').classList.add('hidden');
        document.getElementById('sentMessages').classList.remove('hidden');
    }
}

// Close center
function closeWhatsAppCenter() {
    const center = document.getElementById('whatsappCenter');
    if (center) center.remove();
}

// Load queue on page load
loadWhatsAppQueue();

console.log('✅ WhatsApp Notification Center loaded');
