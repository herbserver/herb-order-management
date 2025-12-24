// WhatsApp Icon SVG
const WHATSAPP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width:1.2em; height:1.2em;"><path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.1 0-65.6-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.1-3.2-5.4-.3-8.3 2.4-11.1 2.4-2.5 5.5-6.4 8.3-9.6 2.8-3.2 3.7-5.5 5.5-9.1 1.9-3.7 1-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>`;

// API Configuration
// If API_URL is defined in HTML, use it, else default
if (typeof API_URL === 'undefined') {
    var API_URL = '/api';
}

// Fallback WhatsApp Templates - Hinglish Version
if (typeof whatsappTemplates === 'undefined') {
    var whatsappTemplates = {
        booked: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

✅ Aapka order confirm ho gaya hai!

📦 *ORDER DETAILS*
▸ Order No: *${order.orderId}*
▸ Total Amount: *Rs. ${order.total || 0}*
▸ Advance Paid: Rs. ${order.advance || 0}
▸ COD Amount: *Rs. ${order.codAmount || order.cod || 0}*

📞 Hamari team jaldi hi aapko call karegi address verify karne ke liye.

⚠️ *IMPORTANT*
🚫 Product milne se pehle OTP share NA karein!

_Team Herb On Naturals_ 💚
🌐 herbonnaturals.in`,

        verified: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

✅ Aapka order *VERIFY* ho gaya hai!

📦 *ORDER: ${order.orderId}*

💰 *PAYMENT INFO*
▸ Total: Rs. ${order.total || 0}
▸ Paid: Rs. ${order.advance || 0}
▸ COD: *Rs. ${order.codAmount || order.cod || 0}*

📦 Order packing ho raha hai. Tracking details jaldi milenge!

🔐 *YAAD RAKHEIN*
🚫 Product check kiye bina OTP share NA karein!

_Team Herb On Naturals_ 💚`,

        dispatched: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

🚚 Aapka order *DISPATCH* ho gaya hai!

📦 *ORDER: ${order.orderId}*

📍 *TRACKING INFO*
▸ AWB No: *${order.shiprocket?.awb || order.tracking?.trackingId || 'Processing'}*
▸ Courier: *${order.shiprocket?.courierName || order.tracking?.courier || 'Processing'}*

💰 *PAYMENT*
▸ Total: Rs. ${order.total || 0}
▸ COD: *Rs. ${order.codAmount || order.cod || 0}*

🔗 Track karein: shiprocket.co/tracking

📋 *ZARURI BAATEIN*
📱 Phone ON rakhein
💵 COD amount ready rakhein
👀 Pehle product check karein
🔐 Phir OTP dein

_Happy Shopping!_ 🛍️
_Team Herb On Naturals_ 💚`,

        out_for_delivery: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

🏃 *AJ DELIVERY HOGI!*

📦 Order: *${order.orderId}*
💵 COD: *Rs. ${order.codAmount || order.cod || 0}*

🏠 Aaj aapka parcel aane wala hai, please available rahein.

⚠️ *YAAD RAKHEIN*
👀 Pehle product check karein, phir OTP dein!

_Team Herb On Naturals_ 💚`,

        delivered: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

🎉 *ORDER DELIVER HO GAYA!*

📦 Order: ${order.orderId}

🙏 Hamare saath shopping karne ke liye dhanyavaad!

⭐ Hume umeed hai ki aapko products pasand aayenge. Apna feedback zarur share karein - yeh hamare liye bahut important hai!

🛒 Dobara shopping karein: herbonnaturals.in

_Warm regards,_ 💚
_Team Herb On Naturals_`
    };
}

// ==================== SESSION MANAGEMENT ====================
let currentUser = null;

function saveSession(user, type, deptType) {
    const session = {
        user: user,
        type: type,
        deptType: deptType || 'verification'
    };
    localStorage.setItem('herb_session', JSON.stringify(session));
}

function loadSession() {
    try {
        const session = JSON.parse(localStorage.getItem('herb_session'));
        if (session && session.user) {
            currentUser = session.user;
            return session;
        }
    } catch (e) { }
    return null;
}

function clearSession() {
    localStorage.removeItem('herb_session');
    currentUser = null;
}

function logout() {
    clearSession();
    window.location.href = '/login';
}

function checkAuth(requiredRole) {
    const session = loadSession();
    if (!session) {
        // If not on login page, redirect
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
        return false;
    }

    // Role Redirects
    if (requiredRole && session.type !== requiredRole) {
        if (session.type === 'admin') window.location.href = '/admin';
        else if (session.type === 'employee') window.location.href = '/employee';
        else if (session.type === 'department') window.location.href = '/department';
        return false;
    }

    // If on login page but already logged in, redirect
    if (window.location.pathname.includes('/login')) {
        if (session.type === 'admin') window.location.href = '/admin';
        else if (session.type === 'employee') window.location.href = '/employee';
        else if (session.type === 'department') window.location.href = '/department';
    }

    return true;
}

// ==================== UI HELPERS ====================
function showMessage(msg, type, elementId) {
    const el = document.getElementById(elementId) || document.getElementById('adminMessage'); // Fallback
    if (!el) {
        alert(msg); // Ultimate fallback
        return;
    }

    el.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border animate-fadeIn ${type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
        type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
            'bg-blue-50 border-blue-200 text-blue-700'
        }`;
    el.innerHTML = `<div class="flex items-center gap-3">
        <span class="text-2xl">${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
        <p class="font-bold">${msg}</p>
    </div>`;

    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function showSuccessPopup(title, msg, icon, color, whatsappData = null) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn';

    let whatsappBtn = '';
    if (whatsappData) {
        whatsappBtn = `
            <button onclick="sendWhatsAppDirect('${whatsappData.type}', ${JSON.stringify(whatsappData.order).replace(/"/g, '&quot;')}); this.closest('.fixed').remove()" 
                class="w-full py-3.5 rounded-xl font-bold text-white shadow-lg bg-green-500 hover:bg-green-600 hover:scale-105 transition-all flex items-center justify-center gap-2 mb-3">
                <span>📱</span> Send WhatsApp
            </button>
        `;
    }

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100">
            <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg" style="background:${color}20; color:${color}">
                ${icon}
            </div>
            <h3 class="text-2xl font-black text-gray-800 mb-3">${title}</h3>
            <p class="text-gray-500 font-medium mb-8 leading-relaxed">${msg.replace(/\n/g, '<br>')}</p>
            ${whatsappBtn}
            <button onclick="this.closest('.fixed').remove()" class="w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all" style="background:${color}">
                Continue
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Helper for direct WhatsApp redirect
function sendWhatsAppDirect(type, order) {
    if (typeof whatsappTemplates !== 'undefined' && whatsappTemplates[type]) {
        const msg = whatsappTemplates[type](order);
        const url = `https://wa.me/91${order.telNo}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    } else {
        alert('WhatsApp template not found');
    }
}

function showWarningPopup(title, msg) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-t-8 border-orange-500">
            <div class="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-6 text-4xl text-orange-500">
                ⚠️
            </div>
            <h3 class="text-2xl font-black text-gray-800 mb-3">${title}</h3>
            <p class="text-gray-600 font-medium mb-8 leading-relaxed">${msg.replace(/\n/g, '<br>')}</p>
            <button onclick="this.closest('.fixed').remove()" class="w-full py-3.5 bg-orange-500 rounded-xl font-bold text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-105 transition-all">
                Theek Hai
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// ==================== COPY FUNCTIONS ====================
function copyTracking(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => showMessage('Copied: ' + text, 'success'))
            .catch(err => console.error('Copy failed', err));
    } else {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showMessage('Copied: ' + text, 'success');
        } catch (err) {
            prompt("Copy manually:", text);
        }
        document.body.removeChild(textArea);
    }
}

// ==================== ORDER VIEW LOGIC (Shared) ====================
async function viewOrder(orderId) {
    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await res.json();
        const order = data.order;

        if (!order) {
            alert('Order not found!');
            return;
        }

        const fullAddress = `${order.address || '', order.distt || ''}, ${order.state || ''} - ${order.pin || ''}`;

        // Support both ID versions used across different pages
        const modalContent = document.getElementById('orderDetailContent') || document.getElementById('orderModalContent');
        const modalElement = document.getElementById('orderDetailModal') || document.getElementById('orderModal');

        if (!modalContent || !modalElement) {
            console.error('Order Modal not found in DOM');
            return;
        }

        modalContent.innerHTML = `
                <div class="flex flex-col h-full bg-gray-50/50">
                    <!-- Premium Header -->
                    <div class="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-8 text-white relative flex-shrink-0 rounded-t-2xl shadow-lg border-b border-white/10">
                        <!-- Close Button -->
                        <button onclick="closeModal('${modalElement.id}')" class="absolute top-5 right-5 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2.5 transition-all z-20 backdrop-blur-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <div class="flex justify-between items-end relative z-10">
                            <div class="space-y-2">
                                <div class="flex items-center gap-3">
                                    <h4 class="text-4xl font-black font-mono tracking-tighter drop-shadow-lg">${order.orderId}</h4>
                                    <span class="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl bg-white/20 backdrop-blur-md border border-white/30">
                                        ${order.status}
                                    </span>
                                </div>
                                <p class="text-sm font-bold text-white/70 flex items-center gap-2">
                                    📅 ${order.timestamp ? new Date(order.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                            <div class="text-right">
                                <p class="text-5xl font-black drop-shadow-2xl tracking-tighter">₹${order.total || 0}</p>
                                <p class="text-xs font-black text-white/60 uppercase tracking-widest mt-1">Total Order Value</p>
                            </div>
                        </div>
                    </div>

                    <!-- Layout Grid -->
                    <div class="p-6 space-y-8">
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- Customer Details Card -->
                            <div class="bg-white border-2 border-gray-50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div class="absolute top-0 right-0 bg-blue-600 text-white px-5 py-1.5 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest shadow-md">CUSTOMER</div>
                                <div class="flex items-center gap-5 mb-6">
                                    <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-3xl shadow-inner group-hover:scale-110 transition-transform cursor-pointer">👤</div>
                                    <div>
                                    <div class="flex items-center gap-3">
                                        <h5 class="text-2xl font-black text-gray-900 leading-tight">${order.customerName}</h5>
                                        <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                                            class="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 hover:scale-110 shadow-sm transition-all" title="Send WhatsApp">
                                            ${WHATSAPP_ICON}
                                        </button>
                                    </div>
                                    <p class="text-xs text-blue-500 font-black uppercase tracking-widest mt-0.5">Verified Client</p>
                                    </div>
                                </div>
                                <div class="space-y-4">
                                   <div class="flex flex-col">
                                       <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile Contact</span>
                                       <span class="text-xl font-black text-gray-800 font-mono tracking-wide">${order.telNo}</span>
                                   </div>
                                   ${order.altNo ? `
                                   <div class="flex flex-col">
                                       <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alternative Number</span>
                                       <span class="text-lg font-bold text-gray-700 font-mono">${order.altNo}</span>
                                   </div>` : ''}
                                   <div class="pt-2">
                                       <span class="px-4 py-2 bg-gray-100 rounded-xl text-xs font-black text-gray-600 border border-gray-200 uppercase tracking-wider">${order.orderType || 'Standard Order'}</span>
                                   </div>
                                </div>
                            </div>

                            <!-- Delivery Address Card -->
                            <div class="bg-white border-2 border-gray-50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div class="absolute top-0 right-0 bg-orange-500 text-white px-5 py-1.5 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest shadow-md">DELIVERY</div>
                                <div class="flex items-center justify-between mb-6">
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 text-2xl shadow-inner">📍</div>
                                        <h5 class="text-xl font-black text-gray-900 leading-none">Shipping Address</h5>
                                    </div>
                                    <button type="button" onclick="copyTracking(this.getAttribute('data-addr'))" data-addr="${fullAddress.replace(/"/g, '&quot;')}" 
                                        class="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white px-4 py-2 rounded-2xl text-[10px] font-black transition-all border border-blue-100 flex items-center gap-2 shadow-sm uppercase tracking-widest">
                                        📋 Copy
                                    </button>
                                </div>
                                <div class="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 flex flex-col gap-3">
                                    <p class="text-gray-900 font-bold text-lg leading-relaxed capitalize">
                                        ${fullAddress}
                                    </p>
                                    ${order.landMark ? `
                                    <div class="pt-2 border-t border-orange-200/50 flex items-start gap-3 text-sm text-gray-600">
                                        <span class="text-orange-500 font-black">🚩</span>
                                        <div class="flex flex-col">
                                            <span class="text-[10px] font-black text-orange-400 uppercase tracking-widest">Landmark</span>
                                            <span class="font-bold">${order.landMark}</span>
                                        </div>
                                    </div>` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Order Items Section -->
                        <div class="bg-white border-2 border-gray-50 rounded-[40px] shadow-sm overflow-hidden">
                            <div class="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <h5 class="text-xl font-black text-gray-900 flex items-center gap-3">📦 <span class="uppercase tracking-tighter">Order Line Items</span></h5>
                                <span class="text-[10px] bg-white text-gray-700 px-4 py-2 rounded-2xl border-2 border-gray-50 font-black uppercase tracking-widest shadow-sm">
                                    ${order.items ? order.items.length : 0} Unique Products
                                </span>
                            </div>
                            <div class="px-2 pb-2">
                                ${order.items && order.items.length > 0 ?
                `<div class="overflow-x-auto rounded-[30px] border border-gray-50">
                                    <table class="w-full text-base">
                                        <thead class="bg-gray-100/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] text-left">
                                            <tr>
                                                <th class="px-8 py-5">Product Description</th>
                                                <th class="px-8 py-5 text-right">Rate</th>
                                                <th class="px-8 py-5 text-center w-32">Qty</th>
                                                <th class="px-8 py-5 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-50">
                                            ${order.items.map(item => {
                    const rate = item.rate || item.price || 0;
                    const qty = item.quantity || item.qty || 1;
                    const subtotal = item.amount || (rate * qty);
                    return `
                                                <tr class="hover:bg-blue-50/30 transition-all">
                                                    <td class="px-8 py-5 font-black text-gray-800">${item.description || 'Unnamed Product'}</td>
                                                    <td class="px-8 py-5 text-right font-bold text-gray-500">₹${rate}</td>
                                                    <td class="px-8 py-5 text-center">
                                                        <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-black text-gray-700">x${qty}</span>
                                                    </td>
                                                    <td class="px-8 py-5 text-right font-black text-gray-900 text-lg">₹${subtotal}</td>
                                                </tr>
                                            `}).join('')}
                                        </tbody>
                                    </table>
                                </div>`
                : '<div class="p-16 text-center text-gray-300 font-black uppercase tracking-widest">No Items in this Order</div>'
            }
                            </div>
                            
                            <!-- Detailed Totals Summary -->
                            <div class="bg-gray-900 mx-4 mb-4 mt-2 p-8 rounded-[30px] shadow-2xl relative overflow-hidden">
                                <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                                <div class="flex flex-col gap-4 ml-auto w-full md:w-1/2 relative z-10">
                                    <div class="flex justify-between text-white/50 text-xs font-black uppercase tracking-widest">
                                        <span>Order Total (MRP)</span>
                                        <span class="text-white font-bold">₹${order.total || 0}</span>
                                    </div>
                                    <div class="flex justify-between text-white/50 text-xs font-black uppercase tracking-widest">
                                        <span>Advance Payment</span>
                                        <span class="text-emerald-400 font-bold">- ₹${order.advance || 0}</span>
                                    </div>
                                    <div class="h-px bg-white/10 my-1"></div>
                                    <div class="flex justify-between items-end">
                                        <div class="flex flex-col">
                                            <span class="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-1">Total Balance Due</span>
                                            <span class="text-3xl font-black text-white tracking-tighter">COD Payable</span>
                                        </div>
                                        <span class="text-4xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">₹${order.codAmount || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Professional Footer Meta -->
                        <div class="bg-gray-800 p-8 rounded-[40px] border border-gray-700 shadow-xl flex flex-col md:flex-row gap-6 items-center justify-between text-white">
                            <div class="flex items-center gap-4">
                               <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl backdrop-blur-sm">👨‍💻</div>
                               <div class="flex flex-col">
                                   <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Created By</span>
                                   <span class="font-black text-lg text-emerald-400 capitalize">${order.employee} <span class="text-gray-500 font-mono text-sm">(${order.employeeId})</span></span>
                               </div>
                            </div>
                            <div class="flex gap-4">
                                ${order.verifiedBy ? `
                                <div class="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex flex-col">
                                    <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Verified</span>
                                    <span class="text-sm font-black text-blue-400">${order.verifiedBy}</span>
                                </div>` : ''}
                                ${order.dispatchedBy ? `
                                <div class="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex flex-col">
                                    <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Dispatched</span>
                                    <span class="text-sm font-black text-purple-400">${order.dispatchedBy}</span>
                                </div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>`;

        modalElement.classList.remove('hidden');

        // Note: Map initialization is skipped in common.js unless initOrderMap is present
        if (typeof initOrderMap === 'function') {
            setTimeout(() => {
                initOrderMap(fullAddress);
            }, 300);
        }

    } catch (e) {
        console.error('Error loading order:', e);
        alert('Failed to load order details');
    }
}
