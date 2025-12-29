/**
 * =====================================================
 * DISPATCH CARD RENDERER
 * =====================================================
 * Edit THIS file to change dispatch card design
 * =====================================================
 */

function renderDispatchCardModern(o) {
    const suggestion = o.courierSuggestion || {};
    const suggestedCourier = suggestion.suggestedCourier || o.suggestedCourier || '';
    const suggestionNote = suggestion.suggestionNote || '';
    const suggestedBy = suggestion.suggestedBy || '';
    const remark = o.verificationRemark?.text || o.remark || '';

    return `
    <div class="bg-gradient-to-br from-white to-orange-50/30 border-2 border-orange-200 rounded-2xl p-5 hover:shadow-2xl hover:border-orange-400 transition-all duration-300 relative overflow-hidden group">
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100/40 to-amber-100/40 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
        
        <div class="flex justify-between items-center mb-4 relative z-10">
           <div class="flex items-center gap-3 flex-1">
               <h4 class="font-black text-xl text-gray-900">${o.customerName}</h4>
               <button onclick="sendWhatsAppDirect('booked', ${JSON.stringify(o).replace(/"/g, '&quot;')})" 
                   class="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl flex items-center justify-center hover:scale-110 hover:rotate-12 shadow-lg shadow-green-200 transition-all">
                   ${WHATSAPP_ICON}
               </button>
           </div>
           <span class="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-green-200">✓ Verified</span>
        </div>
        
        <div class="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200 mb-4 space-y-2 shadow-inner">
            <div class="flex items-start gap-2">
                <span class="text-lg">📍</span>
                <p class="text-sm text-gray-700 font-medium flex-1">${o.address}</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-lg">📞</span>
                <p class="text-sm text-gray-800 font-bold">${o.telNo || o.mobile || ''}</p>
            </div>
        </div>
        
        <div class="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border-2 border-yellow-300 mb-4 flex items-center justify-between shadow-sm">
            <span class="text-base font-bold text-yellow-800">💰 COD Amount</span>
            <span class="text-2xl font-black bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">₹${o.codAmount || o.total || 0}</span>
        </div>
        
        ${suggestedCourier ? `
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
            <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">🚚</span>
                <div class="flex-1">
                    <p class="font-bold text-blue-900 text-sm">Suggested Courier</p>
                    <p class="font-black text-blue-700 text-lg">${suggestedCourier}</p>
                </div>
            </div>
            ${suggestionNote ? `<p class="text-sm text-blue-600 ml-8 mt-2">📝 ${suggestionNote}</p>` : ''}
            ${suggestedBy ? `<p class="text-xs text-blue-500 ml-8 mt-1">By: ${suggestedBy}</p>` : ''}
        </div>
        ` : ''}
        
        ${remark ? `
        <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-3 mb-4 shadow-sm">
            <p class="text-sm text-yellow-900"><span class="font-bold">📝 Note:</span> ${remark}</p>
        </div>
        ` : ''}
        
        <!-- Dispatch Buttons -->
        <div class="grid grid-cols-2 gap-3 mb-3">
            <button onclick="openManualDispatchModal('${o.orderId}')" 
                class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:scale-105 transform flex items-center justify-center gap-2 text-sm">
                <span class="text-xl">📝</span>
                <span>Manual</span>
            </button>
            <button onclick="dispatchWithShiprocket('${o.orderId}')" 
                class="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:scale-105 transform flex items-center justify-center gap-2 text-sm">
                <span class="text-xl">🚀</span>
                <span>Shiprocket</span>
            </button>
        </div>
    </div>`;
}

window.renderDispatchCardModern = renderDispatchCardModern;
console.log('✅ Dispatch Card Renderer Loaded');
