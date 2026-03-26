// MongoDB Data Access Layer
// This module provides functions to interact with MongoDB collections
// Falls back to JSON files if MongoDB is not connected
// NOW WITH IN-MEMORY CACHING FOR PERFORMANCE

const path = require('path');
const fs = require('fs').promises; // Use promises for async file ops
const { Order, Department, ShiprocketConfig } = require('./models');
const { readJSON: readJSONFile, writeJSONAsync: writeJSONFileAsync } = require('./utils/fileHelpers');

// Track MongoDB connection status
let mongoConnected = false;

// IN-MEMORY CACHE
const cache = {
    orders: null, // Array of orders
    departments: null, // Object of departments
    shiprocketConfig: null,
    lastRefreshed: {
        orders: 0,
        departments: 0,
        shiprocketConfig: 0
    }
};

const CACHE_TTL = 0; // 0 = Infinite for this session (files update via this process only)

function setMongoStatus(status) {
    mongoConnected = status;
}

function getMongoStatus() {
    return mongoConnected;
}

// ==================== CACHE HELPERS ====================

function loadCache(key, filePath, defaultValue) {
    if (mongoConnected) return null;

    if (cache[key] === null) {
        console.log(`[CACHE] Loading ${key} from disk...`);
        try {
            cache[key] = readJSONFile(filePath, defaultValue);
        } catch (e) {
            console.error(`[CACHE] Error loading ${key}:`, e);
            cache[key] = defaultValue;
        }
    }
    return cache[key];
}

function updateCacheAndDisk(key, filePath, data) {
    if (mongoConnected) return;

    cache[key] = data;
    // Write asynchronously to avoid blocking the event loop
    // Using fire-and-forget for performance, but logging errors
    writeJSONFileAsync(filePath, data).catch(err => console.error(`[DISK] Write failed for ${key}:`, err));
}


// ==================== DEPARTMENTS ====================

async function getDepartment(departmentId) {
    if (mongoConnected) {
        return await Department.findOne({ departmentId }).lean();
    }
    // Fallback to JSON (Cached)
    const depts = loadCache('departments', path.join(__dirname, 'data', 'departments.json'), {});
    return depts[departmentId] ? {
        departmentId,
        ...depts[departmentId],
        employees: depts[departmentId].employees || {}
    } : null;
}

async function getAllDepartments() {
    if (mongoConnected) {
        return await Department.find({}).lean();
    }
    // Fallback to JSON (Cached)
    const depts = loadCache('departments', path.join(__dirname, 'data', 'departments.json'), {});
    return Object.entries(depts).map(([id, data]) => ({
        departmentId: id,
        ...data
    }));
}

async function createDepartment(departmentId, departmentName, password, departmentType) {
    if (mongoConnected) {
        const dept = new Department({
            departmentId,
            departmentName,
            password,
            departmentType,
            employees: {},
            createdAt: new Date().toISOString()
        });
        return await dept.save();
    }
    // Fallback to JSON
    const depts = loadCache('departments', path.join(__dirname, 'data', 'departments.json'), {});
    depts[departmentId] = {
        name: departmentName,
        password,
        type: departmentType,
        employees: {}
    };
    updateCacheAndDisk('departments', path.join(__dirname, 'data', 'departments.json'), depts);
    return { departmentId, ...depts[departmentId] };
}

async function updateDepartment(departmentId, updates) {
    if (mongoConnected) {
        return await Department.findOneAndUpdate(
            { departmentId },
            updates,
            { new: true }
        );
    }
    // Fallback to JSON
    const depts = loadCache('departments', path.join(__dirname, 'data', 'departments.json'), {});
    if (depts[departmentId]) {
        depts[departmentId] = { ...depts[departmentId], ...updates };
        updateCacheAndDisk('departments', path.join(__dirname, 'data', 'departments.json'), depts);
        return { departmentId, ...depts[departmentId] };
    }
    return null;
}

async function deleteDepartment(departmentId) {
    if (mongoConnected) {
        return await Department.findOneAndDelete({ departmentId });
    }
    // Fallback to JSON
    const depts = loadCache('departments', path.join(__dirname, 'data', 'departments.json'), {});
    if (depts[departmentId]) {
        delete depts[departmentId];
        updateCacheAndDisk('departments', path.join(__dirname, 'data', 'departments.json'), depts);
        return true;
    }
    return false;
}

