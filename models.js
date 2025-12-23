const mongoose = require('mongoose');

// Order Schema - COMPLETE with all fields from old system
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, required: true },

    // Employee Info
    employee: String,
    employeeId: String,

    // Customer Info
    customerName: { type: String, required: true },
    telNo: String,
    mobile: String,
    altNo: String,
    email: String,

    // Address Info
    address: { type: String, required: true },
    hNo: String,
    blockGaliNo: String,
    villColony: String,
    landmark: String,
    landMark: String,  // Keep both for compatibility
    postOfficeName: String,
    po: String,  // Keep both
    tahTaluka: String,
    distt: String,
    city: String,
    state: { type: String, required: true },
    pin: String,
    pincode: String,  // Keep both

    // Order Info
    orderType: String,
    date: String,
    time: String,
    treatment: String,
    paymentMode: { type: String, default: 'COD' },
    total: { type: Number, required: true },
    advance: Number,
    codAmount: Number,

    // Items
    items: [{
        description: String,
        quantity: Number,
        price: Number,
        rate: Number,
        amount: Number
    }],

    // Status
    status: {
        type: String,
        enum: ['Pending', 'Address Verified', 'Dispatched', 'Delivered', 'Cancelled', 'On Hold', 'Unverified'],
        default: 'Pending',
        index: true
    },

    // Verification Info
    verifiedBy: String,
    verifiedAt: String,
    verificationRemark: {
        text: String,
        addedBy: String,
        addedAt: String
    },

    // Dispatch Info
    dispatchedBy: String,
    dispatchedAt: String,

    // Delivery Info
    deliveredBy: String,
    deliveredAt: String,
    deliveryRequested: Boolean,
    deliveryRequestedBy: {
        employeeId: String,
        employeeName: String,
        requestedAt: String
    },

    // Shiprocket
    shiprocket: {
        awb: String,
        courierName: String,
        shiprocketOrderId: String,
        dispatchedAt: String
    },

    // Tracking
    tracking: {
        courier: String,
        trackingId: String,
        currentStatus: String,
        lastUpdate: String,
        lastUpdatedAt: String,
        dispatchedAt: String
    },

    // Hold Order Details
    holdDetails: {
        isOnHold: { type: Boolean, default: false },
        holdReason: String,
        expectedDispatchDate: Date,
        holdBy: String,
        holdAt: String
    },

    // Remarks
    remarks: [{
        text: String,
        addedBy: String,
        addedAt: String,
        timestamp: String
    }],

    // Cancellation Info
    cancellationInfo: {
        cancelledAt: Date,
        cancelledBy: String,
        cancellationReason: String
    },

    // Courier Suggestion (from Verification to Dispatch)
    courierSuggestion: {
        suggestedCourier: String,
        suggestedBy: String,
        suggestedAt: Date,
        suggestionNote: String
    },

    // Misc
    updatedAt: String
}, {
    timestamps: true,
    collection: 'orders'
});

// Department Schema
const departmentSchema = new mongoose.Schema({
    departmentId: { type: String, required: true, unique: true, index: true },
    departmentName: { type: String, required: true },
    password: { type: String, required: true },
    departmentType: {
        type: String,
        required: true,
        enum: ['employee', 'verification', 'dispatch', 'delivery'],
        index: true
    },
    employees: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: String
}, {
    timestamps: true,
    collection: 'departments'
});

// Shiprocket Config Schema
const shiprocketConfigSchema = new mongoose.Schema({
    configId: { type: String, default: 'main', unique: true },
    enabled: { type: Boolean, default: true },
    apiEmail: String,
    apiPassword: String,
    authToken: String,
    tokenExpiry: String,
    pickupAddress: {
        name: String,
        phone: String,
        address: String,
        city: String,
        state: String,
        pincode: String
    },
    defaultDimensions: {
        length: Number,
        breadth: Number,
        height: Number,
        weight: Number
    },
    shiprocketOrderCounter: { type: Number, default: 7417 }
}, {
    timestamps: true,
    collection: 'shiprocket_config'
});

// Notification Schema - For real-time alerts
const notificationSchema = new mongoose.Schema({
    orderId: { type: String, required: true, index: true },
    employeeId: String,
    type: {
        type: String,
        enum: ['tracking_update', 'order_update', 'system_alert'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    emoji: String,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    data: mongoose.Schema.Types.Mixed,
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now, index: true }
}, {
    timestamps: true,
    collection: 'notifications'
});

// Create models
const Order = mongoose.model('Order', orderSchema);
const Department = mongoose.model('Department', departmentSchema);
const ShiprocketConfig = mongoose.model('ShiprocketConfig', shiprocketConfigSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
    Order,
    Department,
    ShiprocketConfig,
    Notification
};
