// ==================== ADMIN PANEL LOGIC ====================

document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth('admin');
    if (!user) return; // Redirects handled

    loadAdminStats();
    loadAllEmployees();
});

async function loadAdminStats() {
    try {
        const res = await fetch(`${API_URL}/admin/stats`);
        const data = await res.json();

        if (data.success) {
            updateCardStats('totalOrdersCount', data.stats.totalOrders, data.stats.totalFresh, data.stats.totalReorder);
            document.getElementById('totalRevenueCount').innerText = '₹' + (data.stats.revenue || 0).toLocaleString();
            updateCardStats('pendingCount', data.stats.pendingOrders, data.stats.pendingFresh, data.stats.pendingReorder);
            document.getElementById('dispatchedCount').innerText = data.stats.dispatchedOrders || 0;
        }
    } catch (e) { console.error('Stats error', e); }
}

function updateCardStats(elementId, total, fresh, reorder) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Check if Stats Container already exists to avoid duplication if re-run
    let container = el.parentElement.querySelector('.stats-breakdown');
    if (container) {
        container.innerHTML = `<span class="text-emerald-600">🆕 ${fresh}</span> <span class="text-gray-300">|</span> <span class="text-blue-600">🔄 ${reorder}</span>`;
        // Update main count just in case
        el.innerText = total;
    } else {
        el.innerText = total;
        // Inject breakdown
        const breakdownHtml = `<div class="stats-breakdown text-[10px] font-bold mt-1 tracking-wide flex gap-2">
            <span class="text-emerald-600">🆕 ${fresh || 0}</span> 
            <span class="text-gray-300">|</span> 
            <span class="text-blue-600">🔄 ${reorder || 0}</span>
        </div>`;
        el.insertAdjacentHTML('afterend', breakdownHtml);
    }
}

async function loadAllEmployees() {
    try {
        const res = await fetch(`${API_URL}/employees`);
        const data = await res.json();

        const list = document.getElementById('employeeList'); // Ensure this ID exists in admin.ejs
        if (!list) return;

        if (data.employees && data.employees.length > 0) {
            list.innerHTML = data.employees.map(e => `
                <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border mb-2">
                    <div>
                        <p class="font-bold text-gray-800">${e.name}</p>
                        <p class="text-xs text-gray-500">${e.employeeId}</p>
                    </div>
                    <div class="text-right">
                         <button onclick="removeEmployee('${e._id}')" class="text-red-500 text-xs font-bold hover:bg-red-50 px-3 py-1 rounded">Remove</button>
                    </div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p class="text-gray-400 text-center">No employees found</p>';
        }
    } catch (e) { console.error(e); }
}

async function removeEmployee(id) {
    if (!confirm('Are you sure you want to remove this employee?')) return;
    try {
        const res = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showSuccessPopup('Removed', 'Employee removed successfully', '🗑️', '#ef4444');
            loadAllEmployees();
        } else {
            alert(data.message);
        }
    } catch (e) { alert(e.message); }
}

// Global
window.removeEmployee = removeEmployee;