// ==================== ORDERS ====================

// Pagination Support
// Pagination Support with Date Range
async function getAllOrders(page = 1, limit = 0, startDate = null, endDate = null) {
    // Date Filter Construction
    let dateQuery = {};
    if (startDate || endDate) {
        dateQuery.timestamp = {};
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            dateQuery.timestamp.$gte = start.toISOString();
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateQuery.timestamp.$lte = end.toISOString();
        }
    }

    if (mongoConnected) {
        let query = {};
        if (Object.keys(dateQuery).length > 0) Object.assign(query, dateQuery);

        if (limit > 0) {
            const skip = (page - 1) * limit;
            const orders = await Order.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean();
            const total = await Order.countDocuments(query);
            return { orders, total };
        }
        // Legacy/Export: Return array directly
        return await Order.find(query).sort({ timestamp: -1 }).lean();
    }
    // Fallback to JSON (Cached)
    let orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);

    // Date Filtering for JSON
    if (startDate || endDate) {
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

        orders = orders.filter(o => {
            const oDate = new Date(o.timestamp).getTime();
            if (start && oDate < start) return false;
            if (end && oDate > end) return false;
            return true;
        });
    }

    if (limit > 0) {
        // Sort first if needed, though JSON implies chronological usually. 
        // For consistency let's sort descenting by timestamp
        orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const total = orders.length;
        const start = (page - 1) * limit;
        const sliced = orders.slice(start, start + limit);
        return { orders: sliced, total };
    }
    return orders;
}

async function getOrderById(orderId) {
    if (mongoConnected) {
        return await Order.findOne({ orderId }).lean();
    }
    // Fallback to JSON
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    return orders.find(o => o.orderId === orderId);
}

// Optimized: Use MongoDB Aggregation for Dashboard Stats
async function getDashboardStats(startDate = null, endDate = null) {
    if (!mongoConnected) {
        // Fallback to simpler (but potentially slow) JSON stats if needed
        // For now, let's keep it simple as MongoDB is the primary target
        return null;
    }

    let dateQuery = {};
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.timestamp = { $gte: start.toISOString(), $lte: end.toISOString() };
    }

    try {
        const isReorder = { $in: ["$orderType", ["Reorder", "REORDER"]] };
        const isFresh = { $not: [{ $in: ["$orderType", ["Reorder", "REORDER"]] }] };

        const stats = await Order.aggregate([
            { $match: dateQuery },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalFresh: { $sum: { $cond: [isFresh, 1, 0] } },
                    totalReorder: { $sum: { $cond: [isReorder, 1, 0] } },
                    freshRevenue: { $sum: { $cond: [isFresh, { $ifNull: ["$total", 0] }, 0] } },
                    reorderRevenue: { $sum: { $cond: [isReorder, { $ifNull: ["$total", 0] }, 0] } },
                    
                    pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                    pendingFresh: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "Pending"] }, isFresh] }, 1, 0] } },
                    pendingReorder: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "Pending"] }, isReorder] }, 1, 0] } },
                    pendingFreshRevenue: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "Pending"] }, isFresh] }, { $ifNull: ["$total", 0] }, 0] } },
                    pendingReorderRevenue: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "Pending"] }, isReorder] }, { $ifNull: ["$total", 0] }, 0] } },

                    verifiedOrders: { $sum: { $cond: [{ $in: ["$status", ["Address Verified", "Verified"]] }, 1, 0] } },
                    verifiedFreshRevenue: { $sum: { $cond: [{ $and: [{ $in: ["$status", ["Address Verified", "Verified"]] }, isFresh] }, { $ifNull: ["$total", 0] }, 0] } },
                    verifiedReorderRevenue: { $sum: { $cond: [{ $and: [{ $in: ["$status", ["Address Verified", "Verified"]] }, isReorder] }, { $ifNull: ["$total", 0] }, 0] } },

                    dispatchedOrders: { $sum: { $cond: [{ $eq: ["$status", "Dispatched"] }, 1, 0] } },
                    dispatchedFreshRevenue: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "Dispatched"] }, isFresh] }, { $ifNull: ["$total", 0] }, 0] } },
                    dispatchedReorderRevenue: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "Dispatched"] }, isReorder] }, { $ifNull: ["$total", 0] }, 0] } },

                    deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
                    deliveredFreshRevenue: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "Delivered"] }, isFresh] }, { $ifNull: ["$total", 0] }, 0] } },
                    deliveredReorderRevenue: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "Delivered"] }, isReorder] }, { $ifNull: ["$total", 0] }, 0] } },

                    cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } },
                    onHoldOrders: { $sum: { $cond: [{ $eq: ["$status", "On Hold"] }, 1, 0] } }
                }
            }
        ]);

        return stats[0] || {
            totalOrders: 0, totalFresh: 0, totalReorder: 0, freshRevenue: 0, reorderRevenue: 0,
            pendingOrders: 0, pendingFresh: 0, pendingReorder: 0, pendingFreshRevenue: 0, pendingReorderRevenue: 0,
            verifiedOrders: 0, verifiedFreshRevenue: 0, verifiedReorderRevenue: 0,
            dispatchedOrders: 0, dispatchedFreshRevenue: 0, dispatchedReorderRevenue: 0,
            deliveredOrders: 0, deliveredFreshRevenue: 0, deliveredReorderRevenue: 0,
            cancelledOrders: 0, onHoldOrders: 0
        };
    } catch (e) {
        console.error('❌ Aggregation error:', e);
        return null;
    }
}

