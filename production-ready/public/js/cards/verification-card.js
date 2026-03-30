/**
 * =====================================================
 * VERIFICATION CARD RENDERER
 * =====================================================
 * This file contains ONLY the verification card HTML
 * Edit THIS file to change verification card design
 * =====================================================
 */

function renderVerificationCardModern(o) {
    // Robust employee remark collection
    const eRemark = o.remark || (o.remarks && o.remarks.length > 0 ? o.remarks[0].text : '');

    return `
    <div class="bg-gradient-to-br from-white to-indigo-50/30 border-2 border-indigo-200 rounded-3xl p-6 hover:shadow-2xl hover:border-indigo-400 transition-all duration-500 relative overflow-hidden group">
        <!-- Badge -->
        <div class="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest shadow-lg z-10">PENDING</div>

        <div class="flex justify-between items-start mb-6 relative z-10">
            <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform">👤</div>
                <div>
                   <h4 class="font-black text-2xl text-slate-900 leading-tight">${o.customerName}</h4>
                   <div class="flex items-center gap-2 mt-1">
                       <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${o.orderId}</span>
                   </div>
                </div>
            </div>
            <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(o).replace(/"/g, '&quot;')})" 
                class="bg-emerald-50 text-emerald-600 p-3 rounded-2xl hover:bg-emerald-600 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-sm border border-emerald-100">
                ${WHATSAPP_ICON}
            </button>
        </div>

        <!-- Address & Contact -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 group-hover:bg-indigo-50 transition-colors">
                <p class="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Shipping Address</p>
                <p class="text-sm font-bold text-slate-700 leading-relaxed capitalize">${o.address}</p>
            </div>
            <div class="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 group-hover:bg-purple-50 transition-colors">
                <p class="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Primary Contact</p>
                <p class="text-xl font-black text-slate-800 font-mono tracking-tight">${o.telNo}</p>
                ${o.altNo ? `<p class="text-xs font-bold text-slate-500 mt-1">Alt: ${o.altNo}</p>` : ''}
            </div>
        </div>

        <!-- Employee Note -->
        ${eRemark ? `
        <div class="bg-rose-50 border-2 border-rose-100 rounded-2xl p-4 mb-6 relative overflow-hidden group/note">
            <div class="absolute top-0 right-0 bg-rose-200/30 px-3 py-1 rounded-bl-xl text-[8px] font-black text-rose-500 uppercase">Employee Note</div>
            <div class="flex items-start gap-3">
                <span class="text-2xl">💬</span>
                <div>
                    <p class="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Note from ${o.employee || 'Staff'}</p>
                    <p class="text-sm font-bold text-rose-900 italic leading-relaxed">"${eRemark}"</p>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Remark Section -->
        <div class="mb-4">
            <label class="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">📝 Internal Notes (Verification)</label>
            <textarea id="remark-${o.orderId}" placeholder="Add verification notes, special instructions..." 
                class="w-full text-sm p-3 border-2 border-gray-200 rounded-xl h-20 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none">${o.verificationRemark?.text || ''}</textarea>
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
