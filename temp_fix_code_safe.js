async function filterVerificationOrders(mobile) {
    const searchValue = mobile.trim();
    if (!searchValue) {
        const activeTab = document.querySelector('[id^="verificationTab"].tab-active').id.replace("verificationTab", "").toLowerCase();
        if (activeTab === 'pending') loadDeptOrders();
        else if (activeTab === 'history') loadVerificationHistory();
        return;
    }

    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        let orders = (data.orders || []).filter(o =>
            (o.telNo && o.telNo.includes(searchValue)) ||
            (o.altNo && o.altNo.includes(searchValue))
        );

        const activeTabContent = document.querySelector('[id^="verification"][id$="Tab"]:not(.hidden)');
        let listId = '';
        if (activeTabContent.id === 'verificationPendingTab') listId = 'pendingVerificationList';
        else if (activeTabContent.id === 'verificationHistoryTab') listId = 'verificationHistoryList';

        if (!listId) return;

        if (orders.length === 0) {
            document.getElementById(listId).innerHTML = '<p class="text-center text-gray-500 py-8">Koi orders nahi mile is mobile number se</p>';
            return;
        }

        let html = '';
        orders.forEach(order => {
            html += `<div class="order-card bg-white border rounded-xl p-4 border-l-4 border-l-green-500">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-bold text-blue-600">${order.orderId}</p>
                                <p class="text-gray-800">${order.customerName}</p>
                                <p class="text-sm text-gray-500 font-mono bg-green-50 inline-block px-2 py-1 rounded">Tel: ${order.telNo}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-lg font-bold text-red-600">Rs. ${order.total}</p>
                                <p class="text-xs">${order.status}</p>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button type="button" onclick="viewOrder('${order.orderId}')" class="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs">View</button>
                        </div>
                    </div>`;
        });
        document.getElementById(listId).innerHTML = html;

    } catch (e) {
        console.error(e);
    }
}
