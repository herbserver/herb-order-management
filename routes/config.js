const express = require('express');
const router = express.Router();
const { AppConfig } = require('../models');
const { hashPassword, comparePassword } = require('../auth');
const {
    DEFAULT_PRODUCT_NAMES,
    isCatalogProductName,
    normalizeConfiguredProducts,
    normalizeProductName,
    simplifyProductKey
} = require('../utils/product-catalog');
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@2025';
const LEGACY_DEFAULT_ADMIN_PASSWORDS = ['admin@herb2025', 'admin123'];

function productListsMatch(currentProducts = [], nextProducts = []) {
    if (currentProducts.length !== nextProducts.length) {
        return false;
    }

    return currentProducts.every((product, index) => {
        const nextProduct = nextProducts[index];
        if (!nextProduct) {
            return false;
        }

        return String(product?.name || '').trim() === String(nextProduct.name || '').trim()
            && String(product?.category || 'General').trim() === String(nextProduct.category || 'General').trim()
            && (product?.active !== false) === (nextProduct.active !== false)
            && Number(product?.order || 0) === Number(nextProduct.order || 0)
            && Number(product?.rate || 0) === Number(nextProduct.rate || 0);
    });
}

// Helper: Get or create AppConfig document
async function getOrCreateConfig() {
    let config = await AppConfig.findOne({ configId: 'main' });
    if (!config) {
        // First time: create with default password + products
        const hashed = await hashPassword(DEFAULT_ADMIN_PASSWORD);
        config = new AppConfig({
            configId: 'main',
            adminPassword: hashed,
            products: normalizeConfiguredProducts(DEFAULT_PRODUCT_NAMES, { strictCatalog: false })
        });
        await config.save();
        console.log('✅ AppConfig initialized in DB with default admin password & products');
    }
    const repairedProducts = normalizeConfiguredProducts(config.products || [], { strictCatalog: false });
    if (!productListsMatch(config.products || [], repairedProducts)) {
        config.products = repairedProducts;
        await config.save();
        console.log('Product master repaired and synced with canonical employee panel list');
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
        const normalizedName = normalizeProductName(
            name,
            [...(config.products || []).map((product) => product.name), ...DEFAULT_PRODUCT_NAMES]
        );
        const normalizedKey = simplifyProductKey(normalizedName);

        // Check duplicate
        const exists = config.products.some((product) => simplifyProductKey(product.name) === normalizedKey);
        if (exists) {
            return res.status(400).json({ success: false, message: 'Product already exists!' });
        }

        config.products.push({
            name: normalizedName,
            category: category || 'General',
            active: true,
            order: config.products.length,
            rate: req.body.rate || 0
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

        if (name !== undefined) {
            const normalizedName = normalizeProductName(
                name,
                [...(config.products || []).map((item) => item.name), ...DEFAULT_PRODUCT_NAMES]
            );
            const normalizedKey = simplifyProductKey(normalizedName);

            const duplicate = config.products.some((item) => {
                return item._id.toString() !== req.params.id && simplifyProductKey(item.name) === normalizedKey;
            });

            if (duplicate) {
                return res.status(400).json({ success: false, message: 'Product already exists!' });
            }

            product.name = normalizedName;
        }
        if (category !== undefined) product.category = category;
        if (active !== undefined) product.active = active;
        if (req.body.rate !== undefined) product.rate = req.body.rate;

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
