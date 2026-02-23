// Smart Reminders & Alerts Utility
const dataAccess = require('../dataAccess');

// Calculate all active reminders
async function calculateReminders() {
    try {
        const alerts = [];
        const orders = await dataAccess.getAllOrders();
        const now = new Date();

        // 1. Old Pending Orders (2+ days without verification)
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const oldPending = orders.filter(o => {
            if (o.status !== 'Pending' && o.status !== 'Unverified') return false;
            if (!o.timestamp) return false;
            const orderDate = new Date(o.timestamp);
            return orderDate < twoDaysAgo;
        });

        if (oldPending.length > 0) {
            alerts.push({
                id: 'old-pending',
                type: 'warning',
                priority: 'high',
                icon: '⚠️',
                title: 'Old Pending Orders',
                message: `${oldPending.length} orders pending verification for 2+ days`,
                count: oldPending.length,
                action: 'Go to Verification',
                actionUrl: '/verification',
                orders: oldPending.map(o => o.orderId)
            });
        }

        // 2. Ready to Dispatch (10+ verified orders)
        const readyToDispatch = orders.filter(o => o.status === 'Address Verified');

        if (readyToDispatch.length >= 10) {
            alerts.push({
                id: 'ready-dispatch',
                type: 'info',
                priority: 'medium',
                icon: '📦',
                title: 'Ready to Dispatch',
                message: `${readyToDispatch.length} verified orders ready for dispatch`,
                count: readyToDispatch.length,
                action: 'Go to Dispatch',
                actionUrl: '/dispatch',
                orders: readyToDispatch.map(o => o.orderId)
            });
        }

        // 3. Hold Orders Due Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const holdOrdersDue = orders.filter(o => {
            if (o.status !== 'On Hold') return false;
            if (!o.holdDetails?.expectedDispatchDate) return false;

            const dueDate = new Date(o.holdDetails.expectedDispatchDate);
            return dueDate >= today && dueDate < tomorrow;
        });

        if (holdOrdersDue.length > 0) {
            alerts.push({
                id: 'hold-due',
                type: 'warning',
                priority: 'high',
                icon: '🕐',
                title: 'Hold Orders Due Today',
                message: `${holdOrdersDue.length} hold orders scheduled for dispatch today`,
                count: holdOrdersDue.length,
                action: 'View Orders',
                actionUrl: '/admin',
                orders: holdOrdersDue.map(o => o.orderId)
            });
        }

        // 4. Pending COD Collections (5+ days after delivery)
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const oldCODPending = orders.filter(o => {
            if (o.paymentMode !== 'COD') return false;
            if (o.status !== 'Delivered') return false;
            if (o.paymentTracking?.codStatus !== 'Pending' && o.paymentTracking?.codStatus) return false;
            if (!o.deliveredAt) return false;

            const deliveredDate = new Date(o.deliveredAt);
            return deliveredDate < fiveDaysAgo;
        });

        if (oldCODPending.length > 0) {
            const totalAmount = oldCODPending.reduce((sum, o) => sum + (o.codAmount || 0), 0);

            alerts.push({
                id: 'old-cod',
                type: 'danger',
                priority: 'high',
                icon: '💰',
                title: 'Pending COD Collections',
                message: `${oldCODPending.length} COD collections pending (5+ days) - ₹${totalAmount.toLocaleString()}`,
                count: oldCODPending.length,
                amount: totalAmount,
                action: 'View COD Status',
                actionUrl: '/admin?tab=payments',
                orders: oldCODPending.map(o => o.orderId)
            });
        }

        // 5. Orders stuck in transit (Dispatched > 7 days, not delivered)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const stuckInTransit = orders.filter(o => {
            if (o.status !== 'Dispatched') return false;
            if (!o.dispatchedAt) return false;

            const dispatchDate = new Date(o.dispatchedAt);
            return dispatchDate < sevenDaysAgo;
        });

        if (stuckInTransit.length > 0) {
            alerts.push({
                id: 'stuck-transit',
                type: 'warning',
                priority: 'medium',
                icon: '🚚',
                title: 'Orders in Transit Too Long',
                message: `${stuckInTransit.length} orders dispatched 7+ days ago`,
                count: stuckInTransit.length,
                action: 'Check Status',
                actionUrl: '/admin',
                orders: stuckInTransit.map(o => o.orderId)
            });
        }

        // 6. High value pending orders (>₹5000)
        const highValuePending = orders.filter(o => {
            return (o.status === 'Pending' || o.status === 'Unverified') &&
                (o.total || 0) > 5000;
        });

        if (highValuePending.length > 0) {
            const totalValue = highValuePending.reduce((sum, o) => sum + (o.total || 0), 0);

            alerts.push({
                id: 'high-value-pending',
                type: 'info',
                priority: 'medium',
                icon: '💎',
                title: 'High Value Orders Pending',
                message: `${highValuePending.length} orders >₹5000 pending verification - Total: ₹${totalValue.toLocaleString()}`,
                count: highValuePending.length,
                amount: totalValue,
                action: 'Verify Now',
                actionUrl: '/verification',
                orders: highValuePending.map(o => o.orderId)
            });
        }

        // Sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        return alerts;

    } catch (error) {
        console.error('❌ Calculate reminders error:', error);
        return [];
    }
}

// Get reminder summary
async function getReminderSummary() {
    const alerts = await calculateReminders();

    return {
        total: alerts.length,
        high: alerts.filter(a => a.priority === 'high').length,
        medium: alerts.filter(a => a.priority === 'medium').length,
        low: alerts.filter(a => a.priority === 'low').length,
        alerts
    };
}

module.exports = {
    calculateReminders,
    getReminderSummary
};
