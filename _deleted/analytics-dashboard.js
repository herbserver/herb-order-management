// Analytics Dashboard - Real-time Business Insights

// Global state
let currentFilters = {
    startDate: null,
    endDate: null,
    employeeId: 'all'
};

// Load dashboard
async function loadAnalyticsDashboard() {
    try {
        // Load initial dashboard
        const res = await fetch(`${API_URL}/analytics/dashboard`);
        const data = await res.json();

        console.log('🔍 Analytics Dashboard Response:', data);
        console.log('💰 Today Stats:', data.today);
        console.log('💰 Fresh Revenue:', data.today?.freshRevenue);
        console.log('💰 Reorder Revenue:', data.today?.reorderRevenue);

        if (!data.success) {
            console.error('Analytics fetch failed');
            return;
        }

        renderDashboardFilters();
        renderMissingOrdersAlert();
        renderDashboardStats(data.today);
        renderOrdersChart(data.charts.ordersTimeline);
        renderEmployeeChart(data.charts.employeePerformance);
        renderStatusChart(data.charts.statusDistribution);

    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

// Render filter controls
function renderDashboardFilters() {
    const container = document.getElementById('dashboardStats');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];

    const filtersHTML = `
        <div class="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🔍</span> Analytics Filters
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                    <input type="date" id="filterStartDate" value="${today}"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                    <input type="date" id="filterEndDate" value="${today}"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Employee</label>
                    <select id="filterEmployee" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="all">All Employees</option>
                    </select>
                </div>
                <div class="flex items-end gap-2">
                    <button onclick="applyAnalyticsFilters()" 
                        class="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition">
                        Apply Filters
                    </button>
                    <button onclick="resetAnalyticsFilters()" 
                        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition">
                        Reset
                    </button>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforebegin', filtersHTML);
    loadEmployeeDropdown();
}

// Load employees for dropdown
async function loadEmployeeDropdown() {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const data = await res.json();
        const orders = data.orders || [];

        const employees = new Set();
        orders.forEach(o => {
            if (o.employeeId) employees.add(`${o.employeeId}:${o.employee || o.employeeId}`);
        });

        const select = document.getElementById('filterEmployee');
        if (!select) return;

        Array.from(employees).sort().forEach(emp => {
            const [id, name] = emp.split(':');
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Apply filters
async function applyAnalyticsFilters() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const employeeId = document.getElementById('filterEmployee').value;

    currentFilters = { startDate, endDate, employeeId };

    try {
        const params = new URLSearchParams(currentFilters);
        const res = await fetch(`${API_URL}/analytics/range?${params}`);
        const data = await res.json();

        if (data.success) {
            // Update stats display
            updateFilteredStats(data.stats);
        }
    } catch (error) {
        console.error('Filter error:', error);
    }
}

// Reset filters
function resetAnalyticsFilters() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filterStartDate').value = today;
    document.getElementById('filterEndDate').value = today;
    document.getElementById('filterEmployee').value = 'all';
    loadAnalyticsDashboard();
}

// Update stats after filtering
function updateFilteredStats(stats) {
    const container = document.getElementById('dashboardStats');
    if (!container) return;

    container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-3xl">📊</span>
                    <span class="text-blue-100 text-sm font-bold">FILTERED</span>
                </div>
                <h3 class="text-4xl font-black mb-1">${stats.totalOrders}</h3>
                <p class="text-blue-100 text-sm font-medium">Total Orders</p>
            </div>
            
            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-3xl">💰</span>
                    <span class="text-green-100 text-sm font-bold">FILTERED</span>
                </div>
                <h3 class="text-4xl font-black mb-1">₹${stats.totalRevenue.toLocaleString()}</h3>
                <p class="text-green-100 text-sm font-medium">Revenue</p>
            </div>
            
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-3xl">🚚</span>
                    <span class="text-purple-100 text-sm font-bold">FILTERED</span>
                </div>
                <h3 class="text-4xl font-black mb-1">${stats.statusBreakdown.dispatched}</h3>
                <p class="text-purple-100 text-sm font-medium">Dispatched</p>
            </div>
            
            <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-3xl">✅</span>
                    <span class="text-emerald-100 text-sm font-bold">FILTERED</span>
                </div>
                <h3 class="text-4xl font-black mb-1">${stats.statusBreakdown.delivered}</h3>
                <p class="text-emerald-100 text-sm font-medium">Delivered</p>
            </div>
        </div>
    `;
}

// Render missing orders alert
async function renderMissingOrdersAlert() {
    try {
        const res = await fetch(`${API_URL}/analytics/missing-orders`);
        const data = await res.json();

        if (!data.success || !data.alert) return;

        const container = document.getElementById('dashboardStats');
        if (!container) return;

        const alertHTML = `
            <div class="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-black text-red-800 flex items-center gap-2">
                        <span>🚨</span> Stuck Orders Alert
                    </h3>
                    <span class="bg-red-500 text-white px-4 py-2 rounded-full font-black text-lg">
                        ${data.totalStuck}
                    </span>
                </div>
                <p class="text-red-700 mb-4">
                    ${data.totalStuck} orders are stuck for more than 48 hours!
                </p>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    ${Object.entries(data.byStatus).map(([status, orders]) => `
                        <div class="bg-white rounded-lg p-3 border border-red-200">
                            <p class="text-sm font-bold text-gray-700">${status}</p>
                            <p class="text-2xl font-black text-red-600">${orders.length}</p>
                        </div>
                    `).join('')}
                </div>
                <button onclick="viewStuckOrders()" 
                    class="mt-4 w-full bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition">
                    View Stuck Orders Details
                </button>
            </div>
        `;

        container.insertAdjacentHTML('afterend', alertHTML);
    } catch (error) {
        console.error('Missing orders alert error:', error);
    }
}

// View stuck orders details
async function viewStuckOrders() {
    try {
        const res = await fetch(`${API_URL}/analytics/missing-orders`);
        const data = await res.json();

        let details = '<div class="space-y-4">';

        Object.entries(data.byStatus).forEach(([status, orders]) => {
            details += `
                <div class="border-b pb-4">
                    <h4 class="font-bold text-lg mb-2">${status} (${orders.length})</h4>
                    ${orders.map(o => `
                        <div class="bg-gray-50 p-3 rounded-lg mb-2">
                            <p class="font-bold">${o.orderId} - ${o.customerName}</p>
                            <p class="text-sm text-gray-600">Amount: ₹${o.total}</p>
                            <p class="text-sm text-red-600 font-bold">Stuck for: ${o.hoursStuck} hours</p>
                        </div>
                    `).join('')}
                </div>
            `;
        });

        details += '</div>';

        alert('Stuck Orders:\n\n' + data.totalStuck + ' orders stuck. Check console for details.');
        console.log('Stuck Orders:', data);
    } catch (error) {
        console.error('Error viewing stuck orders:', error);
    }
}

// Render today's stats cards
function renderDashboardStats(stats) {
    const container = document.getElementById('dashboardStats');
    if (!container) return;

    container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <!-- Total Orders -->
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-3xl">📊</span>
                    <span class="text-blue-100 text-sm font-bold">TODAY</span>
                </div>
                <h3 class="text-4xl font-black mb-1">${stats.totalOrders}</h3>
                <p class="text-blue-100 text-sm font-medium">Total Orders</p>
            </div>
            
            <!-- Revenue -->
            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-3xl">💰</span>
                    <span class="text-green-100 text-sm font-bold">TODAY</span>
                </div>
                <h3 class="text-4xl font-black mb-1">₹${stats.totalRevenue.toLocaleString()}</h3>
                <p class="text-green-100 text-sm font-medium mb-3">Revenue</p>
                <div class="flex gap-2 pt-2 border-t border-green-400">
                    <div class="flex-1 text-center bg-green-400/30 rounded-lg py-1">
                        <span class="block text-[9px] uppercase font-bold text-green-100">Fresh</span>
                        <span class="block text-xs font-black text-white">🆕 ₹${(stats.freshRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div class="flex-1 text-center bg-green-400/30 rounded-lg py-1">
                        <span class="block text-[9px] uppercase font-bold text-green-100">Reorder</span>
                        <span class="block text-xs font-black text-white">🔄 ₹${(stats.reorderRevenue || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <!-- Dispatched -->
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-3xl">🚚</span>
                    <span class="text-purple-100 text-sm font-bold">TODAY</span>
                </div>
                <h3 class="text-4xl font-black mb-1">${stats.dispatched}</h3>
                <p class="text-purple-100 text-sm font-medium">Dispatched</p>
            </div>
            
            <!-- Delivered -->
            <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-3xl">✅</span>
                    <span class="text-emerald-100 text-sm font-bold">TODAY</span>
                </div>
                <h3 class="text-4xl font-black mb-1">${stats.delivered}</h3>
                <p class="text-emerald-100 text-sm font-medium">Delivered</p>
            </div>
        </div>
    `;
}

// Render orders timeline chart
function renderOrdersChart(timeline) {
    const container = document.getElementById('ordersChart');
    if (!container) return;

    const labels = timeline.map(d => d.date);
    const totals = timeline.map(d => d.total);
    const delivered = timeline.map(d => d.delivered);
    const cancelled = timeline.map(d => d.cancelled);

    container.innerHTML = `
        <div class="bg-white rounded-2xl p-6 shadow-lg">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📈</span> Orders Last 7 Days
            </h3>
            <canvas id="ordersLineChart"></canvas>
        </div>
    `;

    const ctx = document.getElementById('ordersLineChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Orders',
                    data: totals,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Delivered',
                    data: delivered,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Cancelled',
                    data: cancelled,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Render employee performance chart
function renderEmployeeChart(employees) {
    const container = document.getElementById('employeeChart');
    if (!container) return;

    const names = employees.map(e => e.name);
    const orders = employees.map(e => e.totalOrders);
    const revenue = employees.map(e => e.revenue);

    container.innerHTML = `
        <div class="bg-white rounded-2xl p-6 shadow-lg">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                <span>👥</span> Top 5 Employees
            </h3>
            <canvas id="employeeBarChart"></canvas>
        </div>
    `;

    const ctx = document.getElementById('employeeBarChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: names,
            datasets: [{
                label: 'Total Orders',
                data: orders,
                backgroundColor: [
                    '#3b82f6',
                    '#8b5cf6',
                    '#ec4899',
                    '#f59e0b',
                    '#10b981'
                ],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Render status distribution chart
function renderStatusChart(status) {
    const container = document.getElementById('statusChart');
    if (!container) return;

    container.innerHTML = `
        <div class="bg-white rounded-2xl p-6 shadow-lg">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📊</span> Order Status Distribution
            </h3>
            <canvas id="statusDoughnutChart"></canvas>
        </div>
    `;

    const ctx = document.getElementById('statusDoughnutChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Verified', 'Dispatched', 'Delivered', 'Cancelled'],
            datasets: [{
                data: [
                    status.pending,
                    status.verified,
                    status.dispatched,
                    status.delivered,
                    status.cancelled
                ],
                backgroundColor: [
                    '#f59e0b',
                    '#3b82f6',
                    '#8b5cf6',
                    '#10b981',
                    '#ef4444'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

console.log('✅ Analytics Dashboard loaded');
