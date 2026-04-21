const express = require('express');
const router = express.Router();
const dataAccess = require('../dataAccess');

// ==================== ANALYTICS DASHBOARD API ====================

// Get comprehensive dashboard analytics
router.get('/dashboard', async (req, res) => {
    try {
        const { startDate, endDate, employeeId } = req.query;
        const today = new Date().toISOString().split('T')[0];
        const effectiveStartDate = startDate || today;
        const effectiveEndDate = endDate || today;

        // Use the new optimized aggregation function (Moves processing to MongoDB)
        const data = await dataAccess.getAnalyticsDashboardData(effectiveStartDate, effectiveEndDate, employeeId);

        if (!data) {
            return res.status(500).json({ success: false, message: 'Error fetching analytics' });
        }

        // Map results to the format expected by the frontend
        res.json({
            success: true,
            today: {
                totalOrders: data.created.totalOrders,
                totalRevenue: data.created.totalRevenue,
                freshRevenue: data.created.freshRevenue,
                reorderRevenue: data.created.reorderRevenue,
                freshCount: data.created.freshCount,
                reorderCount: data.created.reorderCount,
                delivered: data.delivered.count,
                deliveredRevenue: data.delivered.revenue,
                dispatched: data.dispatched.count,
                dispatchedRevenue: data.dispatched.revenue,
                hold: data.hold.count,
                holdRevenue: data.hold.revenue,
                cancelled: data.cancelled.count,
                cancelledRevenue: data.cancelled.revenue,
                rto: data.rto.count,
                rtoRevenue: data.rto.revenue
            },
            charts: {
                statusDistribution: {
                    total: data.created.totalOrders,
                    pending: data.created.pending,
                    verified: data.created.verified,
                    dispatched: data.dispatched.count,
                    delivered: data.delivered.count,
                    cancelled: data.cancelled.count,
                    rto: data.rto.count
                },
                ordersTimeline: data.timeline,
                employeePerformance: data.employees,
                cityDistribution: data.cities
            },
            quickStats: {
                totalOrders: data.created.totalOrders,
                totalRevenue: data.created.totalRevenue,
                deliveredRevenue: data.delivered.revenue,
                deliveredOrders: data.delivered.count,
                totalCustomers: data.created.customersCount,
                deliverySuccessRate: data.created.totalOrders > 0 ?
                    ((data.created.deliveredCount / data.created.totalOrders) * 100).toFixed(1) : 0
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
        const result = await dataAccess.getStuckOrders(48);
        res.json(result);
    } catch (error) {
        console.error('Stuck orders error:', error);
        res.status(500).json({ success: false, message: 'Error' });
    }
});

// Range Filter API (matching frontend applyAnalyticsFilters)
router.get('/range', async (req, res) => {
    try {
        const { startDate, endDate, employeeId } = req.query;
        let orders = await dataAccess.getOrdersForStats(startDate, endDate);

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

        const activeOrders = orders.filter(o => !['Cancelled', 'On Hold', 'Hold'].includes(o.status));
        const stats = {
            totalOrders: activeOrders.length,
            totalRevenue: activeOrders.reduce((sum, o) => sum + (o.total || 0), 0),
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
