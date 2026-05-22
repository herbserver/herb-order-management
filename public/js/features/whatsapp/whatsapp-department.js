// WhatsApp Direct Messaging for Departments
// Professional Hindi message templates for Verification & Dispatch

const whatsappDepartmentTemplates = {
    // Verification Department Messages
    verification: {
        addressConfirm: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

📦 Aapka Order receive ho gaya hai!

*ORDER: ${order.orderId}*
▸ Total Amount: Rs. ${order.total}
▸ Payment Mode: ${order.paymentMode}
${order.paymentMode === 'COD' ? `▸ COD: *Rs. ${order.codAmount || order.total}*` : ''}

📍 *DELIVERY ADDRESS*
${order.address}
${order.city ? order.city : order.distt}, ${order.state} - ${order.pin || order.pincode}

Kripya apna address check karein:
✅ Agar sahi hai toh "YES" reply karein
❌ Agar change karna hai toh "CHANGE" reply karein

_Team Herb On Naturals_ 💚`,

        addressVerified: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

✅ Aapka address *VERIFY* ho gaya hai!

📦 *ORDER: ${order.orderId}*

📍 *CONFIRMED ADDRESS*
${order.address}
${order.city ? order.city : order.distt}, ${order.state} - ${order.pin || order.pincode}

🚚 Aapka order jaldi hi dispatch kar diya jayega. Tracking details aapko WhatsApp par bhej di jayengi.

_Team Herb On Naturals_ 💚`,

        orderCancelled: (order, reason) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

❌ *ORDER CANCEL HO GAYA HAI*

📦 Order: ${order.orderId}

📋 *Reason:* ${reason || 'Customer request'}

Kisi bhi sawal ke liye humse sampark karein.

_Team Herb On Naturals_ 💚`,

        addressIssue: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

⚠️ *ADDRESS MEIN PROBLEM HAI*

📦 Order: ${order.orderId}

Kripya sahi address bhejein:
▸ House/Flat Number
▸ Area/Locality
▸ Landmark
▸ Pin Code

Jaldi reply karein taaki delivery mein deri na ho!

_Team Herb On Naturals_ 💚`
    },

    // Dispatch Department Messages
    dispatch: {
        readyToDispatch: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

📦 Aapka order *PACK* ho gaya hai aur *SHIP* hone ke liye tayyar hai!

*ORDER: ${order.orderId}*
▸ Saman (Items): ${order.items?.length || 1}
▸ Amount: Rs. ${order.total}
▸ Payment: ${order.paymentMode}

Aaj ya kal mein dispatch ho jayega. Tracking details jaldi milengi!

📱 Apna phone chalu (ON) rakhein.

_Team Herb On Naturals_ 💚`,

        dispatched: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

🚚 Aapka order *DISPATCH* ho gaya hai!

📦 *ORDER: ${order.orderId}*

📍 *TRACKING INFO*
▸ AWB No: *${order.shiprocket?.awb || order.tracking?.trackingId || 'Processing'}*
▸ Courier: *${order.shiprocket?.courierName || order.tracking?.courier || 'Processing'}*
▸ Date: ${new Date().toLocaleDateString('en-IN')}

🔗 Track karein: shiprocket.co/tracking

📋 *ZARURI BAATEIN*
📱 Phone ON rakhein
💵 COD amount ready rakhein
👀 Pehle product check karein
🔐 Phir OTP dein

_Happy Shopping!_ 🛍️
_Team Herb On Naturals_ 💚`,

        outForDelivery: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

🏃 *AJ DELIVERY HOGI!*

📦 Order: *${order.orderId}*
📍 AWB: ${order.shiprocket?.awb || order.tracking?.trackingId}
🚚 Courier: ${order.shiprocket?.courierName || order.tracking?.courier}

💵 *COD: Rs. ${order.codAmount || 0}*

📱 Apna phone reachable rakhein
👀 Pehle product check karein, phir OTP dein!

_Team Herb On Naturals_ 💚`,

        customMessage: (order, message) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

📦 *ORDER: ${order.orderId}*

${message}

_Team Herb On Naturals_ 💚
🌐 www.herbonnaturals.in`
    }
};

