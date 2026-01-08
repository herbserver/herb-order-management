// MongoDB Data Access Layer
// This module provides functions to interact with MongoDB collections
// Falls back to JSON files if MongoDB is not connected
// NOW WITH IN-MEMORY CACHING FOR PERFORMANCE

const fs = require('fs');
const path = require('path');
const { Order, Department, ShiprocketConfig } = require('./models');

// Track MongoDB connection status
let mongoConnected = false;

// IN-MEMORY CACHE
const cache = {
    orders: null, // Array of orders
    departments: null, // Object of departments
    shiprocketConfig: null,
    lastRefreshed: {
        orders: 0,
        departments: 0,
        shiprocketConfig: 0
    }
};

const CACHE_TTL = 0; // 0 = Infinite for this session (files update via this process only)
// If you have multiple processes, you'd need a short TTL or file watcher. 
// Assuming single instance for now as per "server.js".

function setMongoStatus(status) {
    mongoConnected = status;
}

function getMongoStatus() {
    return mongoConnected;
}

// ==================== CACHE HELPERS ====================

function loadCache(key, filePath, defaultValue) {
    // If mongo is connected, we don't cache locally in this simple implementation
    // because Mongo has its own internal buffering and we want fresh data.
    // Ideally we would cache mongo too but let's focus on the JSON file bottleneck first.
    if (mongoConnected) return null;

    if (cache[key] === null) {
        // console.log(`[CACHE] Loading ${key} from disk...`);
        cache[key] = readJSONFile(filePath, defaultValue);
    }
    return cache[key];
}

function updateCacheAndDisk(key, filePath, data) {
    if (mongoConnected) return;

    cache[key] = data;
    // Write asynchronously to avoid blocking the event loop
    // But for safety in this specific app which relied on sync, we'll keep it simple or use async file write
    // For "Creating Order is slow", let's make the disk write ASYNC but return immediately.
    writeJSONFileAsync(filePath, data);
}


// ==================== DEPARTMENTS ====================

async function getDepartment(departmentId) {
    if (mongoConnected) {
        return await Department.findOne({ departmentId });
    }
    // Fallback to JSON (Cached)
    const depts = loadCache('departments', path.join(__dirname, 'data', 'departments.json'), {});
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
    // Fallback to JSON (Cached)
    const depts = loadCache('departments', path.join(__dirname, 'data', 'departments.json'), {});
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
    const depts = loadCache('departments', path.join(__dirname, 'data', 'departments.json'), {});
    depts[departmentId] = {
        name: departmentName,
        password,
        type: departmentType,
        employees: {}
    };
    updateCacheAndDisk('departments', path.join(__dirname, 'data', 'departments.json'), depts);
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
    const depts = loadCache('departments', path.join(__dirname, 'data', 'departments.json'), {});
    if (depts[departmentId]) {
        depts[departmentId] = { ...depts[departmentId], ...updates };
        updateCacheAndDisk('departments', path.join(__dirname, 'data', 'departments.json'), depts);
        return { departmentId, ...depts[departmentId] };
    }
    return null;
}

async function deleteDepartment(departmentId) {
    if (mongoConnected) {
        return await Department.findOneAndDelete({ departmentId });
    }
    // Fallback to JSON
    const depts = loadCache('departments', path.join(__dirname, 'data', 'departments.json'), {});
    if (depts[departmentId]) {
        delete depts[departmentId];
        updateCacheAndDisk('departments', path.join(__dirname, 'data', 'departments.json'), depts);
        return true;
    }
    return false;
}

// ==================== ORDERS ====================

// Pagination Support
async function getAllOrders(page = 1, limit = 0) {
    if (mongoConnected) {
        if (limit > 0) {
            const skip = (page - 1) * limit;
            const orders = await Order.find({}).sort({ timestamp: -1 }).skip(skip).limit(limit);
            const total = await Order.countDocuments({});
            return { orders, total };
        }
        // Legacy/Export: Return array directly
        return await Order.find({}).sort({ timestamp: -1 });
    }
    // Fallback to JSON (Cached)
    let orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);

    if (limit > 0) {
        // Sort first if needed, though JSON implies chronological usually. 
        // For consistency let's sort descenting by timestamp
        orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const total = orders.length;
        const start = (page - 1) * limit;
        const sliced = orders.slice(start, start + limit);
        return { orders: sliced, total };
    }
    return orders;
}

async function getOrderById(orderId) {
    if (mongoConnected) {
        return await Order.findOne({ orderId });
    }
    // Fallback to JSON
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    return orders.find(o => o.orderId === orderId);
}

