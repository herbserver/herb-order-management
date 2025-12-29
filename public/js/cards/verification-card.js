/**
 * =====================================================
 * VERIFICATION CARD RENDERER
 * =====================================================
 * This file contains ONLY the verification card HTML
 * Edit THIS file to change verification card design
 * =====================================================
 */

function renderVerificationCardModern(o) {
    return `
    <div class="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-2xl p-5 hover:shadow-2xl hover:border-emerald-300 transition-all duration-300 relative overflow-hidden group">
        <!-- Decorative Corner -->
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/40 to-blue-100/40 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
        
        <!-- Header Section -->
        <div class="flex justify-between items-start mb-4 relative z-10">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full font-bold shadow-lg shadow-orange-200 animate-pulse">✨ NEW</span>
                    <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(o).replace(/"/g, '&quot;')})" 
                        class="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl flex items-center justify-center hover:scale-110 hover:rotate-12 shadow-lg shadow-green-200 transition-all" title="Send WhatsApp">
                        ${WHATSAPP_ICON}
                    </button>
                </div>
                <h4 class="font-black text-xl text-gray-900 leading-tight">${o.customerName}</h4>
                <p class="text-xs text-gray-500 font-medium mt-1">🕒 ${new Date(o.timestamp).toLocaleString()}</p>
            </div>
            <div class="text-right bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-3 rounded-2xl border-2 border-emerald-200 shadow-sm">
                <p class="text-xs text-emerald-600 font-bold uppercase tracking-wide">Total</p>
                <p class="font-black text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">₹${o.total}</p>
            </div>
        </div>
        
        <!-- Contact Info Section -->
        <div class="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200 mb-4 space-y-2 shadow-inner">
            <div class="flex items-start gap-2">
                <span class="text-lg">📍</span>
                <p class="text-sm text-gray-700 font-medium flex-1">${o.address}</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-lg">📞</span>
                <p class="text-sm text-gray-800 font-bold">${o.telNo}</p>
            </div>
        </div>
        
        <!-- Remark Section -->
        <div class="mb-4">
            <label class="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">📝 Internal Notes</label>
            <textarea id="remark-${o.orderId}" placeholder="Add verification notes, special instructions..." 
                class="w-full text-sm p-3 border-2 border-gray-200 rounded-xl h-20 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none">${o.remark || ''}</textarea>
        </div>
        
        <!-- Courier Suggestion -->
        <div class="mb-4">
            <label class="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span class="text-lg">🚚</span> Suggest Courier
            </label>
            <select id="courier-${o.orderId}" 
                class="w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all bg-white">
                <option value="">-- No Suggestion --</option>
                <option value="Delhivery">🚛 Delhivery</option>
                <option value="Delhivery Air">✈️ Delhivery Air</option>
                <option value="Blue Dart Air">🔵 Blue Dart Air</option>
                <option value="DTDC Air 500gm">📦 DTDC Air 500gm</option>
                <option value="Xpressbees">⚡ Xpressbees</option>
                <option value="Ekart">🛒 Ekart</option>
                <option value="Shiprocket Auto">🤖 Shiprocket Auto (AI Decides)</option>
            </select>
        </div>
        
        <!-- Action Buttons -->
        <div class="grid grid-cols-2 gap-3 mb-3">
            <button onclick="saveOrderRemark('${o.orderId}')" 
                class="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 font-bold py-3 rounded-xl hover:from-gray-200 hover:to-slate-200 transition-all border-2 border-gray-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                <span>💾</span> Save Notes
            </button>
            <button onclick="viewOrder('${o.orderId}')" 
                class="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-bold py-3 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all border-2 border-blue-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                <span>👁️</span> View
            </button>
        </div>
        <div class="grid grid-cols-2 gap-3">
            <button onclick="verifyAddress('${o.orderId}')" 
                class="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 hover:shadow-green-300 hover:scale-105 transform flex items-center justify-center gap-2">
                <span>✅</span> Approve
            </button>
            <button onclick="cancelOrder('${o.orderId}')" 
                class="bg-gradient-to-r from-red-50 to-rose-50 text-red-600 font-bold py-3 rounded-xl hover:from-red-100 hover:to-rose-100 transition-all border-2 border-red-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                <span>❌</span> Cancel
            </button>
        </div>
    </div>`;
}

// Make it globally available
window.renderVerificationCardModern = renderVerificationCardModern;

console.log('✅ Verification Card Renderer Loaded');