// Helper: Get tracking link
function getTrackingLink(order) {
    if (order.shiprocket?.awb) {
        const courier = order.shiprocket.courierName?.toLowerCase() || '';

        const trackingUrls = {
            'delhivery': `https://www.delhivery.com/track/package/${order.shiprocket.awb}`,
            'bluedart': `https://www.bluedart.com/tracking/${order.shiprocket.awb}`,
            'dtdc': `https://www.dtdc.in/tracking/${order.shiprocket.awb}`,
            'ekart': `https://ekartlogistics.com/track/${order.shiprocket.awb}`,
            'default': `https://shiprocket.co/tracking/${order.shiprocket.awb}`
        };

        for (const [key, url] of Object.entries(trackingUrls)) {
            if (courier.includes(key)) {
                return `🔗 Track करें: ${url}`;
            }
        }
        return `🔗 Track करें: ${trackingUrls.default}`;
    }
    return '';
}

// Helper: Get estimated delivery
function getEstimatedDelivery(order) {
    const today = new Date();
    const delivery = new Date(today);

    // Add 3-7 days based on location
    const state = order.state?.toLowerCase() || '';
    let days = 5; // Default

    // Major cities - faster delivery
    if (state.includes('maharashtra') || state.includes('delhi') ||
        state.includes('karnataka') || state.includes('tamil nadu')) {
        days = 3;
    }
    // Remote areas - slower
    else if (state.includes('jammu') || state.includes('kashmir') ||
        state.includes('himachal') || state.includes('arunachal')) {
        days = 7;
    }

    delivery.setDate(delivery.getDate() + days);
    return delivery.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long' });
}

// Send WhatsApp message
function sendWhatsAppMessage(order, templateType, customData) {
    const phone = order.telNo || order.mobile;

    if (!phone) {
        alert('❌ Customer phone number not found!');
        return;
    }

    // Get message based on department and template
    let message = '';

    if (templateType.includes('.')) {
        // Department-specific template (e.g., 'verification.addressConfirm')
        const [dept, template] = templateType.split('.');
        message = whatsappDepartmentTemplates[dept][template](order, customData);
    } else {
        // Legacy template from whatsapp-notifications.js
        if (whatsappTemplates && whatsappTemplates[templateType]) {
            message = whatsappTemplates[templateType](order);
        }
    }

    if (!message) {
        alert('❌ Invalid template type!');
        return;
    }

    // Clean phone number (remove +91, spaces, hyphens)
    let cleanPhone = phone.toString().replace(/[\s\-+]/g, '');

    // Add 91 if not present
    if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }

    // Open WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    console.log(`📱 WhatsApp opened for ${order.orderId} to ${cleanPhone}`);
}

// Show custom message dialog
function showCustomMessageDialog(order, callback) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold text-gray-800">📱 Custom WhatsApp Message</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-2">Customer:</label>
                <div class="text-gray-600">${order.customerName} - ${order.telNo || order.mobile}</div>
            </div>
            
            <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-2">Message:</label>
                <textarea id="customMessage" rows="6" 
                    class="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-green-500 focus:outline-none"
                    placeholder="Enter your custom message here..."></textarea>
            </div>
            
            <div class="flex gap-3">
                <button onclick="this.closest('.fixed').remove()" 
                    class="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300">
                    Cancel
                </button>
                <button onclick="sendCustomMessage('${order.orderId}')" 
                    class="flex-1 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2">
                    📱 Send WhatsApp
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('customMessage').focus();
}

// Send custom message
window.sendCustomMessage = function (orderId) {
    const message = document.getElementById('customMessage').value.trim();

    if (!message) {
        alert('Please enter a message!');
        return;
    }

    // Find order (from global orders array if available)
    let order = null;
    if (window.currentOrders) {
        order = window.currentOrders.find(o => o.orderId === orderId);
    }

    if (order) {
        sendWhatsAppMessage(order, 'dispatch.customMessage', message);
        document.querySelector('.fixed.inset-0').remove();
    } else {
        alert('Order not found!');
    }
};

// Export for global use
window.sendWhatsAppMessage = sendWhatsAppMessage;
window.showCustomMessageDialog = showCustomMessageDialog;

console.log('✅ WhatsApp department templates loaded');
