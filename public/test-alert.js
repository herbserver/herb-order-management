// TEST SCRIPT - Manually trigger Out for Delivery alert
// Run in browser console to test alert system

// Test order data
const testOrder = {
    orderId: 'HON7417',
    customerName: 'Test Customer',
    telNo: '9876543210'
};

const testTracking = {
    currentStatus: 'Out for Delivery',
    location: 'Delhi Hub',
    lastUpdate: 'Package out for delivery'
};

// Trigger the alert
if (typeof showOutForDeliveryAlert === 'function') {
    console.log('🧪 Testing Out for Delivery Alert...');
    showOutForDeliveryAlert(testOrder, testTracking);
    console.log('✅ Alert should appear with sound!');
} else {
    console.error('❌ Alert function not found! Make sure auto-tracking.js is loaded.');
}