// Optimized: Get full analytics data using MongoDB Aggregation
async function getAnalyticsDashboardData(startDate, endDate, employeeId = null) {
    if (!mongoConnected) return null;

    // 1. Date range for "Created in period"
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const startISO = start.toISOString();
    const endISO = end.toISOString();

    try {
        const isReorder = { $in: ["$orderType", ["Reorder", "REORDER"]] };
        const isFresh = { $not: [{ $in: ["$orderType", ["Reorder", "REORDER"]] }] };

        // Match for orders CREATED in range
        let baseMatch = { timestamp: { $gte: startISO, $lte: endISO } };
        if (employeeId && employeeId !== 'all' && employeeId !== '') {
            baseMatch.employeeId = employeeId.toUpperCase();
        }

        const results = await Order.aggregate([
            {
                $facet: {
                    // Quick Stats & distribution based on CREATED orders
                    "createdStats": [
                        { $match: baseMatch },
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                totalRevenue: { $sum: { $ifNull: ["$total", 0] } },
                                freshRevenue: { $sum: { $cond: [isFresh, { $ifNull: ["$total", 0] }, 0] } },
                                reorderRevenue: { $sum: { $cond: [isReorder, { $ifNull: ["$total", 0] }, 0] } },
                                freshCount: { $sum: { $cond: [isFresh, 1, 0] } },
                                reorderCount: { $sum: { $cond: [isReorder, 1, 0] } },
                                deliveredCount: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
                                pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                                verified: { $sum: { $cond: [{ $eq: ["$status", "Address Verified"] }, 1, 0] } },
                                customers: { $addToSet: "$telNo" }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalOrders: 1, totalRevenue: 1, freshRevenue: 1, reorderRevenue: 1,
                                freshCount: 1, reorderCount: 1, deliveredCount: 1, pending: 1, verified: 1,
                                customersCount: { $size: { $ifNull: ["$customers", []] } }
                            }
                        }
                    ],
                    // Delivered in Period (Regardless of creation)
                    "deliveredStats": [
                        {
                            $match: {
                                status: "Delivered",
                                deliveredAt: { $gte: startISO, $lte: endISO },
                                ...(employeeId && employeeId !== 'all' && employeeId !== '' ? { employeeId: employeeId.toUpperCase() } : {})
                            }
                        },
                        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$total", 0] } } } }
                    ],
                    // Dispatched in Period
                    "dispatchedStats": [
                        {
                            $match: {
                                status: { $in: ["Dispatched", "Delivered", "RTO", "Out For Delivery"] },
                                dispatchedAt: { $gte: startISO, $lte: endISO },
                                ...(employeeId && employeeId !== 'all' && employeeId !== '' ? { employeeId: employeeId.toUpperCase() } : {})
                            }
                        },
                        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$total", 0] } } } }
                    ],
                    // Cancelled in Period
                    "cancelledStats": [
                        {
                            $match: {
                                status: "Cancelled",
                                "cancellationInfo.cancelledAt": { $gte: start, $lte: end },
                                ...(employeeId && employeeId !== 'all' && employeeId !== '' ? { employeeId: employeeId.toUpperCase() } : {})
                            }
                        },
                        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$total", 0] } } } }
                    ],
                    // Hold Orders (Booked in period)
                    "holdStats": [
                        {
                            $match: {
                                status: { $in: ["Hold", "On Hold"] },
                                timestamp: { $gte: startISO, $lte: endISO },
                                ...(employeeId && employeeId !== 'all' && employeeId !== '' ? { employeeId: employeeId.toUpperCase() } : {})
                            }
                        },
                        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$total", 0] } } } }
                    ],
                    // RTO in Period
                    "rtoStats": [
                        {
                            $match: {
                                status: "RTO",
                                rtoAt: { $gte: startISO, $lte: endISO },
                                ...(employeeId && employeeId !== 'all' && employeeId !== '' ? { employeeId: employeeId.toUpperCase() } : {})
                            }
                        },
                        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$total", 0] } } } }
                    ],
                    // Top Employees (Full per-status breakdown for leaderboard)
                    "employeePerformance": [
                        { $match: baseMatch },
                        {
                            $group: {
                                _id: "$employeeId",
                                name: { $first: { $ifNull: ["$employee", "$employeeId"] } },
                                total: { $sum: 1 },
                                revenue: { $sum: { $ifNull: ["$total", 0] } },
                                hold: { $sum: { $cond: [{ $in: ["$status", ["Hold", "On Hold"]] }, 1, 0] } },
                                holdRev: { $sum: { $cond: [{ $in: ["$status", ["Hold", "On Hold"]] }, { $ifNull: ["$total", 0] }, 0] } },
                                dispatched: { $sum: { $cond: [{ $in: ["$status", ["Dispatched", "Out For Delivery"]] }, 1, 0] } },
                                dispatchedRev: { $sum: { $cond: [{ $in: ["$status", ["Dispatched", "Out For Delivery"]] }, { $ifNull: ["$total", 0] }, 0] } },
                                delivered: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
                                deliveredRev: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, { $ifNull: ["$total", 0] }, 0] } },
                                rto: { $sum: { $cond: [{ $eq: ["$status", "RTO"] }, 1, 0] } },
                                rtoRev: { $sum: { $cond: [{ $eq: ["$status", "RTO"] }, { $ifNull: ["$total", 0] }, 0] } },
                                cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } },
                                cancelledRev: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, { $ifNull: ["$total", 0] }, 0] } }
                            }
                        },
                        { $addFields: { id: "$_id" } },
                        { $sort: { revenue: -1 } },
                        { $limit: 10 }
                    ],
                    // City Distribution
                    "cityDistribution": [
                        { $match: baseMatch },
                        {
                            $group: {
                                _id: { $toUpper: { $trim: { input: { $ifNull: ["$city", "$distt"] } } } },
                                count: { $sum: 1 }
                            }
                        },
                        { $match: { _id: { $nin: [null, "", "SAME", "NA", "N/A", "NULL"] } } },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    // 7-Day Timeline trend
                    "timeline": [
                        {
                            $match: {
                                timestamp: { $gte: startISO, $lte: endISO },
                                ...(employeeId && employeeId !== 'all' && employeeId !== '' ? { employeeId: employeeId.toUpperCase() } : {})
                            }
                        },
                        {
                            $group: {
                                _id: { $substr: ["$timestamp", 0, 10] },
                                total: { $sum: 1 },
                                revenue: { $sum: { $ifNull: ["$total", 0] } },
                                delivered: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
                                cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ]);

        if (!results || results.length === 0) return null;
        const data = results[0];

        return {
            created: data.createdStats[0] || { totalOrders: 0, totalRevenue: 0, customersCount: 0, deliveredCount: 0, pending: 0, verified: 0, freshRevenue: 0, reorderRevenue: 0, freshCount: 0, reorderCount: 0 },
            delivered: data.deliveredStats[0] || { count: 0, revenue: 0 },
            dispatched: data.dispatchedStats[0] || { count: 0, revenue: 0 },
            cancelled: data.cancelledStats[0] || { count: 0, revenue: 0 },
            hold: data.holdStats[0] || { count: 0, revenue: 0 },
            rto: data.rtoStats[0] || { count: 0, revenue: 0 },
            employees: data.employeePerformance || [],
            cities: data.cityDistribution || [],
            timeline: data.timeline || []
        };
    } catch (e) {
        console.error('❌ Aggregation error:', e);
        return null;
    }
}

