const fs = require('fs');
let code = fs.readFileSync('public/js/panels/employee.js', 'utf8');

// Fix calculateTotal
code = code.replace(/function calculateTotal\(\) \{[\s\S]*?calculateCOD\(\);\n\}/, 
\unction calculateTotal() {
    let sum = 0;
    const empItems = document.querySelectorAll('.item-row .item-row-total');
    if (empItems.length > 0) {
        empItems.forEach(i => sum += Number(i.value || 0));
    } else {
        // Fallback for app.js Edit Order legacy UI
        let itemCount = 0;
        document.querySelectorAll('#itemsContainer > div').forEach(div => {
            const descEl = div.querySelector('.item-desc');
            const desc = descEl ? descEl.value : null;
            const qtyEl = div.querySelector('.item-qty');
            const qty = qtyEl ? parseInt(qtyEl.value) || 0 : 0;
            if (desc) itemCount += qty;
        });
        
        if (itemCount === 0) {
            const totalInput = document.getElementById('totalAmountInput');
            if (totalInput) totalInput.value = 0;
        }
        
        calculateCOD();
        return;
    }
    
    const totalInput = document.getElementById('totalAmountInput');
    if (totalInput) {
        totalInput.value = sum;
    }
    calculateCOD();
}\);

fs.writeFileSync('public/js/panels/employee.js', code);
console.log('Fixed calculateTotal in employee.js');
