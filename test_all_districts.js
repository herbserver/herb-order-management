const fs = require('fs');

const db = JSON.parse(fs.readFileSync('public/data/pincodes.json'));

// Test multiple districts to ensure fix works universally
const testQueries = [
    'sagar',
    'mumbai',
    'delhi',
    'bangalore',
    'jaipur',
    'pune',
    'chennai',
    'kolkata',
    'hyderabad',
    'agra'
];

console.log('🔍 TESTING DISTRICT SEARCH FOR ALL DISTRICTS\n');
console.log('='.repeat(70));

testQueries.forEach(query => {
    const q = query.toLowerCase();
    const results = [];
    const seen = new Set();

    // Simulate backend logic
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

    // Sort by priority
    results.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.district.localeCompare(b.district);
    });

    // Display results
    const priorityLabel = (p) => p === 1 ? '✅ EXACT' : (p === 2 ? '🔸 STARTS' : '🔹 CONTAINS');

    console.log(`\n📍 Query: "${query}"`);
    console.log(`   Found: ${results.length} district(s)`);

    if (results.length > 0) {
        console.log(`   Top 3 Results:`);
        results.slice(0, 3).forEach((r, i) => {
            console.log(`   ${i + 1}. ${priorityLabel(r.priority)} ${r.district}, ${r.state}`);
        });
    } else {
        console.log(`   ❌ NO RESULTS FOUND!`);
    }
});

console.log('\n' + '='.repeat(70));
console.log('✅ TEST COMPLETE - Verify exact matches appear first for ALL queries');