// Optimized: Find stuck orders directly in DB
async function getStuckOrders(thresholdHours = 48) {
    if (!mongoConnected) return { success: false, message: 'DB not connected' };

    try {
        const threshold = thresholdHours * 60 * 60 * 1000;
        const cutoff = new Date(Date.now() - threshold);
        const cutoffISO = cutoff.toISOString();

        // Optimized query: Only non-final states, older than threshold
        // We check both updatedAt and timestamp (if updatedAt missing)
        const stuckOrders = await Order.find({
            status: { $nin: ['Delivered', 'Cancelled'] },
            $or: [
                { updatedAt: { $lt: cutoffISO } },
                { updatedAt: { $exists: false }, timestamp: { $lt: cutoffISO } }
            ]
        }).select('orderId customerName total status updatedAt timestamp').lean();

        const byStatus = {};
        stuckOrders.forEach(o => {
            if (!byStatus[o.status]) byStatus[o.status] = [];
            const lastUpdate = o.updatedAt || o.timestamp;
            const hoursStuck = Math.floor((Date.now() - new Date(lastUpdate)) / (3600000));
            byStatus[o.status].push({
                orderId: o.orderId,
                customerName: o.customerName,
                total: o.total,
                lastUpdate,
                hoursStuck
            });
        });

        return {
            success: true,
            totalStuck: stuckOrders.length,
            byStatus,
            alert: stuckOrders.length > 0
        };
    } catch (e) {
        console.error('❌ Stuck orders query error:', e);
        return { success: false, message: e.message };
    }
}

