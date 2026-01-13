/**
 * Global Configuration
 * Core settings and constants used across the application
 */

// API Configuration - using var to allow redeclaration
var API_URL = API_URL || (window.location.origin + '/api');

console.log('Connecting to API at:', API_URL);

// Admin Password 
var ADMIN_PASS = ADMIN_PASS || 'admin123';

// Courier Tracking URLs
window.COURIER_TRACKING = window.COURIER_TRACKING || {
    'Shiprocket': 'https://shiprocket.co/tracking/',
    'Delhivery': 'https://www.delhivery.com/track/package/',
    'BlueDart': 'https://www.bluedart.com/tracking/',
    'Ekart': 'https://ekartlogistics.com/track/',
    'DTDC': 'https://www.dtdc.in/tracking.asp?strCnno=',
    'Xpressbees': 'https://www.xpressbees.com/track?awb=',
    'Ecom Express': 'https://ecomexpress.in/tracking/?awb_field=',
    'Shadowfax': 'https://tracker.shadowfax.in/',
    'Amazon': 'https://www.amazon.in/gp/your-account/order-history',
    'Professional': 'https://www.tpcindia.com/track.aspx'
};

// Product List for Order Form
window.PRODUCT_LIST = window.PRODUCT_LIST || [
    { name: "Vedic Vain's Liquid" },
    { name: "Pain Snap Prash" },
    { name: "Naskhol" },
    { name: "Nadiyog" },
    { name: "Oil" },
    { name: "Spray Oil" },
    { name: "Vedic-Tab" },
    { name: "Vedic-Cap" },
    { name: "Vena-V" },
    { name: "Painover" },
    { name: "Ostrich-Cap" },
    { name: "Gaumutra" },
    { name: "Amlex" },
    { name: "Black pills" },
    { name: "Tea-400" },
    { name: "Tea-1500" },
    { name: "Tea-1800" },
    { name: "Ostrich-Red Oil" },
    { name: "HOS Powder" },
    { name: "Mind Fresh Tea" },
    { name: "H.O.S." },
    { name: "Slim fit kit" }
];

// Emoji constants for WhatsApp compatibility
window.E = window.E || {
    check: String.fromCodePoint(0x2705),
    cross: String.fromCodePoint(0x274C),
    phone: String.fromCodePoint(0x1F4DE),
    pin: String.fromCodePoint(0x1F4CD),
    pack: String.fromCodePoint(0x1F4E6),
    truck: String.fromCodePoint(0x1F69A),
    money: String.fromCodePoint(0x1F4B0),
    rupee: String.fromCodePoint(0x20B9),
    star: String.fromCodePoint(0x2B50),
    fire: String.fromCodePoint(0x1F525),
    herb: String.fromCodePoint(0x1F33F),
    wave: String.fromCodePoint(0x1F44B),
    pray: String.fromCodePoint(0x1F64F),
    sparkle: String.fromCodePoint(0x2728),
    gift: String.fromCodePoint(0x1F381),
    heart: String.fromCodePoint(0x2764),
    cart: String.fromCodePoint(0x1F6D2),
    arr: String.fromCodePoint(0x25B8)
};

// Pagination settings
window.ORDERS_PER_PAGE = window.ORDERS_PER_PAGE || 10;

// Admin Pagination State
var adminPagination = adminPagination || {
    pending: 1,
    verified: 1,
    dispatched: 1,
    delivered: 1,
    cancelled: 1,
    onhold: 1
};
