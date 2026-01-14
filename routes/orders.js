const express = require('express');
const router = express.Router();
const path = require('path');
const xlsx = require('xlsx');
const rateLimit = require('express-rate-limit');
const dataAccess = require('../dataAccess');
const { validateOrderCreation } = require('../validators');
const { readJSON, writeJSON } = require('../utils/fileHelpers');
const { trackSpeedPost } = require('../utils/speedpost-tracker');
const { trackBlueDart } = require('../utils/bluedart-tracker');

const DATA_DIR = path.join(__dirname, '../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const DELIVERY_REQUESTS_FILE = path.join(DATA_DIR, 'delivery_requests.json');

// API Limiter for order creation
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Too many requests. Please slow down.' }
});

// Note: Using centralized fileHelpers module for JSON operations

// Create Order
// Check for Duplicate Order (by mobile number) - FAST DIRECT QUERY
router.post('/check-duplicate', async (req, res) => {
    console.log('\n🔍 ==== DUPLICATE CHECK API CALLED ====');
    console.log('📥 Request body:', req.body);

    try {
        const { telNo, customerName } = req.body;
        console.log('📱 Mobile to check:', telNo);

        if (!telNo) {
            console.log('❌ No mobile number provided');
            return res.json({ success: true, isDuplicate: false });
        }

        // FAST: Direct database query instead of loading all orders
        console.log('🔎 Searching for mobile:', telNo);
        const existingOrder = await dataAccess.findOrderByMobile(telNo);
        console.log('📦 Search result:', existingOrder ? `Found: ${existingOrder.orderId}` : 'Not found');

        if (existingOrder) {
            console.log(`⚠️ DUPLICATE FOUND! Order: ${existingOrder.orderId}, Customer: ${existingOrder.customerName}`);

            return res.json({
                success: true,
                isDuplicate: true,
                existingOrder: {
                    orderId: existingOrder.orderId,
                    customerName: existingOrder.customerName,
                    telNo: existingOrder.telNo || existingOrder.mobileNumber,
                    status: existingOrder.status,
                    total: existingOrder.total,
                    createdAt: existingOrder.timestamp,
                    createdBy: existingOrder.employeeId,
                    employeeName: existingOrder.employeeName || existingOrder.employee
                }
            });
        }

        console.log('✅ No duplicate found, new order allowed');
        res.json({ success: true, isDuplicate: false });

    } catch (error) {
        console.error('❌ Check duplicate error:', error);
        res.status(500).json({ success: false, message: 'Failed to check for duplicates' });
    }
});

// Create Order
router.post('/', apiLimiter, validateOrderCreation, async (req, res) => {
    try {
        const orderData = req.body;


        const config = await dataAccess.getShiprocketConfig();
        const nextId = config.shiprocketOrderCounter || 1;
        const orderId = `Order ID-${nextId.toString().padStart(4, '0')}`;

        await dataAccess.updateShiprocketConfig({ shiprocketOrderCounter: nextId + 1 });

        // Determine Fresh vs Reorder
        // PRIORITY: Manual Selection > Automatic History Check
        let orderType = orderData.orderType; // 'Fresh' or 'Reorder' from frontend

        if (!orderType) {
            // Fallback to automatic detection if not provided
            orderType = 'Fresh';
            try {
                const allOrders = await dataAccess.getAllOrders();
                const customerMobile = orderData.telNo || orderData.mobileNumber;
                const exists = allOrders.some(o => (o.telNo === customerMobile || o.mobileNumber === customerMobile));
                if (exists) {
                    orderType = 'Reorder';
                }
            } catch (err) {
                console.error('Error checking order history:', err);
            }
        }

        const newOrder = {
            ...orderData,
            orderId,
            orderType, // Saved explicitly
            status: 'Pending',
            tracking: null,
            deliveryRequested: false,
            timestamp: new Date().toISOString(),
            createdBy: orderData.employeeId
        };

        await dataAccess.createOrder(newOrder);
        console.log(`📦 New Order: ${orderId} (${orderType}) by ${orderData.employee} (${orderData.employeeId})`);
        res.json({ success: true, message: 'Order saved!', orderId });
    } catch (error) {
        console.error('❌ Create order error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create order.' });
    }
});

