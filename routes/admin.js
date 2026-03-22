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

// Get Dashboard Stats
// Get Dashboard Stats with Enhanced Date Filtering (Activity Based)
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let allOrders = await dataAccess.getOrdersForStats(startDate, endDate);

        let createdOrders = [...allOrders];
        let deliveredOrders = [];
        let dispatchedOrders = [];
        let cancelledOrders = [];
        let onHoldOrders = [];
        let pendingOrders = [];
        let verifiedOrders = [];

        // --- FILTER LOGIC ---
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            // 1. Total (Created)
            createdOrders = allOrders.filter(o => {
                const d = new Date(o.timestamp);
                return d >= start && d <= end;
            });

            // 2. Delivered (Activity Based) - IMPROVED
            deliveredOrders = allOrders.filter(o => {
                if (o.status === 'Delivered') {
                    // Use deliveredAt, fallback to updatedAt, then timestamp
                    const dStr = o.deliveredAt || o.updatedAt || o.timestamp;
                    const d = new Date(dStr);
                    return d >= start && d <= end;
                }
                return false;
            });

            // 3. Dispatched (Activity Based) - IMPROVED
            dispatchedOrders = allOrders.filter(o => {
                if (o.status === 'Dispatched' || o.status === 'Delivered') {
                    // Use dispatchedAt, fallback to updatedAt, then timestamp
                    // improved check: Only count if dispatchedAt exists OR if status is Dispatched (meaning it happened recently if we use updatedAt)
                    // If status is Delivered, we only count as dispatched if dispatchedAt is in range.

                    let dStr = o.dispatchedAt;
                    if (!dStr && o.status === 'Dispatched') dStr = o.updatedAt || o.timestamp;

                    if (dStr) {
                        const d = new Date(dStr);
                        return d >= start && d <= end;
                    }
                }
                return false;
            });

            // 4. Cancelled (Activity Based) - Fallback to updatedAt if cancelledAt missing
            cancelledOrders = allOrders.filter(o => {
                if (o.status === 'Cancelled') {
                    const dStr = (o.cancellationInfo && o.cancellationInfo.cancelledAt) || o.updatedAt || o.timestamp;
                    const d = new Date(dStr);
                    return d >= start && d <= end;
                }
                return false;
            });

            // 5. On Hold (Activity Based)
            onHoldOrders = allOrders.filter(o => {
                if (o.status === 'On Hold') {
                    const dStr = (o.holdDetails && o.holdDetails.holdAt) || o.updatedAt || o.timestamp;
                    const d = new Date(dStr);
                    return d >= start && d <= end;
                }
                return false;
            });

            // 6. Pending & Verified (Usually concerned with current state created in range)
            // Or strictly current status? Let's use current status of created orders for these.
            pendingOrders = createdOrders.filter(o => o.status === 'Pending');
            verifiedOrders = createdOrders.filter(o => o.status === 'Address Verified');

        } else {
            // Default: All Time / Current Snapshot
            createdOrders = allOrders;
            deliveredOrders = allOrders.filter(o => o.status === 'Delivered');
            dispatchedOrders = allOrders.filter(o => o.status === 'Dispatched'); // Note: This only counts CURRENTLY dispatched. 
            // Ideally 'dispatched' should include delivered too for "Total Dispatched", but preserving legacy behavior logic for 'snapshot'.
            // Actually, for consistency, let's keep it simple: Status === 'Dispatched'.
            // Wait, previous logic was just filter by status. 

            cancelledOrders = allOrders.filter(o => o.status === 'Cancelled');
            onHoldOrders = allOrders.filter(o => o.status === 'On Hold');
            pendingOrders = allOrders.filter(o => o.status === 'Pending');
            verifiedOrders = allOrders.filter(o => o.status === 'Address Verified');
        }

        const departments = await dataAccess.getAllDepartments();
        let totalEmployees = 0;
        departments.forEach(d => {
            if (d.employees) totalEmployees += Object.keys(d.employees).length;
        });

        const now = new Date();
        const thisMonth = allOrders.filter(o => {
            const orderDate = new Date(o.timestamp);
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        });

        // Calculate Revenue from Created Orders (Standard)
        // Calculate Fresh vs Re-order (from Created Orders for consistency with Total Orders)
        let totalFresh = 0, totalReorder = 0;
        let freshRevenue = 0, reorderRevenue = 0;

        createdOrders.forEach(o => {
            if (!o.orderType) return;
            // Handle both old format (NEW, REORDER) and new format (Fresh, Reorder)
            const isReorder = o.orderType === 'Reorder' || o.orderType === 'REORDER';
            const orderTotal = o.total || 0;

            if (isReorder) {
                totalReorder++;
                reorderRevenue += orderTotal;
            } else {
                totalFresh++;
                freshRevenue += orderTotal;
            }
        });

        // Helper for status revenue (using the specific lists)
        const calcRev = (list) => {
            let fresh = 0, reorder = 0;
            list.forEach(o => {
                if (!o.orderType) return;
                const isReorder = o.orderType === 'Reorder' || o.orderType === 'REORDER';
                if (isReorder) reorder += (o.total || 0);
                else fresh += (o.total || 0);
            });
            return { fresh, reorder };
        };

        const pendingRev = calcRev(pendingOrders);
        const verifiedRev = calcRev(verifiedOrders);
        const dispatchedRev = calcRev(dispatchedOrders);
        const deliveredRev = calcRev(deliveredOrders);

        res.json({
            success: true,
            stats: {
                totalOrders: createdOrders.length,
                totalFresh,
                totalReorder,
                freshRevenue,
                reorderRevenue,
                pendingOrders: pendingOrders.length,
                pendingFresh: pendingOrders.filter(o => (o.orderType !== 'Reorder' && o.orderType !== 'REORDER')).length, // approx
                pendingReorder: pendingOrders.filter(o => (o.orderType === 'Reorder' || o.orderType === 'REORDER')).length, // approx
                pendingFreshRevenue: pendingRev.fresh,
                pendingReorderRevenue: pendingRev.reorder,
                verifiedOrders: verifiedOrders.length,
                verifiedFreshRevenue: verifiedRev.fresh,
                verifiedReorderRevenue: verifiedRev.reorder,
                dispatchedOrders: dispatchedOrders.length,
                dispatchedFreshRevenue: dispatchedRev.fresh,
                dispatchedReorderRevenue: dispatchedRev.reorder,
                deliveredOrders: deliveredOrders.length,
                deliveredFreshRevenue: deliveredRev.fresh,
                deliveredReorderRevenue: deliveredRev.reorder,
                cancelledOrders: cancelledOrders.length,
                onHoldOrders: onHoldOrders.length,
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
