/**
 * Department Panel Search Functions
 * Search within current department's visible orders
 */

// Filter Verification Department Orders
function filterDeptOrders(query) {
    const q = query.toLowerCase().trim();
    const cards = document.querySelectorAll('#deptOrdersList [data-mobile]');

    let visibleCount = 0;
    cards.forEach(card => {
        const mobile = (card.getAttribute('data-mobile') || '').toLowerCase();
        const text = card.innerText.toLowerCase();
        const matches = !q || mobile.includes(q) || text.includes(q);

        card.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
    });

    console.log(`🔍 Dept search: "${query}" - ${visibleCount} results`);
}

// Filter Delivery Department specific tabs
function filterDeliveryOrders(query, listId) {
    const q = query.toLowerCase().trim();
    const cards = document.querySelectorAll(`#${listId} > div`);

    let visibleCount = 0;
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        const matches = !q || text.includes(q);

        card.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
    });

    console.log(`🔍 Delivery search (${listId}): "${query}" - ${visibleCount} results`);
}

// Specific filter functions for each delivery tab
function filterOFDOrders(query) {
    filterDeliveryOrders(query, 'ofdOrdersList');
}

function filterOnWayOrders(query) {
    filterDeliveryOrders(query, 'onWayOrdersList');
}

function filterDeliveredOrders(query) {
    filterDeliveryOrders(query, 'deliveredOrdersList');
}

function filterRTOOrders(query) {
    filterDeliveryOrders(query, 'rtoOrdersList');
}

// Debounce timer for search
let headerSearchDebounce = null;

// Check if we're in delivery department
function isDeliveryDepartment() {
    const deliveryContent = document.getElementById('deliveryDeptContent');
    return deliveryContent && !deliveryContent.classList.contains('hidden');
}

// Search only delivery department tabs (Dispatched, OFD, Delivered, RTO)
async function searchDeliveryDepartmentOrders(query) {
    if (!query || query.trim().length < 3) {
        if (typeof showWarningPopup === 'function') {
            showWarningPopup('Search Too Short', 'Kam se kam 3 characters likhein');
        }
        return;
    }

    const searchQuery = query.trim();
    console.log('🚚 Delivery department search:', searchQuery);

    try {
        // Show loading
        if (typeof showLoadingPopup === 'function') {
            showLoadingPopup('Searching delivery orders...');
        }

        // Fetch orders from multiple delivery statuses
        const statuses = ['Dispatched', 'Out For Delivery', 'Delivered', 'RTO'];
        const allOrders = [];

        for (const status of statuses) {
            try {
                const res = await fetch(`${API_URL}/orders?status=${encodeURIComponent(status)}`);
                const data = await res.json();
                if (data.success && data.orders) {
                    allOrders.push(...data.orders);
                }
            } catch (e) {
                console.warn(`Could not fetch ${status} orders:`, e);
            }
        }

        if (typeof closeLoadingPopup === 'function') {
            closeLoadingPopup();
        }

        // Filter results locally
        const q = searchQuery.toLowerCase();
        const results = allOrders.filter(o => {
            const mobile = (o.telNo || '').toLowerCase();
            const orderId = (o.orderId || '').toLowerCase();
            const customerName = (o.customerName || '').toLowerCase();
            return mobile.includes(q) || orderId.includes(q) || customerName.includes(q);
        });

        if (results.length === 0) {
            if (typeof showWarningPopup === 'function') {
                showWarningPopup('No Results', `"${searchQuery}" se koi order nahi mila delivery tabs mein`);
            }
            return;
        }

        // Display results
        if (typeof displaySearchResults === 'function') {
            displaySearchResults(results, searchQuery);
        } else {
            console.log('Found orders:', results);
            alert(`Found ${results.length} orders matching "${searchQuery}"`);
        }

    } catch (error) {
        if (typeof closeLoadingPopup === 'function') {
            closeLoadingPopup();
        }
        console.error('Delivery search error:', error);
    }
}

// Header search - smart department detection
function filterDeptOrdersHeader(query) {
    const q = query.trim();

    // For quick typing (< 3 chars), just filter current visible tab
    if (q.length < 3) {
        // Delegate to active tab's filter
        const activeTab = document.querySelector('#deptOrdersList:not(.hidden)');
        if (activeTab) {
            filterDeptOrders(query);
            return;
        }

        // Check delivery tabs
        if (!document.getElementById('deliveryOFDTab')?.classList.contains('hidden')) {
            filterOFDOrders(query);
        } else if (!document.getElementById('deliveryOnWayTab')?.classList.contains('hidden')) {
            filterOnWayOrders(query);
        } else if (!document.getElementById('deliveryDeliveredTab')?.classList.contains('hidden')) {
            filterDeliveredOrders(query);
        } else if (!document.getElementById('deliveryRTOTab')?.classList.contains('hidden')) {
            filterRTOOrders(query);
        }
        return;
    }

    // For 3+ chars, use debounced department-aware search
    clearTimeout(headerSearchDebounce);
    headerSearchDebounce = setTimeout(() => {
        if (isDeliveryDepartment()) {
            // Delivery department - search only delivery tabs
            searchDeliveryDepartmentOrders(q);
        } else if (typeof globalSearchOrder === 'function') {
            // Other departments - global search
            globalSearchOrder(q);
        } else {
            console.warn('Search function not available');
            filterDeptOrders(query);
        }
    }, 500);
}

// Handle Enter key for immediate search
function handleHeaderSearchKeypress(event, input) {
    if (event.key === 'Enter') {
        const q = input.value.trim();
        if (q.length >= 3) {
            clearTimeout(headerSearchDebounce);
            if (isDeliveryDepartment()) {
                searchDeliveryDepartmentOrders(q);
            } else if (typeof globalSearchOrder === 'function') {
                globalSearchOrder(q);
            }
        }
    }
}

// Export to window
window.filterDeptOrders = filterDeptOrders;
window.filterDeptOrdersHeader = filterDeptOrdersHeader;
window.handleHeaderSearchKeypress = handleHeaderSearchKeypress;
window.filterOFDOrders = filterOFDOrders;
window.filterOnWayOrders = filterOnWayOrders;
window.filterDeliveredOrders = filterDeliveredOrders;
window.filterRTOOrders = filterRTOOrders;
window.searchDeliveryDepartmentOrders = searchDeliveryDepartmentOrders;

console.log('✅ Department search functions loaded (with delivery-specific search)');

