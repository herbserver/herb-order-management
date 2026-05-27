const express = require('express');
const router = express.Router();
const { CallLog, Order, Employee } = require('../models');
const { authenticateToken } = require('../auth');

// Helper to map DB CallLog model to the exact format expected by the frontend
function mapCallLogToFrontend(call) {
    if (!call) return null;
    
    // Support both mongoose document and lean POJO object
    const callObj = typeof call.toObject === 'function' ? call.toObject() : call;
    
    return {
        ...callObj,
        id: callObj._id,
        phone: callObj.callerNumber,
        type: callObj.callType,
        status: callObj.callStatus,
        outcome: callObj.callOutcome,
        notes: (callObj.callNotes || []).map(n => ({
            text: n.note,
            addedBy: n.addedBy,
            timestamp: n.addedAt
        })),
        startTime: callObj.timestamp,
        callbackRequired: callObj.callType === 'missed' && !callObj.callbackDone
    };
}

// ==================== VOICELL WEBHOOK (No Auth - called by Voicell) ====================

// POST /api/voicell/webhook — Receive call events from Voicell
router.post('/webhook', async (req, res) => {
    try {
        const payload = req.body;
        console.log('[VOICELL WEBHOOK] Received:', JSON.stringify(payload));
        
        // Extract common fields (adjust based on actual Voicell payload)
        const callerNumber = payload.cli || payload.caller_number || payload.callerNumber || payload.from || payload.caller || '';
        const agentNumber = payload.to || payload.agent_number || payload.agentNumber || payload.agent || '';
        const callId = payload.uniqueid || payload.call_id || payload.callId || payload.id || '';
        const status = payload.event || payload.status || payload.call_status || '';
        const duration = parseInt(payload.duration || payload.call_duration || 0);
        const recording = payload.recording_url || payload.recordingUrl || payload.recording || '';
        const dtmf = payload.dtmf || payload.dtmf_input || '';
        
        // Determine call type
        let callType = 'incoming';
        let callStatus = 'completed';
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('miss') || statusLower.includes('noanswer') || statusLower.includes('no_answer') || statusLower.includes('no answer')) {
            callType = 'missed';
            callStatus = 'missed';
        } else if (statusLower.includes('busy')) {
            callType = 'missed';
            callStatus = 'busy';
        } else if (statusLower.includes('answer') || statusLower.includes('complete') || statusLower.includes('connected')) {
            callType = 'incoming';
            callStatus = 'completed';
        } else if (statusLower.includes('ring') || status === 'IN' || status === 'TA' || statusLower === 'in' || statusLower === 'ta') {
            callStatus = 'ringing';
        } else if (statusLower.includes('fail')) {
            callStatus = 'failed';
        }
        
        // Normalize phone number (remove +91, spaces, etc.)
        let normalizedPhone = callerNumber.replace(/[\s\-\+]/g, '');
        if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
            normalizedPhone = normalizedPhone; // keep as 91XXXXXXXXXX
        } else if (normalizedPhone.length === 10) {
            normalizedPhone = '91' + normalizedPhone;
        }
        
        // Check if this call already exists (update if so)
        let callLog;
        if (callId) {
            callLog = await CallLog.findOne({ voicellCallId: callId });
        }
        
        if (callLog) {
            // Update existing call log
            callLog.callStatus = callStatus;
            callLog.callType = callType;
            if (duration > 0) callLog.duration = duration;
            if (recording) callLog.recordingUrl = recording;
            if (dtmf) callLog.dtmfInput = dtmf;
            if (agentNumber) callLog.agentNumber = agentNumber;
            callLog.rawPayload = payload;
            await callLog.save();
        } else {
            // Try to find customer name from orders
            let customerName = '';
            if (normalizedPhone) {
                const order = await Order.findOne({
                    $or: [
                        { mobile: normalizedPhone },
                        { mobile: normalizedPhone.replace('91', '') },
                        { telNo: normalizedPhone },
                        { telNo: normalizedPhone.replace('91', '') },
                        { altNo: normalizedPhone },
                        { altNo: normalizedPhone.replace('91', '') }
                    ]
                }).sort({ createdAt: -1 });
                if (order) customerName = order.customerName || '';
            }
            
            // Create new call log
            callLog = new CallLog({
                voicellCallId: callId,
                callerNumber: normalizedPhone,
                agentNumber: agentNumber,
                callType,
                callStatus,
                duration,
                recordingUrl: recording,
                dtmfInput: dtmf,
                customerName,
                rawPayload: payload
            });
            await callLog.save();
        }
        
        // Emit socket event for real-time UI update
        try {
            const io = require('../socket-manager').getIo();
            if (io) {
                const eventPayload = {
                    type: callType,
                    status: callStatus,
                    callerNumber: normalizedPhone,
                    customerName: callLog.customerName,
                    agentNumber: callLog.agentNumber,
                    duration,
                    callId: callLog._id
                };

                // Find if an employee is assigned this agent number
                let targetEmployeeId = null;
                if (agentNumber) {
                    const agentEmployee = await Employee.findOne({ voicellExtension: agentNumber }).lean();
                    if (agentEmployee) {
                        targetEmployeeId = agentEmployee.employeeId;
                    }
                }

                if (targetEmployeeId) {
                    // Send strictly to that employee's room
                    console.log(`[VOICELL WEBHOOK] Routing call popup strictly to Employee: ${targetEmployeeId}`);
                    io.to(`employee:${targetEmployeeId}`).emit('voicell:call', eventPayload);
                } else {
                    // No employee mapped, do not popup anywhere
                    console.log(`[VOICELL WEBHOOK] No employee mapped to extension ${agentNumber}. Not routing popup.`);
                }
            }
        } catch (e) { 
            console.error('[VOICELL WEBHOOK] Socket emit error:', e);
        }
        
        res.status(200).json({ success: true, message: 'Call logged', id: callLog._id });
    } catch (error) {
        console.error('[VOICELL WEBHOOK ERROR]', error);
        res.status(200).json({ success: true }); // Always 200 to Voicell
    }
});

