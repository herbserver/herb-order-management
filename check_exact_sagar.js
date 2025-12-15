const fs = require('fs');

const db = JSON.parse(fs.readFileSync('public/data/pincodes.json'));

// Check for EXACT "Sagar" (not Sibsagar)
const exactSagar = db.filter(i => i.districtName.toLowerCase() === 'sagar');
console.log('✅ Exact "Sagar" district records:', exactSagar.length);

if (exactSagar.length > 0) {
    console.log('\n✅ FOUND SAGAR! Samples:');
    exactSagar.slice(0, 5).forEach(s => {
        console.log(`  - ${s.districtName}, ${s.stateName}, PIN: ${s.pincode}, PO: ${s.officeName}`);
    });
} else {
    console.log('\n❌ NO EXACT "SAGAR" FOUND!');
    console.log('\nLet me check for "Sagar" in Madhya Pradesh specifically:');
    const mp = db.filter(i =>
        i.districtName.toLowerCase().includes('sagar') &&
        i.stateName.toLowerCase().includes('madhya')
    );
    console.log(`MP Sagar records: ${mp.length}`);
    if (mp.length > 0) {
        mp.slice(0, 3).forEach(s => {
            console.log(`  - ${s.districtName}, ${s.stateName}, PIN: ${s.pincode}`);
        });
    }
}
