(function () {
    async function loadEmployeePerformance() {
        if (!currentUser || !currentUser.id) return;

        try {
            const res = await fetch(`${API_URL}/orders`);
            const data = await res.json();
            const allOrders = data.orders || [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayOrders = allOrders.filter((order) => {
                const orderDate = new Date(order.timestamp);
                orderDate.setHours(0, 0, 0, 0);
                return orderDate.getTime() === today.getTime();
            });

            const verifiedToday = allOrders.filter((order) =>
                order.verifiedBy === currentUser.id &&
                order.verifiedAt &&
                new Date(order.verifiedAt) >= today
            ).length;

            const dispatchedToday = allOrders.filter((order) =>
                order.dispatchedBy === currentUser.id &&
                order.tracking?.dispatchedAt &&
                new Date(order.tracking.dispatchedAt) >= today
            ).length;

            const createdToday = todayOrders.filter((order) =>
                order.employeeId === currentUser.id
            ).length;

            const card = document.getElementById('empPerformanceCard');
            if (!card) return;

            card.innerHTML = `
                <div class="glass-card p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-black text-gray-800">&#x1F4CA; Aaj Ka Kaam</h3>
                        <span class="text-sm text-gray-500">${new Date().toLocaleDateString('hi-IN')}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="bg-white rounded-xl p-4 text-center border-2 border-green-200 shadow-sm">
                            <p class="text-3xl font-black text-green-600">${verifiedToday}</p>
                            <p class="text-xs font-bold text-gray-500 uppercase">Verified</p>
                        </div>
                        <div class="bg-white rounded-xl p-4 text-center border-2 border-purple-200 shadow-sm">
                            <p class="text-3xl font-black text-purple-600">${dispatchedToday}</p>
                            <p class="text-xs font-bold text-gray-500 uppercase">Dispatched</p>
                        </div>
                        <div class="bg-white rounded-xl p-4 text-center border-2 border-blue-200 shadow-sm">
                            <p class="text-3xl font-black text-blue-600">${createdToday}</p>
                            <p class="text-xs font-bold text-gray-500 uppercase">Created</p>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Performance load error:', error);
        }
    }

    window.loadEmployeePerformance = loadEmployeePerformance;

    window.addEventListener('DOMContentLoaded', () => {
        if (currentUser && currentUserType === 'employee') {
            loadEmployeePerformance();
            window.setInterval(loadEmployeePerformance, 5 * 60 * 1000);
        }
    });
})();
