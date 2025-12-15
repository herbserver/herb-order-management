const fs = require('fs');

const db = JSON.parse(fs.readFileSync('public/data/pincodes.json'));
const sagar = db.filter(i => i.districtName.toLowerCase().includes('sagar'));

console.log('Total Sagar records:', sagar.length);

if (sagar.length > 0) {
    console.log('\n✅ SAGAR FOUND! First 3 samples:');
    sagar.slice(0, 3).forEach(s => {
        console.log(`  - ${s.districtName}, ${s.stateName}, PIN: ${s.pincode}`);
    });
} else {
    console.log('\n❌ NO SAGAR FOUND IN DATABASE!');
}
