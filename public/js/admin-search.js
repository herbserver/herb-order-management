/**
 * Admin Panel Search Functions
 * Search within current admin tab's visible orders
 */

// Generic admin filter function
function filterAdminOrders(query, listId) {
    const q = query.toLowerCase().trim();
    const cards = document.querySelectorAll(`#${listId} > div, #${listId} .order-card`);

    let visibleCount = 0;
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        const matches = !q || text.includes(q);

        card.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
    });

    console.log(`🔍 Admin search (${listId}): "${query}" - ${visibleCount} results`);
}

// Specific filter functions for each admin tab
function filterAdminPending(query) {
    filterAdminOrders(query, 'adminPendingList');
}

function filterAdminVerified(query) {
    filterAdminOrders(query, 'adminVerifiedList');
}

function filterAdminDispatched(query) {
    filterAdminOrders(query, 'adminDispatchedList');
}

function filterAdminDelivered(query) {
    filterAdminOrders(query, 'adminDeliveredList');
}

function filterAdminCancelled(query) {
    filterAdminOrders(query, 'adminCancelledList');
}

function filterAdminOnHold(query) {
    filterAdminOrders(query, 'adminOnHoldList');
}

// Export to window
window.filterAdminPending = filterAdminPending;
window.filterAdminVerified = filterAdminVerified;
window.filterAdminDispatched = filterAdminDispatched;
window.filterAdminDelivered = filterAdminDelivered;
window.filterAdminCancelled = filterAdminCancelled;
window.filterAdminOnHold = filterAdminOnHold;

console.log('✅ Admin search functions loaded');