// Legacy wrapper or for specific date ranges
async function getOrdersForStats(startDate, endDate) {
    if (!startDate || !endDate) return await getAllOrders();
    // Implementation can be simple find since it's used for exports/logs mostly now
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
    return await Order.find({ timestamp: { $gte: start.toISOString(), $lte: end.toISOString() } }).lean();
}

// Optimized: Filter in memory with Pagination and Date Range
async function getOrdersByStatus(status, page = 1, limit = 0, startDate = null, endDate = null) {
    // Map status to its corresponding date field
    const statusDateFieldMap = {
        'Pending': 'timestamp',
        'Address Verified': 'verifiedAt',
        'Dispatched': 'dispatchedAt',
        'Out For Delivery': 'ofdAt',
        'Delivered': 'deliveredAt',
        'Cancelled': 'cancellationInfo.cancelledAt',
        'On Hold': 'holdDetails.holdAt',
        'RTO': 'rtoAt'
    };
    const dateField = statusDateFieldMap[status] || 'timestamp';

    // Date Filter Construction
    let dateQuery = { status: status };
    if (startDate || endDate) {
        if (startDate === endDate && startDate) {
            // Optimization for single day search (Today/Yesterday)
            // Use Regex to match start of ISO string: ^2026-02-09
            dateQuery[dateField] = { $regex: `^${startDate}` };
        } else {
            dateQuery[dateField] = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                dateQuery[dateField].$gte = start.toISOString();
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateQuery[dateField].$lte = end.toISOString();
            }
        }
    }

    if (mongoConnected) {
        // Use status as-is - MongoDB has proper case: 'Pending', 'Address Verified', etc.
        if (limit > 0) {
            const skip = (page - 1) * limit;
            const orders = await Order.find(dateQuery).sort({ [dateField]: -1 }).skip(skip).limit(limit).lean();
            const total = await Order.countDocuments(dateQuery);
            return { orders, total };
        }
        return await Order.find(dateQuery).sort({ [dateField]: -1 }).lean();
    }
    // Fallback to JSON
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    // Simple in-memory filter
    let filtered = orders.filter(o => o.status === status);

    // Date Filtering for JSON
    if (startDate || endDate) {
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

        filtered = filtered.filter(o => {
            // Support nested fields like cancellationInfo.cancelledAt
            let dateValue;
            if (dateField.includes('.')) {
                const parts = dateField.split('.');
                dateValue = o[parts[0]] ? o[parts[0]][parts[1]] : null;
            } else {
                dateValue = o[dateField];
            }

            if (!dateValue) return false;

            const oDate = new Date(dateValue).getTime();
            if (start && oDate < start) return false;
            if (end && oDate > end) return false;
            return true;
        });
    }

    if (limit > 0) {
        filtered.sort((a, b) => {
            let valA, valB;
            if (dateField.includes('.')) {
                const parts = dateField.split('.');
                valA = a[parts[0]] ? a[parts[0]][parts[1]] : null;
                valB = b[parts[0]] ? b[parts[0]][parts[1]] : null;
            } else {
                valA = a[dateField];
                valB = b[dateField];
            }
            return new Date(valB || 0) - new Date(valA || 0);
        });
        const total = filtered.length;
        const start = (page - 1) * limit;
        const sliced = filtered.slice(start, start + limit);
        return { orders: sliced, total };
    }
    return filtered;
}

