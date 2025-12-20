// WhatsApp Direct Messaging for Departments
// Professional Hindi message templates for Verification & Dispatch

const whatsappDepartmentTemplates = {
    // Verification Department Messages
    verification: {
        addressConfirm: (order) => `नमस्ते ${order.customerName}! 🙏

आपका Order *${order.orderId}* receive हो गया है।

📦 *Order Details:*
- Amount: ₹${order.total}
- Payment: ${order.paymentMode}
${order.paymentMode === 'COD' ? `- COD Amount: ₹${order.codAmount || order.total}` : ''}

📍 *Delivery Address:*
${order.address}
${order.city ? order.city : order.distt}, ${order.state} - ${order.pin || order.pincode}

कृपया address verify करें और confirm करें कि यह सही है।

Reply करें: 
✅ "हाँ सही है" - Address correct है
❌ "बदलें" - Address change करना है

धन्यवाद!
*Herb On Naturals*`,

        addressVerified: (order) => `नमस्ते ${order.customerName}! ✅

आपका order *${order.orderId}* का address verify हो गया है।

📦 *Verified Address:*
${order.address}
${order.city ? order.city : order.distt}, ${order.state} - ${order.pin || order.pincode}

जल्द ही आपका order dispatch किया जाएगा। Dispatch होते ही tracking details आपको SMS/WhatsApp पर भेजी जाएंगी।

धन्यवाद!
*Herb On Naturals*
📞 Customer Care: [Your Number]`,

        orderCancelled: (order, reason) => `नमस्ते ${order.customerName}!

आपका order *${order.orderId}* cancel किया गया है।

❌ *Cancellation Reason:*
${reason || 'Customer request'}

अगर आपको कोई query है तो हमें contact करें।

धन्यवाद!
*Herb On Naturals*
📞 Customer Care: [Your Number]`,

        addressIssue: (order) => `नमस्ते ${order.customerName}! ⚠️

आपके order *${order.orderId}* के address में कुछ issue है।

कृपया सही address भेजें:
- House/Flat Number
- Area/Locality
- Landmark
- Pin Code

जल्दी reply करें ताकि delivery में delay न हो।

धन्यवाद!
*Herb On Naturals*`
    },

    // Dispatch Department Messages
    dispatch: {
        readyToDispatch: (order) => `नमस्ते ${order.customerName}! 📦

आपका order *${order.orderId}* dispatch के लिए ready है।

*Order Details:*
- Total Items: ${order.items?.length || 1}
- Amount: ₹${order.total}
- Payment: ${order.paymentMode}

आज/कल dispatch किया जाएगा। Dispatch होते ही tracking number भेजा जाएगा।

कृपया phone available रखें।

धन्यवाद!
*Herb On Naturals*`,

        dispatched: (order) => `नमस्ते ${order.customerName}! 🚚

आपका order *${order.orderId}* dispatch हो गया है!

📦 *Tracking Details:*
- AWB: *${order.shiprocket?.awb || order.tracking?.trackingId || 'Updating soon...'}*
- Courier: *${order.shiprocket?.courierName || order.tracking?.courier || 'India Post'}*
- Dispatched: ${new Date().toLocaleDateString('hi-IN')}

${getTrackingLink(order)}

*अनुमानित Delivery:* ${getEstimatedDelivery(order)}

📞 Courier से contact होने पर phone available रखें।

धन्यवाद!
*Herb On Naturals*`,

        outForDelivery: (order) => `नमस्ते ${order.customerName}! 🏃

आपका order *${order.orderId}* आज delivery के लिए निकल चुका है!

📦 AWB: ${order.shiprocket?.awb || order.tracking?.trackingId}
🚚 Courier: ${order.shiprocket?.courierName || order.tracking?.courier}

*🔔 Important:*
- आज delivery होगी
- कृपया phone available रखें
- COD amount ready रखें: ₹${order.codAmount || 0}

धन्यवाद!
*Herb On Naturals*`,

        customMessage: (order, message) => `नमस्ते ${order.customerName}!

*Order ID:* ${order.orderId}

${message}

धन्यवाद!
*Herb On Naturals*
📞 Customer Care: [Your Number]`
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
