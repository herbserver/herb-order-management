const fs = require('fs');

const db = JSON.parse(fs.readFileSync('public/data/pincodes.json'));

// Simulate the new search logic
const query = 'sagar';
const q = query.toLowerCase();
const results = [];
const seen = new Set();

for (const item of db) {
    if (item.districtName.toLowerCase().includes(q)) {
        const key = `${item.districtName}|${item.stateName}`;
        if (!seen.has(key)) {
            seen.add(key);
            const distLower = item.districtName.toLowerCase();
            results.push({
                district: item.districtName,
                state: item.stateName,
                priority: distLower === q ? 1 : (distLower.startsWith(q) ? 2 : 3)
            });
        }
    }
}

// Sort  by priority
results.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.district.localeCompare(b.district);
});

console.log(`\n✅ Search Results for "${query}": (Top 10)\n`);
results.slice(0, 10).forEach((r, i) => {
    const priorityLabel = r.priority === 1 ? '[EXACT]' : (r.priority === 2 ? '[STARTS]' : '[CONTAINS]');
    console.log(`${i + 1}. ${priorityLabel} ${r.district}, ${r.state}`);
});
