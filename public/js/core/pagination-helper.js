/**
 * Flexible Pagination Helper
 * Allows users to select items per page (10, 25, 50, 100, All)
 */

// Items per page configuration with localStorage persistence
const paginationConfig = {
    STORAGE_KEY: 'herb_items_per_page',
    DEFAULT_ITEMS: 12,
    OPTIONS: [
        { value: 10, label: '10 orders' },
        { value: 25, label: '25 orders' },
        { value: 50, label: '50 orders' },
        { value: 100, label: '100 orders' },
        { value: 0, label: 'Show All' }
    ],

    // Get current items per page from localStorage or default
    getItemsPerPage() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? parseInt(stored) : this.DEFAULT_ITEMS;
    },

    // Save items per page to localStorage
    setItemsPerPage(value) {
        localStorage.setItem(this.STORAGE_KEY, value.toString());
    },

    // Create dropdown HTML
    createDropdown(containerId, onChangeCallback) {
        const current = this.getItemsPerPage();
        const options = this.OPTIONS.map(opt =>
            `<option value="${opt.value}" ${opt.value === current ? 'selected' : ''}>${opt.label}</option>`
        ).join('');

        return `
            <div class="flex items-center gap-2 text-sm">
                <label class="text-gray-600 font-medium">Show:</label>
                <select 
                    id="${containerId}" 
                    onchange="${onChangeCallback}"
                    class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors">
                    ${options}
                </select>
            </div>
        `;
    }
};

// Enhanced pagination controls with items per page selector
function renderPaginationWithSelector(container, currentPage, totalItems, itemsPerPage, fetchFuncName) {
    const totalPages = itemsPerPage > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;

    const controls = document.createElement('div');
    controls.className = 'col-span-full flex justify-between items-center gap-4 mt-6 flex-wrap';

    controls.innerHTML = `
        <!-- Items per page selector -->
        <div class="flex-shrink-0">
            ${paginationConfig.createDropdown('itemsPerPageSelect', `handleItemsPerPageChange('${fetchFuncName}')`)}
        </div>
        
        <!-- Pagination controls -->
        <div class="flex items-center gap-3 flex-1 justify-center">
            <button onclick="${fetchFuncName}(1)" 
                class="px-3 py-1.5 rounded-lg border text-sm font-medium ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                ${currentPage === 1 ? 'disabled' : ''}>
                ⏮️ First
            </button>
            
            <button onclick="${fetchFuncName}(${currentPage - 1})" 
                class="px-4 py-1.5 rounded-lg border text-sm font-medium ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                ${currentPage === 1 ? 'disabled' : ''}>
                ← Previous
            </button>
            
            <span class="text-sm font-bold text-gray-700 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                Page ${currentPage} of ${totalPages}
                <span class="text-gray-500 text-xs ml-1">(${totalItems} total)</span>
            </span>
            
            <button onclick="${fetchFuncName}(${currentPage + 1})" 
                class="px-4 py-1.5 rounded-lg border text-sm font-medium ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                ${currentPage === totalPages ? 'disabled' : ''}>
                Next →
            </button>
            
            <button onclick="${fetchFuncName}(${totalPages})" 
                class="px-3 py-1.5 rounded-lg border text-sm font-medium ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}"
                ${currentPage === totalPages ? 'disabled' : ''}>
                ⏭️ Last
            </button>
        </div>
        
        <!-- Info -->
        <div class="text-xs text-gray-500 flex-shrink-0">
            Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}
        </div>
    `;

    container.appendChild(controls);
}

// Handle items per page change
function handleItemsPerPageChange(fetchFuncName) {
    const select = document.getElementById('itemsPerPageSelect');
    if (!select) return;

    const newValue = parseInt(select.value);
    paginationConfig.setItemsPerPage(newValue);

    console.log(`📊 Items per page changed to: ${newValue === 0 ? 'All' : newValue}`);

    // Reload data with new limit (reset to page 1)
    if (typeof window[fetchFuncName] === 'function') {
        window[fetchFuncName](1);
    }
}

// Make globally available
window.paginationConfig = paginationConfig;
window.renderPaginationWithSelector = renderPaginationWithSelector;
window.handleItemsPerPageChange = handleItemsPerPageChange;

console.log('✅ Flexible pagination helper loaded');
