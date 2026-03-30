(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });

    const WHATSAPP_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width:1em; height:1em;"><path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.1 0-65.6-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.1-3.2-5.4-.3-8.3 2.4-11.1 2.4-2.5 5.5-6.4 8.3-9.6 2.8-3.2 3.7-5.5 5.5-9.1 1.9-3.7 1-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>';

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function closeEmployeePopup(button) {
        button?.closest('.fixed')?.remove();
    }

    function buildBookedMessage(order) {
        return [
            'Herb On Naturals',
            '',
            `Namaste ${order.customerName || 'Customer'} ji,`,
            '',
            'Aapka order confirm ho gaya hai.',
            `Order ID: ${order.orderId || '-'}`,
            `Total: Rs. ${order.total || 0}`,
            `COD: Rs. ${order.codAmount || order.cod || order.total || 0}`,
            '',
            'Team jaldi aapse contact karegi.'
        ].join('\n');
    }

    function sendWhatsAppDirect(type, order) {
        const mobile = String(order?.telNo || order?.mobile || '').trim();
        if (!mobile) {
            showWarningPopup('WhatsApp Error', 'Customer mobile number available nahi hai.');
            return;
        }

        const message = buildBookedMessage(order || {});
        window.open(`https://wa.me/91${encodeURIComponent(mobile)}?text=${encodeURIComponent(message)}`, '_blank');
    }

    function showMessage(message, type, elementId) {
        const host = document.getElementById(elementId || 'empMessage');
        if (!host) {
            return;
        }

        const classes = {
            success: 'border-emerald-500 bg-emerald-50 text-emerald-700',
            error: 'border-red-500 bg-red-50 text-red-700',
            info: 'border-blue-500 bg-blue-50 text-blue-700'
        };

        host.className = `mb-6 p-4 rounded-2xl text-sm border-l-4 shadow-sm ${classes[type] || classes.info}`;
        host.textContent = message;
        host.classList.remove('hidden');

        window.clearTimeout(host._hideTimer);
        host._hideTimer = window.setTimeout(() => {
            host.classList.add('hidden');
        }, 4000);
    }

    function clearPopup(id) {
        document.getElementById(id)?.remove();
    }

    function showSuccessPopup(title, message, icon, color, whatsappData) {
        clearPopup('employeeSuccessPopup');

        const popup = document.createElement('div');
        popup.id = 'employeeSuccessPopup';
        popup.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-[10030] flex items-center justify-center p-4';

        const whatsappButton = whatsappData?.order?.telNo ? `
            <button type="button" onclick="sendWhatsAppDirect('${escapeHtml(whatsappData.type || 'booked')}', ${JSON.stringify(whatsappData.order).replace(/"/g, '&quot;')}); closeEmployeePopup(this);" class="w-full py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mb-3">
                ${WHATSAPP_ICON}
                <span>Send WhatsApp</span>
            </button>
        ` : '';

        popup.innerHTML = `
            <div class="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                <div class="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl font-black" style="background:${color}20;color:${color}">
                    ${escapeHtml(icon || 'OK')}
                </div>
                <h3 class="text-2xl font-black text-slate-800 mb-3">${escapeHtml(title)}</h3>
                <p class="text-slate-500 font-medium leading-relaxed mb-6">${escapeHtml(message).replace(/\n/g, '<br>')}</p>
                ${whatsappButton}
                <button type="button" onclick="closeEmployeePopup(this)" class="w-full py-3 rounded-xl font-bold text-white" style="background:${color}">
                    Continue
                </button>
            </div>
        `;

        document.body.appendChild(popup);
    }

    function showWarningPopup(title, message) {
        clearPopup('employeeWarningPopup');

        const popup = document.createElement('div');
        popup.id = 'employeeWarningPopup';
        popup.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-[10030] flex items-center justify-center p-4';
        popup.innerHTML = `
            <div class="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border-t-8 border-orange-500">
                <div class="w-20 h-20 rounded-full bg-orange-50 text-orange-500 mx-auto mb-5 flex items-center justify-center text-3xl font-black">
                    !
                </div>
                <h3 class="text-2xl font-black text-slate-800 mb-3">${escapeHtml(title)}</h3>
                <p class="text-slate-500 font-medium leading-relaxed mb-6">${escapeHtml(message).replace(/\n/g, '<br>')}</p>
                <button type="button" onclick="closeEmployeePopup(this)" class="w-full py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors">
                    Theek Hai
                </button>
            </div>
        `;

        document.body.appendChild(popup);
    }

    function copyTracking(text) {
        const value = String(text || '').trim();
        if (!value) {
            return;
        }

        if (typeof copyToClipboard === 'function') {
            copyToClipboard(value);
            showMessage(`Copied: ${value}`, 'success', 'empMessage');
            return;
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(value).then(() => {
                showMessage(`Copied: ${value}`, 'success', 'empMessage');
            }).catch((error) => {
                console.error('Copy failed:', error);
            });
        }
    }

    function getDepartmentRoute() {
        if (currentDeptType === 'dispatch') {
            return '/dispatch';
        }
        if (currentDeptType === 'delivery') {
            return '/delivery';
        }
        return '/verification';
    }

    function checkAuth(requiredRole) {
        const hasSession = typeof loadSession === 'function' ? loadSession() : false;
        if (!hasSession) {
            window.location.href = '/login';
            return false;
        }

        if (requiredRole && currentUserType !== requiredRole) {
            if (currentUserType === 'admin') {
                window.location.href = '/admin';
            } else if (currentUserType === 'department') {
                window.location.href = getDepartmentRoute();
            } else if (currentUserType === 'employee') {
                window.location.href = '/employee';
            } else {
                window.location.href = '/login';
            }

            return false;
        }

        return true;
    }

    panel.shared.helpers = {
        WHATSAPP_ICON,
        checkAuth,
        copyTracking,
        sendWhatsAppDirect,
        showMessage,
        showSuccessPopup,
        showWarningPopup
    };

    window.WHATSAPP_ICON = WHATSAPP_ICON;
    window.checkAuth = checkAuth;
    window.closeEmployeePopup = closeEmployeePopup;
    window.copyTracking = copyTracking;
    window.sendWhatsAppDirect = sendWhatsAppDirect;
    window.showMessage = showMessage;
    window.showSuccessPopup = showSuccessPopup;
    window.showWarningPopup = showWarningPopup;
})();
