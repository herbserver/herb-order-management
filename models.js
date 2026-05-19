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
    fatherOrHusbandName: String,
    gender: String,
    age: Number,
    problem: String,
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
    subtotal: Number,
    discount: { type: Number, default: 0 },
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
        enum: ['Pending', 'Address Verified', 'Dispatched', 'Out For Delivery', 'Delivered', 'Cancelled', 'RTO', 'On Hold', 'Unverified', 'Delivery Requested'],
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
    ofdAt: String,

    // Delivery Info
    deliveredBy: String,
    deliveredAt: String,
    rtoAt: String,
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
        location: String,
        dispatchedAt: String,
        allScans: [mongoose.Schema.Types.Mixed]
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
    suggestedCourier: String,  // Root level for quick access
    courierSuggestion: {
        suggestedCourier: String,
        suggestedBy: String,
        suggestedAt: Date,
        suggestionNote: String
    },

    // Misc
    remark: String,
    updatedAt: String
}, {
    timestamps: true,
    collection: 'orders'
});

// Performance Indices
orderSchema.index({ status: 1 });
orderSchema.index({ timestamp: -1 });
orderSchema.index({ employeeId: 1 });
orderSchema.index({ mobile: 1 }); // Index for mobile search (Duplication check)
orderSchema.index({ telNo: 1 });   // Index for mobile search (Alternate field)
orderSchema.index({ verifiedAt: -1 });
orderSchema.index({ dispatchedAt: -1 });
orderSchema.index({ deliveredAt: -1 });
orderSchema.index({ ofdAt: -1 });
orderSchema.index({ rtoAt: -1 });
orderSchema.index({ updatedAt: -1 });
orderSchema.index({ 'cancellationInfo.cancelledAt': -1 }); // Added for analytics
orderSchema.index({ employeeId: 1, timestamp: -1 }); // For Employee History
orderSchema.index({ status: 1, timestamp: -1 }); // For Department Panels
orderSchema.index({ orderType: 1 }); // For Stats


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

// Employee Schema
const employeeSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    createdAt: String
}, {
    timestamps: true,
    collection: 'employees'
});

employeeSchema.index({ name: 1 });

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

// AppConfig Schema - Admin password, product list, and other app settings
const appConfigSchema = new mongoose.Schema({
    configId: { type: String, default: 'main', unique: true },
    // Admin Password (bcrypt hashed)
    adminPassword: { type: String },
    // Product List
    products: [{
        name: { type: String, required: true },
        category: { type: String, default: 'General' },
        active: { type: Boolean, default: true },
        order: { type: Number, default: 0 }, rate: { type: Number, default: 0 }
    }]
}, {
    timestamps: true,
    collection: 'app_config'
});

// Pincode/Post Office Schema
const pincodeEntrySchema = new mongoose.Schema({
    officeName: { type: String, required: true, trim: true, index: true },
    pincode: { type: Number, required: true, index: true },
    taluk: { type: String, default: '', trim: true, index: true },
    districtName: { type: String, required: true, trim: true, index: true },
    stateName: { type: String, required: true, trim: true, index: true }
}, {
    timestamps: true,
    collection: 'pincodes'
});

pincodeEntrySchema.index({ districtName: 1, stateName: 1 });
pincodeEntrySchema.index({ officeName: 1, pincode: 1 });

// WhatsApp Message Schema - Store all sent/received messages
const whatsappMessageSchema = new mongoose.Schema({
    phone:     { type: String, required: true, index: true },  // 91XXXXXXXXXX
    name:      { type: String, default: 'Customer' },
    direction: { type: String, enum: ['out', 'in'], default: 'out' },  // out = sent by admin, in = received from customer
    type:      { type: String, enum: ['text', 'template', 'image', 'audio', 'video', 'document'], default: 'text' },
    body:      { type: String },            // actual message text (for display)
    templateName: { type: String },         // template name if type=template
    mediaId:   { type: String },            // Meta media ID for images/videos/audio
    status:    { type: String, enum: ['sent', 'delivered', 'read', 'failed'], default: 'sent' },
    orderId:   { type: String },            // linked order if any
    metaMsgId: { type: String },            // Meta message ID from API response
    isRead:    { type: Boolean, default: false }, // true when admin has opened and seen this message
    timestamp: { type: Date, default: Date.now, index: true }
}, {
    timestamps: true,
    collection: 'whatsapp_messages'
});
whatsappMessageSchema.index({ phone: 1, timestamp: -1 });

// Create models
const Order = mongoose.model('Order', orderSchema);
const Department = mongoose.model('Department', departmentSchema);
const Employee = mongoose.model('Employee', employeeSchema);
const ShiprocketConfig = mongoose.model('ShiprocketConfig', shiprocketConfigSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const AppConfig = mongoose.model('AppConfig', appConfigSchema);
const PincodeEntry = mongoose.model('PincodeEntry', pincodeEntrySchema);
const WhatsAppMessage = mongoose.model('WhatsAppMessage', whatsappMessageSchema);

module.exports = {
    Order,
    Department,
    Employee,
    ShiprocketConfig,
    Notification,
    AppConfig,
    PincodeEntry,
    WhatsAppMessage
};
