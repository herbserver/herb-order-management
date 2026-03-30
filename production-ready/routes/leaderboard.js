// Employee Leaderboard & Gamification API Routes
const express = require('express');
const router = express.Router();
const dataAccess = require('../dataAccess');

// Helper function to calculate employee stats
async function calculateEmployeeStats(orders, employeeId) {
    const empOrders = orders.filter(o => o.employeeId === employeeId);

    if (empOrders.length === 0) {
        return null;
    }

    const totalRevenue = empOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const delivered = empOrders.filter(o => o.status === 'Delivered').length;
    const deliveryRate = empOrders.length > 0 ? (delivered / empOrders.length * 100).toFixed(1) : 0;

    // Calculate average order value
    const avgOrderValue = empOrders.length > 0 ? (totalRevenue / empOrders.length).toFixed(2) : 0;

    // Calculate orders per day (since first order)
    const firstOrder = empOrders.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0];
    const daysSinceFirst = Math.max(1, Math.ceil((Date.now() - new Date(firstOrder.timestamp)) / (1000 * 60 * 60 * 24)));
    const ordersPerDay = (empOrders.length / daysSinceFirst).toFixed(2);

    return {
        employeeId,
        employeeName: empOrders[0].employee || employeeId,
        totalOrders: empOrders.length,
        totalRevenue,
        delivered,
        deliveryRate: parseFloat(deliveryRate),
        avgOrderValue: parseFloat(avgOrderValue),
        ordersPerDay: parseFloat(ordersPerDay),
        cancelled: empOrders.filter(o => o.status === 'Cancelled').length
    };
}

// Helper function to award badges
function awardBadges(employeeStats, allStats) {
    const badges = [];

    // 🥇 Top Performer (Most orders)
    const maxOrders = Math.max(...allStats.map(s => s.totalOrders));
    if (employeeStats.totalOrders === maxOrders && maxOrders > 0) {
        badges.push({ icon: '🥇', name: 'Top Performer', reason: 'Most orders created' });
    }

    // 💰 Revenue Champion (Highest revenue)
    const maxRevenue = Math.max(...allStats.map(s => s.totalRevenue));
    if (employeeStats.totalRevenue === maxRevenue && maxRevenue > 0) {
        badges.push({ icon: '💰', name: 'Revenue Champion', reason: 'Highest revenue generated' });
    }

    // ⚡ Speed Demon (Fastest processing - orders per day)
    const maxSpeed = Math.max(...allStats.map(s => s.ordersPerDay));
    if (employeeStats.ordersPerDay === maxSpeed && maxSpeed > 1) {
        badges.push({ icon: '⚡', name: 'Speed Demon', reason: 'Fastest order processing' });
    }

    // 🎯 Perfect Delivery (100% delivery rate, min 10 orders)
    if (employeeStats.deliveryRate === 100 && employeeStats.totalOrders >= 10) {
        badges.push({ icon: '🎯', name: 'Perfect Delivery', reason: '100% delivery success rate' });
    }

    // 💎 High Value (Highest average order value)
    const maxAvgValue = Math.max(...allStats.map(s => s.avgOrderValue));
    if (employeeStats.avgOrderValue === maxAvgValue && maxAvgValue > 0) {
        badges.push({ icon: '💎', name: 'High Value', reason: 'Highest average order value' });
    }

    // 🔥 Consistent Performer (10+ orders)
    if (employeeStats.totalOrders >= 10) {
        badges.push({ icon: '🔥', name: 'Consistent', reason: '10+ orders created' });
    }

    // 🌟 Rising Star (50+ orders)
    if (employeeStats.totalOrders >= 50) {
        badges.push({ icon: '🌟', name: 'Rising Star', reason: '50+ orders created' });
    }

    // 👑 Legend (100+ orders)
    if (employeeStats.totalOrders >= 100) {
        badges.push({ icon: '👑', name: 'Legend', reason: '100+ orders created' });
    }

    return badges;
}

// Get Monthly Leaderboard
router.get('/monthly', async (req, res) => {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const orders = await dataAccess.getAllOrders();

        // Filter this month's orders
        const monthOrders = orders.filter(o => {
            if (!o.timestamp) return false;
            const orderDate = new Date(o.timestamp);
            return orderDate >= firstDayOfMonth;
        });

        // Get unique employee IDs
        const employeeIds = [...new Set(monthOrders.map(o => o.employeeId))].filter(Boolean);

        // Calculate stats for each employee
        const employeeStats = [];
        for (const empId of employeeIds) {
            const stats = await calculateEmployeeStats(monthOrders, empId);
            if (stats) {
                employeeStats.push(stats);
            }
        }

        // Sort by total orders (can be changed to revenue, etc.)
        employeeStats.sort((a, b) => b.totalOrders - a.totalOrders);

        // Award badges
        const leaderboard = employeeStats.map((stats, index) => ({
            rank: index + 1,
            ...stats,
            badges: awardBadges(stats, employeeStats)
        }));

        res.json({
            success: true,
            month: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
            leaderboard,
            totalEmployees: leaderboard.length
        });

    } catch (error) {
        console.error('❌ Monthly leaderboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate leaderboard' });
    }
});

// Get All-Time Leaderboard
router.get('/all-time', async (req, res) => {
    try {
        const orders = await dataAccess.getAllOrders();

        // Get unique employee IDs
        const employeeIds = [...new Set(orders.map(o => o.employeeId))].filter(Boolean);

        // Calculate stats for each employee
        const employeeStats = [];
        for (const empId of employeeIds) {
            const stats = await calculateEmployeeStats(orders, empId);
            if (stats) {
                employeeStats.push(stats);
            }
        }

        // Sort by total orders
        employeeStats.sort((a, b) => b.totalOrders - a.totalOrders);

        // Award badges
        const leaderboard = employeeStats.map((stats, index) => ({
            rank: index + 1,
            ...stats,
            badges: awardBadges(stats, employeeStats)
        }));

        res.json({
            success: true,
            type: 'all-time',
            leaderboard,
            totalEmployees: leaderboard.length
        });

    } catch (error) {
        console.error('❌ All-time leaderboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate leaderboard' });
    }
});

// Get Employee Badges
router.get('/badges/:empId', async (req, res) => {
    try {
        const { empId } = req.params;
        const orders = await dataAccess.getAllOrders();

        // Get all employee IDs for comparison
        const employeeIds = [...new Set(orders.map(o => o.employeeId))].filter(Boolean);

        // Calculate stats for all employees
        const allStats = [];
        for (const id of employeeIds) {
            const stats = await calculateEmployeeStats(orders, id);
            if (stats) {
                allStats.push(stats);
            }
        }

        // Get stats for requested employee
        const employeeStats = allStats.find(s => s.employeeId === empId.toUpperCase());

        if (!employeeStats) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Award badges
        const badges = awardBadges(employeeStats, allStats);

        res.json({
            success: true,
            employeeId: empId,
            employeeName: employeeStats.employeeName,
            badges,
            stats: employeeStats
        });

    } catch (error) {
        console.error('❌ Get badges error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch badges' });
    }
});

module.exports = router;
