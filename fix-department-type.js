// Fix Department Type - HON-D002
require('dotenv').config();
const { connectDatabase } = require('./database');
const { Department } = require('./models');

async function fixDepartmentType() {
    console.log('🔧 Fixing department type...\n');

    await connectDatabase();

    const deptId = 'HON-D002';
    const correctType = 'delivery';

    // Find department
    const dept = await Department.findOne({ deptId: deptId });

    if (!dept) {
        console.log(`❌ Department ${deptId} not found!`);
        process.exit(1);
    }

    console.log(`📋 Current Details:`);
    console.log(`   ID: ${dept.deptId}`);
    console.log(`   Name: ${dept.name}`);
    console.log(`   Type: ${dept.type}`);
    console.log(`   Should be: ${correctType}\n`);

    if (dept.type === correctType) {
        console.log(`✅ Already correct! No changes needed.`);
        process.exit(0);
    }

    // Update type
    dept.type = correctType;
    await dept.save();

    console.log(`✅ Updated successfully!`);
    console.log(`   ${deptId} → type: ${correctType}`);

    process.exit(0);
}

fixDepartmentType().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
