// ==================== ANALYTICS DASHBOARD API ====================

// Get comprehensive dashboard analytics
router.get('/api/analytics/dashboard', async (req, res) => {
    try {
        const { startDate, endDate, employeeId } = req.query;

        // Get all orders
        let orders = await Order.find().sort({ timestamp: -1 });

        // Apply date filter if provided
        if (startDate && endDate) {
            orders = orders.filter(o => {
                const orderDate = new Date(o.timestamp);
                return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
            });
        }

        // Apply employee filter if provided
        if (employeeId) {
            orders = orders.filter(o => o.employeeId === employeeId);
        }

        // Calculate today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(o => new Date(o.timestamp) >= today);

        const todayStats = {
            totalOrders: todayOrders.length,
            totalRevenue: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
            pendingVerification: todayOrders.filter(o => o.status === 'Pending').length,
            dispatched: todayOrders.filter(o => o.status === 'Dispatched').length,
            delivered: todayOrders.filter(o => o.status === 'Delivered').length,
            successRate: todayOrders.length > 0
                ? ((todayOrders.filter(o => o.status === 'Delivered').length / todayOrders.length) * 100).toFixed(1)
                : 0
        };

        // Orders timeline (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const dayOrders = orders.filter(o => {
                const orderDate = new Date(o.timestamp);
                return orderDate >= date && orderDate < nextDay;
            });

            last7Days.push({
                date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                total: dayOrders.length,
                pending: dayOrders.filter(o => o.status === 'Pending').length,
                verified: dayOrders.filter(o => o.status === 'Address Verified').length,
                dispatched: dayOrders.filter(o => o.status === 'Dispatched').length,
                delivered: dayOrders.filter(o => o.status === 'Delivered').length,
                cancelled: dayOrders.filter(o => o.status === 'Cancelled').length
            });
        }

        // Revenue breakdown
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalCOD = orders.reduce((sum, o) => sum + (o.codAmount || 0), 0);
        const totalAdvance = orders.reduce((sum, o) => sum + (o.advance || 0), 0);

        // Employee performance
        const employeeStats = {};
        orders.forEach(order => {
            if (!order.employeeId) return;

            if (!employeeStats[order.employeeId]) {
                employeeStats[order.employeeId] = {
                    id: order.employeeId,
                    name: order.employee || order.employeeId,
                    totalOrders: 0,
                    delivered: 0,
                    cancelled: 0,
                    revenue: 0
                };
            }

            employeeStats[order.employeeId].totalOrders++;
            employeeStats[order.employeeId].revenue += order.total || 0;

            if (order.status === 'Delivered') employeeStats[order.employeeId].delivered++;
            if (order.status === 'Cancelled') employeeStats[order.employeeId].cancelled++;
        });

        const employeePerformance = Object.values(employeeStats)
            .sort((a, b) => b.totalOrders - a.totalOrders)
            .slice(0, 10)
            .map(emp => ({
                ...emp,
                successRate: emp.totalOrders > 0
                    ? ((emp.delivered / emp.totalOrders) * 100).toFixed(1)
                    : 0
            }));

        // Status distribution
        const statusDistribution = {
            pending: orders.filter(o => o.status === 'Pending').length,
            verified: orders.filter(o => o.status === 'Address Verified').length,
            dispatched: orders.filter(o => o.status === 'Dispatched').length,
            delivered: orders.filter(o => o.status === 'Delivered').length,
            cancelled: orders.filter(o => o.status === 'Cancelled').length,
            onHold: orders.filter(o => o.status === 'On Hold').length
        };

        // Quick stats
        const avgOrderValue = orders.length > 0
            ? (totalRevenue / orders.length).toFixed(2)
            : 0;

        const uniqueCustomers = new Set(orders.map(o => o.telNo)).size;

        const deliveryRate = orders.length > 0
            ? ((statusDistribution.delivered / orders.length) * 100).toFixed(1)
            : 0;

        // Calculate average delivery time
        const deliveredOrders = orders.filter(o =>
            o.status === 'Delivered' && o.dispatchedAt && o.deliveredAt
        );

        let avgDeliveryTime = 0;
        if (deliveredOrders.length > 0) {
            const totalTime = deliveredOrders.reduce((sum, o) => {
                const dispatchDate = new Date(o.dispatchedAt);
                const deliveredDate = new Date(o.deliveredAt);
                return sum + (deliveredDate - dispatchDate);
            }, 0);
            avgDeliveryTime = Math.round(totalTime / deliveredOrders.length / (1000 * 60 * 60 * 24)); // in days
        }

        // Top products (from items array)
        const productCount = {};
        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const desc = item.description || 'Unknown';
                    productCount[desc] = (productCount[desc] || 0) + (item.quantity || 1);
                });
            }
        });

        const topProducts = Object.entries(productCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Peak order hours
        const hourlyDistribution = new Array(24).fill(0);
        orders.forEach(order => {
            if (order.timestamp) {
                const hour = new Date(order.timestamp).getHours();
                hourlyDistribution[hour]++;
            }
        });

        const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));

        res.json({
            success: true,
            today: todayStats,
            charts: {
                ordersTimeline: last7Days,
                revenueBreakdown: {
                    total: totalRevenue,
                    cod: totalCOD,
                    advance: totalAdvance
                },
                employeePerformance,
                statusDistribution
            },
            quickStats: {
                avgOrderValue,
                totalCustomers: uniqueCustomers,
                deliverySuccessRate: deliveryRate,
                avgDeliveryTime: `${avgDeliveryTime} days`,
                topProducts,
                peakOrderHour: `${peakHour}:00 - ${peakHour + 1}:00`
            }
        });

    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
});

module.exports = router;
