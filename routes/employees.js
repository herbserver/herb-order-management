const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const dataAccess = require('../dataAccess');

const DATA_DIR = path.join(__dirname, '../data');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Helper Functions for JSON (Fallback)
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

function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// Get All Employees (for Admin)
router.get('/', async (req, res) => {
    try {
        const employees = readJSON(EMPLOYEES_FILE, {});
        let orders = [];
        try {
            orders = await dataAccess.getAllOrders();
        } catch (mongoError) {
            console.warn('⚠️ MongoDB orders failed, using JSON fallback:', mongoError.message);
            orders = readJSON(ORDERS_FILE, []);
        }

        const employeeList = Object.entries(employees).map(([id, data]) => {
            const empOrders = orders.filter(o => o.employeeId === id);
            return {
                id,
                name: data.name,
                createdAt: data.createdAt,
                totalOrders: empOrders.length,
                pendingOrders: empOrders.filter(o => o.status === 'Pending').length,
                verifiedOrders: empOrders.filter(o => o.status === 'Address Verified').length,
                dispatchedOrders: empOrders.filter(o => o.status === 'Dispatched').length,
                deliveredOrders: empOrders.filter(o => o.status === 'Delivered').length
            };
        });

        console.log(`✅ Loaded ${employeeList.length} employees`);
        res.json({ success: true, employees: employeeList });
    } catch (error) {
        console.error('❌ Get employees error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Get Single Employee with Orders
router.get('/:empId', async (req, res) => {
    try {
        const id = req.params.empId.toUpperCase();
        const depts = await dataAccess.getAllDepartments();

        let foundEmployee = null;
        for (const dept of depts) {
            if (dept.employees && dept.employees[id]) {
                foundEmployee = {
                    id,
                    ...dept.employees[id],
                    department: dept.departmentName
                };
                break;
            }
        }

        if (!foundEmployee) {
            // Check standalone employees file too
            const employees = readJSON(EMPLOYEES_FILE, {});
            if (employees[id]) {
                foundEmployee = { id, ...employees[id] };
            }
        }

        if (!foundEmployee) {
            return res.status(404).json({ success: false, message: 'Employee not found!' });
        }

        const orders = await dataAccess.getAllOrders();
        const empOrders = orders.filter(o => o.employeeId === id);
        empOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            employee: foundEmployee,
            orders: empOrders,
            stats: {
                total: empOrders.length,
                pending: empOrders.filter(o => o.status === 'Pending').length,
                verified: empOrders.filter(o => o.status === 'Address Verified').length,
                dispatched: empOrders.filter(o => o.status === 'Dispatched').length,
                delivered: empOrders.filter(o => o.status === 'Delivered').length,
                thisMonth: empOrders.filter(o => {
                    const orderDate = new Date(o.timestamp);
                    const now = new Date();
                    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
                }).length
            }
        });
    } catch (e) {
        console.error('Get employee detail error:', e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update Employee
router.put('/:empId', async (req, res) => {
    try {
        const oldId = req.params.empId.toUpperCase();
        const { newId, name } = req.body;
        const employees = readJSON(EMPLOYEES_FILE, {});

        if (!employees[oldId]) {
            return res.status(404).json({ success: false, message: 'Employee not found!' });
        }

        if (newId && newId.toUpperCase() !== oldId) {
            const newIdUpper = newId.toUpperCase();
            if (employees[newIdUpper]) {
                return res.status(400).json({ success: false, message: 'New employee ID already exists!' });
            }

            employees[newIdUpper] = { ...employees[oldId] };
            if (name) employees[newIdUpper].name = name;
            delete employees[oldId];

            const orders = readJSON(ORDERS_FILE, []);
            orders.forEach(order => {
                if (order.employeeId === oldId) {
                    order.employeeId = newIdUpper;
                    if (name) order.employee = name;
                }
            });
            writeJSON(ORDERS_FILE, orders);
            writeJSON(EMPLOYEES_FILE, employees);
            return res.json({ success: true, message: 'Employee ID updated successfully!', newId: newIdUpper });
        }

        if (name) {
            employees[oldId].name = name;
            const orders = readJSON(ORDERS_FILE, []);
            orders.forEach(order => {
                if (order.employeeId === oldId) order.employee = name;
            });
            writeJSON(ORDERS_FILE, orders);
            writeJSON(EMPLOYEES_FILE, employees);
            return res.json({ success: true, message: 'Employee name updated successfully!' });
        }

        res.status(400).json({ success: false, message: 'No changes provided' });
    } catch (error) {
        console.error('❌ Employee update error:', error.message);
        res.status(500).json({ success: false, message: 'Update failed. Please try again.' });
    }
});

module.exports = router;
