const fs = require('fs');
let content = fs.readFileSync('public/app.js', 'utf8');

const startIndex = content.indexOf("const container = document.getElementById('itemsContainer');");
const endIndex = content.indexOf("currentEditingOrderId = orderId;");

if (startIndex !== -1 && endIndex !== -1) {
    const chunkToReplace = content.substring(startIndex, endIndex);

    const newChunk = `const container = document.getElementById('itemsContainer');
        container.innerHTML = '';
        
        (order.items || []).forEach(item => {
            const currentItemName = item.description || item.product || item.name || '';
            const qty = item.quantity || 1;
            const amt = item.amount || item.rate || 0;
            
            const div = document.createElement('div');
            div.className = 'item-row grid grid-cols-12 gap-2 mb-2 items-center';
            
            // Build options array to perfectly match employee.js format
            let options = (window.PRODUCT_LIST || []).map((product) => {
                return \\\`<option value="\\\${product.name}" data-price="\\\${product.price || 0}">\\\${product.name}</option>\\\`;
            }).join('');
            
            // If current item is not in PRODUCT_LIST, add it to options
            if (currentItemName && !(window.PRODUCT_LIST || []).find(p => p.name === currentItemName)) {
                options += \\\`<option value="\\\${currentItemName}" data-price="\\\${amt/qty}">\\\${currentItemName}</option>\\\`;
            }
            
            div.innerHTML = \\\`
                <div class="col-span-6">
                    <select class="item-desc w-full p-2 border rounded" onchange="if(typeof updateTotal === 'function') updateTotal(this); else calculateTotal();">
                        <option value="">Select Product...</option>
                        \\\${options}
                    </select>
                </div>
                <div class="col-span-2">
                    <input type="number" class="item-qty w-full p-2 border rounded text-center" value="\\\${qty}" min="1" oninput="if(typeof updateTotal === 'function') updateTotal(this); else calculateTotal();">
                </div>
                <div class="col-span-3">
                    <input type="number" class="w-full p-2 border rounded text-right item-row-total" value="\\\${amt}" oninput="calculateTotal()">
                </div>
                <div class="col-span-1 text-center">
                    <button type="button" onclick="this.closest('.item-row').remove(); calculateTotal();" class="text-red-500 font-bold text-xl">×</button>
                </div>
            \\\`;
            
            container.appendChild(div);
            
            if (currentItemName) {
                const selectEl = div.querySelector('.item-desc');
                if (selectEl) selectEl.value = currentItemName;
            }
        });
        
        if (order.items.length === 0) {
            if (typeof window.addItem === 'function') {
                window.addItem();
            } else if (typeof addItem === 'function') {
                addItem();
            }
        }

        if (typeof calculateTotal === 'function') {
            calculateTotal();
        }
        
        document.getElementById('totalAmountInput').value = order.total || 0;
        if (typeof calculateCOD === 'function') calculateCOD();

        // Set Edit Mode
        `;

    content = content.replace(chunkToReplace, newChunk);
    fs.writeFileSync('public/app.js', content, 'utf8');
    console.log('REPLACEMENT SUCCESSFUL!');
} else {
    console.log('Target block NOT FOUND!');
}
