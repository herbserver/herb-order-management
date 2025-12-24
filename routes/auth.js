const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { hashPassword, comparePassword, generateToken } = require('../auth');
const dataAccess = require('../dataAccess');

// Data Files Path (Assuming they are in ../data)
const DATA_DIR = path.join(__dirname, '../data');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');

// Helper function to sync employee to MongoDB
async function syncEmployeeToMongo(employeeId, employeeData) {
    try {
        if (!dataAccess.getMongoStatus()) {
            console.log('⚠️ MongoDB not connected, skipping sync');
            return false;
        }

        // Get or create employee department
        let empDept = await dataAccess.getDepartment('HON-EMP');
        if (!empDept) {
            // Check if any employee type department exists
            const allDepts = await dataAccess.getAllDepartments();
            empDept = allDepts.find(d => d.departmentType === 'employee');
        }

        if (empDept) {
            const employees = empDept.employees || {};
            employees[employeeId] = employeeData;
            await dataAccess.updateDepartment(empDept.departmentId, { employees });
            console.log(`✅ Employee ${employeeId} synced to MongoDB`);
            return true;
        } else {
            // Create employee department if not exists
            await dataAccess.createDepartment('HON-EMP', 'Employee Department', employeeData.password, 'employee');
            console.log('✅ Created Employee Department in MongoDB');
            // Now add the employee
            const newDept = await dataAccess.getDepartment('HON-EMP');
            if (newDept) {
                const employees = { [employeeId]: employeeData };
                await dataAccess.updateDepartment('HON-EMP', { employees });
                console.log(`✅ Employee ${employeeId} synced to MongoDB`);
            }
            return true;
        }
    } catch (error) {
        console.error('❌ Failed to sync employee to MongoDB:', error.message);
        return false;
    }
}

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
        const employeeData = {
            name,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        employees[id] = employeeData;
        writeJSON(EMPLOYEES_FILE, employees);

        // Also sync to MongoDB for production
        await syncEmployeeToMongo(id, employeeData);

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
