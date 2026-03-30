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

module.exports = router;
