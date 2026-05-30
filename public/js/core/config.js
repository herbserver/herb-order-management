/**
 * Global Configuration
 * Core settings and constants used across the application
 */

// API Configuration - using var to allow redeclaration
var API_URL = API_URL || (window.location.origin + '/api');

console.log('Connecting to API at:', API_URL);

// Admin password is now verified server-side via /api/config/admin-login
// Do NOT store admin password on frontend for security

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

// Product List - available immediately on the frontend
// DB can still override this later, but the UI should never start empty.
window.DEFAULT_PRODUCT_LIST = window.DEFAULT_PRODUCT_LIST || [
    { name: 'Amlex', price: 6.66 },
    { name: 'Black pills', price: 666 },
    { name: 'Ess. Oil', price: 500 },
    { name: 'Ess. capsule', price: 999 },
    { name: 'Gaumutra', price: 6.66 },
    { name: 'H.O.S.', price: 3300 },
    { name: 'Herbon Daibayog Cap', price: 780 },
    { name: 'Herbon Tulsi Paawan', price: 499 },
    { name: 'Herbon Urja Rasayan Cap', price: 1590 },
    { name: 'HOS Powder', price: 1500 },
    { name: 'NadiYog Capsule', price: 1460 },
    { name: 'Namo Tea', price: 1500 },
    { name: 'Naskhol Capsule', price: 1990 },
    { name: 'Ostrich-Cap', price: 0 },
    { name: 'PainOver Capsule', price: 960 },
    { name: 'Pain Snap Prash', price: 2499 },
    { name: 'Same Medicine', price: 0 },
    { name: 'Spray Oil', price: 800 },
    { name: 'Tea-1500', price: 1500 },
    { name: 'Tea-1800', price: 1800 },
    { name: 'Tea-400', price: 400 },
    { name: "Vains Clean Capsules", price: 1599 },
    { name: "Vedic Vain's Liquid", price: 2499 },
    { name: 'Vedic-Cap', price: 1399 },
    { name: 'Vedic-Tab', price: 1199 },
    { name: 'Vena-V', price: 1599 }
];

window.PRODUCT_LIST = (Array.isArray(window.PRODUCT_LIST) && window.PRODUCT_LIST.length > 0)
    ? window.PRODUCT_LIST
    : window.DEFAULT_PRODUCT_LIST.slice();

/**
 * Load products from MongoDB via API
 * Called automatically on page load
 */
async function loadProductListFromDB() {
    try {
        const res = await fetch('/api/config/products');
        const data = await res.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
            window.PRODUCT_LIST = data.products;
            // Notify any listening components (e.g., order form dropdowns)
            window.dispatchEvent(new CustomEvent('productsLoaded', { detail: data.products }));
            console.log(`✅ Products loaded from DB: ${data.products.length} items`);
        }
    } catch (e) {
        console.warn('⚠️ Could not load products from DB:', e.message);
    }
}

// Auto-load products when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProductListFromDB);
} else {
    loadProductListFromDB();
}

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
