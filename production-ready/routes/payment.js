// Payment Tracking & COD Management API Routes
const express = require('express');
const router = express.Router();
const { Order } = require('../models');
const dataAccess = require('../dataAccess');

// Mark COD as Collected
router.post('/cod/mark-collected', async (req, res) => {
    try {
        const { orderId, collectedBy, collectionAmount, notes } = req.body;

        const order = await dataAccess.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

        const updates = {
            'paymentTracking.codStatus': 'Collected',
            'paymentTracking.collectedBy': collectedBy,
            'paymentTracking.collectedAt': new Date(),
            'paymentTracking.collectionAmount': collectionAmount || order.codAmount,
            'paymentTracking.notes': notes || '',
            updatedAt: new Date().toISOString()
        };

        const updated = await dataAccess.updateOrder(orderId, updates);
        console.log(`💰 COD Collected: ${orderId} by ${collectedBy}`);

        res.json({
            success: true,
            message: 'COD marked as collected!',
            order: updated
        });
    } catch (error) {
        console.error('❌ Mark collected error:', error);
        res.status(500).json({ success: false, message: 'Failed to update COD status' });
    }
});

// Mark COD as Deposited
router.post('/cod/mark-deposited', async (req, res) => {
    try {
        const { orderId, depositReference, notes } = req.body;

        const order = await dataAccess.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

        if (order.paymentTracking?.codStatus !== 'Collected') {
            return res.status(400).json({
                success: false,
                message: 'COD must be collected before depositing!'
            });
        }

        const updates = {
            'paymentTracking.codStatus': 'Deposited',
            'paymentTracking.depositedAt': new Date(),
            'paymentTracking.depositReference': depositReference,
            'paymentTracking.notes': notes || order.paymentTracking?.notes || '',
            updatedAt: new Date().toISOString()
        };

        const updated = await dataAccess.updateOrder(orderId, updates);
        console.log(`🏦 COD Deposited: ${orderId} - Ref: ${depositReference}`);

        res.json({
            success: true,
            message: 'COD marked as deposited!',
            order: updated
        });
    } catch (error) {
        console.error('❌ Mark deposited error:', error);
        res.status(500).json({ success: false, message: 'Failed to update deposit status' });
    }
});

// Get Pending COD Collections
router.get('/cod/pending', async (req, res) => {
    try {
        const orders = await dataAccess.getAllOrders();

        const pendingCOD = orders.filter(o => {
            return o.status === 'Delivered' &&
                o.paymentMode === 'COD' &&
                (!o.paymentTracking || o.paymentTracking.codStatus === 'Pending');
        });

        // Calculate total pending amount
        const totalPending = pendingCOD.reduce((sum, o) => sum + (o.codAmount || 0), 0);

        res.json({
            success: true,
            orders: pendingCOD,
            summary: {
                count: pendingCOD.length,
                totalAmount: totalPending
            }
        });
    } catch (error) {
        console.error('❌ Get pending COD error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending COD' });
    }
});

// Get COD Summary (Daily/Monthly)
router.get('/cod/summary', async (req, res) => {
    try {
        const { period = 'today' } = req.query; // today, week, month
        const orders = await dataAccess.getAllOrders();

        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setDate(1);
        }

        const codOrders = orders.filter(o => {
            if (o.paymentMode !== 'COD') return false;
            if (!o.timestamp) return false;

            const orderDate = new Date(o.timestamp);
            return orderDate >= startDate;
        });

        const summary = {
            total: codOrders.length,
            totalAmount: codOrders.reduce((sum, o) => sum + (o.codAmount || 0), 0),
            pending: codOrders.filter(o => !o.paymentTracking || o.paymentTracking.codStatus === 'Pending').length,
            collected: codOrders.filter(o => o.paymentTracking?.codStatus === 'Collected').length,
            deposited: codOrders.filter(o => o.paymentTracking?.codStatus === 'Deposited').length,
            verified: codOrders.filter(o => o.paymentTracking?.codStatus === 'Verified').length,

            pendingAmount: codOrders
                .filter(o => !o.paymentTracking || o.paymentTracking.codStatus === 'Pending')
                .reduce((sum, o) => sum + (o.codAmount || 0), 0),

            collectedAmount: codOrders
                .filter(o => o.paymentTracking?.codStatus === 'Collected')
                .reduce((sum, o) => sum + (o.codAmount || 0), 0),

            depositedAmount: codOrders
                .filter(o => o.paymentTracking?.codStatus === 'Deposited')
                .reduce((sum, o) => sum + (o.codAmount || 0), 0)
        };

        res.json({ success: true, summary, period });
    } catch (error) {
        console.error('❌ COD summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate summary' });
    }
});

// Get Employee-wise COD Collection
router.get('/cod/employee/:empId', async (req, res) => {
    try {
        const { empId } = req.params;
        const orders = await dataAccess.getAllOrders();

        const employeeCOD = orders.filter(o => {
            return o.employeeId === empId.toUpperCase() &&
                o.paymentMode === 'COD' &&
                o.status === 'Delivered';
        });

        const stats = {
            total: employeeCOD.length,
            totalAmount: employeeCOD.reduce((sum, o) => sum + (o.codAmount || 0), 0),
            pending: employeeCOD.filter(o => !o.paymentTracking || o.paymentTracking.codStatus === 'Pending').length,
            collected: employeeCOD.filter(o => o.paymentTracking?.codStatus === 'Collected').length,
            collectedAmount: employeeCOD
                .filter(o => o.paymentTracking?.codStatus === 'Collected')
                .reduce((sum, o) => sum + (o.codAmount || 0), 0)
        };

        res.json({
            success: true,
            employeeId: empId,
            stats,
            orders: employeeCOD
        });
    } catch (error) {
        console.error('❌ Employee COD error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch employee COD data' });
    }
});

module.exports = router;
