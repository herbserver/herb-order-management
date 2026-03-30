const express = require('express');
const router = express.Router();
const { hashPassword, comparePassword, generateToken } = require('../auth');
const dataAccess = require('../dataAccess');
const { Employee } = require('../models');

async function findEmployeeRecord(employeeId) {
    return Employee.findOne({ employeeId }).lean();
}

async function createEmployeeRecord(employeeId, employeeData) {
    return Employee.create({ employeeId, ...employeeData });
}

async function updateEmployeePassword(employeeId, password) {
    return Employee.findOneAndUpdate(
        { employeeId },
        { password },
        { new: true }
    );
}

async function updateEmployeeRecord(oldId, newId, updates) {
    return Employee.findOneAndUpdate(
        { employeeId: oldId },
        { $set: { employeeId: newId, ...updates } },
        { new: true, runValidators: true }
    );
}

// Register Employee
router.post('/register', async (req, res) => {
    try {
        const { name, employeeId, password } = req.body;
        const id = String(employeeId || '').toUpperCase().trim();

        const existingEmployee = await findEmployeeRecord(id);
        if (existingEmployee) {
            return res.status(400).json({ success: false, message: `Employee ID (${id}) already exists!` });
        }

        const employeeData = {
            name,
            password: await hashPassword(password),
            createdAt: new Date().toISOString()
        };

        await createEmployeeRecord(id, employeeData);

        console.log(`✅ New Employee Registered: ${name} (${id})`);
        res.json({ success: true, message: 'Registration successful!', employee: { id, name } });
    } catch (error) {
        console.error('❌ Registration error:', error.message);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
});

// Employee Login
router.post('/login', async (req, res) => {
    try {
        const { employeeId, password } = req.body;
        const id = String(employeeId || '').toUpperCase().trim();
        const employee = await findEmployeeRecord(id);

        if (!employee) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isValidPassword = await comparePassword(password, employee.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken({
            id,
            name: employee.name,
            role: 'employee'
        });

        console.log(`✅ Employee Login: ${employee.name} (${id})`);
        res.json({
            success: true,
            message: 'Login successful!',
            token,
            employee: { id, name: employee.name }
        });
    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { employeeId, newPassword } = req.body;
        const id = String(employeeId || '').toUpperCase().trim();
        const hashedPassword = await hashPassword(newPassword);
        const updatedEmployee = await updateEmployeePassword(id, hashedPassword);

        if (!updatedEmployee) {
            return res.status(404).json({ success: false, message: 'Employee not found!' });
        }

        console.log(`🔐 Password Reset: ${id}`);
        res.json({ success: true, message: 'Password reset successful!' });
    } catch (error) {
        console.error('❌ Password reset error:', error.message);
        res.status(500).json({ success: false, message: 'Password reset failed. Please try again.' });
    }
});

// Update Employee Details
router.put('/update-employee', async (req, res) => {
    try {
        const { oldId, newId, newName, newPassword } = req.body;
        const oId = String(oldId || '').toUpperCase().trim();
        const nId = String(newId || oldId || '').toUpperCase().trim();

        const existingEmployee = await findEmployeeRecord(oId);
        if (!existingEmployee) {
            return res.status(404).json({ success: false, message: 'Employee not found!' });
        }

        if (oId !== nId) {
            const duplicateEmployee = await findEmployeeRecord(nId);
            if (duplicateEmployee) {
                return res.status(400).json({ success: false, message: `New ID (${nId}) is already in use!` });
            }
        }

        const updates = {};
        if (newName) {
            updates.name = newName;
        }
        if (newPassword) {
            updates.password = await hashPassword(newPassword);
        }

        const updatedEmployee = await updateEmployeeRecord(oId, nId, updates);
        await dataAccess.updateEmployeeOrders(oId, nId, newName);

        console.log(`👤 Employee Updated & Orders Synced: ${oId} -> ${nId} (${updatedEmployee.name})`);
        res.json({
            success: true,
            message: 'Employee updated successfully!',
            employee: { id: nId, name: updatedEmployee.name }
        });
    } catch (error) {
        console.error('❌ Update employee error:', error.message);
        res.status(500).json({ success: false, message: 'Update failed. Please try again.' });
    }
});

module.exports = router;
