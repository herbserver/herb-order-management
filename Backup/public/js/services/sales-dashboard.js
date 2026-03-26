// Sales Dashboard Logic
// Author: Herb On Naturals AI Assistant

// Configuration
const DATA_URL = '/data/sales_2025.json';
const ITEMS_PER_PAGE = 50;

// State
let allData = [];
let filteredData = [];
let currentPage = 1;
let stats = {
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    deliveredCount: 0,
    rejectedCount: 0
};

// DOM Elements
const tableBody = document.getElementById('orders-table-body');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const exportBtn = document.getElementById('export-btn');
const resultsCount = document.getElementById('results-count');
const mobileCount = document.getElementById('mobile-count');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const startIndexEl = document.getElementById('start-index');
const endIndexEl = document.getElementById('end-index');
const totalItemsEl = document.getElementById('total-items');
const lastUpdatedEl = document.getElementById('last-updated');

// Stats Elements
const statsContainer = document.getElementById('stats-container');

// Initialization
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        await fetchData();
        renderStats();
        applyFilters(); // Initial render
        setupEventListeners();
    } catch (error) {
        console.error('Initialization failed:', error);
        alert('Failed to load sales data. Please ensure the data file exists.');
    }
}

async function fetchData() {
    lastUpdatedEl.textContent = 'Fetching data...';
    try {
        const response = await fetch(DATA_URL);
        const json = await response.json();

        // Data Normalization Logic
        // The JSON has a structure where "General" is the array
        // The first item (index 0) is often headers, subsequent are data
        const rawList = json.General || [];

        if (rawList.length === 0) {
            throw new Error('No data found in JSON');
        }

        // We skip index 0 as it seems to be header definitions
        // Keys based on file inspection:
        // Column2: Name
        // Column3: Phone
        // Column10: Items
        // Column13: Amount
        // Column14: Agent
        // Column8: Date
        // "Orders of a particular date & their Status": Status

        // Helper to safely get string
        const safeStr = (val) => val ? String(val).trim() : '';

        allData = rawList.slice(1).map((item, index) => {
            // Fix amount parsing (remove commas, handle non-numbers)
            let rawAmount = item["Column13"];
            let amount = 0;
            if (typeof rawAmount === 'number') {
                amount = rawAmount;
            } else if (typeof rawAmount === 'string') {
                amount = parseFloat(rawAmount.replace(/,/g, '')) || 0;
            }

            return {
                id: index + 1, // Artificial ID
                customerName: safeStr(item["Column2"]) || 'N/A',
                phone: safeStr(item["Column3"]) || 'N/A',
                address: safeStr(item["Column4"]),
                date: safeStr(item["Column8"]),
                items: safeStr(item["Column10"]),
                amount: amount,
                agent: safeStr(item["Column14"]),
                // The tricky key for status
                status: safeStr(item["Orders of a particular date & their Status"]) || 'Pending',
                original: item
            };
        });

        // Calculate Stats
        calculateStats();

        lastUpdatedEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        console.log(`Loaded ${allData.length} orders`);

    } catch (error) {
        lastUpdatedEl.textContent = 'Error loading data';
        throw error;
    }
}

function calculateStats() {
    stats.totalOrders = allData.length;
    stats.totalRevenue = allData.reduce((sum, order) => sum + order.amount, 0);
    stats.deliveredCount = allData.filter(o => o.status.toLowerCase().includes('delivered')).length;
    stats.rejectedCount = allData.filter(o => o.status.toLowerCase().includes('rejected') || o.status.toLowerCase().includes('return')).length;
    stats.avgOrderValue = stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;
}

function renderStats() {
    const formatCurrency = (num) => '₹' + num.toLocaleString('en-IN');

    const statCards = [
        { title: 'Total Orders', value: stats.totalOrders.toLocaleString(), color: 'text-blue-600', icon: '📦' },
        { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), color: 'text-green-600', icon: '💰' },
        { title: 'Delivered', value: stats.deliveredCount.toLocaleString(), sub: `${Math.round((stats.deliveredCount / stats.totalOrders) * 100)}%`, color: 'text-brand-600', icon: '✅' },
        { title: 'Avg. Order Value', value: formatCurrency(stats.avgOrderValue), color: 'text-purple-600', icon: '📊' }
    ];

    statsContainer.innerHTML = statCards.map((card, index) => `
        <div class="glass-panel bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow animate__animated animate__fadeInUp" style="animation-delay: ${index * 0.1}s">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-slate-500 text-sm font-medium uppercase tracking-wider">${card.title}</h3>
                    <div class="mt-2 flex items-baseline gap-2">
                        <span class="text-2xl font-bold text-slate-800">${card.value}</span>
                        ${card.sub ? `<span class="text-sm font-medium ${card.color} bg-opacity-10 px-2 py-0.5 rounded-full bg-current">${card.sub}</span>` : ''}
                    </div>
                </div>
                <div class="p-3 bg-slate-50 rounded-xl text-xl">${card.icon}</div>
            </div>
        </div>
    `).join('');
}

