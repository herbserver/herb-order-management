const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize MongoDB
const { connectDatabase, initializeDefaultData, Order, Department, ShiprocketConfig } = require('./database');
const dataAccess = require('./dataAccess');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Request Logger Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

// Data Files Path
const DATA_DIR = path.join(__dirname, 'data');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');
const DEPARTMENTS_FILE = path.join(DATA_DIR, 'departments.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const DELIVERY_REQUESTS_FILE = path.join(DATA_DIR, 'delivery_requests.json');
const SALE_FILE = path.join(DATA_DIR, 'Sale File 2025 All Orders.xlsx');
const PINCODES_FILE = path.join(__dirname, 'public', 'data', 'pincodes.json');

// Load Pincode Database in Memory (for fast search)
let pincodeDatabase = [];
console.log('📍 Loading Pincode Database...');
try {
    const pincodeData = fs.readFileSync(PINCODES_FILE, 'utf8');
    pincodeDatabase = JSON.parse(pincodeData);
    console.log(`✅ Loaded ${pincodeDatabase.length.toLocaleString()} pincode records in memory`);
} catch (error) {
    console.error('❌ Error loading pincode database:', error.message);
    pincodeDatabase = [];
}

// Track database connection status
let isMongoDBConnected = false;

// Set MongoDB connection flag (called from database.js after successful connection)
function setDBStatus(status) {
    isMongoDBConnected = status;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ==================== HYBRID DATA ACCESS LAYER ====================
// These functions use MongoDB when available, fall back to JSON files

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

// Initialize default JSON data (fallback)
function initializeData() {
    if (!fs.existsSync(EMPLOYEES_FILE)) writeJSON(EMPLOYEES_FILE, {});
    if (!fs.existsSync(DEPARTMENTS_FILE)) writeJSON(DEPARTMENTS_FILE, {});
    if (!fs.existsSync(ORDERS_FILE)) writeJSON(ORDERS_FILE, []);
    if (!fs.existsSync(CONFIG_FILE)) writeJSON(CONFIG_FILE, { nextOrderId: 1 });
    if (!fs.existsSync(DELIVERY_REQUESTS_FILE)) writeJSON(DELIVERY_REQUESTS_FILE, []);
}

initializeData();

// Export DB status setter for database.js
module.exports.setDBStatus = setDBStatus;

// ==================== EMPLOYEE APIs ====================

// Register Employee
app.post('/api/register', (req, res) => {
    const { name, employeeId, password } = req.body;

    if (!name || !employeeId || !password) {
        return res.status(400).json({ success: false, message: 'All fields required!' });
    }

    const employees = readJSON(EMPLOYEES_FILE, {});
    const id = employeeId.toUpperCase();

    if (employees[id]) {
        return res.status(400).json({ success: false, message: `Employee ID (${id}) already exists!` });
    }

    employees[id] = { name, password, createdAt: new Date().toISOString() };
    writeJSON(EMPLOYEES_FILE, employees);

    console.log(`✅ New Employee Registered: ${name} (${id})`);
    res.json({ success: true, message: 'Registration successful!', employee: { id, name } });
});

// Employee Login
app.post('/api/login', (req, res) => {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
        return res.status(400).json({ success: false, message: 'ID and Password required!' });
    }

    const employees = readJSON(EMPLOYEES_FILE, {});
    const id = employeeId.toUpperCase();

    if (!employees[id]) {
        return res.status(401).json({ success: false, message: 'Employee ID not found!' });
    }

    if (employees[id].password !== password) {
        return res.status(401).json({ success: false, message: 'Wrong Password!' });
    }

    console.log(`✅ Employee Login: ${employees[id].name} (${id})`);
    res.json({ success: true, message: 'Login successful!', employee: { id, name: employees[id].name } });
});

// Reset Password
app.post('/api/reset-password', (req, res) => {
    const { employeeId, newPassword } = req.body;

    const employees = readJSON(EMPLOYEES_FILE, {});
    const id = employeeId.toUpperCase();

    if (!employees[id]) {
        return res.status(404).json({ success: false, message: 'Employee not found!' });
    }

    employees[id].password = newPassword;
    writeJSON(EMPLOYEES_FILE, employees);

    res.json({ success: true, message: 'Password reset successful!' });
});

// Get All Employees (for Admin)
app.get('/api/employees', (req, res) => {
    const employees = readJSON(EMPLOYEES_FILE, {});
    const orders = readJSON(ORDERS_FILE, []);

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

    res.json({ success: true, employees: employeeList });
});

// Get Single Employee with Orders (for Admin Profile View)
app.get('/api/employees/:empId', (req, res) => {
    const employees = readJSON(EMPLOYEES_FILE, {});
    const orders = readJSON(ORDERS_FILE, []);
    const id = req.params.empId.toUpperCase();

    if (!employees[id]) {
        return res.status(404).json({ success: false, message: 'Employee not found!' });
    }

    const empOrders = orders.filter(o => o.employeeId === id);
    empOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
        success: true,
        employee: {
            id,
            name: employees[id].name,
            createdAt: employees[id].createdAt
        },
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
});

// ==================== DEPARTMENT APIs ====================

// Register Department
app.post('/api/departments/register', async (req, res) => {
    try {
        const { name, deptId, password, deptType } = req.body;

        if (!name || !deptId || !password || !deptType) {
            return res.status(400).json({ success: false, message: 'All fields required!' });
        }

        const id = deptId.toUpperCase();
        const existing = await dataAccess.getDepartment(id);

        if (existing) {
            return res.status(400).json({ success: false, message: `Department ID (${id}) already exists!` });
        }

        await dataAccess.createDepartment(id, name, password, deptType);

        console.log(`✅ New Department Registered: ${name} (${id}) - Type: ${deptType}`);
        res.json({ success: true, message: 'Department registered!', department: { id, name, type: deptType } });
    } catch (error) {
        console.error('❌ Department register error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
});

// Department Login
app.post('/api/departments/login', async (req, res) => {
    try {
        const { deptId, password, deptType } = req.body;

        if (!deptId || !password) {
            return res.status(400).json({ success: false, message: 'ID and Password required!' });
        }

        const id = deptId.toUpperCase();
        const department = await dataAccess.getDepartment(id);

        if (!department) {
            return res.status(401).json({ success: false, message: 'Department ID not found!' });
        }

        if (department.password !== password) {
            return res.status(401).json({ success: false, message: 'Wrong Password!' });
        }

        if (department.departmentType !== deptType) {
            return res.status(401).json({ success: false, message: 'Wrong department type!' });
        }

        console.log(`✅ Department Login: ${department.departmentName} (${id}) - ${deptType}`);
        res.json({
            success: true,
            message: 'Login successful!',
            department: {
                id,
                name: department.departmentName,
                type: department.departmentType
            }
        });
    } catch (error) {
        console.error('Department login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// Get All Departments (for Admin)
app.get('/api/departments', async (req, res) => {
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

// Update Department (Admin Edit)
app.put('/api/departments/:deptId', async (req, res) => {
    try {
        const { name, password } = req.body;
        const id = req.params.deptId.toUpperCase();

        const department = await dataAccess.getDepartment(id);

        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found!' });
        }

        // Build update object
        const updates = {};
        if (name) {
            updates.departmentName = name;
            updates.name = name; // For JSON compatibility
        }
        if (password) updates.password = password;

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

// Delete Department (Admin)
app.delete('/api/departments/:deptId', (req, res) => {
    const departments = readJSON(DEPARTMENTS_FILE, {});
    const id = req.params.deptId.toUpperCase();

    if (!departments[id]) {
        return res.status(404).json({ success: false, message: 'Department not found!' });
    }

    delete departments[id];
    writeJSON(DEPARTMENTS_FILE, departments);

    console.log(`🗑️ Department Deleted: ${id}`);
    res.json({ success: true, message: 'Department deleted!' });
});

// ==================== ORDER APIs ====================

// Create Order (Employee)
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        const config = await dataAccess.getShiprocketConfig();
        const nextId = config.shiprocketOrderCounter || 7417;
        const orderId = `HON${nextId.toString().padStart(4, '0')}`;

        // Update counter
        await dataAccess.updateShiprocketConfig({ shiprocketOrderCounter: nextId + 1 });

        const newOrder = {
            ...orderData,
            orderId,
            status: 'Pending',
            tracking: null,
            deliveryRequested: false,
            timestamp: new Date().toISOString()
        };

        await dataAccess.createOrder(newOrder);

        console.log(`📦 New Order: ${orderId} by ${orderData.employee} (${orderData.employeeId}) - Status: Pending`);
        res.json({ success: true, message: 'Order saved!', orderId });
    } catch (error) {
        console.error('❌ Create order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// Update Order (Department Edit)
app.put('/api/orders/:orderId', async (req, res) => {
    try {
        const order = await dataAccess.getOrderById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

        const updates = { ...req.body, updatedAt: new Date().toISOString() };
        const updated = await dataAccess.updateOrder(req.params.orderId, updates);

        console.log(`✏️ Order Updated: ${req.params.orderId}`);
        res.json({ success: true, message: 'Order updated!', order: updated });
    } catch (error) {
        console.error('❌ Update order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get All Orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await dataAccess.getAllOrders();
        res.json({ success: true, orders });
    } catch (error) {
        console.error('❌ Get orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Pending Orders (for Verification Dept)
app.get('/api/orders/pending', async (req, res) => {
    try {
        const pendingOrders = await dataAccess.getOrdersByStatus('Pending');
        console.log(`📋 Pending Orders for Verification: ${pendingOrders.length}`);
        res.json({ success: true, orders: pendingOrders });
    } catch (error) {
        console.error('❌ Get pending orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Verified Orders (for Dispatch Dept)
app.get('/api/orders/verified', async (req, res) => {
    try {
        const verifiedOrders = await dataAccess.getOrdersByStatus('Address Verified');
        console.log(`📋 Verified Orders for Dispatch: ${verifiedOrders.length}`);
        res.json({ success: true, orders: verifiedOrders });
    } catch (error) {
        console.error('❌ Get verified orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Dispatched Orders
app.get('/api/orders/dispatched', async (req, res) => {
    try {
        const dispatchedOrders = await dataAccess.getOrdersByStatus('Dispatched');
        res.json({ success: true, orders: dispatchedOrders });
    } catch (error) {
        console.error('❌ Get dispatched orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Delivered Orders
app.get('/api/orders/delivered', async (req, res) => {
    try {
        const deliveredOrders = await dataAccess.getOrdersByStatus('Delivered');
        res.json({ success: true, orders: deliveredOrders });
    } catch (error) {
        console.error('❌ Get delivered orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Employee's Orders
app.get('/api/orders/employee/:empId', async (req, res) => {
    try {
        const orders = await dataAccess.getAllOrders();
        const empOrders = orders.filter(o => o.employeeId === req.params.empId.toUpperCase());
        res.json({ success: true, orders: empOrders });
    } catch (error) {
        console.error('❌ Get employee orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Single Order
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const order = await dataAccess.getOrderById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('❌ Get order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update Order Status (Generic - e.g. On Hold)
app.put('/api/orders/:orderId/status', async (req, res) => {
    try {
        const { status, employee } = req.body;
        const updates = {
            status,
            updatedAt: new Date().toISOString()
        };

        const updated = await dataAccess.updateOrder(req.params.orderId, updates);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

        console.log(`🔄 Status Update: ${req.params.orderId} -> ${status} (${employee || 'Unknown'})`);
        res.json({ success: true, message: 'Status updated!', order: updated });
    } catch (error) {
        console.error('❌ Status update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Verify Address (Verification Dept)
app.put('/api/orders/:orderId/verify', async (req, res) => {
    try {
        const updates = {
            status: 'Address Verified',
            verifiedAt: new Date().toISOString(),
            verifiedBy: req.body.verifiedBy || 'Address Dept'
        };

        const updated = await dataAccess.updateOrder(req.params.orderId, updates);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

        console.log(`✅ Address Verified: ${req.params.orderId} - Now goes to Dispatch Dept`);
        res.json({ success: true, message: 'Address verified! Order moved to Dispatch Department.', order: updated });
    } catch (error) {
        console.error('❌ Verify error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Save Remark (Verification Dept)
app.put('/api/orders/:orderId/remark', async (req, res) => {
    try {
        const { remark, remarkBy } = req.body;
        const updates = {
            verificationRemark: {
                text: remark || '',
                addedBy: remarkBy || 'Verification Dept',
                addedAt: new Date().toISOString()
            }
        };

        const updated = await dataAccess.updateOrder(req.params.orderId, updates);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

        console.log(`📝 Remark Added to ${req.params.orderId}: "${remark?.substring(0, 50)}..."`);
        res.json({ success: true, message: 'Remark saved!', order: updated });
    } catch (error) {
        console.error('❌ Remark error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Dispatch Order (Dispatch Dept)
app.put('/api/orders/:orderId/dispatch', async (req, res) => {
    try {
        const { courier, trackingId, dispatchedBy } = req.body;

        const updates = {
            status: 'Dispatched',
            tracking: {
                courier: courier || '',
                trackingId: trackingId || '',
                dispatchedAt: new Date().toISOString()
            },
            dispatchedBy: dispatchedBy || 'Dispatch Dept'
        };

        const updated = await dataAccess.updateOrder(req.params.orderId, updates);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

        console.log(`🚚 Order Dispatched: ${req.params.orderId} - Courier: ${courier}, Tracking: ${trackingId}`);
        res.json({ success: true, message: 'Order dispatched with tracking!', order: updated });
    } catch (error) {
        console.error('❌ Dispatch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Request Delivery (Employee creates request)
app.post('/api/orders/:orderId/request-delivery', async (req, res) => {
    try {
        const { employeeId, employeeName } = req.body;
        const orderId = req.params.orderId;

        const updates = {
            deliveryRequested: true,
            deliveryRequestedBy: {
                employeeId,
                employeeName,
                requestedAt: new Date().toISOString()
            }
        };

        const updated = await dataAccess.updateOrder(orderId, updates);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Order not found!' })
        }

        console.log(`📦 Delivery Request: ${orderId} by ${employeeName} (${employeeId})`);
        res.json({ success: true, message: 'Delivery request sent to Dispatch Dept!', order: updated });
    } catch (error) {
        console.error('❌ Delivery request error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Delivery Requests (For Dispatch Dept)
app.get('/api/delivery-requests', (req, res) => {
    const requests = readJSON(DELIVERY_REQUESTS_FILE, []);
    const pendingRequests = requests.filter(r => r.status === 'pending');
    pendingRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    res.json({ success: true, requests: pendingRequests });
});

// Mark Delivered (Dispatch Dept approves request)
app.put('/api/orders/:orderId/deliver', (req, res) => {
    const orderId = req.params.orderId;
    const { approvedBy } = req.body;

    const orders = readJSON(ORDERS_FILE, []);
    const index = orders.findIndex(o => o.orderId === orderId);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Order not found!' });
    }

    orders[index].status = 'Delivered';
    orders[index].deliveredAt = new Date().toISOString();
    orders[index].deliveredBy = approvedBy || 'Dispatch Dept';
    orders[index].deliveryRequested = false;
    writeJSON(ORDERS_FILE, orders);

    // Update delivery request status
    const requests = readJSON(DELIVERY_REQUESTS_FILE, []);
    const requestIndex = requests.findIndex(r => r.orderId === orderId && r.status === 'pending');
    if (requestIndex !== -1) {
        requests[requestIndex].status = 'approved';
        requests[requestIndex].approvedAt = new Date().toISOString();
        writeJSON(DELIVERY_REQUESTS_FILE, requests);
    }

    console.log(`✅ Order Delivered: ${orderId} `);
    res.json({ success: true, message: 'Order marked as delivered!', order: orders[index] });
});

// Delete Order
app.delete('/api/orders/:orderId', (req, res) => {
    let orders = readJSON(ORDERS_FILE, []);
    const initialLength = orders.length;
    orders = orders.filter(o => o.orderId !== req.params.orderId);

    if (orders.length === initialLength) {
        return res.status(404).json({ success: false, message: 'Order not found!' });
    }

    writeJSON(ORDERS_FILE, orders);

    console.log(`🗑️ Order Deleted: ${req.params.orderId} `);
    res.json({ success: true, message: 'Order deleted!' });
});



// Get Sales Data from JSON
app.get('/api/orders/export', (req, res) => {
    console.log('📊 Export request received');
    try {
        const orders = readJSON(ORDERS_FILE, []);
        console.log(`📊 Found ${orders.length} orders to export `);

        if (!Array.isArray(orders)) {
            throw new Error('Orders data is not an array');
        }

        // Transform data for Excel
        const exportData = orders.map((order, index) => {
            try {
                let address = order.address || '';
                // Format address if it's an object
                if (typeof address === 'object' && address !== null) {
                    address = `${address.houseNo || ''}, ${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''} `;
                }

                // Handle items safely
                let productNames = '';
                if (Array.isArray(order.items)) {
                    productNames = order.items.map(i => i && i.description ? i.description : '').join(', ');
                } else if (typeof order.items === 'string') {
                    productNames = order.items;
                }

                return {
                    "S.No": index + 1,
                    "Customer Name": order.customerName || '',
                    "Mobile Number": order.mobileNumber || '',
                    "Address": address,
                    "Add1": "",
                    "Add2": "",
                    "Add3": "",
                    "Order Date": order.timestamp ? new Date(order.timestamp).toLocaleDateString('en-GB') : '',
                    "Delivered Date": order.status === 'Delivered' ? (order.deliveryDate || '') : '',
                    "Product Name": productNames,
                    "Delivery Status": order.status || '',
                    "Amount Rs.": order.total || 0,
                    "Advance Payment": 0,
                    "Payment Method": order.paymentMode || 'COD',
                    "Agent": order.employee || '',
                    "Order Type": order.orderType || 'New',
                    "Invoice Date": order.timestamp ? new Date(order.timestamp).toLocaleDateString('en-GB') : '',
                    "Delivered by": order.dispatchedBy || '',
                    "AWB Number": order.tracking ? (order.tracking.trackingId || '') : '',
                    "RTO Status": order.rtoStatus || ''
                };
            } catch (err) {
                console.error(`⚠️ Error processing order index ${index}: `, err);
                return null; // Skip bad records
            }
        }).filter(item => item !== null); // Filter out failed records

        console.log(`📊 Successfully transformed ${exportData.length} records`);

        const ws = xlsx.utils.json_to_sheet(exportData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Orders");

        // Write to buffer
        const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Send headers
        res.setHeader('Content-Disposition', `attachment; filename = "HerbOrders_${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);

        console.log(`✅ Excel Export completed successfully`);

    } catch (e) {
        console.error('❌ CRITICAL Export Error:', e);
        res.status(500).json({ success: false, message: 'Export failed: ' + e.message });
    }
});

app.get('/api/sales-data', (req, res) => {
    try {
        const jsonFile = path.join(DATA_DIR, 'Sale File 2025 All Orders.json');

        if (!fs.existsSync(jsonFile)) {
            return res.status(404).json({ success: false, message: 'Sale file (JSON) not found!' });
        }

        // Read JSON directly
        const rawData = fs.readFileSync(jsonFile, 'utf8');
        const jsonData = JSON.parse(rawData);

        // Return the "General" array
        // We return the logic that the frontend expects: just the data object/array
        // The frontend will handle parsing the specific 'General' key if needed, 
        // OR we can normalize it here. 
        // Let's pass the whole JSON object so the frontend can access "General".
        res.json({ success: true, data: jsonData });
    } catch (e) {
        console.error('Sale File Error:', e);
        res.status(500).json({ success: false, message: 'Failed to load sale file' });
    }
});

// ==================== ADMIN APIs ====================

// Get Order History (with filters)
app.get('/api/admin/history', (req, res) => {
    const orders = readJSON(ORDERS_FILE, []);
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
});

// Get Dashboard Stats
app.get('/api/admin/stats', (req, res) => {
    const orders = readJSON(ORDERS_FILE, []);
    const employees = readJSON(EMPLOYEES_FILE, {});
    const departments = readJSON(DEPARTMENTS_FILE, {});

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
            thisMonthOrders: thisMonth.length,
            totalEmployees: Object.keys(employees).length,
            totalDepartments: Object.keys(departments).length
        }
    });
});

// ==================== LOCATION DROPDOWN API ====================

// Get All States
app.get('/api/locations/states', (req, res) => {
    try {
        // Extract unique states
        const states = [...new Set(pincodeDatabase.map(item => item.stateName))].sort();
        res.json({ success: true, states });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching states' });
    }
});

// Get Districts by State
app.get('/api/locations/districts', (req, res) => {
    const state = req.query.state;
    if (!state) return res.status(400).json({ success: false, message: 'State is required' });

    try {
        const districts = [...new Set(
            pincodeDatabase
                .filter(item => item.stateName.toLowerCase() === state.toLowerCase())
                .map(item => item.districtName)
        )].sort();
        res.json({ success: true, districts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching districts' });
    }
});

// Search Districts (Global Search for Autocomplete)
app.get('/api/locations/search-district', (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) return res.json({ success: true, districts: [] });

    try {
        const q = query.toLowerCase();
        // Return Name and State for unique pairings
        const results = [];
        const seen = new Set();

        for (const item of pincodeDatabase) {
            if (item.districtName.toLowerCase().includes(q)) {
                const key = `${item.districtName}| ${item.stateName} `;
                if (!seen.has(key)) {
                    seen.add(key);
                    const distLower = item.districtName.toLowerCase();
                    results.push({
                        district: item.districtName,
                        state: item.stateName,
                        // Add priority for sorting
                        priority: distLower === q ? 1 : (distLower.startsWith(q) ? 2 : 3)
                    });
                }
            }
            if (results.length > 100) break; // Limit results
        }

        // Sort by priority (1=exact, 2=starts, 3=contains), then alphabetically
        results.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.district.localeCompare(b.district);
        });

        // Remove priority field before sending
        const finalResults = results.map(r => ({ district: r.district, state: r.state }));

        res.json({ success: true, districts: finalResults });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error searching districts' });
    }
});

// Search Post Offices (Global Search for Autocomplete)
app.get('/api/locations/search-po', (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) return res.json({ success: true, offices: [] });

    try {
        const q = query.toLowerCase();
        const results = [];
        // Limit to 20 results
        let count = 0;

        for (const item of pincodeDatabase) {
            // Search in Office Name OR Taluk (Block) OR District Name
            if (
                item.officeName.toLowerCase().includes(q) ||
                (item.taluk && item.taluk.toLowerCase().includes(q)) ||
                (item.districtName && item.districtName.toLowerCase().includes(q))
            ) {
                results.push({
                    office: item.officeName,
                    pincode: item.pincode,
                    taluk: item.taluk,
                    district: item.districtName,
                    state: item.stateName
                });
                count++;
            }
            if (count >= 100) break;
        }
        res.json({ success: true, offices: results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error searching post offices' });
    }
});

// Smart Search (Searches EVERYTHING)
app.get('/api/locations/smart-search', (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) return res.json({ success: true, results: [] });

    try {
        const q = query.toLowerCase();
        const results = [];
        let count = 0;

        // Search in District, Office, Pincode OR Taluk
        for (const item of pincodeDatabase) {
            if (
                item.districtName.toLowerCase().includes(q) ||
                item.officeName.toLowerCase().includes(q) ||
                item.pincode.toString().includes(q) ||
                (item.taluk && item.taluk.toLowerCase().includes(q))
            ) {
                results.push({
                    office: item.officeName,
                    pincode: item.pincode,
                    taluk: item.taluk,
                    district: item.districtName,
                    state: item.stateName
                });
                count++;
            }
            if (count >= 100) break;
        }

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error in smart search' });
    }
});

// GET offices by District (For Explorer Modal)
app.get('/api/locations/district/:name', (req, res) => {
    const distName = req.params.name.toLowerCase();
    try {
        const results = pincodeDatabase.filter(item =>
            item.districtName.toLowerCase() === distName
        ).map(item => ({
            Name: item.officeName,
            Pincode: item.pincode,
            Block: item.taluk,
            District: item.districtName,
            State: item.stateName
        }));

        // Wrap in legacy format expected by frontend or just clean list
        // Returning simple list is better, will update frontend to match
        res.json({ success: true, offices: results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching district details' });
    }
});

// Get Talukas by District
app.get('/api/locations/talukas', (req, res) => {
    const district = req.query.district;
    if (!district) return res.status(400).json({ success: false, message: 'District is required' });

    try {
        const talukas = [...new Set(
            pincodeDatabase
                .filter(item => item.districtName.toLowerCase() === district.toLowerCase())
                .map(item => item.taluk)
        )].sort();
        res.json({ success: true, talukas });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching talukas' });
    }
});

// Get Details by Taluka & District
app.get('/api/locations/details', (req, res) => {
    const { taluka, district } = req.query;
    if (!taluka || !district) return res.status(400).json({ success: false, message: 'Taluka and District required' });

    try {
        // Find best match
        const match = pincodeDatabase.find(item =>
            item.taluk.toLowerCase() === taluka.toLowerCase() &&
            item.districtName.toLowerCase() === district.toLowerCase()
        );

        if (match) {
            res.json({ success: true, details: match });
        } else {
            res.status(404).json({ success: false, message: 'Location not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching details' });
    }
});

// Search Pincode Database (Smart Search)
app.get('/api/search-pincode', (req, res) => {
    const query = req.query.q;
    const districtFilter = req.query.district ? req.query.district.trim().toLowerCase() : null;

    if (!query || query.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
    }

    const searchTerm = query.trim().toLowerCase();

    try {
        // Search across district, taluk, state, and office names
        // IF district is provided, strictly enforce it
        const results = pincodeDatabase.filter(item => {
            const matchesTerm = item.districtName.toLowerCase().includes(searchTerm) ||
                item.taluk.toLowerCase().includes(searchTerm) ||
                item.stateName.toLowerCase().includes(searchTerm) ||
                item.officeName.toLowerCase().includes(searchTerm);

            if (districtFilter) {
                return matchesTerm && item.districtName.toLowerCase().includes(districtFilter);
            }
            return matchesTerm;
        });

        // Sort results: Exact matches first, then partial matches
        results.sort((a, b) => {
            // Check for exact matches
            const aExactDistrict = a.districtName.toLowerCase() === searchTerm;
            const bExactDistrict = b.districtName.toLowerCase() === searchTerm;
            const aExactTaluk = a.taluk.toLowerCase() === searchTerm;
            const bExactTaluk = b.taluk.toLowerCase() === searchTerm;
            const aExactOffice = a.officeName.toLowerCase() === searchTerm;
            const bExactOffice = b.officeName.toLowerCase() === searchTerm;

            // Exact district match has highest priority
            if (aExactDistrict && !bExactDistrict) return -1;
            if (!aExactDistrict && bExactDistrict) return 1;

            // Then exact taluk match
            if (aExactTaluk && !bExactTaluk) return -1;
            if (!aExactTaluk && bExactTaluk) return 1;

            // Then exact office match
            if (aExactOffice && !bExactOffice) return -1;
            if (!aExactOffice && bExactOffice) return 1;

            // For partial matches, prefer matches at the start
            const aStartsDistrict = a.districtName.toLowerCase().startsWith(searchTerm);
            const bStartsDistrict = b.districtName.toLowerCase().startsWith(searchTerm);
            if (aStartsDistrict && !bStartsDistrict) return -1;
            if (!aStartsDistrict && bStartsDistrict) return 1;

            return 0; // Keep original order for same priority
        });

        // Group by pincode while maintaining sort order
        const grouped = {};
        const orderedPincodes = []; // Track order of first occurrence

        results.forEach(item => {
            if (!grouped[item.pincode]) {
                grouped[item.pincode] = {
                    pincode: item.pincode,
                    district: item.districtName,
                    state: item.stateName,
                    taluk: item.taluk,
                    offices: []
                };
                orderedPincodes.push(item.pincode); // Remember order
            }
            grouped[item.pincode].offices.push(item.officeName);
        });

        // Convert to array in the correct order
        const finalResults = orderedPincodes.map(pin => grouped[pin]).slice(0, 100);

        console.log(`🔍 Pincode Search: "${query}" - Found ${results.length} matches, returning ${finalResults.length} pincodes`);
        res.json({
            success: true,
            query: query,
            totalMatches: results.length,
            results: finalResults
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Search failed', error: error.message });
    }
});

// ==================== LOCAL PINCODE LOOKUP API ====================

// Get Pincode Details (Local - Replaces external API)
app.get('/api/pincode/:pincode', (req, res) => {
    const pincode = req.params.pincode;

    if (!pincode || pincode.length !== 6) {
        return res.status(400).json({
            success: false,
            message: 'Valid 6-digit pincode required'
        });
    }

    try {
        // Find all records for this pincode
        const records = pincodeDatabase.filter(item => item.pincode == pincode);

        if (records.length === 0) {
            return res.json([{
                Status: "Error",
                Message: "No records found",
                PostOffice: null
            }]);
        }

        // Extract unique post offices
        const postOffices = records.map(item => ({
            Name: item.officeName,
            District: item.districtName,
            State: item.stateName,
            Block: item.taluk,
            Region: item.regionName || 'NA',
            Pincode: item.pincode
        }));

        // Return in external API format for compatibility
        res.json([{
            Status: "Success",
            Message: "Number of records found",
            PostOffice: postOffices
        }]);

        console.log(`🔍 Pincode Lookup: ${pincode} - Found ${postOffices.length} post offices`);

    } catch (error) {
        console.error('Pincode lookup error:', error);
        res.status(500).json([{
            Status: "Error",
            Message: "Search failed",
            PostOffice: null
        }]);
    }
});

// Get Location Details by City/District (Local - Replaces external API)
app.get('/api/postoffice/:query', (req, res) => {
    const query = req.params.query.toLowerCase();

    if (!query || query.length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Query must be at least 2 characters'
        });
    }

    try {
        // Search in district names and office names
        const results = pincodeDatabase.filter(item =>
            item.districtName.toLowerCase().includes(query) ||
            item.officeName.toLowerCase().includes(query) ||
            item.taluk.toLowerCase().includes(query)
        );

        if (results.length === 0) {
            return res.json([{
                Status: "Error",
                Message: "No records found",
                PostOffice: null
            }]);
        }

        // Group by office name to get all unique offices
        const uniqueOffices = {};
        results.forEach(item => {
            const key = `${item.officeName}_${item.pincode} `;
            if (!uniqueOffices[key]) {
                uniqueOffices[key] = {
                    Name: item.officeName,
                    District: item.districtName,
                    State: item.stateName,
                    Block: item.taluk,
                    Region: item.regionName || 'NA',
                    Pincode: item.pincode
                };
            }
        });

        const postOffices = Object.values(uniqueOffices);

        // Return in external API format
        res.json([{
            Status: "Success",
            Message: "Number of records found",
            PostOffice: postOffices
        }]);

        console.log(`🔍 Location Search: "${query}" - Found ${postOffices.length} locations`);

    } catch (error) {
        console.error('Location search error:', error);
        res.status(500).json([{
            Status: "Error",
            Message: "Search failed",
            PostOffice: null
        }]);
    }
});

// Get Village/Office Autocomplete Suggestions (Local)
app.get('/api/autocomplete/village', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';

    if (!query || query.length < 2) {
        return res.json({ success: true, suggestions: [] });
    }

    try {
        // Find matching office names
        const matches = new Set();

        pincodeDatabase.forEach(item => {
            if (item.officeName.toLowerCase().includes(query)) {
                matches.add(item.officeName);
            }
        });

        // Convert to array and limit to 10 suggestions
        const suggestions = Array.from(matches).slice(0, 10);

        res.json({
            success: true,
            query: query,
            suggestions: suggestions
        });

        console.log(`🔍 Village Autocomplete: "${query}" - ${suggestions.length} suggestions`);

    } catch (error) {
        console.error('Autocomplete error:', error);
        res.status(500).json({ success: false, suggestions: [] });
    }
});

// Get Taluka/Sub-district Autocomplete Suggestions (Local)
app.get('/api/autocomplete/taluka', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';

    if (!query || query.length < 2) {
        return res.json({ success: true, suggestions: [] });
    }

    try {
        // Find matching taluka names
        const matches = new Set();

        pincodeDatabase.forEach(item => {
            if (item.taluk && item.taluk.toLowerCase().includes(query)) {
                matches.add(item.taluk);
            }
        });

        // Convert to array and limit to 10 suggestions
        const suggestions = Array.from(matches).slice(0, 10);

        res.json({
            success: true,
            query: query,
            suggestions: suggestions
        });

        console.log(`🔍 Taluka Autocomplete: "${query}" - ${suggestions.length} suggestions`);

    } catch (error) {
        console.error('Taluka autocomplete error:', error);
        res.status(500).json({ success: false, suggestions: [] });
    }
});

// Update order tracking status
app.post('/api/orders/update-tracking', (req, res) => {
    try {
        const { orderId, tracking } = req.body;
        const orders = readJSON(ORDERS_FILE, []);
        const orderIndex = orders.findIndex(o => o.orderId === orderId);

        if (orderIndex === -1) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update tracking info
        orders[orderIndex].tracking = {
            ...orders[orderIndex].tracking,
            ...tracking,
            lastUpdatedAt: new Date().toISOString()
        };

        writeJSON(ORDERS_FILE, orders);
        res.json({ success: true });
    } catch (e) {
        console.error('Update tracking error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});



app.post('/api/couriers/check', async (req, res) => {
    const { pickup_postcode, delivery_postcode, weight, cod } = req.body;

    if (SHIPROCKET_EMAIL === "YOUR_EMAIL_HERE") {
        return res.status(401).json({ success: false, message: 'Please configure SHIPROCKET_EMAIL in server.js' });
    }

    try {
        const token = await getShiprocketToken();

        // 1. Check Serviceability
        const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${pickup_postcode}&delivery_postcode=${delivery_postcode}&weight=${weight}&cod=${cod}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.status === 200 && data.data && data.data.available_courier_companies) {
            // Sort by Rating (desc) then Rate (asc)
            const couriers = data.data.available_courier_companies.map(c => ({
                name: c.courier_name,
                rating: c.rating || 3.0,
                rate: c.rate,
                etd: c.etd,
                mode: c.mode_name || 'Surface',
                min_weight: c.min_weight
            })).sort((a, b) => b.rating - a.rating);

            res.json({ success: true, couriers, recommended: data.data.recommended_courier_company_id });
        } else {
            res.json({ success: false, message: 'No couriers available for this route', apiData: data });
        }
    } catch (error) {
        console.error('❌ Courier Check Error:', error.message);
        // If 401, retry login once (logic omitted for brevity, user can retry)
        if (error.message.includes('401')) shiprocketToken = null;
        res.status(500).json({ success: false, message: 'Courier check failed: ' + error.message });
    }
});

// ==================== SHIPROCKET APIs ====================

const SHIPROCKET_CONFIG_FILE = path.join(DATA_DIR, 'shiprocket_config.json');
const SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in/v1/external';

function getShiprocketConfig() {
    return readJSON(SHIPROCKET_CONFIG_FILE, {
        enabled: false, apiEmail: '', apiPassword: '', authToken: null, tokenExpiry: null,
        pickupAddress: {}, defaultDimensions: { length: 10, breadth: 10, height: 5, weight: 0.5 }
    });
}

function saveShiprocketConfig(config) {
    return writeJSON(SHIPROCKET_CONFIG_FILE, config);
}

async function makeShiprocketRequest(endpoint, method = 'GET', body = null, token = null) {
    const https = require('https');
    const url = new URL(`${SHIPROCKET_API_BASE}${endpoint}`);
    const options = {
        hostname: url.hostname, path: url.pathname + url.search, method: method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch (e) { reject(new Error('Invalid JSON')); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function authenticateShiprocket() {
    const config = getShiprocketConfig();
    if (!config.apiEmail || !config.apiPassword) throw new Error('Shiprocket not configured');

    if (config.authToken && config.tokenExpiry) {
        const expiry = new Date(config.tokenExpiry).getTime();
        if (Date.now() < (expiry - 3600000)) return config.authToken;
    }

    const response = await makeShiprocketRequest('/auth/login', 'POST', {
        email: config.apiEmail, password: config.apiPassword
    });

    if (response.status === 200 && response.data.token) {
        config.authToken = response.data.token;
        config.tokenExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
        saveShiprocketConfig(config);
        console.log('✅ Shiprocket authenticated');
        return config.authToken;
    }
    throw new Error('Authentication failed');
}

app.get('/api/shiprocket/config', (req, res) => {
    const config = getShiprocketConfig();
    res.json({
        success: true, config: {
            enabled: config.enabled, apiEmail: config.apiEmail, hasPassword: !!config.apiPassword,
            hasToken: !!config.authToken, tokenExpiry: config.tokenExpiry,
            pickupAddress: config.pickupAddress, defaultDimensions: config.defaultDimensions
        }
    });
});

app.post('/api/shiprocket/config', async (req, res) => {
    try {
        const { apiEmail, apiPassword, pickupAddress, defaultDimensions } = req.body;
        const config = getShiprocketConfig();
        if (apiEmail) config.apiEmail = apiEmail;
        if (apiPassword) config.apiPassword = apiPassword;
        if (pickupAddress) config.pickupAddress = pickupAddress;
        if (defaultDimensions) config.defaultDimensions = defaultDimensions;
        config.enabled = true;
        saveShiprocketConfig(config);

        try {
            await authenticateShiprocket();
            res.json({ success: true, message: 'Shiprocket configured!' });
        } catch (e) {
            res.json({ success: false, message: 'Config saved but auth failed' });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to save config' });
    }
});

app.post('/api/shiprocket/test', async (req, res) => {
    try {
        const token = await authenticateShiprocket();
        res.json({ success: true, message: 'Connection successful!', hasToken: !!token });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/shiprocket/create-order', async (req, res) => {
    try {
        const { orderId, dimensions } = req.body;
        const orders = readJSON(ORDERS_FILE, []);
        const order = orders.find(o => o.orderId === orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const token = await authenticateShiprocket();
        const config = getShiprocketConfig();

        // Use custom dimensions if provided, otherwise use defaults
        const boxDimensions = dimensions || config.defaultDimensions;

        // Fetch available pickup locations
        const pickupResponse = await makeShiprocketRequest('/settings/company/pickup', 'GET', null, token);
        let pickupLocationName = 'PRIMARY'; // Default - matches Shiprocket dashboard

        if (pickupResponse.status === 200 && pickupResponse.data?.data?.shipping_address) {
            const pickupLocations = pickupResponse.data.data.shipping_address;
            if (pickupLocations.length > 0) {
                // Use first available pickup location
                pickupLocationName = pickupLocations[0].pickup_location;
                console.log('Using pickup location:', pickupLocationName);
            }
        }

        // Normalize PIN code field (can be 'pin' or 'pincode')
        const pincode = order.pincode || order.pin;

        // Validate required fields
        if (!order.customerName) return res.json({ success: false, message: 'Customer name missing' });
        if (!order.address) return res.json({ success: false, message: 'Address missing' });
        if (!pincode || pincode.length !== 6) return res.json({ success: false, message: 'Valid 6-digit PIN code required' });
        if (!order.state) return res.json({ success: false, message: 'State missing' });
        if (!order.telNo && !order.mobile) return res.json({ success: false, message: 'Phone number missing' });

        // Generate unique Shiprocket order ID
        const shiprocketOrderId = `SR-${config.shiprocketOrderCounter || 7417}`;

        // Increment counter for next order
        config.shiprocketOrderCounter = (config.shiprocketOrderCounter || 7417) + 1;
        writeJSON(SHIPROCKET_CONFIG_FILE, config);

        const shiprocketOrder = {
            order_id: shiprocketOrderId, order_date: order.timestamp,
            billing_customer_name: order.customerName, billing_last_name: "",
            billing_address: order.address, billing_city: order.city || order.tahTaluka || order.distt || "City",
            billing_pincode: pincode, billing_state: order.state, billing_country: "India",
            billing_email: order.email || "customer@herbonnaturals.com",
            billing_phone: order.telNo || order.mobile, shipping_is_billing: true,
            pickup_location: pickupLocationName,
            order_items: [{ name: order.items?.[0]?.description || "Product", sku: "SKU001", units: 1, selling_price: order.total || 0 }],
            payment_method: order.paymentMode === "Online" ? "Prepaid" : "COD",
            sub_total: order.total || 0,
            length: boxDimensions.length,
            breadth: boxDimensions.breadth,
            height: boxDimensions.height,
            weight: boxDimensions.weight
        };

        console.log('📦 Creating Shiprocket order:', orderId);
        console.log('Shiprocket payload:', JSON.stringify(shiprocketOrder, null, 2));

        const createResponse = await makeShiprocketRequest('/orders/create/adhoc', 'POST', shiprocketOrder, token);

        console.log('Shiprocket API Response:', JSON.stringify(createResponse, null, 2));

        if (createResponse.status === 200 && createResponse.data.order_id) {
            const shipmentId = createResponse.data.shipment_id;

            // Prepare AWB request - use specific courier if provided
            const awbPayload = { shipment_id: shipmentId };
            if (req.body.courierId) {
                awbPayload.courier_id = req.body.courierId;
            }

            const awbResponse = await makeShiprocketRequest('/courier/assign/awb', 'POST', awbPayload, token);

            if (awbResponse.status === 200 && awbResponse.data.awb_code) {
                const orderIndex = orders.findIndex(o => o.orderId === orderId);
                orders[orderIndex].shiprocket = {
                    orderId: createResponse.data.order_id, shipmentId: shipmentId,
                    awb: awbResponse.data.awb_code, courierName: awbResponse.data.courier_name,
                    courierId: awbResponse.data.courier_id
                };
                orders[orderIndex].tracking = {
                    courier: awbResponse.data.courier_name, trackingId: awbResponse.data.awb_code,
                    dispatchedAt: new Date().toISOString()
                };
                orders[orderIndex].status = 'Dispatched';
                writeJSON(ORDERS_FILE, orders);

                console.log(`📦 Shiprocket: ${orderId} → AWB: ${awbResponse.data.awb_code}`);
                res.json({ success: true, message: 'AWB generated!', awb: awbResponse.data.awb_code, courier: awbResponse.data.courier_name });
            } else {
                console.error('AWB generation failed:', awbResponse);
                res.json({ success: false, message: 'AWB generation failed: ' + (awbResponse.data?.message || 'Unknown error') });
            }
        } else {
            console.error('Order creation failed:', createResponse);
            const errorMsg = createResponse.data?.message || createResponse.data?.errors || 'Failed to create order';
            res.json({ success: false, message: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg });
        }
    } catch (e) {
        console.error('Shiprocket error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/shiprocket/track/:awb', async (req, res) => {
    try {
        const token = await authenticateShiprocket();
        const trackResponse = await makeShiprocketRequest(`/courier/track/awb/${req.params.awb}`, 'GET', null, token);
        if (trackResponse.status === 200) {
            res.json({ success: true, tracking: trackResponse.data });
        } else {
            res.json({ success: false, message: 'Tracking not available' });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Check available couriers for order
app.post('/api/shiprocket/check-serviceability', async (req, res) => {
    try {
        const { orderId, dimensions } = req.body;
        const orders = readJSON(ORDERS_FILE, []);
        const order = orders.find(o => o.orderId === orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const token = await authenticateShiprocket();
        const config = getShiprocketConfig();
        const boxDimensions = dimensions || config.defaultDimensions;
        const pincode = order.pincode || order.pin;

        // Build query parameters for serviceability check
        const queryParams = new URLSearchParams({
            pickup_postcode: config.pickupAddress.pincode,
            delivery_postcode: pincode,
            cod: order.paymentMode === "COD" ? "1" : "0",
            weight: boxDimensions.weight.toString()
        });

        console.log('Checking serviceability:', queryParams.toString());

        const serviceResponse = await makeShiprocketRequest(
            `/courier/serviceability/?${queryParams.toString()}`,
            'GET',
            null,
            token
        );

        console.log('Serviceability response:', JSON.stringify(serviceResponse, null, 2));

        if (serviceResponse.status === 200 && serviceResponse.data?.data?.available_courier_companies) {
            const couriers = serviceResponse.data.data.available_courier_companies;

            console.log(`📦 Total couriers in API response: ${couriers.length}`);

            // Filter only truly serviceable couriers
            const serviceableCouriers = couriers.filter(c => {
                // Check Shiprocket serviceability flags
                const isServiceable = (c.is_surface === 1 || c.is_surface === true) &&
                    (c.suppression === 0 || c.suppression === false);

                if (!isServiceable) {
                    console.log(`❌ Filtered: ${c.courier_name} (is_surface: ${c.is_surface}, suppression: ${c.suppression})`);
                }
                return isServiceable;
            });

            console.log(`✅ Serviceable couriers after filtering: ${serviceableCouriers.length}`);

            // Format courier data for frontend
            const formattedCouriers = serviceableCouriers.map(c => ({
                id: c.courier_company_id,
                name: c.courier_name,
                rate: c.rate || c.freight_charge || 0,
                cod: c.cod_charges || 0,
                edd: c.etd || 'N/A',
                rating: c.rating || 4.0,
                pickupPerformance: c.pickup_performance || 0,
                deliveryPerformance: c.delivery_performance || 0,
                recommended: c.recommendation === 1
            })).sort((a, b) => {
                // Sort: recommended first, then by rating
                if (a.recommended && !b.recommended) return -1;
                if (!a.recommended && b.recommended) return 1;
                return b.rating - a.rating;
            });

            console.log(`📋 Final courier list:`, formattedCouriers.map(c => c.name).join(', '));

            res.json({ success: true, couriers: formattedCouriers });
        } else {
            console.error('No couriers found:', serviceResponse);
            res.json({ success: false, message: 'No couriers available for this location', couriers: [] });
        }
    } catch (e) {
        console.error('Serviceability check error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/shiprocket/pickup', async (req, res) => {
    try {
        const { shipmentId, pickupDate } = req.body;
        const token = await authenticateShiprocket();
        const pickupResponse = await makeShiprocketRequest('/courier/generate/pickup', 'POST', {
            shipment_id: [shipmentId], pickup_date: pickupDate || new Date().toISOString().split('T')[0]
        }, token);
        if (pickupResponse.status === 200) {
            res.json({ success: true, message: 'Pickup scheduled!' });
        } else {
            res.json({ success: false, message: 'Pickup scheduling failed' });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ==================== START SERVER ====================
async function startServer() {
    // Connect to MongoDB
    const dbConnected = await connectDatabase();

    if (dbConnected) {
        await initializeDefaultData();
        console.log('✅ Database initialized!');
    } else {
        console.warn('⚠️ Running without MongoDB - Data will not persist!');
    }

    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║       🌿 HERB ON NATURALS SERVER v4.0 STARTED 🌿          ║');
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log(`║  Status:   ${dbConnected ? '🟢 MongoDB Connected' : '🔴 JSON Mode (Temporary)'}           ║`);
        console.log(`║  Port:     ${PORT}                                            ║`);
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log('║  FEATURES:                                                ║');
        console.log('║  ✅ Order Edit in Verification & Dispatch Dept            ║');
        console.log('║  ✅ Employee Delivery Request System                      ║');
        console.log('║  ✅ Dispatch Dept Approves Delivery                       ║');
        console.log('║  ✅ Admin Full Department Edit (ID, Pass, Type)           ║');
        console.log('║  ✅ Department Delete Option                              ║');
        console.log('║  ✅ Employee & Admin Progress Reports                     ║');
        console.log('║  ✅ Shiprocket Integration (AWB, Tracking)                ║');
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log('║  ORDER FLOW:                                              ║');
        console.log('║  Employee → Pending → [Edit] Verification Dept            ║');
        console.log('║  → Verified → [Edit] Dispatch Dept → Dispatched           ║');
        console.log('║  → Employee Request → Dispatch Approve → Delivered        ║');
        console.log('╚═══════════════════════════════════════════════════════════╝');
        console.log('');
    });
}

// Start the application
startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