// ==================== CALL LOG APIs (Auth Required) ====================

// GET /api/calls — Get all call logs with filters
router.get('/', async (req, res) => {
    try {
        const { type, status, outcome, date, phone, page = 1, limit = 50 } = req.query;
        const filter = {};
        
        if (type) filter.callType = type;
        if (status) filter.callStatus = status;
        if (outcome) filter.callOutcome = outcome;
        if (phone) {
            const normalizedPhone = phone.replace(/[\s\-\+]/g, '');
            filter.callerNumber = { $regex: normalizedPhone, $options: 'i' };
        }
        if (date) {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            filter.timestamp = { $gte: dayStart, $lte: dayEnd };
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [calls, total] = await Promise.all([
            CallLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)).lean(),
            CallLog.countDocuments(filter)
        ]);
        
        const mappedCalls = calls.map(mapCallLogToFrontend);
        
        res.json({ 
            success: true, 
            calls: mappedCalls, 
            total, 
            page: parseInt(page), 
            totalPages: Math.ceil(total / parseInt(limit)) 
        });
    } catch (error) {
        console.error('[CALLS LIST ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/calls/stats — Get call statistics
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const [totalToday, answeredToday, missedToday, totalAll, recentMissed] = await Promise.all([
            CallLog.countDocuments({ timestamp: { $gte: today, $lt: tomorrow } }),
            CallLog.countDocuments({ timestamp: { $gte: today, $lt: tomorrow }, callType: { $ne: 'missed' } }),
            CallLog.countDocuments({ timestamp: { $gte: today, $lt: tomorrow }, callType: 'missed' }),
            CallLog.countDocuments(),
            CallLog.countDocuments({ callType: 'missed', callbackDone: false })
        ]);
        
        res.json({
            success: true,
            stats: {
                totalToday,
                answeredToday,
                missedToday,
                pendingCallbacks: recentMissed,
                
                // Original nesting kept for schema/route backwards compatibility
                today: { total: totalToday, answered: answeredToday, missed: missedToday },
                overall: { total: totalAll }
            }
        });
    } catch (error) {
        console.error('[CALLS STATS ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/calls/missed — Get missed calls pending callback
router.get('/missed', async (req, res) => {
    try {
        const calls = await CallLog.find({
            callType: 'missed',
            callbackDone: false
        }).sort({ timestamp: -1 }).limit(100).lean();
        
        const mappedCalls = calls.map(mapCallLogToFrontend);
        
        res.json({ success: true, calls: mappedCalls, total: calls.length });
    } catch (error) {
        console.error('[MISSED CALLS ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/calls/:id — Get single call log detail
router.get('/:id', async (req, res) => {
    try {
        const call = await CallLog.findById(req.params.id).lean();
        if (!call) return res.status(404).json({ success: false, message: 'Call not found' });
        
        let orders = [];
        let allCalls = [];
        let customerSummary = { ltv: 0, totalOrders: 0, deliveredOrders: 0, statusBreakdown: {} };
        let latestAddress = null;

        if (call.callerNumber) {
            const phone10 = call.callerNumber.replace('91', '');
            
            // 1. Fetch Orders
            orders = await Order.find({
                $or: [
                    { mobile: call.callerNumber },
                    { mobile: phone10 },
                    { telNo: call.callerNumber },
                    { telNo: phone10 },
                    { altNo: call.callerNumber },
                    { altNo: phone10 }
                ]
            }).sort({ timestamp: -1, createdAt: -1 }).lean();
            
            // 2. Fetch All Historical Calls
            allCalls = await CallLog.find({
                $or: [
                    { callerNumber: call.callerNumber },
                    { callerNumber: phone10 },
                    { callerNumber: '91' + phone10 }
                ]
            }).sort({ timestamp: -1 }).lean();
            
            // 3. Compute Summary
            customerSummary.totalOrders = orders.length;
            orders.forEach(o => {
                const s = o.status || 'Pending';
                customerSummary.statusBreakdown[s] = (customerSummary.statusBreakdown[s] || 0) + 1;
                if (s === 'Delivered') {
                    customerSummary.deliveredOrders++;
                    customerSummary.ltv += (Number(o.total) || 0);
                }
            });
            
            // Extract latest address
            const addressOrder = orders.find(o => o.address && o.state && (o.pincode || o.pin));
            if (addressOrder) {
                latestAddress = {
                    customerName: addressOrder.customerName || call.customerName || '',
                    fatherOrHusbandName: addressOrder.fatherOrHusbandName || '',
                    gender: addressOrder.gender || '',
                    age: addressOrder.age || '',
                    problem: addressOrder.problem || '',
                    address: addressOrder.address || '',
                    hNo: addressOrder.hNo || '',
                    blockGaliNo: addressOrder.blockGaliNo || '',
                    villColony: addressOrder.villColony || '',
                    landmark: addressOrder.landmark || '',
                    city: addressOrder.city || addressOrder.distt || '',
                    state: addressOrder.state || '',
                    pincode: addressOrder.pincode || addressOrder.pin || ''
                };
            }
        }
        
        const frontendCall = mapCallLogToFrontend(call);
        frontendCall.customerOrders = orders; // Legacy compat
        
        res.json({ 
            success: true, 
            call: frontendCall, 
            orders, 
            allCalls: allCalls.map(mapCallLogToFrontend), 
            customerSummary,
            latestAddress
        });
    } catch (error) {
        console.error('[CALL DETAIL ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/calls/:id/notes — Add note to a call
router.post('/:id/notes', async (req, res) => {
    try {
        // Handle both body formats (req.body.note vs req.body.text) sent by frontend
        const { note, text, addedBy } = req.body;
        const noteContent = note || text;
        
        if (!noteContent) return res.status(400).json({ success: false, message: 'Note is required' });
        
        const call = await CallLog.findById(req.params.id);
        if (!call) return res.status(404).json({ success: false, message: 'Call not found' });
        
        call.callNotes.push({ note: noteContent, addedBy: addedBy || 'Admin', addedAt: new Date() });
        await call.save();
        
        res.json({ success: true, call: mapCallLogToFrontend(call) });
    } catch (error) {
        console.error('[CALL NOTE ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/calls/:id/outcome — Update call outcome
router.put('/:id/outcome', async (req, res) => {
    try {
        const { outcome, callbackScheduled } = req.body;
        const update = {};
        if (outcome) update.callOutcome = outcome;
        if (callbackScheduled) update.callbackScheduled = new Date(callbackScheduled);
        
        const call = await CallLog.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!call) return res.status(404).json({ success: false, message: 'Call not found' });
        
        res.json({ success: true, call: mapCallLogToFrontend(call) });
    } catch (error) {
        console.error('[CALL OUTCOME ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/calls/:id/callback-done — Mark callback as done
router.put('/:id/callback-done', async (req, res) => {
    try {
        const call = await CallLog.findByIdAndUpdate(req.params.id, { callbackDone: true }, { new: true });
        if (!call) return res.status(404).json({ success: false, message: 'Call not found' });
        
        res.json({ success: true, call: mapCallLogToFrontend(call) });
    } catch (error) {
        console.error('[CALLBACK DONE ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/calls/customer/:phone/360 — Customer 360° view
router.get('/customer/:phone/360', async (req, res) => {
    try {
        let phone = req.params.phone.replace(/[\s\-\+]/g, '');
        let phone10 = phone;
        if (phone.startsWith('91') && phone.length === 12) phone10 = phone.substring(2);
        else if (phone.length === 10) phone = '91' + phone;
        
        // Get all data in parallel
        const [calls, orders] = await Promise.all([
            CallLog.find({
                $or: [
                    { callerNumber: phone },
                    { callerNumber: phone10 }
                ]
            }).sort({ timestamp: -1 }).limit(50).lean(),
            
            Order.find({
                $or: [
                    { mobile: phone },
                    { mobile: phone10 },
                    { telNo: phone },
                    { telNo: phone10 }
                ]
            }).sort({ createdAt: -1 }).lean()
        ]);
        
        // Build customer summary
        const totalOrders = orders.length;
        const totalCalls = calls.length;
        const missedCalls = calls.filter(c => c.callType === 'missed').length;
        const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const lastOrder = orders[0] || null;
        const lastCall = calls[0] || null;
        const customerName = (orders[0] && orders[0].customerName) || (calls[0] && calls[0].customerName) || 'Unknown';
        
        // Get unique medicines ordered
        const medicines = new Set();
        orders.forEach(o => {
            if (o.items) o.items.forEach(item => { if (item.description) medicines.add(item.description); });
        });
        
        // Order status breakdown
        const statusBreakdown = {};
        orders.forEach(o => {
            statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
        });
        
        const mappedCalls = calls.map(mapCallLogToFrontend);
        
        res.json({
            success: true,
            customer: {
                name: customerName,
                phone,
                phone10,
                totalOrders,
                totalCalls,
                missedCalls,
                totalSpent,
                medicines: Array.from(medicines),
                statusBreakdown,
                
                // Add summary object for the frontend dashboard panels
                summary: {
                    totalOrders,
                    totalCalls,
                    missedCalls,
                    totalSpent,
                    medicines: Array.from(medicines).length
                },
                
                lastOrder: lastOrder ? { orderId: lastOrder.orderId, date: lastOrder.timestamp, status: lastOrder.status, total: lastOrder.total } : null,
                lastCall: lastCall ? { date: lastCall.timestamp, type: lastCall.callType, duration: lastCall.duration } : null
            },
            calls: mappedCalls,
            orders
        });
    } catch (error) {
        console.error('[CUSTOMER 360 ERROR]', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
