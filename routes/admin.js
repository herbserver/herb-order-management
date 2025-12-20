const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const dataAccess = require('../dataAccess');

const DATA_DIR = path.join(__dirname, '../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Helper Function for JSON (Fallback)
function readJSON(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return defaultValue;
    }
}

// Get Order History (with filters)
router.get('/history', async (req, res) => {
    try {
        let orders = [];
        try {
            orders = await dataAccess.getAllOrders();
        } catch (e) {
            orders = readJSON(ORDERS_FILE, []);
        }

        let filteredOrders = [...orders];

        if (req.query.date) {
            filteredOrders = filteredOrders.filter(o => {
                const orderDate = new Date(o.timestamp).toISOString().split('T')[0];
                return orderDate === req.query.date;
            });
        }

        if (req.query.employee) {
            filteredOrders = filteredOrders.filter(o => o.employeeId === req.query.employee.toUpperCase());
        }

        if (req.query.status) {
            filteredOrders = filteredOrders.filter(o => o.status === req.query.status);
        }

        filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json({ success: true, orders: filteredOrders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const orders = await dataAccess.getAllOrders();
        const departments = await dataAccess.getAllDepartments();

        let totalEmployees = 0;
        departments.forEach(d => {
            if (d.employees) totalEmployees += Object.keys(d.employees).length;
        });

        const now = new Date();
        const thisMonth = orders.filter(o => {
            const orderDate = new Date(o.timestamp);
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        });

        res.json({
            success: true,
            stats: {
                totalOrders: orders.length,
                pendingOrders: orders.filter(o => o.status === 'Pending').length,
                verifiedOrders: orders.filter(o => o.status === 'Address Verified').length,
                dispatchedOrders: orders.filter(o => o.status === 'Dispatched').length,
                deliveredOrders: orders.filter(o => o.status === 'Delivered').length,
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

module.exports = router;
