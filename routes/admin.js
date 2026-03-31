const express = require('express');
const router = express.Router();
const path = require('path');
const dataAccess = require('../dataAccess');
const { readJSON } = require('../utils/fileHelpers');

const DATA_DIR = path.join(__dirname, '../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const REPORT_TIMEZONE = 'Asia/Kolkata';
const REPORT_OFFSET = '+05:30';
const REPORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

// Note: Using centralized fileHelpers module for JSON operations

function getNestedValue(record, dottedPath) {
    return String(dottedPath || '')
        .split('.')
        .filter(Boolean)
        .reduce((value, key) => (value && value[key] !== undefined ? value[key] : undefined), record);
}

function parseInventoryBoundary(dateText, endOfDay = false) {
    if (!dateText) return null;
    return new Date(`${dateText}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}${REPORT_OFFSET}`);
}

function formatInventoryDay(dateValue) {
    if (!dateValue) return null;
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return REPORT_DATE_FORMATTER.format(parsed);
}

function normalizeInventoryItemName(name) {
    return String(name || '').replace(/\s+/g, ' ').trim();
}

function extractInventoryItems(rawItems) {
    const items = [];

    const pushItem = (name, quantity) => {
        const normalizedName = normalizeInventoryItemName(name);
        if (!normalizedName) return;

        const parsedQty = Number.parseInt(quantity, 10);
        items.push({
            name: normalizedName,
            quantity: Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1
        });
    };

    if (Array.isArray(rawItems)) {
        rawItems.forEach((item) => {
            if (typeof item === 'string') {
                item.split(',').map((part) => part.trim()).filter(Boolean).forEach((part) => pushItem(part, 1));
                return;
            }

            if (item && typeof item === 'object') {
                pushItem(item.product || item.description || item.name || 'Unknown', item.quantity ?? item.qty ?? 1);
            }
        });
    } else if (typeof rawItems === 'string') {
        rawItems.split(',').map((part) => part.trim()).filter(Boolean).forEach((part) => pushItem(part, 1));
    }

    return items;
}

function summarizeInventoryOrders(orders, dateField) {
    const dailyMap = new Map();
    const productMap = new Map();
    let processedOrders = 0;
    let totalUnits = 0;
    let emptyItemOrders = 0;

    orders.forEach((order, index) => {
        const effectiveDate = getNestedValue(order, dateField) || order.timestamp;
        const dayKey = formatInventoryDay(effectiveDate);
        if (!dayKey) return;

        processedOrders += 1;
        const orderKey = order.orderId || `order-${dayKey}-${index}`;
        const items = extractInventoryItems(order.items);

        if (!dailyMap.has(dayKey)) {
            dailyMap.set(dayKey, {
                date: dayKey,
                ordersCount: 0,
                totalUnits: 0,
                products: new Map()
            });
        }

        const dailyRecord = dailyMap.get(dayKey);
        dailyRecord.ordersCount += 1;

        if (items.length === 0) {
            emptyItemOrders += 1;
            return;
        }

        items.forEach((item) => {
            totalUnits += item.quantity;
            dailyRecord.totalUnits += item.quantity;

            const dailyKey = item.name.toLowerCase();
            if (!dailyRecord.products.has(dailyKey)) {
                dailyRecord.products.set(dailyKey, {
                    name: item.name,
                    quantity: 0,
                    orderIds: new Set()
                });
            }

            const dailyProduct = dailyRecord.products.get(dailyKey);
            dailyProduct.quantity += item.quantity;
            dailyProduct.orderIds.add(orderKey);

            if (!productMap.has(dailyKey)) {
                productMap.set(dailyKey, {
                    name: item.name,
                    quantity: 0,
                    orderIds: new Set()
                });
            }

            const totalProduct = productMap.get(dailyKey);
            totalProduct.quantity += item.quantity;
            totalProduct.orderIds.add(orderKey);
        });
    });

    const daily = Array.from(dailyMap.values())
        .map((entry) => {
            const products = Array.from(entry.products.values())
                .map((product) => ({
                    name: product.name,
                    quantity: product.quantity,
                    orderCount: product.orderIds.size
                }))
                .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));

            return {
                date: entry.date,
                ordersCount: entry.ordersCount,
                totalUnits: entry.totalUnits,
                uniqueProducts: products.length,
                topProducts: products.slice(0, 3),
                products
            };
        })
        .sort((a, b) => b.date.localeCompare(a.date));

    const products = Array.from(productMap.values())
        .map((product) => ({
            name: product.name,
            quantity: product.quantity,
            orderCount: product.orderIds.size
        }))
        .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));

    return {
        summary: {
            totalOrders: processedOrders,
            totalUnits,
            activeDays: daily.length,
            uniqueProducts: products.length,
            emptyItemOrders
        },
        daily,
        products
    };
}

async function fetchInventoryOrders(config, startDate, endDate) {
    const start = parseInventoryBoundary(startDate, false);
    const end = parseInventoryBoundary(endDate, true);

    if (!start || !end) {
        return [];
    }

    if (dataAccess.getMongoStatus()) {
        return await dataAccess.Order.find({
            status: { $in: config.statuses },
            [config.dateField]: {
                $gte: start.toISOString(),
                $lte: end.toISOString()
            }
        }).sort({ [config.dateField]: -1 }).lean();
    }

    const orders = readJSON(ORDERS_FILE, []);
    return orders.filter((order) => {
        if (!config.statuses.includes(order.status)) return false;

        const effectiveDate = getNestedValue(order, config.dateField) || order.timestamp;
        const parsed = new Date(effectiveDate);
        if (Number.isNaN(parsed.getTime())) return false;

        return parsed >= start && parsed <= end;
    });
}

