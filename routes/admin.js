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
        try {
            orders = await dataAccess.getAllOrders();
        } catch (e) {
            orders = readJSON(ORDERS_FILE, []);
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

        if (req.query.status) {
            filteredOrders = filteredOrders.filter(o => o.status === req.query.status);
        }

        filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json({ success: true, orders: filteredOrders });
    } catch (error) {
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

        // Calculate Fresh vs Re-order
        let totalFresh = 0, totalReorder = 0;
        let pendingFresh = 0, pendingReorder = 0;

        // Sort by date asc to find first occurrence
        const sortedOrders = [...orders].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const seenMobiles = new Set();

        sortedOrders.forEach(o => {
            const mobile = o.telNo || o.mobileNumber;
            const isReorder = seenMobiles.has(mobile);
            if (mobile) seenMobiles.add(mobile);

            if (isReorder) {
                totalReorder++;
                if (o.status === 'Pending') pendingReorder++;
            } else {
                totalFresh++;
                if (o.status === 'Pending') pendingFresh++;
            }
        });

        res.json({
            success: true,
            stats: {
                totalOrders: orders.length,
                totalFresh,               // Added
                totalReorder,             // Added
                pendingOrders: orders.filter(o => o.status === 'Pending').length,
                pendingFresh,             // Added
                pendingReorder,           // Added
                verifiedOrders: orders.filter(o => o.status === 'Address Verified').length,
                dispatchedOrders: orders.filter(o => o.status === 'Dispatched').length,
                deliveredOrders: orders.filter(o => o.status === 'Delivered').length,
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

        // Sort orders by timestamp to correctly identify "Fresh" vs "Re-order"
        orders.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const seenMobiles = new Set();

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
            const mobile = o.telNo || o.mobileNumber; // Handle variations
            const isReorder = seenMobiles.has(mobile);
            if (mobile) seenMobiles.add(mobile); // Mark as seen

            const typeKey = isReorder ? 'reorder' : 'fresh';

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
