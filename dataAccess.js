// MongoDB Data Access Layer
// This module provides functions to interact with MongoDB collections
// Falls back to JSON files if MongoDB is not connected

const fs = require('fs');
const path = require('path');
const { Order, Department, ShiprocketConfig } = require('./models');

// Track MongoDB connection status
let mongoConnected = false;

function setMongoStatus(status) {
    mongoConnected = status;
}

function getMongoStatus() {
    return mongoConnected;
}

// ==================== DEPARTMENTS ====================

async function getDepartment(departmentId) {
    if (mongoConnected) {
        return await Department.findOne({ departmentId });
    }
    // Fallback to JSON
    const depts = readJSONFile(path.join(__dirname, 'data', 'departments.json'), {});
    return depts[departmentId] ? {
        departmentId,
        ...depts[departmentId],
        employees: depts[departmentId].employees || {}
    } : null;
}

async function getAllDepartments() {
    if (mongoConnected) {
        return await Department.find({});
    }
    // Fallback to JSON
    const depts = readJSONFile(path.join(__dirname, 'data', 'departments.json'), {});
    return Object.entries(depts).map(([id, data]) => ({
        departmentId: id,
        ...data
    }));
}

async function createDepartment(departmentId, departmentName, password, departmentType) {
    if (mongoConnected) {
        const dept = new Department({
            departmentId,
            departmentName,
            password,
            departmentType,
            employees: {},
            createdAt: new Date().toISOString()
        });
        return await dept.save();
    }
    // Fallback to JSON
    const depts = readJSONFile(path.join(__dirname, 'data', 'departments.json'), {});
    depts[departmentId] = {
        name: departmentName,
        password,
        type: departmentType,
        employees: {}
    };
    writeJSONFile(path.join(__dirname, 'data', 'departments.json'), depts);
    return { departmentId, ...depts[departmentId] };
}

async function updateDepartment(departmentId, updates) {
    if (mongoConnected) {
        return await Department.findOneAndUpdate(
            { departmentId },
            updates,
            { new: true }
        );
    }
    // Fallback to JSON
    const depts = readJSONFile(path.join(__dirname, 'data', 'departments.json'), {});
    if (depts[departmentId]) {
        depts[departmentId] = { ...depts[departmentId], ...updates };
        writeJSONFile(path.join(__dirname, 'data', 'departments.json'), depts);
        return { departmentId, ...depts[departmentId] };
    }
    return null;
}

async function deleteDepartment(departmentId) {
    if (mongoConnected) {
        return await Department.findOneAndDelete({ departmentId });
    }
    // Fallback to JSON
    const depts = readJSONFile(path.join(__dirname, 'data', 'departments.json'), {});
    if (depts[departmentId]) {
        delete depts[departmentId];
        writeJSONFile(path.join(__dirname, 'data', 'departments.json'), depts);
        return true;
    }
    return false;
}

// ==================== ORDERS ====================

async function getAllOrders() {
    if (mongoConnected) {
        return await Order.find({}).sort({ timestamp: -1 });
    }
    // Fallback to JSON
    return readJSONFile(path.join(__dirname, 'data', 'orders.json'), []);
}

async function getOrderById(orderId) {
    if (mongoConnected) {
        return await Order.findOne({ orderId });
    }
    // Fallback to JSON
    const orders = readJSONFile(path.join(__dirname, 'data', 'orders.json'), []);
    return orders.find(o => o.orderId === orderId);
}

async function getOrdersByStatus(status) {
    if (mongoConnected) {
        // Use status as-is - MongoDB has proper case: 'Pending', 'Address Verified', etc.
        return await Order.find({ status: status }).sort({ timestamp: -1 });
    }
    // Fallback to JSON
    const orders = readJSONFile(path.join(__dirname, 'data', 'orders.json'), []);
    return orders.filter(o => o.status === status);
}


async function createOrder(orderData) {
    if (mongoConnected) {
        const order = new Order(orderData);
        return await order.save();
    }
    // Fallback to JSON
    const orders = readJSONFile(path.join(__dirname, 'data', 'orders.json'), []);
    orders.push(orderData);
    writeJSONFile(path.join(__dirname, 'data', 'orders.json'), orders);
    return orderData;
}

