/**
 * ============================================
 * UI MODALS - Modal Open/Close Functions
 * ============================================
 * All modal-related functions in one place.
 * 
 * If modal not opening → Check this file
 * If modal not closing → Check closeModal()
 */

/**
 * Close any modal by ID
 * @param {string} id - Modal element ID
 */
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    // Also try closing dynamic modal
    const dynamicModal = document.getElementById('dynamicEditModal');
    if (dynamicModal && id === 'editOrderModal') {
        dynamicModal.remove();
    }
}

/**
 * Open a modal by ID
 * @param {string} id - Modal element ID
 */
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

/**
 * View Order Details
 * Standardized function used across all panels
 * @param {string} orderId - Order ID to view
 */
async function viewOrder(orderId) {
    if (!orderId) {
        console.error('viewOrder: No orderId provided');
        return;
    }

    try {
        console.log(`🔍 Viewing order: ${orderId}`);
        const res = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}`);
        const data = await res.json();
        const order = data.order || data.data;

        if (!order) {
            alert('Order not found!');
            return;
        }

        const fullAddress = `${order.address || ''}, ${order.distt || ''}, ${order.state || ''} - ${order.pin || ''}`;

        // Standardize on orderDetailModal (Premium)
        let modalElement = document.getElementById('orderDetailModal');
        let modalContent = document.getElementById('orderDetailContent');

        // Fallback to legacy orderModal if premium one isn't found
        if (!modalElement || !modalContent) {
            modalElement = document.getElementById('orderModal');
            modalContent = document.getElementById('orderModalContent');
        }

        if (!modalElement || !modalContent) {
            console.error('CRITICAL: No order modal found in DOM (tried orderDetailModal and orderModal)');
            alert('System Error: View Modal not found. Please refresh.');
            return;
        }

        // WhatsApp Icon SVG (extracted from common.js logic)
        const WHATSAPP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width:1.2em; height:1.2em;"><path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.1 0-65.6-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.1-3.2-5.4-.3-8.3 2.4-11.1 2.4-2.5 5.5-6.4 8.3-9.6 2.8-3.2 3.7-5.5 5.5-9.1 1.9-3.7 1-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>`;

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
                                   <span class="font-black text-lg text-emerald-400 capitalize">${order.employee || 'Admin'} <span class="text-gray-500 font-mono text-sm">(${order.employeeId || 'N/A'})</span></span>
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

        openModal(modalElement.id);

        // Scroll to top of modal for consistency
        modalElement.scrollTop = 0;

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

// Export to window
window.viewOrder = viewOrder;

/**
 * Show Dispatch Modal (Manual AWB Entry)
 * @param {string} orderId - Order ID
 * @param {Object} order - Order object (optional)
 */
function openDispatchModal(orderId, order = null) {
    // Create dynamic modal for manual dispatch
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';
    modal.id = 'manualDispatchModalDynamic';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 class="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                <span class="text-2xl">📝</span>
                Manual Dispatch
            </h3>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">📦 Courier Name *</label>
                    <select id="modalCourierSelect" class="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none font-medium">
                        <option value="">-- Select Courier --</option>
                        <option value="Delhivery">🚛 Delhivery</option>
                        <option value="Delhivery Air">✈️ Delhivery Air</option>
                        <option value="Blue Dart">🔵 Blue Dart</option>
                        <option value="Blue Dart Air">🔵 Blue Dart Air</option>
                        <option value="DTDC">📦 DTDC</option>
                        <option value="DTDC Air">📦 DTDC Air</option>
                        <option value="Xpressbees">⚡ Xpressbees</option>
                        <option value="Ekart">🛒 Ekart</option>
                        <option value="India Post">📮 India Post</option>
                        <option value="Other">📫 Other</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">🔢 AWB / Tracking Number *</label>
                    <input type="text" id="modalAWBInput" placeholder="Enter AWB number..." 
                        class="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none font-mono font-bold">
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">📝 Notes (Optional)</label>
                    <textarea id="modalDispatchNotes" placeholder="Any additional notes..." rows="2"
                        class="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none resize-none"></textarea>
                </div>
            </div>
            
            <!-- Print Label Button for Post Office -->
            <div class="mt-4 pt-4 border-t border-dashed border-gray-200">
                <button onclick="document.getElementById('manualDispatchModalDynamic').remove(); openLabelPrintModal('${orderId}')" 
                    class="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg flex items-center justify-center gap-2">
                    <span>🏷️</span> Print Speed Post Label
                </button>
                <p class="text-xs text-gray-400 text-center mt-2">For India Post / Speed Post COD</p>
            </div>
            
            <div class="grid grid-cols-2 gap-3 mt-4">
                <button onclick="document.getElementById('manualDispatchModalDynamic').remove()" 
                    class="bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all">
                    Cancel
                </button>
                <button onclick="submitModalManualDispatch('${orderId}')" 
                    class="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2">
                    <span>✅</span> Dispatch
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Focus on courier select
    setTimeout(() => document.getElementById('modalCourierSelect')?.focus(), 100);
}

// Submit function for modal
window.submitModalManualDispatch = async (orderId) => {
    const courier = document.getElementById('modalCourierSelect')?.value;
    const awb = document.getElementById('modalAWBInput')?.value?.trim();
    const notes = document.getElementById('modalDispatchNotes')?.value?.trim();

    if (!courier) {
        alert('❌ Please select a courier!');
        return;
    }

    if (!awb) {
        alert('❌ Please enter AWB/Tracking number!');
        return;
    }

    // Close modal
    document.getElementById('manualDispatchModalDynamic')?.remove();

    // Show loading
    const loading = document.createElement('div');
    loading.innerHTML = '<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div class="bg-white p-6 rounded-2xl text-center"><p class="text-4xl mb-2">📦</p><p class="font-bold">Processing Manual Dispatch...</p></div></div>';
    loading.id = 'loadingDispatch';
    document.body.appendChild(loading);

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/dispatch`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courier: courier,
                trackingId: awb,
                dispatchedBy: currentUser?.id || 'Dispatch Dept',
                notes: notes || ''
            })
        });

        const data = await res.json();
        document.getElementById('loadingDispatch')?.remove();

        if (data.success) {
            showSuccessPopup('Dispatched!', `Manual dispatch successful\\nCourier: ${courier}\\nAWB: ${awb}`, '✅', '#10b981');
            // Reload orders
            if (typeof loadDeptOrders === 'function') loadDeptOrders();
            if (typeof loadDispatchedOrders === 'function') loadDispatchedOrders();
        } else {
            alert('❌ Error: ' + (data.message || 'Dispatch failed'));
        }
    } catch (e) {
        document.getElementById('loadingDispatch')?.remove();
        alert('❌ Error: ' + e.message);
    }
}


/**
 * Show Register Department Modal
 */
function showRegisterDeptModal() {
    openModal('registerDeptModal');
}

/**
 * Show Shiprocket Modal
 */
function showShiprocketModal() {
    openModal('shiprocketModal');
    loadShiprocketStatus();
}

/**
 * Show Edit Employee Modal
 * @param {string} empId - Employee ID
 * @param {string} name - Employee Name
 */
function showEditEmployeeModal(empId, name) {
    document.getElementById('editEmpOldId').value = empId;
    document.getElementById('editEmpNewId').value = empId;
    document.getElementById('editEmpName').value = name;
    document.getElementById('editEmpPass').value = '';
    openModal('editEmployeeModal');
}

/**
 * Show Edit Department Modal
 * @param {string} deptId - Department ID
 * @param {string} deptName - Department Name
 */
function openEditDeptModal(deptId, deptName) {
    document.getElementById('editDeptId').value = deptId;
    document.getElementById('editDeptName').value = deptName;
    document.getElementById('editDeptNewPassword').value = '';
    openModal('editDeptModal');
}

/**
 * ============================================
 * SPEED POST COD LABEL PRINTING
 * ============================================
 * For Post Office manual dispatch labels
 */

/**
 * Open Label Print Modal for Speed Post COD
 * @param {string} orderId - Order ID
 * @param {Object} orderData - Optional order object (if already available)
 */
async function openLabelPrintModal(orderId, orderData = null) {
    console.log('🏷️ Opening Label Print Modal for:', orderId);

    let order = orderData;

    // Fetch order if not provided
    if (!order) {
        try {
            const res = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}`);
            const data = await res.json();
            order = data.order || data.data;
        } catch (e) {
            console.error('Failed to fetch order:', e);
            alert('❌ Order data load nahi hua!');
            return;
        }
    }

    if (!order) {
        alert('❌ Order not found!');
        return;
    }

    // Create full address
    const fullAddress = [
        order.hNo,
        order.blockGaliNo,
        order.villColony,
        order.po ? `P.O. ${order.po}` : '',
        order.tahTaluka ? `Tah. ${order.tahTaluka}` : '',
        `Dist. ${order.distt || ''}`,
        order.state
    ].filter(Boolean).join(', ');

    // Remove existing modal if any
    const existingModal = document.getElementById('labelPrintModal');
    if (existingModal) existingModal.remove();

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'labelPrintModal';
    modal.className = 'fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 overflow-y-auto';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
            <!-- Header -->
            <div class="bg-gradient-to-r from-amber-500 to-orange-500 p-5 rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h3 class="text-xl font-bold text-white flex items-center gap-2">
                        🏷️ Speed Post COD Label
                    </h3>
                    <p class="text-white/80 text-sm">Order: ${orderId}</p>
                </div>
                <button onclick="document.getElementById('labelPrintModal').remove()" 
                    class="text-white/80 hover:text-white text-2xl font-bold w-10 h-10 rounded-full hover:bg-white/20 transition-all">×</button>
            </div>
            
            <!-- Input Form -->
            <div class="p-5 bg-gray-50 border-b no-print">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">Tracking Number *</label>
                        <input type="text" id="labelTrackingNo" placeholder="e.g., EZ144016497IN" 
                            class="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 font-mono font-bold text-lg focus:border-amber-500 outline-none uppercase">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">Non-BNPL Code</label>
                        <input type="text" id="labelBnplCode" value="928-461" placeholder="e.g., 928-461"
                            class="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 font-mono focus:border-amber-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">Customer/Biller ID</label>
                        <input type="text" id="labelBillerId" value="${order.orderId || orderId}" 
                            class="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 font-mono focus:border-amber-500 outline-none">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">Weight (Approx)</label>
                        <input type="text" id="labelWeight" value="150g" placeholder="e.g., 150g"
                            class="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 focus:border-amber-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">Dimensions (cm)</label>
                        <input type="text" id="labelDimensions" value="16×16×5" placeholder="e.g., 16×16×5"
                            class="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 focus:border-amber-500 outline-none">
                    </div>
                </div>
                <div class="flex gap-3 mt-5">
                    <button onclick="generateSpeedPostLabel()" 
                        class="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg flex items-center justify-center gap-2">
                        📋 Generate Label
                    </button>
                    <button onclick="printSpeedPostLabel()" 
                        class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
                        🖨️ Print Label
                    </button>
                </div>
            </div>
            
            <!-- Label Preview Area -->
            <div class="p-5">
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 no-print">Label Preview</p>
                <div id="labelPrintArea" class="flex justify-center">
                    <div id="speedPostLabelContent" class="speed-post-label">
                        <!-- Header -->
                        <div class="header">Speed Post (Cash On Delivery)</div>
                        
                        <!-- Biller Info -->
                        <div class="biller-info">
                            <div><strong>Customer/Biller ID</strong> – <span id="lbl_billerId">${order.orderId || orderId}</span></div>
                            <div><strong>Non-BNPL Code</strong> – <span id="lbl_bnplCode">928-461</span></div>
                        </div>
                        
                        <!-- Delivery Section -->
                        <div class="deliver-section">
                            <div class="address-block">
                                <div class="label-title">DELIVER To:</div>
                                <div class="customer-name">${order.customerName || 'Customer Name'}</div>
                                <div class="address-text">
                                    ${fullAddress}<br>
                                    <strong style="font-size: 15px; color: #000;">${order.pin || ''}</strong>
                                </div>
                                <div class="mobile-no"><strong>MOBILE NO</strong> – ${order.telNo || 'N/A'}</div>
                            </div>
                            <div class="barcode-block">
                                <svg id="labelBarcode"></svg>
                                <div id="lbl_trackingNo" class="tracking-number">Enter Tracking No.</div>
                            </div>
                        </div>
                        
                        <!-- COD Section -->
                        <div class="cod-section">
                            <div class="cod-amount">
                                <div class="cod-title">CASH ON DELIVERY</div>
                                <div class="cod-value">COLLECT COD – <span>Rs.${order.codAmount || order.total || 0}/-</span></div>
                            </div>
                            <div class="urgent-badge">URGENT<br>DELIVERY</div>
                        </div>
                        
                        <!-- Weight Section -->
                        <div class="weight-section">
                            <div><strong>WEIGHT :</strong> <span id="lbl_weight">150 g</span> (Approx)</div>
                            <div><strong>DIMENSIONS :</strong> <span id="lbl_dimensions">16×16×5</span> (cm) (Approx)</div>
                        </div>
                        
                        <!-- Sender Section -->
                        <div class="sender-section">
                            <div class="sender-title">From (Sender):</div>
                            <div class="sender-name">Herb On Naturals</div>
                            <div class="sender-address">
                                <strong>Add :-</strong> 24/47 AB, Old Market Rd, Tilak Nagar, Delhi-110018<br>
                                <strong>Mobile No.:</strong> 8527668466
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Focus on tracking input
    setTimeout(() => {
        document.getElementById('labelTrackingNo')?.focus();
    }, 100);

    // Store order data for later use
    window._currentLabelOrder = order;
}

