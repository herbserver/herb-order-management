// Advanced Search & Filter API Routes
const express = require('express');
const router = express.Router();
const dataAccess = require('../dataAccess');

// Advanced Order Search
router.post('/orders', async (req, res) => {
    try {
        const { query, filters } = req.body;

        let orders = await dataAccess.getAllOrders();

        // Text search across multiple fields
        if (query && query.trim()) {
            const searchTerm = query.toLowerCase().trim();

            orders = orders.filter(order => {
                const searchFields = [
                    order.orderId,
                    order.customerName,
                    order.telNo,
                    order.mobile,
                    order.address,
                    order.pin,
                    order.pincode,
                    order.city,
                    order.distt,
                    order.state,
                    order.employee,
                    order.employeeId,
                    order.tracking?.trackingId,
                    order.shiprocket?.awb
                ].filter(Boolean).map(f => String(f).toLowerCase());

                return searchFields.some(field => field.includes(searchTerm));
            });
        }

        // Apply filters if provided
        if (filters) {
            // Status filter
            if (filters.status && filters.status.length > 0) {
                orders = orders.filter(o => filters.status.includes(o.status));
            }

            // Date range filter
            if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
                const startDate = new Date(filters.dateRange.start);
                const endDate = new Date(filters.dateRange.end);
                endDate.setHours(23, 59, 59, 999);

                orders = orders.filter(o => {
                    if (!o.timestamp) return false;
                    const orderDate = new Date(o.timestamp);
                    return orderDate >= startDate && orderDate <= endDate;
                });
            }

            // Employee filter
            if (filters.employeeId) {
                orders = orders.filter(o =>
                    o.employeeId?.toUpperCase() === filters.employeeId.toUpperCase()
                );
            }

            // Amount range filter
            if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
                const min = filters.minAmount || 0;
                const max = filters.maxAmount || Infinity;

                orders = orders.filter(o => {
                    const amount = o.total || 0;
                    return amount >= min && amount <= max;
                });
            }

            // Pincode filter
            if (filters.pincode) {
                const pinSearch = filters.pincode.trim();
                orders = orders.filter(o =>
                    o.pin === pinSearch || o.pincode === pinSearch
                );
            }

            // Payment mode filter
            if (filters.paymentMode) {
                orders = orders.filter(o =>
                    o.paymentMode?.toLowerCase() === filters.paymentMode.toLowerCase()
                );
            }

            // COD status filter (for payment tracking)
            if (filters.codStatus) {
                orders = orders.filter(o =>
                    o.paymentTracking?.codStatus === filters.codStatus
                );
            }
        }

        // Sort by timestamp (newest first)
        orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            count: orders.length,
            orders: orders,
            query: query || '',
            filters: filters || {}
        });

    } catch (error) {
        console.error('❌ Advanced search error:', error);
        res.status(500).json({ success: false, message: 'Search failed' });
    }
});

// Quick Filters (Pre-defined useful filters)
router.get('/quick/:filterName', async (req, res) => {
    try {
        const { filterName } = req.params;
        let orders = await dataAccess.getAllOrders();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        switch (filterName) {
            case 'today':
                orders = orders.filter(o => {
                    if (!o.timestamp) return false;
                    const orderDate = new Date(o.timestamp);
                    return orderDate >= today;
                });
                break;

            case 'week-dispatched':
                orders = orders.filter(o => {
                    if (o.status !== 'Dispatched') return false;
                    if (!o.dispatchedAt) return false;
                    const dispatchDate = new Date(o.dispatchedAt);
                    return dispatchDate >= weekAgo;
                });
                break;

            case 'high-value':
                orders = orders.filter(o => (o.total || 0) > 5000);
                break;

            case 'pending-old':
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

                orders = orders.filter(o => {
                    if (o.status !== 'Pending') return false;
                    if (!o.timestamp) return false;
                    const orderDate = new Date(o.timestamp);
                    return orderDate < threeDaysAgo;
                });
                break;

            case 'cod-pending':
                orders = orders.filter(o => {
                    return o.paymentMode === 'COD' &&
                        o.status === 'Delivered' &&
                        (!o.paymentTracking || o.paymentTracking.codStatus === 'Pending');
                });
                break;

            case 'on-hold':
                orders = orders.filter(o => o.status === 'On Hold');
                break;

            case 'unverified':
                orders = orders.filter(o => o.status === 'Unverified' || o.status === 'Pending');
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid filter name',
                    availableFilters: [
                        'today', 'week-dispatched', 'high-value',
                        'pending-old', 'cod-pending', 'on-hold', 'unverified'
                    ]
                });
        }

        // Sort by timestamp
        orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            filterName,
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error('❌ Quick filter error:', error);
        res.status(500).json({ success: false, message: 'Filter failed' });
    }
});

// Get autocomplete suggestions for search
router.get('/suggestions', async (req, res) => {
    try {
        const { field, query } = req.query;

        if (!field || !query) {
            return res.status(400).json({
                success: false,
                message: 'Field and query required'
            });
        }

        const orders = await dataAccess.getAllOrders();
        const searchTerm = query.toLowerCase();
        let suggestions = new Set();

        orders.forEach(order => {
            let value = null;

            switch (field) {
                case 'customer':
                    value = order.customerName;
                    break;
                case 'phone':
                    value = order.telNo || order.mobile;
                    break;
                case 'city':
                    value = order.city || order.distt;
                    break;
                case 'pincode':
                    value = order.pin || order.pincode;
                    break;
                case 'employee':
                    value = order.employee || order.employeeId;
                    break;
            }

            if (value && String(value).toLowerCase().includes(searchTerm)) {
                suggestions.add(String(value));
            }
        });

        res.json({
            success: true,
            suggestions: Array.from(suggestions).slice(0, 10) // Limit to 10
        });

    } catch (error) {
        console.error('❌ Suggestions error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch suggestions' });
    }
});

module.exports = router;