// Optimized: Filter in memory with Pagination
async function getOrdersByStatus(status, page = 1, limit = 0) {
    if (mongoConnected) {
        // Use status as-is - MongoDB has proper case: 'Pending', 'Address Verified', etc.
        if (limit > 0) {
            const skip = (page - 1) * limit;
            const orders = await Order.find({ status: status }).sort({ timestamp: -1 }).skip(skip).limit(limit);
            const total = await Order.countDocuments({ status: status });
            return { orders, total };
        }
        return await Order.find({ status: status }).sort({ timestamp: -1 });
    }
    // Fallback to JSON
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    // Simple in-memory filter
    let filtered = orders.filter(o => o.status === status);

    if (limit > 0) {
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const total = filtered.length;
        const start = (page - 1) * limit;
        const sliced = filtered.slice(start, start + limit);
        return { orders: sliced, total };
    }
    return filtered;
}

// Fast duplicate check - direct database query (INSTANT)
async function findOrderByMobile(telNo) {
    if (mongoConnected) {
        // Direct MongoDB query - very fast with index
        return await Order.findOne({
            $or: [{ telNo: telNo }, { mobileNumber: telNo }],
            status: { $ne: 'Cancelled' }
        }).sort({ timestamp: -1 });
    }
    // Fallback to JSON
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    // Optimized: find instead of filter + sort
    // But we need the LATEST one... JSON is usually appended, so searching from end might be faster,
    // but standard find works from start.
    // Let's stick to existing logic but using cached array.
    const filtered = orders.filter(o =>
        (o.telNo === telNo || o.mobileNumber === telNo) && o.status !== 'Cancelled'
    );
    // Sort logic preserved from original
    return filtered.length > 0 ? filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] : null;
}


async function createOrder(orderData) {
    if (mongoConnected) {
        const order = new Order(orderData);
        return await order.save();
    }
    // Fallback to JSON
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    orders.push(orderData);
    updateCacheAndDisk('orders', path.join(__dirname, 'data', 'orders.json'), orders);
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
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    const index = orders.findIndex(o => o.orderId === orderId);
    if (index !== -1) {
        orders[index] = { ...orders[index], ...updates };
        updateCacheAndDisk('orders', path.join(__dirname, 'data', 'orders.json'), orders);
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
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    const index = orders.findIndex(o => o.orderId === orderId || o.orderId === decodeURIComponent(orderId).trim());
    if (index !== -1) {
        orders.splice(index, 1);
        updateCacheAndDisk('orders', path.join(__dirname, 'data', 'orders.json'), orders);
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
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    let modified = false;
    orders.forEach(order => {
        if (order.employeeId === oldId) {
            if (newId) order.employeeId = newId;
            if (newName) order.employee = newName;
            modified = true;
        }
    });
    if (modified) {
        updateCacheAndDisk('orders', path.join(__dirname, 'data', 'orders.json'), orders);
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
    return loadCache('shiprocketConfig', path.join(__dirname, 'data', 'shiprocket_config.json'), {
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
    const config = loadCache('shiprocketConfig', path.join(__dirname, 'data', 'shiprocket_config.json'), {});
    const updated = { ...config, ...updates };
    updateCacheAndDisk('shiprocketConfig', path.join(__dirname, 'data', 'shiprocket_config.json'), updated);
    return updated;
}

// Optimized Employee Order Fetch
async function getEmployeeOrders(empId, status = null, page = 1, limit = 0) {
    empId = empId.toUpperCase();

    // Check if status is multiple (comma separated)
    let statusFilter = null;
    if (status) {
        if (status.includes(',')) {
            statusFilter = { $in: status.split(',').map(s => s.trim()) };
        } else {
            statusFilter = status;
        }
    }

    if (mongoConnected) {
        const query = { employeeId: empId };
        if (statusFilter) query.status = statusFilter;

        if (limit > 0) {
            const skip = (page - 1) * limit;
            const orders = await Order.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit);
            const total = await Order.countDocuments(query);
            return { orders, total };
        }
        return await Order.find(query).sort({ timestamp: -1 });
    }

    // JSON Fallback
    const orders = loadCache('orders', path.join(__dirname, 'data', 'orders.json'), []);
    let filtered = orders.filter(o => o.employeeId === empId);

    if (status) {
        const statuses = status.split(',').map(s => s.trim());
        filtered = filtered.filter(o => statuses.includes(o.status));
    }

    if (limit > 0) {
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const total = filtered.length;
        const start = (page - 1) * limit;
        const sliced = filtered.slice(start, start + limit);
        return { orders: sliced, total };
    }
    return filtered;
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

// Async write to prevent blocking main thread
function writeJSONFileAsync(filePath, data) {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) console.error(`Error writing ${filePath}:`, err.message);
    });
}

// Keeping sync version for internal use if strictly needed, but replaced usage above
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
    findOrderByMobile,
    createOrder,
    updateOrder,
    deleteOrder,
    updateEmployeeOrders,
    getEmployeeOrders,
    // Shiprocket
    getShiprocketConfig,
    updateShiprocketConfig
};