// Fast duplicate check - direct database query (INSTANT)
async function findOrderByMobile(telNo) {
    if (mongoConnected) {
        // Direct MongoDB query - very fast with index
        return await Order.findOne({
            $or: [{ telNo: telNo }, { mobileNumber: telNo }],
            status: { $ne: 'Cancelled' }
        }).sort({ timestamp: -1 }).lean();
    }
    // Fallback to JSON
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    // Optimized: find instead of filter + sort
    // But we need the LATEST one... JSON is usually appended, so searching from end might be faster,
    // but standard find works from start.
    // Let's stick to existing logic but using cached array.
    const filtered = orders.filter(o =>
        (o.telNo === telNo || o.mobileNumber === telNo) && o.status !== 'Cancelled'
    );
    // Sort logic preserved from original
    return filtered.length > 0 ? filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] : null;
}


async function createOrder(orderData) {
    if (mongoConnected) {
        const order = new Order(orderData);
        return await order.save();
    }
    // Fallback to JSON
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    orders.push(orderData);
    updateCacheAndDisk('orders', path.join(__dirname, 'data', 'orders.json'), orders);
    return orderData;
}

async function updateOrder(orderId, updates) {
    if (mongoConnected) {
        return await Order.findOneAndUpdate(
            { orderId },
            updates,
            { new: true }
        );
    }
    // Fallback to JSON
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    const index = orders.findIndex(o => o.orderId === orderId);
    if (index !== -1) {
        orders[index] = { ...orders[index], ...updates };
        updateCacheAndDisk('orders', path.join(__dirname, 'data', 'orders.json'), orders);
        return orders[index];
    }
    return null;
}

async function deleteOrder(orderId) {
    if (mongoConnected) {
        // Try exact match first
        let result = await Order.findOneAndDelete({ orderId });
        if (!result) {
            // Try with decoded or trimmed version if exact match fails
            const decodedId = decodeURIComponent(orderId).trim();
            result = await Order.findOneAndDelete({
                $or: [{ orderId: decodedId }, { orderId: orderId.trim() }]
            });
        }
        return result;
    }
    // Fallback to JSON
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    const index = orders.findIndex(o => o.orderId === orderId || o.orderId === decodeURIComponent(orderId).trim());
    if (index !== -1) {
        orders.splice(index, 1);
        updateCacheAndDisk('orders', path.join(__dirname, 'data', 'orders.json'), orders);
        return true;
    }
    return false;
}

async function updateEmployeeOrders(oldId, newId, newName) {
    const updates = {};
    if (newId) updates.employeeId = newId;
    if (newName) updates.employee = newName;

    if (Object.keys(updates).length === 0) return;

    if (mongoConnected) {
        return await Order.updateMany({ employeeId: oldId }, { $set: updates });
    }

    // Fallback to JSON
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    let modified = false;
    orders.forEach(order => {
        if (order.employeeId === oldId) {
            if (newId) order.employeeId = newId;
            if (newName) order.employee = newName;
            modified = true;
        }
    });
    if (modified) {
        updateCacheAndDisk('orders', path.join(__dirname, 'data', 'orders.json'), orders);
    }
    return { modifiedCount: orders.filter(o => o.employeeId === (newId || oldId)).length };
}

