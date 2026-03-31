/**
 * Lazy Module Loader
 * Dynamically loads JavaScript modules only when needed
 */

const lazyLoader = {
    loaded: {},
    loading: {},

    /**
     * Load a JavaScript module dynamically
     * @param {string} moduleName - Name of the module to load
     * @param {string} path - Path to the JS file
     * @returns {Promise} - Resolves when module is loaded
     */
    async loadModule(moduleName, path) {
        // Already loaded
        if (this.loaded[moduleName]) {
            console.log(`✅ Module "${moduleName}" already loaded`);
            return Promise.resolve();
        }

        // Currently loading
        if (this.loading[moduleName]) {
            console.log(`⏳ Module "${moduleName}" is loading...`);
            return this.loading[moduleName];
        }

        // Start loading
        console.log(`📦 Loading module: ${moduleName} from ${path}`);

        this.loading[moduleName] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = path + '?v=' + Date.now(); // Cache busting
            script.async = true;

            script.onload = () => {
                this.loaded[moduleName] = true;
                delete this.loading[moduleName];
                console.log(`✅ Module "${moduleName}" loaded successfully!`);
                resolve();
            };

            script.onerror = (error) => {
                delete this.loading[moduleName];
                console.error(`❌ Failed to load module "${moduleName}":`, error);
                reject(new Error(`Failed to load ${moduleName}`));
            };

            document.head.appendChild(script);
        });

        return this.loading[moduleName];
    },

    /**
     * Load multiple modules in parallel
     * @param {Array} modules - Array of {name, path} objects
     * @returns {Promise} - Resolves when all modules are loaded
     */
    async loadModules(modules) {
        const promises = modules.map(m => this.loadModule(m.name, m.path));
        return Promise.all(promises);
    },

    /**
     * Check if a module is loaded
     * @param {string} moduleName
     * @returns {boolean}
     */
    isLoaded(moduleName) {
        return !!this.loaded[moduleName];
    }
};

// Make globally available
window.lazyLoader = lazyLoader;

console.log('🚀 Lazy Loader initialized');
