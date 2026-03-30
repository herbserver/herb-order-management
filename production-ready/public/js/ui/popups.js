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

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'successPopup';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        z-index: 99999; padding: 20px;
        animation: fadeIn 0.2s ease-out;
    `;

    // Determine gradient based on color
    let gradient = 'linear-gradient(135deg, #10b981, #059669)';
    if (color.includes('f59e0b') || color.includes('orange') || icon === '⚠️') {
        gradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
    } else if (color.includes('ef4444') || color.includes('red') || icon === '❌') {
        gradient = 'linear-gradient(135deg, #ef4444, #dc2626)';
    } else if (color.includes('3b82f6') || color.includes('blue') || icon === '👋') {
        gradient = 'linear-gradient(135deg, #3b82f6, #2563eb)';
    } else if (color.includes('9333ea') || color.includes('purple') || icon === '🚀') {
        gradient = 'linear-gradient(135deg, #9333ea, #7c3aed)';
    }

    let whatsappBtn = '';
    if (whatsappData) {
        whatsappBtn = `
            <button onclick="sendWhatsAppDirect('${whatsappData.type}', ${JSON.stringify(whatsappData.order).replace(/"/g, '&quot;')})"
                style="background: linear-gradient(135deg, #25D366, #128C7E); color: white; border: none; 
                padding: 14px 28px; border-radius: 14px; font-weight: 600; cursor: pointer; 
                font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px;
                box-shadow: 0 4px 15px rgba(37,211,102,0.3); transition: all 0.2s ease;">
                <span style="font-size: 18px;">📱</span> Send WhatsApp
            </button>
        `;
    }

    overlay.innerHTML = `
        <div style="
            background: white; border-radius: 24px; 
            max-width: 400px; width: 100%;
            box-shadow: 0 25px 60px rgba(0,0,0,0.3);
            overflow: hidden;
            animation: slideUp 0.3s ease-out;
        ">
            <!-- Header with gradient -->
            <div style="
                background: ${gradient}; 
                padding: 32px 24px;
                text-align: center;
            ">
                <div style="
                    width: 80px; height: 80px; 
                    background: rgba(255,255,255,0.2); 
                    border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 16px;
                    font-size: 42px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                ">${icon}</div>
                <h3 style="
                    color: white; 
                    font-size: 22px; 
                    font-weight: 700; 
                    margin: 0;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">${title}</h3>
            </div>
            
            <!-- Content -->
            <div style="padding: 24px; text-align: center;">
                <p style="
                    color: #4b5563; 
                    font-size: 15px; 
                    line-height: 1.6;
                    margin: 0 0 20px 0;
                    white-space: pre-line;
                ">${msg}</p>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${whatsappBtn}
                    <button onclick="document.getElementById('successPopup').remove()" 
                        style="
                            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
                            border: none; 
                            padding: 14px 28px; 
                            border-radius: 14px; 
                            cursor: pointer; 
                            font-weight: 600;
                            font-size: 15px;
                            color: #374151;
                            transition: all 0.2s ease;
                        ">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    `;
    if (!document.getElementById('popupAnimations')) {
        style.id = 'popupAnimations';
        document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // Auto close after 6 seconds
    setTimeout(() => {
        if (document.getElementById('successPopup')) {
            overlay.remove();
        }
    }, 6000);
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
    // Remove existing popup
    document.getElementById('validationPopup')?.remove();

    const popup = document.createElement('div');
    popup.id = 'validationPopup';
    popup.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        z-index: 99999; padding: 20px;
        animation: fadeIn 0.2s ease-out;
    `;

    popup.innerHTML = `
        <div style="
            background: white; border-radius: 24px; 
            max-width: 420px; width: 100%;
            box-shadow: 0 25px 60px rgba(0,0,0,0.3);
            overflow: hidden;
            animation: slideUp 0.3s ease-out;
        ">
            <!-- Header with gradient -->
            <div style="
                background: linear-gradient(135deg, #ef4444, #dc2626); 
                padding: 28px 24px;
                text-align: center;
            ">
                <div style="
                    width: 70px; height: 70px; 
                    background: rgba(255,255,255,0.2); 
                    border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 14px;
                    font-size: 36px;
                    backdrop-filter: blur(10px);
                ">⚠️</div>
                <h3 style="
                    color: white; 
                    font-size: 20px; 
                    font-weight: 700; 
                    margin: 0;
                ">Required Fields Missing</h3>
            </div>
            
            <!-- Content -->
            <div style="padding: 24px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0; text-align: center;">
                    Please fill in the following fields:
                </p>
                <div style="
                    background: linear-gradient(135deg, #fef2f2, #fee2e2);
                    border-radius: 16px; 
                    padding: 16px 20px;
                    margin-bottom: 20px;
                    border: 1px solid #fecaca;
                ">
                    <ul style="margin: 0; padding-left: 20px; color: #dc2626; font-size: 14px; line-height: 2;">
                        ${missingFields.map(f => `<li style="font-weight: 500;">${f}</li>`).join('')}
                    </ul>
                </div>
                <button onclick="document.getElementById('validationPopup').remove()"
                    style="
                        width: 100%;
                        background: linear-gradient(135deg, #ef4444, #dc2626);
                        color: white;
                        border: none;
                        padding: 15px;
                        border-radius: 14px;
                        font-weight: 600;
                        font-size: 15px;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(239,68,68,0.3);
                        transition: all 0.2s ease;
                    ">
                    OK, I'll Fix It
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Close on overlay click
    popup.addEventListener('click', (e) => {
        if (e.target === popup) popup.remove();
    });
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