async function updateOrder(orderId, updates) {
    if (mongoConnected) {
        return await Order.findOneAndUpdate(
            { orderId },
            updates,
            { new: true }
        );
    }
    // Fallback to JSON
    const orders = readJSONFile(path.join(__dirname, 'data', 'orders.json'), []);
    const index = orders.findIndex(o => o.orderId === orderId);
    if (index !== -1) {
        orders[index] = { ...orders[index], ...updates };
        writeJSONFile(path.join(__dirname, 'data', 'orders.json'), orders);
        return orders[index];
    }
    return null;
}

async function deleteOrder(orderId) {
    if (mongoConnected) {
        // Try exact match first
        let result = await Order.findOneAndDelete({ orderId });
        if (!result) {
            // Try with decoded or trimmed version if exact match fails
            const decodedId = decodeURIComponent(orderId).trim();
            result = await Order.findOneAndDelete({
                $or: [{ orderId: decodedId }, { orderId: orderId.trim() }]
            });
        }
        return result;
    }
    // Fallback to JSON
    const orders = readJSONFile(path.join(__dirname, 'data', 'orders.json'), []);
    const index = orders.findIndex(o => o.orderId === orderId || o.orderId === decodeURIComponent(orderId).trim());
    if (index !== -1) {
        orders.splice(index, 1);
        writeJSONFile(path.join(__dirname, 'data', 'orders.json'), orders);
        return true;
    }
    return false;
}

async function updateEmployeeOrders(oldId, newId, newName) {
    const updates = {};
    if (newId) updates.employeeId = newId;
    if (newName) updates.employee = newName;

    if (Object.keys(updates).length === 0) return;

    if (mongoConnected) {
        return await Order.updateMany({ employeeId: oldId }, { $set: updates });
    }

    // Fallback to JSON
    const orders = readJSONFile(path.join(__dirname, 'data', 'orders.json'), []);
    let modified = false;
    orders.forEach(order => {
        if (order.employeeId === oldId) {
            if (newId) order.employeeId = newId;
            if (newName) order.employee = newName;
            modified = true;
        }
    });
    if (modified) {
        writeJSONFile(path.join(__dirname, 'data', 'orders.json'), orders);
    }
    return { modifiedCount: orders.filter(o => o.employeeId === (newId || oldId)).length };
}

// ==================== SHIPROCKET CONFIG ====================

async function getShiprocketConfig() {
    if (mongoConnected) {
        let config = await ShiprocketConfig.findOne({ configId: 'main' });
        if (!config) {
            // Create default if not exists
            config = new ShiprocketConfig({
                configId: 'main',
                enabled: true,
                apiEmail: process.env.SHIPROCKET_API_EMAIL || '',
                apiPassword: process.env.SHIPROCKET_API_PASSWORD || '',
                shiprocketOrderCounter: 7417
            });
            await config.save();
        }
        return config;
    }
    // Fallback to JSON
    return readJSONFile(path.join(__dirname, 'data', 'shiprocket_config.json'), {
        enabled: false,
        apiEmail: '',
        apiPassword: '',
        shiprocketOrderCounter: 7417
    });
}

async function updateShiprocketConfig(updates) {
    if (mongoConnected) {
        return await ShiprocketConfig.findOneAndUpdate(
            { configId: 'main' },
            updates,
            { new: true, upsert: true }
        );
    }
    // Fallback to JSON
    const config = readJSONFile(path.join(__dirname, 'data', 'shiprocket_config.json'), {});
    const updated = { ...config, ...updates };
    writeJSONFile(path.join(__dirname, 'data', 'shiprocket_config.json'), updated);
    return updated;
}

// ==================== HELPER FUNCTIONS ====================

function readJSONFile(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return defaultValue;
    }
}

function writeJSONFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error.message);
        return false;
    }
}

module.exports = {
    setMongoStatus,
    getMongoStatus,
    // Departments
    getDepartment,
    getAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    // Orders
    getAllOrders,
    getOrderById,
    getOrdersByStatus,
    createOrder,
    updateOrder,
    deleteOrder,
    updateEmployeeOrders,
    // Shiprocket
    getShiprocketConfig,
    updateShiprocketConfig
};
