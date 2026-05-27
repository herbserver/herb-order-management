const express = require('express');
const router = express.Router();
const dataAccess = require('../dataAccess');
const { Employee, Order } = require('../models');

function buildTimestampMatch(startDate, endDate) {
    const match = {};

    if (startDate || endDate) {
        match.timestamp = {};
        if (startDate) {
            const start = new Date(`${startDate}T00:00:00+05:30`);
            match.timestamp.$gte = start.toISOString();
        }
        if (endDate) {
            const end = new Date(`${endDate}T23:59:59.999+05:30`);
            match.timestamp.$lte = end.toISOString();
        }
    }

    return match;
}

function parseStatusList(status) {
    if (!status) {
        return null;
    }

    return String(status)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
}

function defaultStats() {
    return {
        total: 0,
        pending: 0,
        verified: 0,
        dispatched: 0,
        ofd: 0,
        delivered: 0,
        cancelled: 0,
        hold: 0,
        rto: 0
    };
}

function getEffectiveOrderDate(order) {
    const explicitDate = String(order?.date || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(explicitDate)) {
        return explicitDate;
    }

    const timestamp = order?.timestamp;
    if (timestamp) {
        const date = new Date(timestamp);
        const offset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
        const istDate = new Date(date.getTime() + offset);
        return istDate.toISOString().slice(0, 10);
    }
    return '';
}

function filterOrdersByDateField(orders, startDate, endDate) {
    if (!startDate && !endDate) {
        return orders;
    }

    return orders.filter((order) => {
        const effectiveDate = getEffectiveOrderDate(order);
        if (!effectiveDate) return false;
        if (startDate && effectiveDate < startDate) return false;
        if (endDate && effectiveDate > endDate) return false;
        return true;
    });
}

function buildStatsFromOrders(orders) {
    return {
        total: orders.length,
        pending: orders.filter((order) => order.status === 'Pending').length,
        verified: orders.filter((order) => order.status === 'Address Verified').length,
        dispatched: orders.filter((order) => order.status === 'Dispatched').length,
        ofd: orders.filter((order) => order.status === 'Out For Delivery').length,
        delivered: orders.filter((order) => order.status === 'Delivered').length,
        cancelled: orders.filter((order) => order.status === 'Cancelled').length,
        hold: orders.filter((order) => order.status === 'On Hold' || order.status === 'Hold').length,
        rto: orders.filter((order) => order.status === 'RTO').length
    };
}

async function findEmployeeRecord(employeeId) {
    return Employee.findOne({ employeeId }).lean();
}

async function getEmployeeStats(employeeId, startDate, endDate, status, dateField = 'timestamp') {
    if (dateField === 'date') {
        const orders = await dataAccess.getEmployeeOrders(employeeId, status, 1, 0, null, null);
        return buildStatsFromOrders(filterOrdersByDateField(orders, startDate, endDate));
    }

    const statuses = parseStatusList(status);
    const match = { employeeId, ...buildTimestampMatch(startDate, endDate) };

    if (statuses && statuses.length > 0) {
        match.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }

    const [stats] = await Order.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
                verified: { $sum: { $cond: [{ $eq: ['$status', 'Address Verified'] }, 1, 0] } },
                dispatched: { $sum: { $cond: [{ $eq: ['$status', 'Dispatched'] }, 1, 0] } },
                ofd: { $sum: { $cond: [{ $eq: ['$status', 'Out For Delivery'] }, 1, 0] } },
                delivered: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
                hold: { $sum: { $cond: [{ $in: ['$status', ['On Hold', 'Hold']] }, 1, 0] } },
                rto: { $sum: { $cond: [{ $eq: ['$status', 'RTO'] }, 1, 0] } }
            }
        }
    ]);

    return stats ? { ...defaultStats(), ...stats } : defaultStats();
}

