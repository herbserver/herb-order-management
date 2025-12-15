const mongoose = require('mongoose');

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, required: true },
    customerName: { type: String, required: true },
    telNo: String,
    mobile: String,
    email: String,
    address: { type: String, required: true },
    landmark: String,
    postOfficeName: String,
    tahTaluka: String,
    distt: String,
    city: String,
    state: { type: String, required: true },
    pin: String,
    pincode: String,
    paymentMode: { type: String, default: 'COD' },
    total: { type: Number, required: true },
    items: [{
        description: String,
        quantity: Number,
        price: Number
    }],
    status: {
        type: String,
        enum: ['Pending', 'Address Verified', 'Dispatched', 'Delivered', 'Cancelled', 'On Hold', 'Unverified'],
        default: 'Pending',
        index: true
    },
    verifiedBy: String,
    verifiedAt: String,
    dispatchedBy: String,
    dispatchedAt: String,
    deliveredBy: String,
    deliveredAt: String,
    shiprocket: {
        awb: String,
        courierName: String,
        shiprocketOrderId: String,
        dispatchedAt: String
    },
    tracking: {
        currentStatus: String,
        lastUpdate: String,
        lastUpdatedAt: String
    },
    remarks: [{
        text: String,
        addedBy: String,
        addedAt: String,
        timestamp: String
    }]
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

// Create models
const Order = mongoose.model('Order', orderSchema);
const Department = mongoose.model('Department', departmentSchema);
const ShiprocketConfig = mongoose.model('ShiprocketConfig', shiprocketConfigSchema);

module.exports = {
    Order,
    Department,
    ShiprocketConfig
};