// Get Order History (with filters)
router.get('/history', async (req, res) => {
    try {
        const parsedPage = parseInt(req.query.page, 10);
        const parsedLimit = parseInt(req.query.limit, 10);
        const page = Number.isNaN(parsedPage) ? 1 : parsedPage;
        const limit = Number.isNaN(parsedLimit) ? 50 : parsedLimit;
        const startDate = req.query.startDate || req.query.date || null;
        const endDate = req.query.endDate || req.query.date || null;
        let orders = [], total = 0;

        // Employee filter → dedicated function use karo
        if (req.query.employee) {
            const result = await dataAccess.getEmployeeOrders(
                req.query.employee,
                req.query.status || null,
                page, limit,
                startDate, endDate
            );
            orders = result.orders || result;
            total = result.total || orders.length;
        } else if (req.query.status) {
            const result = await dataAccess.getOrdersByStatus(
                req.query.status, page, limit,
                startDate, endDate
            );
            orders = result.orders || result;
            total = result.total || orders.length;
        } else {
            const result = await dataAccess.getAllOrders(
                page, limit,
                startDate, endDate
            );
            orders = result.orders || result;
            total = result.total || orders.length;
        }

        res.json({
            success: true,
            orders,
            pagination: limit > 0 ? {
                total, page, limit,
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
        const { Order } = require('../dataAccess');
        
        const now = new Date();
        const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
        const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate()-1);
        const last7Start = new Date(todayStart); last7Start.setDate(last7Start.getDate()-7);

        const toISO = d => d.toISOString();

        const result = await Order.aggregate([
            {
                $match: {
                    timestamp: { $gte: toISO(last7Start) },
                    status: { $in: ['Address Verified','Verified','Dispatched','Delivered'] }
                }
            },
            {
                $addFields: {
                    typeKey: {
                        $cond: [
                            { $in: ['$orderType', ['Reorder','REORDER']] },
                            'reorder', 'fresh'
                        ]
                    },
                    effectiveDate: {
                        $switch: {
                            branches: [
                                { case: { $in: ['$status',['Address Verified','Verified']] }, then: { $ifNull: ['$verifiedAt','$timestamp'] } },
                                { case: { $eq: ['$status','Dispatched'] }, then: { $ifNull: ['$dispatchedAt','$timestamp'] } },
                                { case: { $eq: ['$status','Delivered'] }, then: { $ifNull: ['$deliveredAt','$timestamp'] } }
                            ],
                            default: '$timestamp'
                        }
                    }
                }
            },
            {
                $addFields: {
                    dateStr: { $substr: ['$effectiveDate', 0, 10] },
                    dept: {
                        $switch: {
                            branches: [
                                { case: { $in: ['$status',['Address Verified','Verified']] }, then: 'verification' },
                                { case: { $eq: ['$status','Dispatched'] }, then: 'dispatch' },
                                { case: { $eq: ['$status','Delivered'] }, then: 'delivery' }
                            ],
                            default: 'other'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: { dept: '$dept', dateStr: '$dateStr', typeKey: '$typeKey' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const todayStr = toISO(todayStart).substring(0,10);
        const yesterdayStr = toISO(yesterdayStart).substring(0,10);

        const initStats = () => ({
            today: { fresh:0, reorder:0 },
            yesterday: { fresh:0, reorder:0 },
            last7Days: { fresh:0, reorder:0 }
        });

        const stats = {
            verification: initStats(),
            dispatch: initStats(),
            delivery: initStats()
        };

        result.forEach(({ _id, count }) => {
            const { dept, dateStr, typeKey } = _id;
            if (!stats[dept]) return;
            
            if (dateStr === todayStr) stats[dept].today[typeKey] += count;
            if (dateStr === yesterdayStr) stats[dept].yesterday[typeKey] += count;
            stats[dept].last7Days[typeKey] += count;
        });

        res.json({ success: true, stats });
    } catch (error) {
        console.error('Department stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/inventory-summary', async (req, res) => {
    try {
        const today = new Date();
        const monthStart = new Date(today);
        monthStart.setDate(1);

        const startDate = String(req.query.startDate || REPORT_DATE_FORMATTER.format(monthStart));
        const endDate = String(req.query.endDate || REPORT_DATE_FORMATTER.format(today));
        const basis = String(req.query.basis || 'dispatched').toLowerCase();

        const inventoryConfigs = {
            dispatched: {
                basis: 'dispatched',
                label: 'Dispatch Date',
                dateField: 'dispatchedAt',
                statuses: ['Dispatched', 'Delivered', 'RTO', 'Out For Delivery']
            },
            delivered: {
                basis: 'delivered',
                label: 'Delivered Date',
                dateField: 'deliveredAt',
                statuses: ['Delivered']
            }
        };

        const config = inventoryConfigs[basis] || inventoryConfigs.dispatched;
        const startBoundary = parseInventoryBoundary(startDate, false);
        const endBoundary = parseInventoryBoundary(endDate, true);

        if (!startBoundary || !endBoundary || Number.isNaN(startBoundary.getTime()) || Number.isNaN(endBoundary.getTime())) {
            return res.status(400).json({ success: false, message: 'Valid startDate and endDate are required' });
        }

        if (startBoundary > endBoundary) {
            return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
        }

        const orders = await fetchInventoryOrders(config, startDate, endDate);
        const report = summarizeInventoryOrders(orders, config.dateField);

        res.json({
            success: true,
            basis: config.basis,
            basisLabel: config.label,
            timezone: REPORT_TIMEZONE,
            startDate,
            endDate,
            ...report
        });
    } catch (error) {
        console.error('Inventory summary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
