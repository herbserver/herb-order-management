// Delete ALL Employees - Fresh Start
const fs = require('fs');
const path = require('path');

const EMPLOYEES_FILE = path.join(__dirname, 'data', 'employees.json');

try {
    console.log('🗑️  Deleting all employees...\n');

    // Check if file exists
    if (fs.existsSync(EMPLOYEES_FILE)) {
        const currentData = JSON.parse(fs.readFileSync(EMPLOYEES_FILE, 'utf8'));
        const count = Object.keys(currentData).length;

        console.log(`📊 Current employees: ${count}`);

        // Write empty object
        fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify({}, null, 2), 'utf8');

        console.log(`✅ Deleted ${count} employees successfully!`);
    } else {
        console.log('⚠️  Employees file not found - creating empty file...');
        fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify({}, null, 2), 'utf8');
        console.log('✅ Empty employees file created!');
    }

    console.log('\n✨ Employees database is now clean!');
    console.log('📝 You can now register new employees fresh.\n');

} catch (error) {
    console.error('❌ Error:', error.message);
}