// Update Order (Generic Edit)
router.put('/:orderId', async (req, res) => {
    try {
        console.log(`📝 [PUT ORDER] Received update request for: "${req.params.orderId}"`);
        const order = await dataAccess.getOrderById(req.params.orderId);
        if (!order) {
            console.log(`❌ [PUT ORDER] Order not found: "${req.params.orderId}"`);
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

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

// Get All Orders (Modified to support status filter and pagination)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;

        let result;
        // Optimization: Server-side filtering
        if (req.query.status) {
            result = await dataAccess.getOrdersByStatus(req.query.status, page, limit);
        } else {
            result = await dataAccess.getAllOrders(page, limit);
        }

        // Handle Pagination Response vs Full List
        let orders = [];
        let total = 0;

        if (limit > 0 && result.orders) {
            orders = result.orders;
            total = result.total;
        } else {
            orders = result;
            total = orders.length; // Approximate for non-paginated
        }

        // Remove dynamic isReorder calculation (expensive and unsafe for pagination)
        // We rely on order.orderType which is saved at creation.

        res.json({
            success: true,
            orders,
            pagination: limit > 0 ? {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            } : null
        });
    } catch (error) {
        console.error('❌ Get orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Pending Orders
router.get('/pending', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        // Default to no limit if not specified to avoid breaking existing clients, 
        // or default to 10 if we want to enforce pagination. 
        // Best to default to 0 (all) unless requested, but for PERF we want frontend to request it.
        const limit = parseInt(req.query.limit) || 0;

        const result = await dataAccess.getOrdersByStatus('Pending', page, limit);
        let orders = [], total = 0;

        if (limit > 0 && result.orders) {
            orders = result.orders;
            total = result.total;
        } else {
            orders = result;
            total = orders.length;
        }

        res.json({
            success: true,
            orders,
            pagination: limit > 0 ? { total, page, limit, totalPages: Math.ceil(total / limit) } : null
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Verified Orders
router.get('/verified', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const result = await dataAccess.getOrdersByStatus('Address Verified', page, limit);

        // Helper to extract orders/total
        const orders = (limit > 0 && result.orders) ? result.orders : result;
        const total = (limit > 0 && result.total) ? result.total : orders.length;

        res.json({
            success: true,
            orders,
            pagination: limit > 0 ? { total, page, limit, totalPages: Math.ceil(total / limit) } : null
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Dispatched Orders
router.get('/dispatched', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const result = await dataAccess.getOrdersByStatus('Dispatched', page, limit);

        const orders = (limit > 0 && result.orders) ? result.orders : result;
        const total = (limit > 0 && result.total) ? result.total : orders.length;

        res.json({ success: true, orders, pagination: limit > 0 ? { total, page, limit, totalPages: Math.ceil(total / limit) } : null });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error', error: e.message });
    }
});

// Get Delivered Orders
router.get('/delivered', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const result = await dataAccess.getOrdersByStatus('Delivered', page, limit);

        const orders = (limit > 0 && result.orders) ? result.orders : result;
        const total = (limit > 0 && result.total) ? result.total : orders.length;

        res.json({ success: true, orders, pagination: limit > 0 ? { total, page, limit, totalPages: Math.ceil(total / limit) } : null });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Cancelled Orders
router.get('/cancelled', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const result = await dataAccess.getOrdersByStatus('Cancelled', page, limit);

        const orders = (limit > 0 && result.orders) ? result.orders : result;
        const total = (limit > 0 && result.total) ? result.total : orders.length;

        res.json({ success: true, orders, pagination: limit > 0 ? { total, page, limit, totalPages: Math.ceil(total / limit) } : null });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get RTO Orders
router.get('/rto', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const result = await dataAccess.getOrdersByStatus('RTO', page, limit);

        const orders = (limit > 0 && result.orders) ? result.orders : result;
        const total = (limit > 0 && result.total) ? result.total : orders.length;

        res.json({ success: true, orders, pagination: limit > 0 ? { total, page, limit, totalPages: Math.ceil(total / limit) } : null });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get On Hold Orders
router.get('/onhold', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const result = await dataAccess.getOrdersByStatus('On Hold', page, limit);

        const orders = (limit > 0 && result.orders) ? result.orders : result;
        const total = (limit > 0 && result.total) ? result.total : orders.length;

        res.json({ success: true, orders, pagination: limit > 0 ? { total, page, limit, totalPages: Math.ceil(total / limit) } : null });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Delivery Requests (Employees requesting delivery confirmation)
router.get('/delivery-requests', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        // Optimized: Use getOrdersByStatus
        const result = await dataAccess.getOrdersByStatus('Delivery Requested', page, limit);

        const requests = (limit > 0 && result.orders) ? result.orders : result;
        const total = (limit > 0 && result.total) ? result.total : requests.length;

        // console.log(`📬 [DELIVERY REQUESTS] Found ${requests.length} delivery requests`);
        res.json({ success: true, requests, pagination: limit > 0 ? { total, page, limit, totalPages: Math.ceil(total / limit) } : null });
    } catch (e) {
        console.error('❌ Get delivery requests error:', e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Mark Order as Delivered
router.post('/deliver', async (req, res) => {
    try {
        const { orderId, deliveredBy } = req.body;
        console.log(`\n📦 [DELIVERY REQUEST] Order: ${orderId}`);

        const updates = {
            status: 'Delivered',
            deliveredAt: new Date().toISOString(),
            deliveredBy: deliveredBy || 'Delivery Dept',
            updatedAt: new Date().toISOString()
        };

        const updatedOrder = await dataAccess.updateOrder(orderId, updates);

        if (updatedOrder) {
            console.log(`✅ Success: Order ${orderId} is now marked as Delivered.`);
            res.json({ success: true, message: 'Order marked as delivered successfully', order: updatedOrder });
        } else {
            console.warn(`⚠️ Warning: Order ${orderId} not found for delivery update.`);
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.error('❌ Deliver order error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to mark order as delivered' });
    }
});

// Mark Order as RTO
router.post('/rto', async (req, res) => {
    try {
        const { orderId, rtoReason, rtoBy } = req.body;
        console.log(`\n📦 [RTO REQUEST] Order: ${orderId}`);

        const updates = {
            status: 'RTO',
            rtoAt: new Date().toISOString(),
            rtoBy: rtoBy || 'Delivery Dept',
            rtoReason: rtoReason || 'Reason not specified',
            updatedAt: new Date().toISOString()
        };

        const updatedOrder = await dataAccess.updateOrder(orderId, updates);

        if (updatedOrder) {
            console.log(`✅ Success: Order ${orderId} is now marked as RTO.`);
            res.json({ success: true, message: 'Order marked as RTO successfully', order: updatedOrder });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.error('❌ RTO order error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to mark order as RTO' });
    }
});

// Revert Delivered Order (Back to On Way or RTO)
router.post('/revert-delivered', async (req, res) => {
    try {
        const { orderId, newStatus, rtoReason, revertedBy } = req.body;
        console.log(`\n🔙 [REVERT DELIVERED] Order: ${orderId} → ${newStatus}`);

        const order = await dataAccess.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

        // Validate current status
        if (order.status !== 'Delivered') {
            return res.status(400).json({
                success: false,
                message: `Cannot revert order with status "${order.status}". Only Delivered orders can be reverted.`
            });
        }

        // Validate new status
        const validStatuses = ['On Way', 'Dispatched', 'RTO'];
        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status "${newStatus}". Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const updates = {
            status: newStatus === 'On Way' ? 'Dispatched' : newStatus, // On Way = Dispatched status
            revertInfo: {
                revertedAt: new Date().toISOString(),
                revertedBy: revertedBy || 'Admin',
                previousStatus: 'Delivered',
                revertReason: newStatus === 'RTO' ? (rtoReason || 'Reverted from Delivered') : 'Reverted from Delivered'
            },
            // Clear delivered data
            deliveredAt: null,
            deliveredBy: null,
            updatedAt: new Date().toISOString()
        };

        // If reverting to RTO, add RTO fields
        if (newStatus === 'RTO') {
            updates.rtoAt = new Date().toISOString();
            updates.rtoBy = revertedBy || 'Admin';
            updates.rtoReason = rtoReason || 'Reverted from Delivered';
        }

        const updatedOrder = await dataAccess.updateOrder(orderId, updates);

        if (updatedOrder) {
            console.log(`✅ Success: Order ${orderId} reverted from Delivered → ${newStatus}`);
            console.log(`   By: ${revertedBy || 'Admin'}`);
            res.json({
                success: true,
                message: `Order reverted to ${newStatus} successfully!`,
                order: updatedOrder
            });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.error('❌ Revert delivered error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to revert order' });
    }
});

// Get Employee Orders (OPTIMIZED - Direct Query)
router.get('/employee/:empId', async (req, res) => {
    try {
        const empId = req.params.empId.toUpperCase();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const status = req.query.status; // Optional: filter by status

        // OPTIMIZED: Direct query instead of loading all orders
        const result = await dataAccess.getEmployeeOrders(empId, status, page, limit);

        const orders = (limit > 0 && result.orders) ? result.orders : result;
        const total = (limit > 0 && result.total) ? result.total : (Array.isArray(orders) ? orders.length : 0);

        res.json({
            success: true,
            orders,
            pagination: limit > 0 ? {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            } : null
        });
    } catch (e) {
        console.error('❌ Get employee orders error:', e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update Order Tracking (for OFD marking) - MUST be before /:orderId route
router.post('/update-tracking', async (req, res) => {
    try {
        const { orderId, tracking } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }

        console.log(`📦 [UPDATE TRACKING] Order: ${orderId}`);
        console.log(`📦 Tracking data:`, tracking);

        const order = await dataAccess.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

        const updates = {
            updatedAt: new Date().toISOString()
        };

        if (tracking) {
            updates.tracking = {
                ...(order.tracking || {}),
                ...tracking,
                lastUpdate: new Date().toISOString()
            };

            if (tracking.currentStatus === 'Out For Delivery') {
                updates.status = 'Out For Delivery';
                updates.ofdAt = new Date().toISOString();
                console.log(`🚚 Order ${orderId} marked as Out For Delivery`);
            }
        }

        const updatedOrder = await dataAccess.updateOrder(orderId, updates);

        if (updatedOrder) {
            console.log(`✅ Tracking updated for ${orderId}`);
            res.json({ success: true, message: 'Tracking updated!', order: updatedOrder });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.error('❌ Update tracking error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Track India Post Order via Scraping
router.post('/track-indiapost/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log(`📡 [INDIA POST TRACKING] Request for: ${orderId}`);

        const order = await dataAccess.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const awb = order.tracking?.trackingId || (order.shiprocket?.awb);
        if (!awb) {
            return res.status(400).json({ success: false, message: 'No tracking ID found for this order' });
        }

        // Perform scraping
        const trackData = await trackSpeedPost(awb);

        if (trackData.success) {
            const updates = {
                'tracking.currentStatus': trackData.status,
                'tracking.lastUpdate': trackData.lastUpdate,
                'tracking.location': trackData.location,
                'tracking.allScans': trackData.allScans,
                updatedAt: new Date().toISOString()
            };

            // Auto-update status if OFD
            if (trackData.status.toLowerCase().includes('out for delivery')) {
                updates.status = 'Out For Delivery';
                updates.ofdAt = new Date().toISOString();
                console.log(`🚚 Order ${orderId} marked as OFD via India Post tracking`);
            } else if (trackData.status.toLowerCase().includes('delivered')) {
                updates.status = 'Delivered';
                updates.deliveredAt = new Date().toISOString();
                console.log(`✅ Order ${orderId} marked as Delivered via India Post tracking`);
            }

            await dataAccess.updateOrder(orderId, updates);

            res.json({
                success: true,
                status: trackData.status,
                location: trackData.location,
                lastUpdate: trackData.lastUpdate,
                allScans: trackData.allScans,
                delivered: trackData.status.toLowerCase().includes('delivered')
            });
        } else {
            // Fallback: If scraper fails but we have previous tracking data, return it
            if (order.tracking && order.tracking.currentStatus) {
                console.log(`⚠️ Scraper failed for ${orderId}, returning cached data.`);

                // Construct a better location if tracking location is missing or N/A
                const fallbackLocation = order.city || order.distt || order.state || 'N/A';
                const trackingLocation = (order.tracking.location && order.tracking.location !== 'N/A')
                    ? order.tracking.location
                    : fallbackLocation;

                return res.json({
                    success: true,
                    cached: true,
                    status: order.tracking.currentStatus || 'Dispatched',
                    location: trackingLocation,
                    destination: order.city || order.distt || order.state || 'N/A',
                    lastUpdate: order.tracking.lastUpdate || 'N/A',
                    allScans: order.tracking.allScans || [],
                    message: trackData.message || 'Tracking site unavailable. Showing last known status.'
                });
            }
            res.status(404).json({ success: false, message: trackData.message || 'Tracking failed' });
        }
    } catch (error) {
        console.error('❌ India Post Tracking Route Error:', error);
        res.status(500).json({ success: false, message: 'Server error during tracking' });
    }
});

// Track BlueDart Order via Scraping
router.post('/track-bluedart/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log(`📡 [BLUEDART TRACKING] Request for: ${orderId}`);

        const order = await dataAccess.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const awb = order.tracking?.trackingId || (order.shiprocket?.awb);
        if (!awb) {
            return res.status(400).json({ success: false, message: 'No tracking ID found for this order' });
        }

        // Perform scraping
        const trackData = await trackBlueDart(awb);

        if (trackData.success) {
            const updates = {
                'tracking.currentStatus': trackData.status,
                'tracking.lastUpdate': trackData.lastUpdate,
                'tracking.location': trackData.location,
                'tracking.allScans': trackData.allScans,
                updatedAt: new Date().toISOString()
            };

            // Auto-update status if OFD
            if (trackData.status.toLowerCase().includes('out for delivery')) {
                updates.status = 'Out For Delivery';
                updates.ofdAt = new Date().toISOString();
                console.log(`🚚 Order ${orderId} marked as OFD via BlueDart tracking`);
            } else if (trackData.status.toLowerCase().includes('delivered')) {
                updates.status = 'Delivered';
                updates.deliveredAt = new Date().toISOString();
                console.log(`✅ Order ${orderId} marked as Delivered via BlueDart tracking`);
            }

            await dataAccess.updateOrder(orderId, updates);

            res.json({
                success: true,
                status: trackData.status,
                location: trackData.location,
                lastUpdate: trackData.lastUpdate,
                allScans: trackData.allScans,
                delivered: trackData.status.toLowerCase().includes('delivered')
            });
        } else {
            // Fallback: If scraper fails but we have previous tracking data, return it
            if (order.tracking && order.tracking.currentStatus) {
                console.log(`⚠️ Scraper failed for ${orderId}, returning cached data.`);

                const fallbackLocation = order.city || order.distt || order.state || 'N/A';
                const trackingLocation = (order.tracking.location && order.tracking.location !== 'N/A')
                    ? order.tracking.location
                    : fallbackLocation;

                return res.json({
                    success: true,
                    cached: true,
                    status: order.tracking.currentStatus || 'Dispatched',
                    location: trackingLocation,
                    destination: order.city || order.distt || order.state || 'N/A',
                    lastUpdate: order.tracking.lastUpdate || 'N/A',
                    allScans: order.tracking.allScans || [],
                    message: trackData.message || 'Tracking site unavailable. Showing last known status.'
                });
            }
            res.status(404).json({ success: false, message: trackData.message || 'Tracking failed' });
        }
    } catch (error) {
        console.error('❌ BlueDart Tracking Route Error:', error);
        res.status(500).json({ success: false, message: 'Server error during tracking' });
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

// Revert Dispatch - Move order back from Dispatched to Ready for Dispatch
router.post('/:orderId/revert-dispatch', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason, revertedBy } = req.body;

        const order = await dataAccess.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

        // Only allow reverting Dispatched orders
        if (order.status !== 'Dispatched') {
            return res.status(400).json({
                success: false,
                message: `Cannot revert order with status "${order.status}". Only Dispatched orders can be reverted.`
            });
        }

        const updates = {
            status: 'Address Verified',  // Back to ready for dispatch
            revertInfo: {
                revertedAt: new Date().toISOString(),
                revertedBy: revertedBy || 'Dispatch Dept',
                revertReason: reason || 'Dispatch reverted',
                previousStatus: 'Dispatched',
                previousDispatchInfo: {
                    dispatchedAt: order.dispatchedAt,
                    dispatchedBy: order.dispatchedBy,
                    shiprocket: order.shiprocket,
                    tracking: order.tracking
                }
            },
            // Clear dispatch data
            dispatchedAt: null,
            dispatchedBy: null,
            // Keep shiprocket info for reference but mark as reverted
            'shiprocket.reverted': true,
            updatedAt: new Date().toISOString()
        };

        const updatedOrder = await dataAccess.updateOrder(orderId, updates);

        console.log(`🔙 Order Reverted: ${orderId} (Dispatched → Address Verified)`);
        console.log(`   Reason: ${reason || 'Not specified'}`);
        console.log(`   By: ${revertedBy || 'Dispatch Dept'}`);

        res.json({
            success: true,
            message: 'Order reverted to Ready for Dispatch!',
            order: updatedOrder
        });
    } catch (error) {
        console.error('❌ Revert dispatch error:', error);
        res.status(500).json({ success: false, message: 'Failed to revert dispatch' });
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

// Excel Export - Download all orders or filter by status
router.get('/export', async (req, res) => {
    try {
        console.log('📊 Export request received');

        // Get status filter if provided
        const statusFilter = req.query.status;
        let orders;

        if (statusFilter) {
            console.log(`📊 Exporting orders with status: ${statusFilter}`);
            const result = await dataAccess.getOrdersByStatus(statusFilter, 1, 0); // Get all matching orders
            orders = Array.isArray(result) ? result : (result.orders || []);
        } else {
            console.log('📊 Exporting ALL orders');
            const result = await dataAccess.getAllOrders(1, 0); // Get all orders (limit=0)
            orders = Array.isArray(result) ? result : (result.orders || []);
        }

        console.log(`📦 Found ${orders.length} orders to export`);

        const exportData = orders.map((order, index) => {
            let address = order.address || '';
            if (typeof address === 'object' && address !== null) {
                address = `${address.houseNo || ''}, ${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;
            }

            // Aggregate items logic (Reliably handles Arrays, Comma-strings, and mixed data)
            let productNames = '';

            // Helper to aggregate dict
            const aggregateItems = (list) => {
                const counts = {};
                list.forEach(item => {
                    // Normalize item to arrays of product names/objects
                    if (typeof item === 'string') {
                        // Handle "Product A, Product B" string inside array or standalone
                        const parts = item.split(',').map(s => s.trim()).filter(s => s);
                        parts.forEach(part => {
                            if (counts[part]) counts[part]++;
                            else counts[part] = 1;
                        });
                    } else if (typeof item === 'object' && item !== null) {
                        const name = (item.product || item.description || 'Unknown').trim();
                        const qty = parseInt(item.quantity || item.qty || 1) || 1;

                        if (counts[name]) counts[name] += qty;
                        else counts[name] = qty;
                    }
                });
                return counts;
            };

            if (Array.isArray(order.items)) {
                const itemCounts = aggregateItems(order.items);
                // User requested format: "Spray Oil (x3), Painover (x1)"
                productNames = Object.entries(itemCounts)
                    .map(([name, count]) => `${name} (x${count})`)
                    .join(', ');

            } else if (typeof order.items === 'string' && order.items.trim().length > 0) {
                // Handling pure string case (just in case)
                const parts = order.items.split(',').map(s => s.trim()).filter(s => s);
                const itemCounts = {};
                parts.forEach(part => {
                    if (itemCounts[part]) itemCounts[part]++;
                    else itemCounts[part] = 1;
                });

                productNames = Object.entries(itemCounts)
                    .map(([name, count]) => `${name} (x${count})`)
                    .join(', ');
            } else {
                productNames = '';
            }

            return {
                "S.No": index + 1,
                "Order ID": order.orderId || '',
                "Customer Name": order.customerName || '',
                "Mobile Number": order.telNo || order.mobileNumber || '',
                "Address": address,
                "Pincode": order.pin || '',
                "Products": productNames,
                "Order Date": order.timestamp ? new Date(order.timestamp).toLocaleDateString('en-GB') : '',
                "Status": order.status || '',
                "Amount Rs.": order.total || 0,
                "COD Amount": order.codAmount || order.cod || 0,
                "Advance Paid": order.advance || 0,
                "Agent": order.employee || order.employeeName || '',
                "Employee ID": order.employeeId || '',
                "AWB Number": order.shiprocket?.awb || (order.tracking ? (order.tracking.trackingId || '') : ''),
                "Courier": order.shiprocket?.courier || (order.tracking ? (order.tracking.courier || '') : ''),
                "Dispatched At": order.dispatchedAt ? new Date(order.dispatchedAt).toLocaleDateString('en-GB') : '',
                "Delivered At": order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-GB') : ''
            };
        });

        const ws = xlsx.utils.json_to_sheet(exportData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Orders");
        const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        const fileName = statusFilter
            ? `HerbOrders_${statusFilter.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
            : `HerbOrders_ALL_${new Date().toISOString().split('T')[0]}.xlsx`;

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);

        console.log(`✅ Export successful: ${orders.length} orders exported`);
    } catch (e) {
        console.error('❌ Export Error:', e);
        res.status(500).json({ success: false, message: 'Export failed', error: e.message });
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
