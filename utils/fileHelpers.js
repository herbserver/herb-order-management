const fs = require('fs');

/**
 * Centralized File Helper Utilities
 * 
 * This module provides shared JSON file read/write operations
 * to eliminate duplicate code across multiple route files.
 * 
 * Used by: auth.js, employees.js, departments.js, orders.js, admin.js, dataAccess.js
 */

/**
 * Read JSON file with error handling
 * @param {string} filePath - Absolute path to JSON file
 * @param {any} defaultValue - Default value if file doesn't exist or parse fails
 * @returns {any} Parsed JSON data or default value
 */
function readJSON(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return defaultValue;
    }
}

/**
 * Write data to JSON file with formatting
 * @param {string} filePath - Absolute path to JSON file
 * @param {any} data - Data to write (will be JSON stringified)
 * @returns {boolean} Success status
 */
function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error.message);
        return false;
    }
}

/**
 * Async write to JSON file (non-blocking)
 * @param {string} filePath - Absolute path to JSON file
 * @param {any} data - Data to write
 * @param {Function} callback - Optional callback(err)
 */
function writeJSONAsync(filePath, data, callback) {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) console.error(`Error writing ${filePath}:`, err.message);
        if (callback) callback(err);
    });
}

module.exports = {
    readJSON,
    writeJSON,
    writeJSONAsync
};
