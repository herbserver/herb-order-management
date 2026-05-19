const fs = require('fs');

const appJsPath = 'public/app.js';
let content = fs.readFileSync(appJsPath, 'utf8');

const target = `            const currentItemName = item.description || item.product || item.name || '';
            let options = PRODUCT_LIST.map(p =>
                \`<option value="\${p.name}" \${p.name === currentItemName ? 'selected' : ''}>\${p.name}</option>\`
            ).join('');

            // Add "Other" if description is not in list
            if (currentItemName && !PRODUCT_LIST.find(p => p.name === currentItemName)) {
                options += \`<option value="\${currentItemName}" selected>\${currentItemName}</option>\`;
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
                    
                    <button type="button" onclick="this.parentElement.remove(); calculateTotal();" class="col-span-4 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors text-center">×</button> \`;
            container.appendChild(div);`;

const targetRegex = new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*'));

const replacement = `            const currentItemName = item.description || item.product || item.name || '';
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
                    
                    <button type="button" onclick="this.parentElement.remove(); calculateTotal();" class="col-span-4 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors text-center">×</button> \`;
            
            // Append first so DOM API works perfectly
            container.appendChild(div);
            
            // Explicitly set the value via DOM API to prevent browser HTML parsing quirks
            if (currentItemName) {
                const selectEl = div.querySelector('.item-desc');
                if (selectEl) {
                    selectEl.value = currentItemName;
                }
            }
`;

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, replacement);
    fs.writeFileSync(appJsPath, content, 'utf8');
    console.log('Update successful via regex match!');
} else {
    console.log('Target NOT found!');
}