router.get('/', async (req, res) => {
    try {
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;
        const employees = await Employee.find({}).sort({ name: 1 }).lean();
        const match = buildTimestampMatch(startDate, endDate);

        const groupedStats = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$employeeId',
                    totalOrders: { $sum: 1 },
                    pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
                    verifiedOrders: { $sum: { $cond: [{ $eq: ['$status', 'Address Verified'] }, 1, 0] } },
                    dispatchedOrders: { $sum: { $cond: [{ $eq: ['$status', 'Dispatched'] }, 1, 0] } },
                    deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } },
                    cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
                    onHoldOrders: { $sum: { $cond: [{ $in: ['$status', ['On Hold', 'Hold']] }, 1, 0] } }
                }
            }
        ]);

        const statsMap = new Map(groupedStats.map((item) => [item._id, item]));
        const employeeList = employees.map((employee) => {
            const stats = statsMap.get(employee.employeeId) || {};
            return {
                id: employee.employeeId,
                name: employee.name,
                phone: employee.phone || '',
                createdAt: employee.createdAt,
                totalOrders: stats.totalOrders || 0,
                pendingOrders: stats.pendingOrders || 0,
                verifiedOrders: stats.verifiedOrders || 0,
                dispatchedOrders: stats.dispatchedOrders || 0,
                deliveredOrders: stats.deliveredOrders || 0,
                cancelledOrders: stats.cancelledOrders || 0,
                onHoldOrders: stats.onHoldOrders || 0
            };
        });

        res.json({ success: true, employees: employeeList });
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

router.get('/:empId', async (req, res) => {
    try {
        const id = req.params.empId.toUpperCase();
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 0;
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;
        const status = req.query.status || null;
        const dateField = req.query.dateField || 'timestamp';

        const employee = await findEmployeeRecord(id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found!' });
        }

        let orders;
        let total;

        if (dateField === 'date') {
            const allOrders = await dataAccess.getEmployeeOrders(id, status, 1, 0, null, null);
            const filteredOrders = filterOrdersByDateField(allOrders, startDate, endDate)
                .sort((left, right) => new Date(right.timestamp || 0) - new Date(left.timestamp || 0));

            total = filteredOrders.length;
            if (limit > 0) {
                const startIndex = (page - 1) * limit;
                orders = filteredOrders.slice(startIndex, startIndex + limit);
            } else {
                orders = filteredOrders;
            }
        } else {
            const result = await dataAccess.getEmployeeOrders(id, status, page, limit, startDate, endDate);
            orders = limit > 0 && result.orders ? result.orders : result;
            total = limit > 0 && result.total ? result.total : orders.length;
        }

        const stats = await getEmployeeStats(id, startDate, endDate, status, dateField);

        res.json({
            success: true,
            employee: {
                id,
                name: employee.name,
                createdAt: employee.createdAt
            },
            orders,
            pagination: limit > 0 ? {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            } : null,
            stats
        });
    } catch (error) {
        console.error('Get employee detail error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/:empId', async (req, res) => {
    try {
        const oldId = req.params.empId.toUpperCase();
        const { newId, name, password, phone, voicellExtension } = req.body;
        const nextId = String(newId || oldId).toUpperCase().trim();

        const existingEmployee = await findEmployeeRecord(oldId);
        if (!existingEmployee) {
            return res.status(404).json({ success: false, message: 'Employee not found!' });
        }

        if (oldId !== nextId) {
            const duplicateEmployee = await findEmployeeRecord(nextId);
            if (duplicateEmployee) {
                return res.status(400).json({ success: false, message: `ID ${nextId} already in use!` });
            }
        }

        const updates = {};
        let updatedName = existingEmployee.name;

        if (name) {
            updates.name = name;
            updatedName = name;
        }

        if (phone !== undefined) {
            updates.phone = String(phone).trim();
        }

        if (voicellExtension !== undefined) {
            updates.voicellExtension = String(voicellExtension).trim();
        }

        if (password) {
            const { hashPassword } = require('../auth');
            updates.password = await hashPassword(password);
        }

        const updatedEmployee = await Employee.findOneAndUpdate(
            { employeeId: oldId },
            { $set: { employeeId: nextId, ...updates } },
            { new: true, runValidators: true }
        );

        updatedName = updatedEmployee.name;
        await dataAccess.updateEmployeeOrders(oldId, nextId, updatedName);

        console.log(`Employee Updated: ${oldId} -> ${nextId} (${updatedName})`);
        res.json({
            success: true,
            message: 'Employee updated successfully!',
            employee: { id: nextId, name: updatedName, phone: updatedEmployee.phone }
        });
    } catch (error) {
        console.error('Employee update error:', error.message);
        res.status(500).json({ success: false, message: 'Update failed. ' + error.message });
    }
});

module.exports = router;
