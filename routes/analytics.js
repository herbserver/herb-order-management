const express = require('express');
const router = express.Router();
const dataAccess = require('../dataAccess');

// ==================== ANALYTICS DASHBOARD API ====================

// Get comprehensive dashboard analytics
router.get('/dashboard', async (req, res) => {
    try {
        const { startDate, endDate, employeeId } = req.query;

        // Get all orders using dataAccess (Hybrid)
        let orders = await dataAccess.getAllOrders();
        orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Apply date filter if provided (Fixed logic)
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            orders = orders.filter(o => {
                const orderDate = new Date(o.timestamp);
                return orderDate >= start && orderDate <= end;
            });
        }

        // Apply employee filter if provided
        if (employeeId) {
            orders = orders.filter(o => o.employeeId === employeeId.toUpperCase());
        }

        // Today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(o => new Date(o.timestamp) >= today);

        const todayStats = {
            totalOrders: todayOrders.length,
            totalRevenue: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
            pendingVerification: todayOrders.filter(o => o.status === 'Pending').length,
            dispatched: todayOrders.filter(o => o.status === 'Dispatched').length,
            delivered: todayOrders.filter(o => o.status === 'Delivered').length
        };

        // 7-Day Timeline Data
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayOrders = orders.filter(o => o.timestamp && o.timestamp.startsWith(dateStr));
            last7Days.push({
                date: dateStr,
                total: dayOrders.length,
                delivered: dayOrders.filter(o => o.status === 'Delivered').length,
                cancelled: dayOrders.filter(o => o.status === 'Cancelled').length
            });
        }

        // Top 5 Employees
        const empPerformance = {};
        orders.forEach(o => {
            if (o.employeeId) {
                if (!empPerformance[o.employeeId]) {
                    empPerformance[o.employeeId] = { name: o.employee || o.employeeId, totalOrders: 0, revenue: 0 };
                }
                empPerformance[o.employeeId].totalOrders++;
                empPerformance[o.employeeId].revenue += (o.total || 0);
            }
        });
        const topEmployees = Object.values(empPerformance)
            .sort((a, b) => b.totalOrders - a.totalOrders)
            .slice(0, 5);

        // Quick stats
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const uniqueCustomers = new Set(orders.map(o => o.mobileNumber || o.telNo)).size;

        res.json({
            success: true,
            today: todayStats,
            charts: {
                statusDistribution,
                ordersTimeline: last7Days,
                employeePerformance: topEmployees
            },
            quickStats: {
                totalOrders: orders.length,
                totalRevenue,
                totalCustomers: uniqueCustomers,
                deliverySuccessRate: orders.length > 0 ? ((statusDistribution.delivered / orders.length) * 100).toFixed(1) : 0
            }
        });

    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
});

// Missing/Stuck Orders Alert (>48 hours in same status)
router.get('/missing-orders', async (req, res) => {
    try {
        const allOrders = await dataAccess.getAllOrders();
        const orders = allOrders.filter(o =>
            !['Delivered', 'Cancelled'].includes(o.status)
        );

        const threshold = 48 * 60 * 60 * 1000; // 48 hours
        const now = new Date();

        const stuckOrders = orders.filter(o => {
            const lastUpdate = new Date(o.updatedAt || o.timestamp);
            return (now - lastUpdate) > threshold;
        }).map(o => {
            const lastUpdate = new Date(o.updatedAt || o.timestamp);
            const hoursStuck = Math.floor((now - lastUpdate) / (1000 * 60 * 60));
            return {
                ...o,
                hoursStuck
            };
        });

        const byStatus = {};
        stuckOrders.forEach(o => {
            if (!byStatus[o.status]) byStatus[o.status] = [];
            byStatus[o.status].push({
                orderId: o.orderId,
                customerName: o.customerName,
                total: o.total,
                lastUpdate: o.updatedAt || o.timestamp,
                hoursStuck: o.hoursStuck
            });
        });

        res.json({
            success: true,
            totalStuck: stuckOrders.length,
            byStatus,
            alert: stuckOrders.length > 0
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error' });
    }
});

// Range Filter API (matching frontend applyAnalyticsFilters)
router.get('/range', async (req, res) => {
    try {
        const { startDate, endDate, employeeId } = req.query;
        let orders = await dataAccess.getAllOrders();

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            orders = orders.filter(o => {
                const d = new Date(o.timestamp);
                return d >= start && d <= end;
            });
        }

        if (employeeId && employeeId !== 'all') {
            orders = orders.filter(o => o.employeeId === employeeId.toUpperCase());
        }

        const stats = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
            statusBreakdown: {
                pending: orders.filter(o => o.status === 'Pending').length,
                verified: orders.filter(o => o.status === 'Address Verified').length,
                dispatched: orders.filter(o => o.status === 'Dispatched').length,
                delivered: orders.filter(o => o.status === 'Delivered').length,
                cancelled: orders.filter(o => o.status === 'Cancelled').length
            }
        };

        res.json({ success: true, stats });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
