/**
 * ============================================
 * UI POPUPS - Success/Warning/Validation Popups
 * ============================================
 * All popup notifications in one place.
 * 
 * If popups not showing → Check this file
 * If WhatsApp button not working → Check sendWhatsAppDirect()
 */

/**
 * Show success popup with optional WhatsApp button
 * @param {string} title - Popup title
 * @param {string} msg - Message text  
 * @param {string} icon - Emoji icon
 * @param {string} color - Background color
 * @param {Object} whatsappData - WhatsApp data (optional)
 */
function showSuccessPopup(title, msg, icon = '✅', color = '#10b981', whatsappData = null) {
    // Remove existing popup
    const existing = document.getElementById('successPopup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'successPopup';
    popup.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: white; border-radius: 20px; padding: 30px;
        box-shadow: 0 25px 50px rgba(0,0,0,0.3); z-index: 99999;
        text-align: center; min-width: 300px; animation: popIn 0.3s ease;
    `;

    let whatsappBtn = '';
    if (whatsappData) {
        whatsappBtn = `
            <button onclick="sendWhatsAppDirect('${whatsappData.type}', ${JSON.stringify(whatsappData.order).replace(/"/g, '&quot;')})"
                style="background: #25D366; color: white; border: none; padding: 12px 24px; 
                border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 10px;">
                📱 Send WhatsApp
            </button>
        `;
    }

    popup.innerHTML = `
        <div style="font-size: 60px; margin-bottom: 15px;">${icon}</div>
        <h3 style="color: ${color}; margin-bottom: 10px; font-size: 20px;">${title}</h3>
        <p style="color: #666; margin-bottom: 15px;">${msg}</p>
        ${whatsappBtn}
        <button onclick="this.parentElement.remove()" 
            style="background: #f3f4f6; border: none; padding: 10px 20px; 
            border-radius: 8px; cursor: pointer; margin-top: 10px;">
            Close
        </button>
    `;

    document.body.appendChild(popup);

    // Auto close after 5 seconds
    setTimeout(() => {
        if (document.getElementById('successPopup')) {
            popup.remove();
        }
    }, 5000);
}

/**
 * Show warning popup
 * @param {string} title - Warning title
 * @param {string} msg - Warning message
 */
function showWarningPopup(title, msg) {
    showSuccessPopup(title, msg, '⚠️', '#f59e0b');
}

/**
 * Show error popup
 * @param {string} title - Error title
 * @param {string} msg - Error message
 */
function showErrorPopup(title, msg) {
    showSuccessPopup(title, msg, '❌', '#ef4444');
}

/**
 * Show validation popup for missing fields
 * @param {Array} missingFields - List of missing field names
 */
function showValidationPopup(missingFields) {
    const popup = document.createElement('div');
    popup.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    popup.id = 'validationPopup';

    popup.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div class="text-center mb-4">
                <div class="text-5xl mb-3">⚠️</div>
                <h3 class="text-xl font-bold text-red-600">Missing Required Fields</h3>
            </div>
            <div class="bg-red-50 rounded-lg p-4 mb-4">
                <p class="text-sm text-red-700 mb-2">Please fill in the following:</p>
                <ul class="list-disc list-inside text-red-600">
                    ${missingFields.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>
            <button onclick="document.getElementById('validationPopup').remove()"
                class="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600">
                OK, I'll Fix It
            </button>
        </div>
    `;

    document.body.appendChild(popup);
}

/**
 * Show inline message in an element
 * @param {string} msg - Message text
 * @param {string} type - 'success' or 'error'
 * @param {string} elementId - Element ID to show message in
 */
function showMessage(msg, type, elementId) {
    const el = document.getElementById(elementId);
    if (!el) {
        console.log(msg);
        return;
    }

    el.innerHTML = `
        <div class="p-3 rounded-lg ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
            ${type === 'error' ? '❌' : '✅'} ${msg}
        </div>
    `;
    el.classList.remove('hidden');

    // Auto hide after 5 seconds
    setTimeout(() => {
        el.classList.add('hidden');
    }, 5000);
}

/**
 * Helper for direct WhatsApp redirect
 * @param {string} type - Message type (booked, verified, dispatched, etc.)
 * @param {Object} order - Order object
 */
function sendWhatsAppDirect(type, order) {
    try {
        const template = whatsappTemplates[type];
        if (template && order) {
            const message = template(order);
            const phone = (order.telNo || order.mobileNumber || '').replace(/\D/g, '');
            const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        }
    } catch (e) {
        console.error('WhatsApp error:', e);
    }
}
