const express = require('express');
const router = express.Router();
const path = require('path');
const dataAccess = require('../dataAccess');
const { readJSON } = require('../utils/fileHelpers');

const DATA_DIR = path.join(__dirname, '../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Note: Using centralized fileHelpers module for JSON operations

// Get Order History (with filters)
router.get('/history', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        let orders = [];
        let total = 0;

        // Optimization: Use efficient lookup if status is provided
        if (req.query.status) {
            const result = await dataAccess.getOrdersByStatus(req.query.status, page, limit, req.query.startDate, req.query.endDate);
            if (limit > 0 && result.orders) {
                orders = result.orders;
                total = result.total;
            } else {
                orders = result;
                total = orders.length;
            }
        } else {
            const result = await dataAccess.getAllOrders(page, limit, req.query.startDate, req.query.endDate);
            if (limit > 0 && result.orders) {
                orders = result.orders;
                total = result.total;
            } else {
                orders = result;
                total = orders.length;
            }
        }

        let filteredOrders = [...orders];

        if (req.query.employee) {
            filteredOrders = filteredOrders.filter(o => o.employeeId === req.query.employee.toUpperCase());
        }

        res.json({ 
            success: true, 
            orders: filteredOrders,
            pagination: limit > 0 ? {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            } : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Dashboard Stats with Enhanced Performance
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Use MongoDB Aggregation for core stats (fast)
        const stats = await dataAccess.getDashboardStats(startDate, endDate);
        
        // Supplemental stats (Metadata)
        const departments = await dataAccess.getAllDepartments();
        let totalEmployees = 0;
        departments.forEach(d => {
            if (d.employees) totalEmployees += Object.keys(d.employees).length;
        });

        if (!stats) {
            return res.status(500).json({ success: false, message: 'Failed to calculate stats' });
        }

        res.json({
            success: true,
            stats: {
                ...stats,
                totalEmployees,
                totalDepartments: departments.length
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
        const last7DaysQuery = new Date();
        last7DaysQuery.setDate(last7DaysQuery.getDate() - 7);
        let orders = await dataAccess.getOrdersForStats(last7DaysQuery.toISOString(), new Date().toISOString());

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
            // Handle missing orderType gracefully (default to fresh if missing)
            let typeKey = 'fresh';
            if (o.orderType && (o.orderType === 'Reorder' || o.orderType === 'REORDER')) {
                typeKey = 'reorder';
            }

            // --- Aggregation Logic (Status Based with Date Fallbacks) ---

            // Verification Stats (Address Verified)
            if (o.status === 'Address Verified' || o.status === 'Verified') {
                const vDateStr = o.verifiedAt || o.updatedAt || o.timestamp;
                const vDate = new Date(vDateStr);
                const vDateIso = getDateStr(vDate);

                if (vDateIso === todayStr) stats.verification.today[typeKey]++;
                if (vDateIso === yesterdayStr) stats.verification.yesterday[typeKey]++;
                if (vDate >= last7Days) stats.verification.last7Days[typeKey]++;
            }

            // Dispatch Stats (Dispatched)
            if (o.status === 'Dispatched') {
                const dDateStr = o.dispatchedAt || o.updatedAt || o.timestamp;
                const dDate = new Date(dDateStr);
                const dDateIso = getDateStr(dDate);

                if (dDateIso === todayStr) stats.dispatch.today[typeKey]++;
                if (dDateIso === yesterdayStr) stats.dispatch.yesterday[typeKey]++;
                if (dDate >= last7Days) stats.dispatch.last7Days[typeKey]++;
            }

            // Delivery Stats (Delivered)
            if (o.status === 'Delivered') {
                const delDateStr = o.deliveredAt || o.updatedAt || o.timestamp;
                const delDate = new Date(delDateStr);
                const delDateIso = getDateStr(delDate);

                if (delDateIso === todayStr) stats.delivery.today[typeKey]++;
                if (delDateIso === yesterdayStr) stats.delivery.yesterday[typeKey]++;
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
