const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const regex = /id=['"](admin[^'"]*)['"]/g;
let match;
const ids = [];
while ((match = regex.exec(html)) !== null) {
    ids.push(match[1]);
}
console.log('--- FOUND IDs ---');
ids.sort().forEach(id => console.log(id));

console.log('\n--- EXPECTED TAB CONTENT IDs ---');
['Pending', 'Verified', 'Dispatched', 'Delivered', 'Employees', 'Departments', 'History', 'Progress'].forEach(t => {
    const id = `admin${t}Tab`;
    const exists = ids.includes(id);
    console.log(`${id}: ${exists ? '✅' : '❌ MISSING'}`);
});

console.log('\n--- EXPECTED TAB BUTTON IDs ---');
['Pending', 'Verified', 'Dispatched', 'Delivered', 'Employees', 'Departments', 'History', 'Progress'].forEach(t => {
    const id = `adminTab${t}`;
    const exists = ids.includes(id);
    console.log(`${id}: ${exists ? '✅' : '❌ MISSING'}`);
});
