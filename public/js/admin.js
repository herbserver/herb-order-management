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
            // Update UI Cards
            document.getElementById('totalOrdersCount').innerText = data.stats.total || 0;
            document.getElementById('totalRevenueCount').innerText = '₹' + (data.stats.revenue || 0).toLocaleString();
            document.getElementById('pendingCount').innerText = data.stats.pending || 0;
            document.getElementById('dispatchedCount').innerText = data.stats.dispatched || 0;
        }
    } catch (e) { console.error('Stats error', e); }
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
