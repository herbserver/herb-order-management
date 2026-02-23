const express = require('express');
const router = express.Router();
const dataAccess = require('../dataAccess');

// ==================== ANALYTICS DASHBOARD API ====================

// Get comprehensive dashboard analytics
router.get('/dashboard', async (req, res) => {
    try {
        const { startDate, endDate, employeeId } = req.query;

        // Get all orders using dataAccess
        const allOrders = await dataAccess.getAllOrders();

        // 1. Filter for "Created in Range" (for Total, Pending, Revenue etc.)
        let createdOrders = [...allOrders];
        createdOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            createdOrders = createdOrders.filter(o => {
                const orderDate = new Date(o.timestamp);
                return orderDate >= start && orderDate <= end;
            });
        }

        // Apply employee filter to createdOrders
        if (employeeId) {
            createdOrders = createdOrders.filter(o => o.employeeId === employeeId.toUpperCase());
        }

        // 2. Filter for "Delivered in Range" (for Delivery Count & Efficiency)
        // We filter from 'allOrders' because delivery might happen for older orders
        let deliveredOrders = [];
        let dispatchedOrders = []; // New: Track dispatched in range for consistency

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            deliveredOrders = allOrders.filter(o => {
                if (o.status === 'Delivered') {
                    const dStr = o.deliveredAt || o.updatedAt || o.timestamp;
                    const d = new Date(dStr);
                    return d >= start && d <= end;
                }
                return false;
            });

            dispatchedOrders = allOrders.filter(o => {
                if (o.status === 'Dispatched' || o.status === 'Delivered') {
                    const dStr = o.dispatchedAt || o.updatedAt || o.timestamp;
                    const d = new Date(dStr);
                    return d >= start && d <= end;
                }
                return false;
            });

        } else {
            // Default View (All Time / No Filter) - Logic remains same
            deliveredOrders = allOrders.filter(o => o.status === 'Delivered');
            dispatchedOrders = allOrders.filter(o => o.status === 'Dispatched');
        }

        if (employeeId) {
            deliveredOrders = deliveredOrders.filter(o => o.employeeId === employeeId.toUpperCase());
            dispatchedOrders = dispatchedOrders.filter(o => o.employeeId === employeeId.toUpperCase());
        }


        // Quick Stats Calculation

        // Revenue: Usually based on Created Orders (Sales booked) OR Delivered Orders (Cash collected)?
        // Standard E-commerce "Revenue" usually means "GMV of orders placed in period".
        // Let's stick to Created Orders for Revenue.
        const totalRevenue = createdOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        // Fresh vs Reorder (Created)
        let freshRevenue = 0, reorderRevenue = 0;
        let freshCount = 0, reorderCount = 0;

        createdOrders.forEach(o => {
            const amt = o.total || 0;
            if (o.orderType === 'Reorder' || o.orderType === 'REORDER') {
                reorderRevenue += amt;
                reorderCount++;
            } else {
                freshRevenue += amt;
                freshCount++;
            }
        });

        // 7-Day Timeline Data (Requires careful iteration)
        // We want to show: 
        // 1. Total Created on Day X
        // 2. Total Delivered on Day X (regardless of creation)

        const timeline = [];
        // Determine last 7 days range OR the selected range?
        // The frontend expects "ordersTimeline" which is usually a trend.
        // If the user selected "Yesterday", a 7-day trend might still be useful context, 
        // OR we should show the hourly trend? 
        // For simplicity, let's keep the "Last 7 Days" trend regardless of filter, 
        // OR better: generate trend for the selected period?
        // The current frontend labels it "Orders Timeline".
        // Let's Stick to "Last 7 Days" fixed trend for now as the chart is designed for that.

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            // Created on this day
            const dayCreated = allOrders.filter(o => o.timestamp && o.timestamp.startsWith(dateStr));
            if (employeeId) {
                // filter by employee if needed
                // Note: efficient filtering would ideally be outside loop
            }

            // Delivered on this day (Activity Based with Fallback)
            const dayDelivered = allOrders.filter(o => {
                if (o.status === 'Delivered') {
                    const dTime = o.deliveredAt || o.updatedAt || o.timestamp;
                    return dTime.startsWith(dateStr);
                }
                return false;
            });

            timeline.push({
                date: dateStr,
                total: dayCreated.length,
                delivered: dayDelivered.length,
                cancelled: dayCreated.filter(o => o.status === 'Cancelled').length
            });
        }

        // Status Distribution (of the Created Orders in Range)
        // This shows "What happened to the orders created in this period?"
        // e.g. "Of orders created today, how many are already dispatched?"
        // Activity Based Distribution (Matching Admin Panel)
        // The user expects "Delivered" count in the chart to match the "Delivered" count in the sidebar/text.
        // So we override the "Created & Delivered" logic with "Delivered in Range" logic.

        // We need to fetch Cancelled and RTO in range as well for consistency if we want pure activity view.
        // Let's do it for consistency.

        const cancelledOrders = allOrders.filter(o => {
            if (o.status === 'Cancelled') {
                const d = new Date(o.cancellationInfo?.cancelledAt || o.updatedAt || o.timestamp);
                if (startDate && endDate) {
                    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
                    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
                    return d >= start && d <= end;
                }
                return true;
            }
            return false;
        });

        const rtoOrders = allOrders.filter(o => {
            if (o.status === 'RTO') {
                const d = new Date(o.rtoAt || o.updatedAt || o.timestamp);
                if (startDate && endDate) {
                    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
                    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
                    return d >= start && d <= end;
                }
                return true;
            }
            return false;
        });

        const statusDistribution = {
            total: createdOrders.length, // Total Created (remains as context)
            pending: createdOrders.filter(o => o.status === 'Pending').length,
            verified: createdOrders.filter(o => o.status === 'Address Verified').length,
            dispatched: dispatchedOrders.length, // Activity Based
            delivered: deliveredOrders.length,   // Activity Based
            cancelled: cancelledOrders.length,   // Activity Based
            rto: rtoOrders.length,               // Activity Based
        };

        // Wait, for "Delivered Count" in the UI Card, user usually expects "Total Deliveries achieved in period".
        // But status distribution usually means "Lifecycle of orders from period".
        // Let's provide BOTH.
        // UI uses 'analyticsStatDelivered' from statusDistribution.
        // UI uses 'analyticsDeliveryRate'. 
        // We should send the "Delivered In Period" count explicitly for the STAT CARD.
        // But the Chart (Doughnut) is Distribution.

        // Top Employees (Based on Revenue of orders created? Or Delivered?)
        // Usually Sales Performance = Revenue Booked.
        const empPerformance = {};
        createdOrders.forEach(o => {
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

        // Quick Stats to return
        const quickStats = {
            totalOrders: createdOrders.length,
            totalRevenue,
            totalCustomers: new Set(createdOrders.map(o => o.mobileNumber || o.telNo)).size,
            // Rate: Delivered (In Period) / Total Created (In Period) ?? 
            // Or Delivered (Lifecycle) / Total Created?
            // Let's use: Delivered Count (orders delivered in this window) / Total orders created in this window ? 
            // No that could be > 100%.
            // Let's use "Efficiency": (Orders Created in Period that are Delivered) / Total Created
            deliverySuccessRate: createdOrders.length > 0 ?
                ((createdOrders.filter(o => o.status === 'Delivered').length / createdOrders.length) * 100).toFixed(1) : 0
        };


        // Calculate Revenue for Delivered Orders
        const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        // UI "Today Stats" (Legacy Key) -> Mapped to filtered result
        // UI "Today Stats" (Legacy Key) -> Mapped to filtered result
        const todayStats = {
            totalOrders: createdOrders.length,
            totalRevenue,
            freshRevenue,
            reorderRevenue,
            freshCount,
            reorderCount,
            delivered: deliveredOrders.length,
            dispatched: dispatchedOrders.length, // Add dispatched count
            deliveredRevenue // Added for legacy support if needed
        };

        res.json({
            success: true,
            today: todayStats,
            charts: {
                statusDistribution,
                ordersTimeline: timeline,
                employeePerformance: topEmployees
            },
            quickStats: {
                totalOrders: createdOrders.length,
                totalRevenue, // Revenue of Created Orders
                deliveredRevenue, // Revenue of Delivered Orders (NEW)
                deliveredOrders: deliveredOrders.length, // Activity Based Delivered Count (NEW)
                totalCustomers: new Set(createdOrders.map(o => o.mobileNumber || o.telNo)).size,
                deliverySuccessRate: createdOrders.length > 0 ?
                    ((createdOrders.filter(o => o.status === 'Delivered').length / createdOrders.length) * 100).toFixed(1) : 0
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
