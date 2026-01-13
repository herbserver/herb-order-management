const express = require('express');
const router = express.Router();
const path = require('path');
const dataAccess = require('../dataAccess');
const { readJSON, writeJSON } = require('../utils/fileHelpers');
const { hashPassword, comparePassword, generateToken } = require('../auth');

const DATA_DIR = path.join(__dirname, '../data');
const DEPARTMENTS_FILE = path.join(DATA_DIR, 'departments.json');

// Note: Using centralized fileHelpers module for JSON operations

// Register Department
router.post('/register', async (req, res) => {
    try {
        const { name, deptId, password, deptType } = req.body;
        const id = deptId.toUpperCase();
        const existing = await dataAccess.getDepartment(id);

        if (existing) {
            return res.status(400).json({ success: false, message: `Department ID (${id}) already exists!` });
        }

        const hashedPassword = await hashPassword(password);
        await dataAccess.createDepartment(id, name, hashedPassword, deptType);

        console.log(`✅ New Department Registered: ${name} (${id}) - Type: ${deptType}`);
        res.json({ success: true, message: 'Department registered!', department: { id, name, type: deptType } });
    } catch (error) {
        console.error('❌ Department register error:', error.message);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
});

// Department Login
router.post('/login', async (req, res) => {
    try {
        const { deptId, password, deptType } = req.body;
        const id = deptId.toUpperCase();
        const department = await dataAccess.getDepartment(id);

        if (!department) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isValidPassword = await comparePassword(password, department.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (department.departmentType !== deptType) {
            return res.status(401).json({ success: false, message: 'Wrong department type!' });
        }

        const token = generateToken({
            id,
            name: department.departmentName,
            role: deptType,
            type: 'department'
        });

        console.log(`✅ Department Login: ${department.departmentName} (${id}) - ${deptType}`);
        res.json({
            success: true,
            message: 'Login successful!',
            token,
            department: {
                id,
                name: department.departmentName,
                type: department.departmentType
            }
        });
    } catch (error) {
        console.error('❌ Department login error:', error.message);
        res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
});

// Get All Departments
router.get('/', async (req, res) => {
    try {
        const departments = await dataAccess.getAllDepartments();
        const deptList = departments.map(dept => ({
            id: dept.departmentId,
            name: dept.departmentName || dept.name,
            type: dept.departmentType || dept.type,
            createdAt: dept.createdAt
        }));
        res.json({ success: true, departments: deptList });
    } catch (error) {
        console.error('❌ Get departments error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update Department
router.put('/:deptId', async (req, res) => {
    try {
        const { name, password } = req.body;
        const id = req.params.deptId.toUpperCase();
        const department = await dataAccess.getDepartment(id);

        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found!' });
        }

        const updates = {};
        if (name) {
            updates.departmentName = name;
            updates.name = name;
        }
        if (password) {
            updates.password = await hashPassword(password);
        }

        const updated = await dataAccess.updateDepartment(id, updates);
        console.log(`✅ Department Updated: ${updated.departmentName || updated.name} (${id})`);
        res.json({
            success: true,
            message: 'Department updated successfully!',
            department: { id, name: updated.departmentName || updated.name, type: updated.departmentType || updated.type }
        });
    } catch (error) {
        console.error('❌ Update department error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete Department
router.delete('/:deptId', async (req, res) => {
    try {
        const id = req.params.deptId.toUpperCase();
        const success = await dataAccess.deleteDepartment(id);

        if (!success) {
            return res.status(404).json({ success: false, message: 'Department not found!' });
        }

        console.log(`🗑️ Department Deleted: ${id}`);
        res.json({ success: true, message: 'Department deleted!' });
    } catch (error) {
        console.error('❌ Delete department error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
