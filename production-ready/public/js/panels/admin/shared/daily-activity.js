(function () {
    async function loadAdminDailyActivity() {
        try {
            const res = await fetch(`${API_URL}/orders`);
            const data = await res.json();
            const allOrders = data.orders || [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const verificationsToday = allOrders.filter((order) =>
                order.verifiedAt &&
                new Date(order.verifiedAt) >= today
            );

            const dispatchesToday = allOrders.filter((order) =>
                order.tracking?.dispatchedAt &&
                new Date(order.tracking.dispatchedAt) >= today
            );

            const verificationByEmployee = {};
            verificationsToday.forEach((order) => {
                const emp = order.verifiedBy || 'Unknown';
                verificationByEmployee[emp] = (verificationByEmployee[emp] || 0) + 1;
            });

            const dispatchByEmployee = {};
            dispatchesToday.forEach((order) => {
                const emp = order.dispatchedBy || 'Unknown';
                dispatchByEmployee[emp] = (dispatchByEmployee[emp] || 0) + 1;
            });

            const card = document.getElementById('adminDailyActivity');
            if (!card) return;

            card.innerHTML = `
                <div class="glass-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-black text-gray-800">&#x1F4CA; Aaj Ki Gatividhi</h3>
                        <span class="text-sm text-gray-500">${new Date().toLocaleDateString('hi-IN')}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-6">
                        <div class="bg-white rounded-xl p-5 border-2 border-green-200 shadow-sm">
                            <div class="flex items-center justify-between mb-3">
                                <p class="text-4xl font-black text-green-600">${verificationsToday.length}</p>
                                <span class="text-2xl">&#x2705;</span>
                            </div>
                            <p class="text-sm font-bold text-gray-600 mb-2">Total Verifications</p>
                            <div class="text-xs text-gray-500">
                                ${Object.entries(verificationByEmployee).map(([emp, count]) =>
                                    `<div class="flex justify-between py-1"><span>${emp}</span><span class="font-bold">${count}</span></div>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="bg-white rounded-xl p-5 border-2 border-purple-200 shadow-sm">
                            <div class="flex items-center justify-between mb-3">
                                <p class="text-4xl font-black text-purple-600">${dispatchesToday.length}</p>
                                <span class="text-2xl">&#x1F69A;</span>
                            </div>
                            <p class="text-sm font-bold text-gray-600 mb-2">Total Dispatches</p>
                            <div class="text-xs text-gray-500">
                                ${Object.entries(dispatchByEmployee).map(([emp, count]) =>
                                    `<div class="flex justify-between py-1"><span>${emp}</span><span class="font-bold">${count}</span></div>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Admin daily activity error:', error);
        }
    }

    window.loadAdminDailyActivity = loadAdminDailyActivity;
})();
