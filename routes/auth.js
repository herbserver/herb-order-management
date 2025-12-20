const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { hashPassword, comparePassword, generateToken } = require('../auth');

// Data Files Path (Assuming they are in ../data)
const DATA_DIR = path.join(__dirname, '../data');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');

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

// Register Employee
router.post('/register', async (req, res) => {
    try {
        const { name, employeeId, password } = req.body;
        const employees = readJSON(EMPLOYEES_FILE, {});
        const id = employeeId.toUpperCase();

        if (employees[id]) {
            return res.status(400).json({ success: false, message: `Employee ID (${id}) already exists!` });
        }

        const hashedPassword = await hashPassword(password);
        employees[id] = {
            name,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        writeJSON(EMPLOYEES_FILE, employees);

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
        const employees = readJSON(EMPLOYEES_FILE, {});
        const id = employeeId.toUpperCase();

        if (!employees[id]) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isValidPassword = await comparePassword(password, employees[id].password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken({
            id,
            name: employees[id].name,
            role: 'employee'
        });

        console.log(`✅ Employee Login: ${employees[id].name} (${id})`);
        res.json({
            success: true,
            message: 'Login successful!',
            token,
            employee: { id, name: employees[id].name }
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
        const employees = readJSON(EMPLOYEES_FILE, {});
        const id = employeeId.toUpperCase();

        if (!employees[id]) {
            return res.status(404).json({ success: false, message: 'Employee not found!' });
        }

        const hashedPassword = await hashPassword(newPassword);
        employees[id].password = hashedPassword;
        writeJSON(EMPLOYEES_FILE, employees);

        console.log(`🔄 Password Reset: ${id}`);
        res.json({ success: true, message: 'Password reset successful!' });
    } catch (error) {
        console.error('❌ Password reset error:', error.message);
        res.status(500).json({ success: false, message: 'Password reset failed. Please try again.' });
    }
});

module.exports = router;
