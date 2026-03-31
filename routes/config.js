const express = require('express');
const router = express.Router();
const { AppConfig } = require('../models');
const { hashPassword, comparePassword } = require('../auth');
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@2025';
const LEGACY_DEFAULT_ADMIN_PASSWORDS = ['admin@herb2025', 'admin123'];

// Default product list (used for first-time DB initialization)
const DEFAULT_PRODUCTS = [
    "Amlex", "Black pills", "Blue & White capsule", "Blue&White Cap",
    "Ess Oil", "Ess. Cap", "Ess. capsule", "Gaumutra", "H.O.S.",
    "Herb On Naturals Herbal Tea", "Herb On Vedic Plus Capsule",
    "Herbon Daibayog Cap", "Herbon Tulsi Paawan", "Herbon Urja Rasayan Capsule",
    "HOS Powder", "KamGold capsule", "kamGold Oil", "KamGold Prash",
    "Mind Fresh Tea", "Nadi Yog Capsule", "Nadiyog", "Naskhol",
    "Naskhol Capsule", "Oil", "Ostrich-Cap", "Ostrich-Red Oil",
    "Pain Over Capsule", "Pain Snap Prash", "Painover", "Pangasic Oil",
    "Same Medicine", "Slim fit kit", "Spray Oil", "Tea-1500",
    "Tea-1800", "Tea-400", "Vedic Vain's Liquid", "Vedic-Cap",
    "Vedic-Tab", "Vena-V", "Yellow capsule", "Yellow Cpasule"
];

// Helper: Get or create AppConfig document
async function getOrCreateConfig() {
    let config = await AppConfig.findOne({ configId: 'main' });
    if (!config) {
        // First time: create with default password + products
        const hashed = await hashPassword(DEFAULT_ADMIN_PASSWORD);
        config = new AppConfig({
            configId: 'main',
            adminPassword: hashed,
            products: DEFAULT_PRODUCTS.map((name, i) => ({ name, order: i, active: true }))
        });
        await config.save();
        console.log('✅ AppConfig initialized in DB with default admin password & products');
    }
    return config;
}

// ==================== ADMIN LOGIN (Server-side) ====================
// POST /api/config/admin-login
router.post('/admin-login', async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Password required' });

        const config = await getOrCreateConfig();

        if (!config.adminPassword) {
            // No password set yet — accept env password and save it
            if (password === DEFAULT_ADMIN_PASSWORD) {
                const hashed = await hashPassword(password);
                config.adminPassword = hashed;
                await config.save();
                return res.json({ success: true, message: 'Login successful' });
            }
            return res.status(401).json({ success: false, message: 'Invalid admin password' });
        }

        let isValid = await comparePassword(password, config.adminPassword);
        if (!isValid && !process.env.ADMIN_PASSWORD && password === DEFAULT_ADMIN_PASSWORD) {
            for (const legacyPassword of LEGACY_DEFAULT_ADMIN_PASSWORDS) {
                const matchesLegacyDefault = await comparePassword(legacyPassword, config.adminPassword);
                if (!matchesLegacyDefault) continue;

                config.adminPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);
                await config.save();
                isValid = true;
                console.log('Admin password migrated to new default admin@2025');
                break;
            }
        }
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Galat Admin Password!' });
        }

        console.log('✅ Admin Login successful');
        res.json({ success: true, message: 'Login successful' });
    } catch (err) {
        console.error('❌ Admin login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== CHANGE ADMIN PASSWORD ====================
// POST /api/config/change-admin-password
router.post('/change-admin-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Both passwords required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const config = await getOrCreateConfig();
        const isValid = await comparePassword(currentPassword, config.adminPassword);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        config.adminPassword = await hashPassword(newPassword);
        await config.save();

        console.log('✅ Admin password changed');
        res.json({ success: true, message: 'Admin password changed successfully!' });
    } catch (err) {
        console.error('❌ Change password error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== PRODUCTS ====================

// GET /api/config/products — Fetch all active products
router.get('/products', async (req, res) => {
    try {
        const config = await getOrCreateConfig();
        const products = (config.products || [])
            .filter(p => p.active !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        res.json({ success: true, products });
    } catch (err) {
        console.error('❌ Get products error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/config/products/all — Fetch all products (including inactive) for admin management
router.get('/products/all', async (req, res) => {
    try {
        const config = await getOrCreateConfig();
        res.json({ success: true, products: config.products || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/config/products — Add a new product
router.post('/products', async (req, res) => {
    try {
        const { name, category } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Product name required' });
        }

        const config = await getOrCreateConfig();

        // Check duplicate
        const exists = config.products.some(p => p.name.toLowerCase() === name.trim().toLowerCase());
        if (exists) {
            return res.status(400).json({ success: false, message: 'Product already exists!' });
        }

        config.products.push({
            name: name.trim(),
            category: category || 'General',
            active: true,
            order: config.products.length
        });
        await config.save();

        console.log(`✅ Product Added: ${name.trim()}`);
        res.json({ success: true, message: 'Product added!', products: config.products });
    } catch (err) {
        console.error('❌ Add product error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/config/products/:id — Update a product
router.put('/products/:id', async (req, res) => {
    try {
        const { name, category, active } = req.body;
        const config = await getOrCreateConfig();

        const product = config.products.id(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if (name !== undefined) product.name = name.trim();
        if (category !== undefined) product.category = category;
        if (active !== undefined) product.active = active;

        await config.save();
        res.json({ success: true, message: 'Product updated!', products: config.products });
    } catch (err) {
        console.error('❌ Update product error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/config/products/:id — Delete a product
router.delete('/products/:id', async (req, res) => {
    try {
        const config = await getOrCreateConfig();
        config.products = config.products.filter(p => p._id.toString() !== req.params.id);
        await config.save();
        res.json({ success: true, message: 'Product deleted!', products: config.products });
    } catch (err) {
        console.error('❌ Delete product error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/config/products/reorder — Reorder products
router.post('/products/reorder', async (req, res) => {
    try {
        const { orderedIds } = req.body; // Array of product IDs in new order
        const config = await getOrCreateConfig();

        orderedIds.forEach((id, index) => {
            const product = config.products.id(id);
            if (product) product.order = index;
        });

        await config.save();
        res.json({ success: true, message: 'Products reordered!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
module.exports.getOrCreateConfig = getOrCreateConfig;
