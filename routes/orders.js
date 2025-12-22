const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const rateLimit = require('express-rate-limit');
const dataAccess = require('../dataAccess');
const { validateOrderCreation } = require('../validators');

const DATA_DIR = path.join(__dirname, '../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const DELIVERY_REQUESTS_FILE = path.join(DATA_DIR, 'delivery_requests.json');

// API Limiter for order creation
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Too many requests. Please slow down.' }
});

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

// Create Order
router.post('/', apiLimiter, validateOrderCreation, async (req, res) => {
    try {
        const orderData = req.body;
        const config = await dataAccess.getShiprocketConfig();
        const nextId = config.shiprocketOrderCounter || 1;
        const orderId = `Order ID-${nextId.toString().padStart(4, '0')}`;

        await dataAccess.updateShiprocketConfig({ shiprocketOrderCounter: nextId + 1 });

        const newOrder = {
            ...orderData,
            orderId,
            status: 'Pending',
            tracking: null,
            deliveryRequested: false,
            timestamp: new Date().toISOString(),
            createdBy: orderData.employeeId
        };

        await dataAccess.createOrder(newOrder);
        console.log(`📦 New Order: ${orderId} by ${orderData.employee} (${orderData.employeeId})`);
        res.json({ success: true, message: 'Order saved!', orderId });
    } catch (error) {
        console.error('❌ Create order error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create order.' });
    }
});

