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

    // Inject animations once
    if (!document.getElementById('popupAnimations')) {
        const style = document.createElement('style');
        style.id = 'popupAnimations';
        style.textContent = `
            @keyframes _popIn  { from { opacity:0; transform: translateY(-16px) scale(0.93); } to { opacity:1; transform: translateY(0) scale(1); } }
            @keyframes _popOut { from { opacity:1; transform: translateY(0) scale(1); } to { opacity:0; transform: translateY(-12px) scale(0.95); } }
            #successPopup { animation: _popIn 0.15s cubic-bezier(0.34,1.56,0.64,1) both; }
            #successPopup.closing { animation: _popOut 0.2s ease-in both; }
        `;
        document.head.appendChild(style);
    }

    // Determine accent color
    let accent = color || '#10b981';
    if (color.includes('f59e0b')) accent = '#f59e0b';
    else if (color.includes('ef4444')) accent = '#ef4444';
    else if (color.includes('3b82f6')) accent = '#3b82f6';
    else if (color.includes('6366f1')) accent = '#6366f1';
    else if (color.includes('8b5cf6')) accent = '#8b5cf6';
    else if (color.includes('9333ea')) accent = '#9333ea';

    let whatsappBtn = '';
    if (whatsappData) {
        whatsappBtn = `
            <button onclick="sendWhatsAppDirect('${whatsappData.type}', ${JSON.stringify(whatsappData.order).replace(/"/g, '&quot;')})"
                style="background:#25D366;color:#fff;border:none;padding:10px 20px;border-radius:10px;font-weight:700;cursor:pointer;font-size:14px;display:flex;align-items:center;gap:6px;margin:0 auto 8px;">
                📱 Send WhatsApp
            </button>
        `;
    }

    // Compact card — no dark overlay
    const card = document.createElement('div');
    card.id = 'successPopup';
    card.style.cssText = `
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        background: #fff;
        border-radius: 18px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 0 0 1px ${accent}22;
        border-top: 4px solid ${accent};
        padding: 18px 24px 16px;
        min-width: 260px;
        max-width: 360px;
        text-align: center;
        cursor: pointer;
    `;
    card.innerHTML = `
        <div style="font-size:32px;margin-bottom:6px;">${icon}</div>
        <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:4px;">${title}</div>
        <div style="font-size:13px;color:#555;line-height:1.5;margin-bottom:${whatsappData ? '10px' : '0'};">${msg}</div>
        ${whatsappBtn}
        <div id="_popupBar" style="height:3px;border-radius:2px;background:${accent};margin-top:12px;transition:width 2s linear;width:100%;"></div>
    `;

    // Click to dismiss
    card.addEventListener('click', () => _dismissPopup(card));

    document.body.appendChild(card);

    // Start progress bar shrink (visual timer)
    requestAnimationFrame(() => {
        const bar = document.getElementById('_popupBar');
        if (bar) { bar.style.width = '0%'; }
    });

    // Auto-dismiss after 2 seconds
    const timer = setTimeout(() => _dismissPopup(card), 2000);
    card._timer = timer;
}

function _dismissPopup(card) {
    if (!card || !card.parentNode) return;
    clearTimeout(card._timer);
    card.classList.add('closing');
    setTimeout(() => { if (card.parentNode) card.remove(); }, 200);
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
