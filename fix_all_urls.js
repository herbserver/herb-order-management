const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'index.html');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    console.log('Starting comprehensive fix...');

    // Fix 1: Collapse ALL ${...} patterns that span multiple lines
    // This regex finds ${...} with content that may span lines
    let fixCount = 0;

    // Fix broken fetch URLs with employee ID
    const beforeEmp = content.length;
    content = content.replace(/\$\{API_URL\}\/orders\/employee\/\$\{currentUser\.id\}\s+`\)/g, '${API_URL}/orders/employee/${currentUser.id}`)');
    if (content.length !== beforeEmp) {
        fixCount++;
        console.log('Fixed: employee fetch URLs');
    }

    // Fix broken fetch URLs with orderId
    const beforeOrder = content.length;
    content = content.replace(/\$\{API_URL\}\/orders\/\$\{orderId\}\s+`\)/g, '${API_URL}/orders/${orderId}`)');
    content = content.replace(/\$\{API_URL\}\/orders\/\$\{orderId\}\s+\/verify/g, '${API_URL}/orders/${orderId}/verify');
    content = content.replace(/\$\{API_URL\}\/orders\/\$\{orderId\}\s+\/dispatch/g, '${API_URL}/orders/${orderId}/dispatch');
    content = content.replace(/\$\{API_URL\}\/orders\/\$\{orderId\}\s+\/deliver/g, '${API_URL}/orders/${orderId}/deliver');
    if (content.length !== beforeOrder) {
        fixCount++;
        console.log('Fixed: order fetch URLs');
    }

    // Fix broken fetch URLs with empId
    const beforeEmpId = content.length;
    content = content.replace(/\$\{API_URL\}\/employees\/\$\{empId\}\s+`\)/g, '${API_URL}/employees/${empId}`)');
    if (content.length !== beforeEmpId) {
        fixCount++;
        console.log('Fixed: employee profile fetch URLs');
    }

    // Fix broken fetch URLs with deptId
    const beforeDept = content.length;
    content = content.replace(/\$\{API_URL\}\/departments\/\$\{oldId\}\s+`/g, '${API_URL}/departments/${oldId}`');
    content = content.replace(/\$\{API_URL\}\/departments\/\$\{deptId\}\s+`/g, '${API_URL}/departments/${deptId}`');
    if (content.length !== beforeDept) {
        fixCount++;
        console.log('Fixed: department fetch URLs');
    }

    // Fix any remaining patterns with extra whitespace in template literals
    // Pattern: ${...}\n\n    `) or similar
    const beforeGeneral = content.length;
    content = content.replace(/\$\{([^}]+)\}\s+`\)/g, '${$1}`)');
    content = content.replace(/\$\{([^}]+)\}\s+`/g, '${$1}`');
    if (content.length !== beforeGeneral) {
        fixCount++;
        console.log('Fixed: general template literal whitespace');
    }

    // Write back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Successfully fixed ${fixCount} issue types in index.html`);

} catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
}
