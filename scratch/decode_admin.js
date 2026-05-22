const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// Define the exact replacement map
const replacements = {
    '≡ƒôì': '📌',  // Pending / Verification / District Explorer
    'Γ£à': '✅',    // Verified / Save
    '≡ƒÜÜ': '🚚',  // In Transit / Delivery
    '≡ƒôª': '📦',  // Out For Delivery / Dispatch / Order Details
    '≡ƒòÆ': '🕒',  // Pending Option
    '≡ƒÄë': '🎉',  // Delivered
    'Γ¥î': '❌',    // Cancelled
    'ΓÅ╕∩╕Å': '⏸️', // On Hold
    'Γå⌐∩╕Å': '↩️', // RTO
    '≡ƒæÑ': '👥',  // Employees
    '≡ƒÅó': '🏢',  // Departments
    '≡ƒôï': '📋',  // History
    '≡ƒôè': '📊',  // Analytics
    '≡ƒôÑ': '📥',  // Export Data
    '≡ƒÜ¬': '🚪',  // Logout
    'Γ₧ò': '➕',    // Register Dept
    '≡ƒöä': '🔄',  // Refresh
    '≡ƒôê': '📈',  // Chart Increasing
    '≡ƒÑº': '🥈',  // 2nd Place Medal
    '≡ƒÅå': '🏆',  // Trophy
    '≡ƒùæ∩╕Å': '🗑️', // Wastebasket
    '≡ƒùæ': '🗑️',   // Wastebasket
    '≡ƒÆ╛': '💾',  // Floppy Disk
    '≡ƒæñ': '👤',  // Bust in Silhouette
    '≡ƒÅ╖∩╕Å': '🏷️', // Label
    '≡ƒÅ╖': '🏷️',   // Label
    '≡ƒù║∩╕Å': '🗺️', // World Map
    '≡ƒù║': '🗺️',   // World Map
    '≡ƒÅ¢∩╕Å': '🏛️', // Talukas
    '≡ƒÅ¢': '🏛️',   // Talukas
    '≡ƒô«': '📮',  // Post Offices
    'Γé╣': '₹',    // Rupee symbol
    'ΓåÆ': '→',    // Right arrow
    'ΓÜá∩╕Å': '⚠️', // Warning
    'Γ£ò': '✖️',    // Clear/Close
    'Γ£Å∩╕Å': '✏️', // Edit
    'Γ£Å': '✏️',     // Edit
    
    // Additional ones found in search
    '≡ƒöì': '🔍',   // Filter Offices / Search
    '≡ƒæê': '👈',   // Pointing left
    '≡ƒåò': '🆕',   // New Fresh Order
    '≡ƒÆ░': '💰',   // Payment Details
    '≡ƒÜ¢': '🚛',   // Articulated Lorry / Shipped
    '≡ƒ¢╡': '🛵',   // Scooter / OFD
    '≡ƒöù': '🔗'    // Track on website link
};

let count = 0;
for (const [mojibake, correct] of Object.entries(replacements)) {
    if (content.includes(mojibake)) {
        // Replace all occurrences
        const regex = new RegExp(mojibake, 'g');
        content = content.replace(regex, correct);
        console.log(`Replaced: ${mojibake} -> ${correct}`);
        count++;
    }
}

// Write the file back with UTF-8 encoding
fs.writeFileSync(adminPath, content, 'utf8');
console.log(`Successfully completed replacements of ${count} unique mojibake patterns in public/admin.html`);