function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        currentPage = 1;
        applyFilters();
    });

    statusFilter.addEventListener('change', (e) => {
        currentPage = 1;
        applyFilters();
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    nextBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
        if (currentPage < maxPage) {
            currentPage++;
            renderTable();
        }
    });

    exportBtn.addEventListener('click', exportToCSV);
}

function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const status = statusFilter.value;

    filteredData = allData.filter(order => {
        // Text Search
        const matchesSearch =
            order.customerName.toLowerCase().includes(query) ||
            order.phone.includes(query) ||
            (order.address && order.address.toLowerCase().includes(query)) ||
            (order.agent && order.agent.toLowerCase().includes(query)) ||
            (order.items && order.items.toLowerCase().includes(query));

        // Status Filter
        let matchesStatus = true;
        if (status !== 'all') {
            const s = order.status.toLowerCase();
            if (status === 'delivered') matchesStatus = s.includes('delivered');
            else if (status === 'rejected') matchesStatus = s.includes('rejected') || s.includes('return');
            else if (status === 'pending') matchesStatus = !s.includes('delivered') && !s.includes('rejected') && !s.includes('return');
        }

        return matchesSearch && matchesStatus;
    });

    // Update Counts
    const countStr = `${filteredData.length.toLocaleString()}`;
    resultsCount.textContent = `${countStr} Results`;
    mobileCount.textContent = `Found ${countStr} results`;

    renderTable();
}

function renderTable() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, filteredData.length);
    const pageData = filteredData.slice(start, end);

    // Update Pagination UI
    startIndexEl.textContent = filteredData.length > 0 ? start + 1 : 0;
    endIndexEl.textContent = end;
    totalItemsEl.textContent = filteredData.length.toLocaleString();
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = end >= filteredData.length;

    // Render Rows
    if (pageData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-slate-500">
                    <p class="text-lg font-medium">No orders found</p>
                    <p class="text-sm">Try adjusting your filters</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = pageData.map((order, index) => {
        // Status Styling
        let statusClass = 'bg-slate-100 text-slate-700'; // Default
        const s = order.status.toLowerCase();
        if (s.includes('delivered')) statusClass = 'bg-green-100 text-green-700 border border-green-200';
        else if (s.includes('rejected')) statusClass = 'bg-red-100 text-red-700 border border-red-200';
        else if (s.includes('return')) statusClass = 'bg-orange-100 text-orange-700 border border-orange-200';

        return `
            <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 table-row-animate" style="animation-delay: ${index * 0.03}s">
                <td class="p-4 text-sm whitespace-nowrap text-slate-600">${order.date}</td>
                <td class="p-4">
                    <div class="font-medium text-slate-900">${order.customerName}</div>
                    <div class="text-xs text-slate-400 truncate max-w-[200px]" title="${order.address}">${order.address || ''}</div>
                </td>
                <td class="p-4 text-sm font-mono text-slate-600">${order.phone}</td>
                <td class="p-4 text-sm text-slate-600 max-w-[200px] truncate" title="${order.items}">${order.items}</td>
                <td class="p-4 text-sm font-medium text-slate-900 text-right">₹${order.amount.toLocaleString()}</td>
                <td class="p-4 text-center">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass}">
                        ${order.status}
                    </span>
                </td>
                <td class="p-4 text-sm text-slate-500">${order.agent}</td>
            </tr>
        `;
    }).join('');
}

function exportToCSV() {
    if (filteredData.length === 0) {
        alert('No data to export!');
        return;
    }

    const headers = ['Order Date', 'Customer Name', 'Phone', 'Address', 'Items', 'Amount', 'Status', 'Agent'];
    // Helper to format items string "A, A, B" -> "A (x2), B (x1)"
    const formatItemsForExport = (itemsStr) => {
        if (!itemsStr) return '';
        const counts = {};
        itemsStr.split(',').forEach(s => {
            const name = s.trim();
            if (name) counts[name] = (counts[name] || 0) + 1;
        });
        return Object.entries(counts).map(([name, count]) => `${name} (x${count})`).join(', ');
    };

    const rows = filteredData.map(o => [
        `"${o.date}"`,
        `"${o.customerName}"`,
        `"${o.phone}"`,
        `"${o.address}"`,
        `"${formatItemsForExport(o.items)}"`,
        o.amount,
        `"${o.status}"`,
        `"${o.agent}"`
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