/**
 * Generate the Speed Post Label with inputs
 */
function generateSpeedPostLabel() {
    const trackingNo = document.getElementById('labelTrackingNo')?.value.trim().toUpperCase();
    const bnplCode = document.getElementById('labelBnplCode')?.value.trim();
    const billerId = document.getElementById('labelBillerId')?.value.trim();
    const weight = document.getElementById('labelWeight')?.value.trim();
    const dimensions = document.getElementById('labelDimensions')?.value.trim();

    if (!trackingNo) {
        alert('❌ Tracking Number daalna zaroori hai!');
        document.getElementById('labelTrackingNo')?.focus();
        return;
    }

    // Update label content
    document.getElementById('lbl_billerId').textContent = billerId;
    document.getElementById('lbl_bnplCode').textContent = bnplCode;
    document.getElementById('lbl_trackingNo').textContent = trackingNo;
    document.getElementById('lbl_weight').textContent = weight;
    document.getElementById('lbl_dimensions').textContent = dimensions;

    // Generate barcode
    try {
        JsBarcode('#labelBarcode', trackingNo, {
            format: 'CODE128',
            width: 1.5,
            height: 45,
            displayValue: false,
            margin: 5
        });
        console.log('✅ Barcode generated for:', trackingNo);
    } catch (e) {
        console.error('Barcode generation failed:', e);
        alert('❌ Barcode generate nahi hua. Check tracking number format.');
    }
}

/**
 * Print the Speed Post Label
 */
function printSpeedPostLabel() {
    const trackingNo = document.getElementById('labelTrackingNo')?.value.trim();

    if (!trackingNo) {
        alert('❌ Pehle Generate Label karo!');
        return;
    }

    // Trigger print
    window.print();
}

// Export to window
window.openLabelPrintModal = openLabelPrintModal;
window.generateSpeedPostLabel = generateSpeedPostLabel;
window.printSpeedPostLabel = printSpeedPostLabel;


// Global keyboard shortcut for ESC to close modals
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        const modals = [
            'orderModal',
            'trackingModal',
            'editOrderModal',
            'dispatchModal',
            'shiprocketModal',
            'editEmployeeModal',
            'editDeptModal',
            'registerDeptModal',
            'dynamicEditModal',
            'labelPrintModal'
        ];

        modals.forEach(id => {
            const modal = document.getElementById(id);
            if (modal && !modal.classList.contains('hidden')) {
                closeModal(id);
            }
        });

        // Also remove dynamic label modal
        const labelModal = document.getElementById('labelPrintModal');
        if (labelModal) labelModal.remove();
    }
});
