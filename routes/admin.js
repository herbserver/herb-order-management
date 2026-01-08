const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const dataAccess = require('../dataAccess');

const DATA_DIR = path.join(__dirname, '../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Helper Function for JSON (Fallback)
function readJSON(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return defaultValue;
    }
}

// Get Order History (with filters)
router.get('/history', async (req, res) => {
    try {
        let orders = [];

        // Optimization: Use efficient lookup if status is provided
        if (req.query.status) {
            orders = await dataAccess.getOrdersByStatus(req.query.status);
        } else {
            try {
                orders = await dataAccess.getAllOrders();
            } catch (e) {
                orders = readJSON(ORDERS_FILE, []);
            }
        }

        let filteredOrders = [...orders];

        if (req.query.date) {
            filteredOrders = filteredOrders.filter(o => {
                const orderDate = new Date(o.timestamp).toISOString().split('T')[0];
                return orderDate === req.query.date;
            });
        }

        if (req.query.employee) {
            filteredOrders = filteredOrders.filter(o => o.employeeId === req.query.employee.toUpperCase());
        }

        // Status filter is already applied if we used the optimized path, 
        // but if we fell back (no status provided but filtered later? No, req.query.status is the switch)
        // If we didn't use optimized path, we need to filter.
        // If we DID use optimized path, filteredOrders already has only that status.
        // Double filtering is safe but redundant.
        if (!req.query.status && req.query.status) {
            // This block is unreachable logically based on above if-else, 
            // but if we had complex logic, we'd check.
            // Actually, if we fetch all, we MUST filter by status if it was somehow skipped (impossible here).
        }

        // Wait, if I fetched by status, I don't need to filter by status again.
        // But if I fetched ALL (else block), I verified req.query.status is falsy.
        // So no status filter needed in else block either? 
        // Ah, what if req.query.status is NOT provided? Then we fetch ALL.
        // AND we don't filter by status. Correct.

        filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json({ success: true, orders: filteredOrders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const orders = await dataAccess.getAllOrders();
        const departments = await dataAccess.getAllDepartments();

        let totalEmployees = 0;
        departments.forEach(d => {
            if (d.employees) totalEmployees += Object.keys(d.employees).length;
        });

        const now = new Date();
        const thisMonth = orders.filter(o => {
            const orderDate = new Date(o.timestamp);
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        });

        // Calculate Fresh vs Re-order (with Revenue)
        let totalFresh = 0, totalReorder = 0;
        let pendingFresh = 0, pendingReorder = 0;
        let freshRevenue = 0, reorderRevenue = 0;

        // Status-specific revenue breakdown
        let pendingFreshRev = 0, pendingReorderRev = 0;
        let verifiedFreshRev = 0, verifiedReorderRev = 0;
        let dispatchedFreshRev = 0, dispatchedReorderRev = 0;
        let deliveredFreshRev = 0, deliveredReorderRev = 0;

        // Calculate Fresh vs Re-order (ONLY count orders with orderType field set)
        orders.forEach(o => {
            // Skip orders without orderType field (old orders)
            if (!o.orderType) return;

            // Handle both old format (NEW, REORDER) and new format (Fresh, Reorder)
            const isReorder = o.orderType === 'Reorder' || o.orderType === 'REORDER';
            const orderTotal = o.total || 0;

            if (isReorder) {
                totalReorder++;
                reorderRevenue += orderTotal;
                if (o.status === 'Pending') {
                    pendingReorder++;
                    pendingReorderRev += orderTotal;
                }
                if (o.status === 'Address Verified') verifiedReorderRev += orderTotal;
                if (o.status === 'Dispatched') dispatchedReorderRev += orderTotal;
                if (o.status === 'Delivered') deliveredReorderRev += orderTotal;
            } else {
                totalFresh++;
                freshRevenue += orderTotal;
                if (o.status === 'Pending') {
                    pendingFresh++;
                    pendingFreshRev += orderTotal;
                }
                if (o.status === 'Address Verified') verifiedFreshRev += orderTotal;
                if (o.status === 'Dispatched') dispatchedFreshRev += orderTotal;
                if (o.status === 'Delivered') deliveredFreshRev += orderTotal;
            }
        });

        res.json({
            success: true,
            stats: {
                totalOrders: orders.length,
                totalFresh,
                totalReorder,
                freshRevenue,            // NEW - Fresh orders revenue
                reorderRevenue,          // NEW - Reorder revenue
                pendingOrders: orders.filter(o => o.status === 'Pending').length,
                pendingFresh,
                pendingReorder,
                pendingFreshRevenue: pendingFreshRev,
                pendingReorderRevenue: pendingReorderRev,
                verifiedOrders: orders.filter(o => o.status === 'Address Verified').length,
                verifiedFreshRevenue: verifiedFreshRev,
                verifiedReorderRevenue: verifiedReorderRev,
                dispatchedOrders: orders.filter(o => o.status === 'Dispatched').length,
                dispatchedFreshRevenue: dispatchedFreshRev,
                dispatchedReorderRevenue: dispatchedReorderRev,
                deliveredOrders: orders.filter(o => o.status === 'Delivered').length,
                deliveredFreshRevenue: deliveredFreshRev,
                deliveredReorderRevenue: deliveredReorderRev,
                totalEmployees: totalEmployees,
                totalDepartments: departments.length,
                thisMonthOrders: thisMonth.length
            }
        });
    } catch (e) {
        console.error('Stats error:', e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Department-specific Daily Stats
// Get Department-specific Daily Stats
router.get('/department-stats', async (req, res) => {
    try {
        let orders = await dataAccess.getAllOrders();

        // Helper to get date string YYYY-MM-DD
        const getDateStr = (d) => new Date(d).toISOString().split('T')[0];

        const now = new Date();
        const todayStr = getDateStr(now);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getDateStr(yesterday);

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        // Sort orders by timestamp to ensure chronological processing if needed (though orderType is static now)
        orders.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Initialize stats structure
        const initStats = () => ({
            today: { fresh: 0, reorder: 0 },
            yesterday: { fresh: 0, reorder: 0 },
            last7Days: { fresh: 0, reorder: 0 }
        });

        const stats = {
            verification: initStats(),
            dispatch: initStats(),
            delivery: initStats()
        };

        orders.forEach(o => {
            // Skip orders without orderType field (old orders)
            if (!o.orderType) return;

            // Use persisted orderType field - handle both old (REORDER) and new (Reorder) format
            const typeKey = (o.orderType === 'Reorder' || o.orderType === 'REORDER') ? 'reorder' : 'fresh';

            // --- Aggregation Logic ---

            // Verification Stats (based on verifiedAt)
            if (o.verifiedAt) {
                const vDate = new Date(o.verifiedAt);
                const vDateStr = getDateStr(vDate);
                if (vDateStr === todayStr) stats.verification.today[typeKey]++;
                if (vDateStr === yesterdayStr) stats.verification.yesterday[typeKey]++;
                if (vDate >= last7Days) stats.verification.last7Days[typeKey]++;
            }

            // Dispatch Stats (based on dispatchedAt)
            if (o.dispatchedAt) {
                const dDate = new Date(o.dispatchedAt);
                const dDateStr = getDateStr(dDate);
                if (dDateStr === todayStr) stats.dispatch.today[typeKey]++;
                if (dDateStr === yesterdayStr) stats.dispatch.yesterday[typeKey]++;
                if (dDate >= last7Days) stats.dispatch.last7Days[typeKey]++;
            }

            // Delivery Stats (based on deliveredAt)
            if (o.deliveredAt) {
                const delDate = new Date(o.deliveredAt);
                const delDateStr = getDateStr(delDate);
                if (delDateStr === todayStr) stats.delivery.today[typeKey]++;
                if (delDateStr === yesterdayStr) stats.delivery.yesterday[typeKey]++;
                if (delDate >= last7Days) stats.delivery.last7Days[typeKey]++;
            }
        });

        res.json({ success: true, stats });
    } catch (error) {
        console.error('Department stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
