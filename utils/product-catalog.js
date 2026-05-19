const DEFAULT_PRODUCT_CATALOG = [
    { name: 'Amlex', rate: 6.66 },
    { name: 'Black pills', rate: 666 },
    { name: 'Ess. Oil', rate: 500, aliases: ['Ess Oil', 'Ess. oil'] },
    { name: 'Ess. capsule', rate: 999, aliases: ['Ess. Cap'] },
    { name: 'Gaumutra', rate: 6.66 },
    { name: 'H.O.S.', rate: 3300 },
    { name: 'Herbon Daibayog Cap', rate: 780 },
    { name: 'Herbon Tulsi Paawan', rate: 499 },
    { name: 'Herbon Urja Rasayan Cap', rate: 1590, aliases: ['Herbon Urja Rasayan Capsule'] },
    { name: 'HOS Powder', rate: 1500 },
    { name: 'NadiYog Capsule', rate: 1460, aliases: ['Nadi Yog Capsule', 'Nadiyog', 'Nadiog'] },
    { name: 'Namo Tea', rate: 1500 },
    { name: 'Naskhol Capsule', rate: 1990, aliases: ['Naskhol'] },
    { name: 'Ostrich-Cap', rate: 0, aliases: ['Ostrich-'] },
    { name: 'PainOver Capsule', rate: 960, aliases: ['Pain Over Capsule', 'Painover'] },
    { name: 'Pain Snap Prash', rate: 2499 },
    { name: 'Same Medicine', rate: 0 },
    { name: 'Spray Oil', rate: 800, aliases: ['Spray'] },
    { name: 'Tea-1500', rate: 1500 },
    { name: 'Tea-1800', rate: 1800 },
    { name: 'Tea-400', rate: 400 },
    { name: "Vedic Vain's Liquid", rate: 2499 },
    { name: 'Vedic-Cap', rate: 1399, aliases: ['Vedic Cap'] },
    { name: 'Vedic-Tab', rate: 1199, aliases: ['Vedic Tab'] },
    { name: 'Vena-V', rate: 1599, aliases: ['Vena -V'] }
];

const DEFAULT_PRODUCT_NAMES = DEFAULT_PRODUCT_CATALOG.map((product) => product.name);
const DEFAULT_PRODUCT_KEY_SET = new Set(DEFAULT_PRODUCT_NAMES.map((productName) => simplifyProductKey(productName)));

function normalizeWhitespace(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function simplifyProductKey(value) {
    return normalizeWhitespace(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function isCatalogProductName(name) {
    return DEFAULT_PRODUCT_KEY_SET.has(simplifyProductKey(name));
}

function buildReferenceMap(referenceProducts = DEFAULT_PRODUCT_NAMES) {
    const map = new Map();

    referenceProducts.forEach((productName) => {
        const normalizedName = normalizeWhitespace(productName);
        const productKey = simplifyProductKey(normalizedName);
        if (!normalizedName || !productKey || map.has(productKey)) {
            return;
        }

        map.set(productKey, normalizedName);
    });

    return map;
}

function buildCatalogAliasMap(referenceProducts = DEFAULT_PRODUCT_NAMES) {
    const referenceMap = buildReferenceMap(referenceProducts);
    const aliasMap = new Map(referenceMap);

    DEFAULT_PRODUCT_CATALOG.forEach((product) => {
        const canonicalKey = simplifyProductKey(product.name);
        const canonicalName = referenceMap.get(canonicalKey) || product.name;

        [product.name, ...(product.aliases || [])].forEach((alias) => {
            const aliasKey = simplifyProductKey(alias);
            if (!aliasKey) {
                return;
            }

            aliasMap.set(aliasKey, canonicalName);
        });
    });

    return aliasMap;
}

function normalizeProductName(name, referenceProducts = DEFAULT_PRODUCT_NAMES) {
    const normalizedName = normalizeWhitespace(name);
    if (!normalizedName) {
        return '';
    }

    const exactMatch = referenceProducts.find((productName) => {
        return normalizeWhitespace(productName).toLowerCase() === normalizedName.toLowerCase();
    });

    if (exactMatch) {
        return normalizeWhitespace(exactMatch);
    }

    const aliasMap = buildCatalogAliasMap(referenceProducts);
    const productKey = simplifyProductKey(normalizedName);
    return aliasMap.get(productKey) || normalizedName;
}

function normalizeConfiguredProducts(products = [], options = {}) {
    const includeDefaultProducts = options.includeDefaultProducts !== false;
    const strictCatalog = options.strictCatalog === true;
    const dedupedProducts = new Map();
    const sourceProducts = Array.isArray(products) ? products : [];

    sourceProducts.forEach((product, index) => {
        const rawName = typeof product === 'string' ? product : product?.name;
        const normalizedName = normalizeProductName(rawName, DEFAULT_PRODUCT_NAMES);
        const productKey = simplifyProductKey(normalizedName);

        if (!normalizedName || !productKey) {
            return;
        }

        if (strictCatalog && !isCatalogProductName(normalizedName)) {
            return;
        }

        const nextProduct = {
            name: normalizedName,
            category: typeof product === 'object' && normalizeWhitespace(product?.category)
                ? normalizeWhitespace(product.category)
                : 'General',
            active: typeof product === 'object' ? product.active !== false : true,
            order: typeof product === 'object' && Number.isFinite(Number(product?.order))
                ? Number(product.order)
                : index,
            rate: typeof product === 'object' ? (product.rate || 0) : 0
        };

        if (!dedupedProducts.has(productKey)) {
            dedupedProducts.set(productKey, nextProduct);
            return;
        }

        const existingProduct = dedupedProducts.get(productKey);
        existingProduct.active = existingProduct.active || nextProduct.active;
        existingProduct.order = Math.min(existingProduct.order, nextProduct.order);
        if (nextProduct.rate) {
            existingProduct.rate = nextProduct.rate;
        }

        if ((!existingProduct.category || existingProduct.category === 'General') && nextProduct.category !== 'General') {
            existingProduct.category = nextProduct.category;
        }
    });

    if (strictCatalog) {
        return DEFAULT_PRODUCT_NAMES.map((productName, index) => {
            const existingProduct = dedupedProducts.get(simplifyProductKey(productName));
            const canonicalProduct = DEFAULT_PRODUCT_CATALOG.find(p => p.name === productName) || {};
            return {
                name: productName,
                category: existingProduct?.category || 'General',
                active: existingProduct ? existingProduct.active !== false : true,
                order: index,
                rate: existingProduct && existingProduct.rate ? existingProduct.rate : (canonicalProduct.rate || 0)
            };
        });
    }

    if (includeDefaultProducts) {
        DEFAULT_PRODUCT_NAMES.forEach((productName, index) => {
            const productKey = simplifyProductKey(productName);
            if (dedupedProducts.has(productKey)) {
                return;
            }

            const canonicalProduct = DEFAULT_PRODUCT_CATALOG.find(p => p.name === productName) || {};
            dedupedProducts.set(productKey, {
                name: productName,
                category: 'General',
                active: true,
                order: sourceProducts.length + index,
                rate: canonicalProduct.rate || 0
            });
        });
    }

    return Array.from(dedupedProducts.values())
        .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name))
        .map((product, index) => ({
            name: product.name,
            category: product.category || 'General',
            active: product.active !== false,
            order: index,
            rate: product.rate || 0
        }));
}

module.exports = {
    DEFAULT_PRODUCT_CATALOG,
    DEFAULT_PRODUCT_NAMES,
    normalizeConfiguredProducts,
    isCatalogProductName,
    normalizeProductName,
    normalizeWhitespace,
    simplifyProductKey
};
