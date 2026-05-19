const fs = require('fs');
let content = fs.readFileSync('public/app.js', 'utf8');

const targetStr = `        document.getElementById('totalAmountInput').value = order.total || 0;
        calculateTotal(); // Trigger combo check

        // Radio Button - handle both old "REORDER" and new "Reorder" format
        if (order.orderType === 'REORDER' || order.orderType === 'Reorder') {
            document.querySelector('input[name="orderType"][value="REORDER"]').checked = true;
        } else {
            document.querySelector('input[name="orderType"][value="NEW"]').checked = true;
        }

        // Populate Items manually as they no longer have per-row Amount
        const container = document.getElementById('itemsContainer');
        container.innerHTML = '';
        (order.items || []).forEach(item => {
            const div = document.createElement('div');
            div.className = 'grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 mb-2';            const currentItemName = item.description || item.product || item.name || '';
            let options = PRODUCT_LIST.map(p =>
                \`<option value="\${p.name}">\${p.name}</option>\`
            ).join('');

            // Add "Other" if description is not in list
            if (currentItemName && !PRODUCT_LIST.find(p => p.name === currentItemName)) {
                options += \`<option value="\${currentItemName}">\${currentItemName}</option>\`;
            } else {
                options += \`<option value="Other">Other</option>\`;
            }

            div.innerHTML = \` 
                    <select class="col-span-12 md:col-span-8 border rounded-lg px-3 py-2 text-sm item-desc bg-white outline-none focus:border-emerald-500 transition-colors"
                        onchange="calculateTotal()"> 
                        <option value="">Select Product...</option> 
                        \${options}
                    </select> 
                    
                    <input type="number" placeholder="Qty" value="\${item.quantity || 1}" min="1"
                        class="col-span-8 md:col-span-3 border rounded-lg px-2 py-2 text-sm item-qty outline-none focus:border-emerald-500"
                        oninput="calculateTotal()"> 
                    
                    <button type="button" onclick="this.parentElement.remove(); calculateTotal();" class="col-span-4 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors text-center">A-</button> \`;
            
            // Append first so DOM API works perfectly
            container.appendChild(div);
            
            // Explicitly set the value via DOM API to prevent browser HTML parsing quirks
            if (currentItemName) {
                const selectEl = div.querySelector('.item-desc');
                if (selectEl) {
                    selectEl.value = currentItemName;
                }
            }

        });
        if (order.items.length === 0) {
            addItem();
        }

        calculateTotal(); // Recalculate totals`;

const newStr = `        // Radio Button - handle both old "REORDER" and new "Reorder" format
        if (order.orderType === 'REORDER' || order.orderType === 'Reorder') {
            document.querySelector('input[name="orderType"][value="REORDER"]').checked = true;
        } else {
            document.querySelector('input[name="orderType"][value="NEW"]').checked = true;
        }

        const container = document.getElementById('itemsContainer');
        container.innerHTML = '';
        
        (order.items || []).forEach(item => {
            const currentItemName = item.description || item.product || item.name || '';
            const qty = item.quantity || 1;
            const amt = item.amount || item.rate || 0;
            
            if (typeof window.addItem === 'function') {
                window.addItem();
                const div = container.lastElementChild;
                if (!div) return;
                
                const selectEl = div.querySelector('.item-desc');
                if (selectEl && currentItemName) {
                    if (!Array.from(selectEl.options).some(opt => opt.value === currentItemName)) {
                        selectEl.add(new Option(currentItemName, currentItemName));
                    }
                    selectEl.value = currentItemName;
                }
                
                const qtyEl = div.querySelector('.item-qty');
                if (qtyEl) qtyEl.value = qty;
                
                const amtEl = div.querySelector('.item-row-total');
                if (amtEl) amtEl.value = amt;
            } else {
                const div = document.createElement('div');
                div.className = 'grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 mb-2';
                let options = window.PRODUCT_LIST.map(p => \\\`<option value="\\\${p.name}">\\\${p.name}</option>\\\`).join('');
                if (currentItemName && !window.PRODUCT_LIST.find(p => p.name === currentItemName)) {
                    options += \\\`<option value="\\\${currentItemName}">\\\${currentItemName}</option>\\\`;
                } else {
                    options += \\\`<option value="Other">Other</option>\\\`;
                }
                div.innerHTML = \\\`
                    <select class="col-span-12 md:col-span-8 border rounded-lg px-3 py-2 text-sm item-desc bg-white outline-none focus:border-emerald-500 transition-colors" onchange="calculateTotal()"> 
                        <option value="">Select Product...</option> 
                        \\\${options}
                    </select> 
                    <input type="number" placeholder="Qty" value="\\\${qty}" min="1" class="col-span-8 md:col-span-3 border rounded-lg px-2 py-2 text-sm item-qty outline-none focus:border-emerald-500" oninput="calculateTotal()"> 
                    <button type="button" onclick="this.parentElement.remove(); calculateTotal();" class="col-span-4 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors text-center">A-</button>
                \\\`;
                container.appendChild(div);
                if (currentItemName) {
                    const selectEl = div.querySelector('.item-desc');
                    if (selectEl) selectEl.value = currentItemName;
                }
            }
        });
        
        if (order.items.length === 0 && typeof window.addItem === 'function') {
            window.addItem();
        }

        if (typeof calculateTotal === 'function') {
            calculateTotal();
        }
        
        document.getElementById('totalAmountInput').value = order.total || 0;
        if (typeof calculateCOD === 'function') calculateCOD();`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, newStr);
    fs.writeFileSync('public/app.js', content, 'utf8');
    console.log('REPLACEMENT SUCCESSFUL!');
} else {
    console.log('Target string NOT FOUND!');
}
