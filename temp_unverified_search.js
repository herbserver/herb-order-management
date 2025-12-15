async function filterVerificationUnverified() {
    const input = document.getElementById('verificationUnverifiedSearch');
    const filter = input.value.trim().toLowerCase();
    const list = document.getElementById('verificationUnverifiedList');

    if (!filter) {
        loadVerificationUnverified();
        return;
    }

    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        let orders = data.orders || [];

        // Filter for 'On Hold' AND search term
        orders = orders.filter(o =>
            o.status === 'On Hold' && (
                (o.telNo && o.telNo.includes(filter)) ||
                (o.customerName && o.customerName.toLowerCase().includes(filter)) ||
                (o.orderId && o.orderId.toLowerCase().includes(filter))
            )
        );

        if (orders.length === 0) {
            list.innerHTML = '<p class="text-center text-gray-500 py-8">No matching unverified orders found</p>';
            return;
        }

        let html = '';
        orders.forEach(order => {
            html += `<div class="order-card bg-white border rounded-xl p-4 border-l-4 border-l-yellow-500">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-bold text-blue-600">${order.orderId}</p>
                                <p class="text-gray-800 font-medium">${order.customerName}</p>
                                <p class="text-sm text-gray-500">📞 ${order.telNo}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-lg font-bold text-red-600">₹${order.total}</p>
                                <span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">⏸️ On Hold</span>
                            </div>
                        </div>
                        <div class="mt-3 flex gap-2">
                            <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-600">👁️ View</button>
                            <button type="button" onclick="verifyAddress('${order.orderId}')" class="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600">✅ Verify</button>
                        </div>
                    </div>`;
        });
        list.innerHTML = html;
    } catch (e) {
        console.error(e);
    }
}
