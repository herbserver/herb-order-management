/**
 * ============================================
 * CORE UTILS - Helper Functions
 * ============================================
 * Common utility functions used throughout the app.
 * 
 * Add new helper functions here.
 */

/**
 * Convert string to Title Case
 * @param {string} str - Input string
 * @returns {string} Title cased string
 */
function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Format date to DD/MM/YYYY
 * @param {string|Date} dateStr - Date to format
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB');
    } catch (e) {
        return '-';
    }
}

/**
 * Format date to DD/MM/YYYY HH:MM
 * @param {string|Date} dateStr - Date to format
 * @returns {string} Formatted date with time
 */
function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '-';
    }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => alert('Copied: ' + text))
            .catch(err => console.error('Copy failed', err));
    } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            alert('Copied: ' + text);
        } catch (err) {
            console.error('Copy failed', err);
        }
        document.body.removeChild(textArea);
    }
}

/**
 * Copy tracking number to clipboard
 * @param {string} text - Tracking ID
 */
function copyTracking(text) {
    copyToClipboard(text);
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string|Date} dateStr - Date to format
 * @returns {string} Relative time string
 */
function getRelativeTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateStr);
}

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if date is today
 * @param {string|Date} dateStr - Date to check
 * @returns {boolean}
 */
function isToday(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

/**
 * Check if date is yesterday
 * @param {string|Date} dateStr - Date to check
 * @returns {boolean}
 */
function isYesterday(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
}

/**
 * Calculate stats for today, yesterday, and last 7 days
 * @param {Array} orders - Orders array
 * @param {string} dateField - Field name for date
 * @returns {Object} Stats object
 */
function calculateDateStats(orders, dateField = 'timestamp') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

    let todayCount = 0, yesterdayCount = 0, weekCount = 0;

    orders.forEach(o => {
        const d = new Date(o[dateField]);
        if (d >= today) todayCount++;
        else if (d >= yesterday && d < today) yesterdayCount++;
        if (d >= weekAgo) weekCount++;
    });

    return { today: todayCount, yesterday: yesterdayCount, week: weekCount };
}