// ==================== SHIPROCKET CONFIG ====================

async function getShiprocketConfig() {
    if (mongoConnected) {
        let config = await ShiprocketConfig.findOne({ configId: 'main' });
        if (!config) {
            // Create default if not exists
            config = new ShiprocketConfig({
                configId: 'main',
                enabled: true,
                apiEmail: process.env.SHIPROCKET_API_EMAIL || '',
                apiPassword: process.env.SHIPROCKET_API_PASSWORD || '',
                shiprocketOrderCounter: 7417
            });
            await config.save();
        }
        return config;
    }
    // Fallback to JSON
    return loadCache('shiprocketConfig', path.join(__dirname, 'data', 'shiprocket_config.json'), {
        enabled: false,
        apiEmail: '',
        apiPassword: '',
        shiprocketOrderCounter: 7417
    });
}

async function updateShiprocketConfig(updates) {
    if (mongoConnected) {
        return await ShiprocketConfig.findOneAndUpdate(
            { configId: 'main' },
            updates,
            { new: true, upsert: true }
        );
    }
    // Fallback to JSON
    const config = loadCache('shiprocketConfig', path.join(__dirname, 'data', 'shiprocket_config.json'), {});
    const updated = { ...config, ...updates };
    updateCacheAndDisk('shiprocketConfig', path.join(__dirname, 'data', 'shiprocket_config.json'), updated);
    return updated;
}

// Optimized Employee Order Fetch with Date Range
async function getEmployeeOrders(empId, status = null, page = 1, limit = 0, startDate = null, endDate = null) {
    empId = empId.toUpperCase();

    // Check if status is multiple (comma separated)
    let statusFilter = null;
    if (status) {
        if (status.includes(',')) {
            statusFilter = { $in: status.split(',').map(s => s.trim()) };
        } else {
            statusFilter = status;
        }
    }

    // Date Filter Construction
    let dateQuery = {};
    if (startDate || endDate) {
        dateQuery.timestamp = {};
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            dateQuery.timestamp.$gte = start.toISOString();
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateQuery.timestamp.$lte = end.toISOString();
        }
    }

    if (mongoConnected) {
        const query = { employeeId: empId };
        if (statusFilter) query.status = statusFilter;
        if (Object.keys(dateQuery).length > 0) Object.assign(query, dateQuery);

        if (limit > 0) {
            const skip = (page - 1) * limit;
            const orders = await Order.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean();
            const total = await Order.countDocuments(query);
            return { orders, total };
        }
        return await Order.find(query).sort({ timestamp: -1 }).lean();
    }

    // JSON Fallback
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    let filtered = orders.filter(o => o.employeeId === empId);

    if (status) {
        const statuses = status.split(',').map(s => s.trim());
        filtered = filtered.filter(o => statuses.includes(o.status));
    }

    // Date Filtering for JSON
    if (startDate || endDate) {
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

        filtered = filtered.filter(o => {
            const oDate = new Date(o.timestamp).getTime();
            if (start && oDate < start) return false;
            if (end && oDate > end) return false;
            return true;
        });
    }

    if (limit > 0) {
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const total = filtered.length;
        const start = (page - 1) * limit;
        const sliced = filtered.slice(start, start + limit);
        return { orders: sliced, total };
    }
    return filtered;
}

// Note: Using centralized fileHelpers module
// readJSONFile and writeJSONFileAsync are imported from utils/fileHelpers

module.exports = {
    setMongoStatus,
    getMongoStatus,
    // Departments
    getDepartment,
    getAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    // Orders
    getAllOrders,
    getOrderById,
    getOrdersByStatus,
    getOrdersForStats,
    getDashboardStats,
    findOrderByMobile,
    createOrder,
    updateOrder,
    deleteOrder,
    updateEmployeeOrders,
    getEmployeeOrders,
    getAnalyticsDashboardData,
    getStuckOrders,
    // Shiprocket
    getShiprocketConfig,
    updateShiprocketConfig,
    // Export Data Models for direct queries
    Order
};