// Update Order (Generic Edit)
router.put('/:orderId', async (req, res) => {
    try {
        const order = await dataAccess.getOrderById(req.params.orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found!' });

        const updates = { ...req.body, updatedAt: new Date().toISOString() };
        // Protect critical fields
        delete updates.orderId;
        delete updates.timestamp;
        delete updates._id;

        const updated = await dataAccess.updateOrder(req.params.orderId, updates);
        console.log(`✏️ Order Updated: ${req.params.orderId}`);
        res.json({ success: true, message: 'Order updated!', order: updated });
    } catch (error) {
        console.error('❌ Update order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get All Orders
router.get('/', async (req, res) => {
    try {
        const orders = await dataAccess.getAllOrders();
        res.json({ success: true, orders });
    } catch (error) {
        console.error('❌ Get orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Pending Orders
router.get('/pending', async (req, res) => {
    try {
        const orders = await dataAccess.getAllOrders();
        const pending = orders.filter(o => o.status === 'Pending');
        res.json({ success: true, orders: pending });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Verified Orders
router.get('/verified', async (req, res) => {
    try {
        const orders = await dataAccess.getAllOrders();
        const verified = orders.filter(o => o.status === 'Address Verified');
        res.json({ success: true, orders: verified });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Dispatched Orders
router.get('/dispatched', async (req, res) => {
    try {
        const orders = await dataAccess.getAllOrders();
        const dispatched = orders.filter(o => o.status === 'Dispatched');
        res.json({ success: true, orders: dispatched });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Delivered Orders
router.get('/delivered', async (req, res) => {
    try {
        const orders = await dataAccess.getAllOrders();
        const delivered = orders.filter(o => o.status === 'Delivered');
        res.json({ success: true, orders: delivered });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Employee Orders
router.get('/employee/:empId', async (req, res) => {
    try {
        const empId = req.params.empId.toUpperCase();
        const orders = await dataAccess.getAllOrders();
        const empOrders = orders.filter(o => o.employeeId === empId);
        res.json({ success: true, orders: empOrders });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Single Order
router.get('/:orderId', async (req, res) => {
    try {
        const order = await dataAccess.getOrderById(req.params.orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found!' });
        res.json({ success: true, order });
    } catch (error) {
        console.error('❌ Get order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update Order Status
router.put('/:orderId/status', async (req, res) => {
    try {
        const { status, employee } = req.body;
        const updates = { status, updatedAt: new Date().toISOString() };
        const updated = await dataAccess.updateOrder(req.params.orderId, updates);
        if (!updated) return res.status(404).json({ success: false, message: 'Order not found!' });
        console.log(`🔄 Status Update: ${req.params.orderId} -> ${status} (${employee || 'Unknown'})`);
        res.json({ success: true, message: 'Status updated!', order: updated });
    } catch (error) {
        console.error('❌ Status update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Verify Address
router.put('/:orderId/verify', async (req, res) => {
    try {
        const updates = {
            status: 'Address Verified',
            verifiedAt: new Date().toISOString(),
            verifiedBy: req.body.verifiedBy || 'Address Dept',
            suggestedCourier: req.body.suggestedCourier || null
        };
        const updated = await dataAccess.updateOrder(req.params.orderId, updates);
        if (!updated) return res.status(404).json({ success: false, message: 'Order not found!' });
        console.log(`✅ Address Verified: ${req.params.orderId}${updates.suggestedCourier ? ` | Suggested: ${updates.suggestedCourier}` : ''}`);
        res.json({ success: true, message: 'Address verified!', order: updated });
    } catch (error) {
        console.error('❌ Verify error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Save Remark
router.put('/:orderId/remark', async (req, res) => {
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
        if (!updated) return res.status(404).json({ success: false, message: 'Order not found!' });
        console.log(`📝 Remark Added to ${req.params.orderId}`);
        res.json({ success: true, message: 'Remark saved!', order: updated });
    } catch (error) {
        console.error('❌ Remark error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Dispatch Order
router.put('/:orderId/dispatch', async (req, res) => {
    try {
        const { courier, trackingId, dispatchedBy } = req.body;
        const updates = {
            status: 'Dispatched',
            tracking: {
                courier: courier || '',
                trackingId: trackingId || '',
                dispatchedAt: new Date().toISOString()
            },
            dispatchedAt: new Date().toISOString(),
            dispatchedBy: dispatchedBy || 'Dispatch Dept'
        };
        const updated = await dataAccess.updateOrder(req.params.orderId, updates);
        if (!updated) return res.status(404).json({ success: false, message: 'Order not found!' });
        console.log(`🚚 Order Dispatched: ${req.params.orderId}`);
        res.json({ success: true, message: 'Order dispatched!', order: updated });
    } catch (error) {
        console.error('❌ Dispatch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Cancel Order
router.post('/:orderId/cancel', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason, cancelledBy } = req.body;
        const order = await dataAccess.getOrderById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found!' });

        const updates = {
            status: 'Cancelled',
            cancellationInfo: {
                cancelledAt: new Date(),
                cancelledBy: cancelledBy || 'verification',
                cancellationReason: reason || 'Customer cancelled'
            },
            updatedAt: new Date().toISOString()
        };

        const updatedOrder = await dataAccess.updateOrder(orderId, updates);
        console.log(`❌ Order Cancelled: ${orderId}`);
        res.json({ success: true, message: 'Order cancelled successfully', order: updatedOrder });
    } catch (error) {
        console.error('❌ Cancel order error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order' });
    }
});

// Suggest Courier
router.post('/:orderId/suggest-courier', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { courier, note, suggestedBy } = req.body;
        const order = await dataAccess.getOrderById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found!' });

        const updates = {
            courierSuggestion: {
                suggestedCourier: courier,
                suggestedBy: suggestedBy || 'verification',
                suggestedAt: new Date(),
                suggestionNote: note || ''
            },
            updatedAt: new Date().toISOString()
        };

        const updatedOrder = await dataAccess.updateOrder(orderId, updates);
        res.json({ success: true, message: `Suggested ${courier} for dispatch`, order: updatedOrder });
    } catch (error) {
        console.error('❌ Suggest courier error:', error);
        res.status(500).json({ success: false, message: 'Failed to suggest courier' });
    }
});

// Put Order On Hold
router.put('/:orderId/hold', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { holdReason, expectedDispatchDate, holdBy } = req.body;

        console.log(`\n⏸️ [HOLD REQUEST] Order: ${orderId}`);

        const updates = {
            status: 'On Hold',
            holdDetails: {
                isOnHold: true,
                holdReason: holdReason || 'On hold',
                expectedDispatchDate: new Date(expectedDispatchDate),
                holdBy: holdBy || 'Verification System',
                holdAt: new Date().toISOString()
            },
            // Also add to remarks for history
            $push: {
                remarks: {
                    text: `Order put on hold. Reason: ${holdReason || 'N/A'}. Expected Dispatch: ${expectedDispatchDate}`,
                    addedBy: holdBy || 'Verification Dept',
                    addedAt: new Date().toISOString(),
                    timestamp: new Date().toISOString()
                }
            },
            updatedAt: new Date().toISOString()
        };

        const updatedOrder = await dataAccess.updateOrder(orderId, updates);

        if (updatedOrder) {
            console.log(`✅ Success: Order ${orderId} is now on hold.`);
            res.json({ success: true, message: 'Order put on hold successfully', order: updatedOrder });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.error('❌ Hold order error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to put order on hold' });
    }
});

// Excel Export
router.get('/export', (req, res) => {
    try {
        const orders = readJSON(ORDERS_FILE, []);
        const exportData = orders.map((order, index) => {
            let address = order.address || '';
            if (typeof address === 'object' && address !== null) {
                address = `${address.houseNo || ''}, ${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;
            }
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
                "Order Date": order.timestamp ? new Date(order.timestamp).toLocaleDateString('en-GB') : '',
                "Delivery Status": order.status || '',
                "Amount Rs.": order.total || 0,
                "Agent": order.employee || '',
                "AWB Number": order.tracking ? (order.tracking.trackingId || '') : ''
            };
        });

        const ws = xlsx.utils.json_to_sheet(exportData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Orders");
        const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', `attachment; filename="HerbOrders_${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (e) {
        console.error('❌ Export Error:', e);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

// Delete Order
router.delete('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log(`\n🗑️ [DELETE REQUEST] Received for Order ID: "${orderId}"`);

        const result = await dataAccess.deleteOrder(orderId);

        if (result) {
            console.log(`✅ Success: Order "${orderId}" deleted.`);
            res.json({ success: true, message: 'Order deleted successfully' });
        } else {
            console.warn(`⚠️ Warning: Order "${orderId}" not found for deletion.`);
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.error('❌ Delete order error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete order' });
    }
});

// Request Delivery (Employee → Dispatch)
router.post('/:orderId/request-delivery', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { employeeId, employeeName } = req.body;

        // Get order
        const order = await dataAccess.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update order status to "Delivery Requested"
        const updated = await dataAccess.updateOrder(orderId, {
            status: 'Delivery Requested',
            deliveryRequestedAt: new Date().toISOString(),
            deliveryRequestedBy: employeeId
        });

        if (updated) {
            console.log(`🚚 Delivery Request: ${orderId} by ${employeeName}`);
            res.json({ success: true, message: 'Delivery request sent successfully!' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update order' });
        }
    } catch (error) {
        console.error('❌ Request delivery error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
