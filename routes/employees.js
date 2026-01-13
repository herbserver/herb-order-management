const express = require('express');
const router = express.Router();
const path = require('path');
const dataAccess = require('../dataAccess');
const { readJSON, writeJSON } = require('../utils/fileHelpers');

const DATA_DIR = path.join(__dirname, '../data');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Note: Using centralized fileHelpers module for JSON operations

// Helper function to sync all employees to MongoDB
async function syncAllEmployeesToMongo(employees) {
    try {
        if (!dataAccess.getMongoStatus()) {
            console.log('⚠️ MongoDB not connected, skipping sync');
            return false;
        }

        // Get or find employee department
        let empDept = await dataAccess.getDepartment('HON-EMP');
        if (!empDept) {
            const allDepts = await dataAccess.getAllDepartments();
            empDept = allDepts.find(d => d.departmentType === 'employee');
        }

        if (empDept) {
            await dataAccess.updateDepartment(empDept.departmentId, { employees });
            console.log(`✅ All employees synced to MongoDB (${Object.keys(employees).length} employees)`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Failed to sync employees to MongoDB:', error.message);
        return false;
    }
}

// Get All Employees (for Admin)
router.get('/', async (req, res) => {
    try {
        // Read employees directly from JSON file
        const employees = readJSON(EMPLOYEES_FILE, {});
        console.log(`📂 Loaded ${Object.keys(employees).length} employees from JSON file`);
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
                deliveredOrders: empOrders.filter(o => o.status === 'Delivered').length,
                cancelledOrders: empOrders.filter(o => o.status === 'Cancelled').length,
                onHoldOrders: empOrders.filter(o => o.status === 'On Hold').length
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

        // Optimization: Use getEmployeeOrders
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0; // Default to all if not specified (legacy)

        let result;
        if (req.query.status) {
            result = await dataAccess.getEmployeeOrders(id, req.query.status, page, limit);
        } else {
            result = await dataAccess.getEmployeeOrders(id, null, page, limit);
        }

        let empOrders, total = 0;
        if (limit > 0 && result.orders) {
            empOrders = result.orders;
            total = result.total;
        } else {
            empOrders = result;
            total = empOrders.length;
        }

        res.json({
            success: true,
            employee: foundEmployee,
            orders: empOrders,
            pagination: limit > 0 ? {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            } : null,
            stats: null // Removed expensive stats calculation as it's unused
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
        const { newId, name, password } = req.body; // Added password
        const employees = readJSON(EMPLOYEES_FILE, {});

        if (!employees[oldId]) {
            return res.status(404).json({ success: false, message: 'Employee not found!' });
        }

        const employeeData = { ...employees[oldId] };
        if (name) employeeData.name = name;
        if (password) {
            const { hashPassword } = require('../auth');
            employeeData.password = await hashPassword(password);
        }

        const nId = (newId || oldId).toUpperCase();

        if (oldId !== nId) {
            if (employees[nId]) {
                return res.status(400).json({ success: false, message: `ID ${nId} already in use!` });
            }
            delete employees[oldId];
            employees[nId] = employeeData;
        } else {
            employees[oldId] = employeeData;
        }

        writeJSON(EMPLOYEES_FILE, employees);

        // Sync to MongoDB Department
        const { syncEmployeeToMongo } = require('./auth'); // Assuming shared logic if possible, or local
        // Actually, let's just use the shared logic or local helper if needed.
        // For now, employees.js has syncAllEmployeesToMongo, which is better.
        await syncAllEmployeesToMongo(employees);

        // SYNC ORDERS: Update employeeId and Name in all existing orders
        if (dataAccess.updateEmployeeOrders) {
            await dataAccess.updateEmployeeOrders(oldId, nId, name);
        }

        console.log(`👤 Employee Updated: ${oldId} -> ${nId} (${employeeData.name})`);
        res.json({ success: true, message: 'Employee updated successfully!', employee: { id: nId, name: employeeData.name } });
    } catch (error) {
        console.error('❌ Employee update error:', error.message);
        res.status(500).json({ success: false, message: 'Update failed. ' + error.message });
    }
});

module.exports = router;
