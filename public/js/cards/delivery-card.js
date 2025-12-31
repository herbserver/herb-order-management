/**
 * =====================================================
 * DELIVERY CARD RENDERER
 * =====================================================
 * Edit THIS file to change delivery card design
 * =====================================================
 */

function renderDeliveryCardModern(o) {
    const hasShiprocket = o.shiprocket && o.shiprocket.awb;

    // Get tracking status badge
    let statusBadge = '';
    if (o.tracking && o.tracking.currentStatus) {
        const status = o.tracking.currentStatus;
        let badgeColor = 'bg-blue-500';
        if (status.includes('Delivered')) badgeColor = 'bg-green-500';
        else if (status.includes('Out for Delivery')) badgeColor = 'bg-purple-500';
        else if (status.includes('Transit')) badgeColor = 'bg-yellow-500';
        statusBadge = `<span class="${badgeColor} text-white text-[10px] px-2 py-0.5 rounded-full font-bold">${status}</span>`;
    }

    return `
    <div class="bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 rounded-2xl p-5 hover:shadow-2xl hover:border-blue-400 transition-all duration-300 relative overflow-hidden group">
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
        
        <div class="flex justify-between items-start mb-4 relative z-10">
           <div>
               <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md mb-1 inline-block">${o.orderId}</span>
               <h4 class="font-black text-xl text-gray-900 leading-tight">${o.customerName}</h4>
           </div>
           <div class="text-right">
               <p class="font-black text-xl text-indigo-600">₹${o.total}</p>
               ${statusBadge}
           </div>
        </div>

        ${hasShiprocket ? `
        <div class="bg-orange-50 border border-orange-200 p-3 rounded-xl mb-4 relative z-10">
            <div class="flex items-center justify-between mb-1">
                <span class="text-orange-600 font-bold text-[10px] uppercase">🚀 via Shiprocket</span>
                <span class="font-mono font-bold text-orange-700 text-[10px]">${o.shiprocket.awb}</span>
            </div>
            <p class="text-[10px] text-gray-500 font-medium">Courier: <span class="text-gray-800 font-bold">${o.shiprocket.courierName || 'N/A'}</span></p>
        </div>
        ` : ''}
        
        ${o.status === 'RTO' ? `
        <div class="bg-indigo-50 border border-indigo-200 p-3 rounded-xl mb-4 relative z-10">
            <p class="text-[10px] text-indigo-600 font-bold uppercase mb-1">↩️ RTO Reason</p>
            <p class="text-xs text-indigo-800 font-medium italic">"${o.rtoReason || 'No reason provided'}"</p>
        </div>
        ` : ''}

        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-5 space-y-2 relative z-10">
            <div class="flex items-start gap-2">
                <span class="text-base">📍</span>
                <p class="text-xs text-gray-600 font-medium line-clamp-2">${o.address}${o.pin ? ', ' + o.pin : ''}</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-base">📞</span>
                <p class="text-xs text-gray-800 font-bold">${o.telNo || o.mobile || 'N/A'}</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 gap-3 relative z-10">
            <div class="grid grid-cols-2 gap-3">
                ${hasShiprocket ? `
                <button onclick="trackShiprocketOrder('${o.orderId}', '${o.shiprocket.awb}')" 
                    class="bg-blue-50 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-100 transition-all border-2 border-blue-100 shadow-sm flex items-center justify-center gap-2 text-xs">
                    <span>🔍</span> Track
                </button>
                ` : `
                <button onclick="viewOrder('${o.orderId}')" 
                    class="bg-blue-50 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-100 transition-all border-2 border-blue-100 shadow-sm flex items-center justify-center gap-2 text-xs">
                    <span>👁️</span> View
                </button>
                `}
                <button onclick="markAsRTO('${o.orderId}')" 
                    class="bg-rose-50 text-rose-600 font-bold py-3 rounded-xl hover:bg-rose-100 transition-all border-2 border-rose-100 shadow-sm flex items-center justify-center gap-2 text-xs">
                    <span>↩️</span> RTO
                </button>
            </div>
            <button onclick="markAsDelivered('${o.orderId}')" 
                class="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-4 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transform active:scale-95 flex items-center justify-center gap-2 text-base">
                <span>✅</span> Delivered
            </button>
        </div>
    </div>`;
}

window.renderDeliveryCardModern = renderDeliveryCardModern;
console.log('✅ Delivery Card Renderer Loaded');
