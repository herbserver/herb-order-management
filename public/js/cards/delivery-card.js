/**
 * =====================================================
 * DELIVERY CARD RENDERER
 * =====================================================
 * Edit THIS file to change delivery card design
 * =====================================================
 */

function renderDeliveryCardModern(o) {
    return `
    <div class="bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 rounded-2xl p-5 hover:shadow-2xl hover:border-blue-400 transition-all duration-300 relative overflow-hidden group">
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
        
        <div class="flex justify-between items-center mb-4 relative z-10">
           <h4 class="font-black text-xl text-gray-900">${o.customerName}</h4>
           <span class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-blue-200">🚚 Out for Delivery</span>
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
        
        <div class="grid grid-cols-2 gap-3">
            <button onclick="viewOrder('${o.orderId}')" 
                class="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-bold py-3 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all border-2 border-blue-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                <span>👁️</span> View
            </button>
            <button onclick="markAsDelivered('${o.orderId}')" 
                class="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 hover:shadow-green-300 hover:scale-105 transform flex items-center justify-center gap-2">
                <span>✅</span> Delivered
            </button>
        </div>
    </div>`;
}

window.renderDeliveryCardModern = renderDeliveryCardModern;
console.log('✅ Delivery Card Renderer Loaded');
