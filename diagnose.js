const fs = require('fs');
const path = require('path');

const PINCODES_FILE = path.join(__dirname, 'public', 'data', 'pincodes.json');
const EMPLOYEES_FILE = path.join(__dirname, 'data', 'employees.json');

console.log('--- DIAGNOSIS START ---');

// 1. Check Pincode Loading
console.log('1. Testing Pincode Database Loading...');
let pincodeDatabase = [];
try {
    const start = Date.now();
    if (!fs.existsSync(PINCODES_FILE)) {
        console.error('❌ Pincode file NOT FOUND at: ' + PINCODES_FILE);
    } else {
        const stats = fs.statSync(PINCODES_FILE);
        console.log(`Pincode file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        const pincodeData = fs.readFileSync(PINCODES_FILE, 'utf8');
        pincodeDatabase = JSON.parse(pincodeData);
        const end = Date.now();
        console.log(`✅ Loaded ${pincodeDatabase.length.toLocaleString()} pincode records in ${(end - start)}ms`);
    }
} catch (error) {
    console.error('❌ Error loading pincode database:', error.message);
    console.error(error.stack);
}

// 2. Test Search Logic
console.log('\n2. Testing Search Logic (e.g., "110001")...');
if (pincodeDatabase.length > 0) {
    const searchTerm = '110001';
    const results = pincodeDatabase.filter(item => String(item.pincode).includes(searchTerm));
    console.log(`Found ${results.length} matches for "110001"`);
} else {
    console.log('Skipping search test because database is empty.');
}

// 3. Check Employees
console.log('\n3. Testing Employee Loading...');
try {
    if (!fs.existsSync(EMPLOYEES_FILE)) {
        console.error('❌ Employees file NOT FOUND at: ' + EMPLOYEES_FILE);
    } else {
        const empData = fs.readFileSync(EMPLOYEES_FILE, 'utf8');
        const employees = JSON.parse(empData);
        console.log(`✅ Loaded ${Object.keys(employees).length} employees`);
        console.log('Employee IDs:', Object.keys(employees));
    }
} catch (error) {
    console.error('❌ Error loading employees:', error.message);
}

console.log('--- DIAGNOSIS END ---');
