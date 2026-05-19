const fs = require('fs');
const files = ['public/employee.html', 'public/admin.html', 'public/verification.html', 'public/delivery.html', 'public/dispatch.html'];
const timestamp = Date.now();

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/app\.js\?v=[^\"']+/g, 'app.js?v=' + timestamp);
        content = content.replace(/edit-order\.js\?v=[^\"']+/g, 'edit-order.js?v=' + timestamp);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
    }
});
