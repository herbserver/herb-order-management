// Employee Daily Performance Stats
async function loadEmployeePerformance() {
    if (!currentUser || !currentUser.id) return;

    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        const allOrders = data.orders || [];

        // Today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter today's orders for this employee
        const todayOrders = allOrders.filter(order => {
            const orderDate = new Date(order.timestamp);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
        });

        // Count specific actions by this employee
        const verifiedToday = allOrders.filter(order =>
            order.verifiedBy === currentUser.id &&
            order.verifiedAt &&
            new Date(order.verifiedAt) >= today
        ).length;

        const dispatchedToday = allOrders.filter(order =>
            order.dispatchedBy === currentUser.id &&
            order.tracking?.dispatchedAt &&
            new Date(order.tracking.dispatchedAt) >= today
        ).length;

        const createdToday = todayOrders.filter(order =>
            order.employeeId === currentUser.id
        ).length;

        // Display performance card
        const card = document.getElementById('empPerformanceCard');
        if (!card) return;

        card.innerHTML = `
            <div class="glass-card p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-black text-gray-800">📊 आज का काम</h3>
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

// Call this when department panel loads
window.addEventListener('DOMContentLoaded', () => {
    // Check if it's department user
    if (currentUser && (currentUser.role === 'dept' || currentUser.department)) {
        loadEmployeePerformance();
        // Refresh every 5 minutes
        setInterval(loadEmployeePerformance, 5 * 60 * 1000);
    }
});

// Admin Daily Activity (Total Department Work Today)
async function loadAdminDailyActivity() {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        const allOrders = data.orders || [];

        // Today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count today's verifications
        const verificationsToday = allOrders.filter(order =>
            order.verifiedAt &&
            new Date(order.verifiedAt) >= today
        );

        // Count today's dispatches
        const dispatchesToday = allOrders.filter(order =>
            order.tracking?.dispatchedAt &&
            new Date(order.tracking.dispatchedAt) >= today
        );

        // Get employee counts
        const verificationByEmployee = {};
        verificationsToday.forEach(order => {
            const emp = order.verifiedBy || 'Unknown';
            verificationByEmployee[emp] = (verificationByEmployee[emp] || 0) + 1;
        });

        const dispatchByEmployee = {};
        dispatchesToday.forEach(order => {
            const emp = order.dispatchedBy || 'Unknown';
            dispatchByEmployee[emp] = (dispatchByEmployee[emp] || 0) + 1;
        });

        // Display card
        const card = document.getElementById('adminDailyActivity');
        if (!card) return;

        card.innerHTML = `
            <div class="glass-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-black text-gray-800">📊 आज की गतिविधि</h3>
                    <span class="text-sm text-gray-500">${new Date().toLocaleDateString('hi-IN')}</span>
                </div>
                <div class="grid grid-cols-2 gap-6">
                    <div class="bg-white rounded-xl p-5 border-2 border-green-200 shadow-sm">
                        <div class="flex items-center justify-between mb-3">
                            <p class="text-4xl font-black text-green-600">${verificationsToday.length}</p>
                            <span class="text-2xl">✅</span>
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
                            <span class="text-2xl">🚚</span>
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
