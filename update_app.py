import sys

with open('public/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """        // Populate Items manually as they no longer have per-row Amount
        const container = document.getElementById('itemsContainer');
        container.innerHTML = '';
        (order.items || []).forEach(item => {
            const div = document.createElement('div');
            div.className = 'grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 mb-2';

            let options = PRODUCT_LIST.map(p =>
                `<option value="${p.name}" ${p.name === item.description ? 'selected' : ''}>${p.name}</option>`
            ).join('');

            // Add "Other" if description is not in list
            if (!PRODUCT_LIST.find(p => p.name === item.description)) {
                options += `<option value="${item.description}" selected>${item.description}</option>`;
            } else {
                options += `<option value="Other">Other</option>`;
            }

            div.innerHTML = ` 
                    <select class="col-span-12 md:col-span-8 border rounded-lg px-3 py-2 text-sm item-desc bg-white outline-none focus:border-emerald-500 transition-colors"
                        onchange="calculateTotal()"> 
                        <option value="">Select Product...</option> 
                        ${options}
                    </select> 
                    
                    <input type="number" placeholder="Qty" value="${item.quantity || 1}" min="1"
                        class="col-span-8 md:col-span-3 border rounded-lg px-2 py-2 text-sm item-qty outline-none focus:border-emerald-500"
                        oninput="calculateTotal()"> 
                    
                    <button type="button" onclick="this.parentElement.remove(); calculateTotal();" class="col-span-4 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors text-center">×</button> `;
            container.appendChild(div);
        });
        if (order.items.length === 0) {
            addItem();
        }"""

replacement = """        // Populate Items using addItem to ensure compatibility with employee.js
        const container = document.getElementById('itemsContainer');
        container.innerHTML = '';
        (order.items || []).forEach(item => {
            if (typeof addItem === 'function') {
                addItem();
                const lastRow = container.lastElementChild;
                if (lastRow) {
                    const descSelect = lastRow.querySelector('.item-desc');
                    const qtyInput = lastRow.querySelector('.item-qty');
                    const amountInput = lastRow.querySelector('.item-row-total');

                    if (descSelect) {
                        let optionExists = false;
                        for (let i = 0; i < descSelect.options.length; i++) {
                            if (descSelect.options[i].value === item.description) {
                                optionExists = true;
                                break;
                            }
                        }
                        if (!optionExists && item.description) {
                            const opt = document.createElement('option');
                            opt.value = item.description;
                            opt.textContent = item.description;
                            const rate = item.rate || item.price || 0;
                            if (rate) opt.dataset.price = rate;
                            descSelect.appendChild(opt);
                        }
                        descSelect.value = item.description || '';
                    }
                    if (qtyInput) qtyInput.value = item.quantity || 1;
                    if (amountInput) {
                        const rate = item.rate || item.price || 0;
                        amountInput.value = item.amount || (rate * (item.quantity || 1)) || 0;
                    }
                }
            } else {
                // Fallback
                const div = document.createElement('div');
                div.className = 'grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 mb-2';
                let options = PRODUCT_LIST.map(p => `<option value="${p.name}" ${p.name === item.description ? 'selected' : ''}>${p.name}</option>`).join('');
                if (!PRODUCT_LIST.find(p => p.name === item.description)) {
                    options += `<option value="${item.description}" selected>${item.description}</option>`;
                } else {
                    options += `<option value="Other">Other</option>`;
                }
                div.innerHTML = `<select class="col-span-12 md:col-span-8 border rounded-lg px-3 py-2 text-sm item-desc bg-white outline-none focus:border-emerald-500 transition-colors" onchange="calculateTotal()"><option value="">Select Product...</option>${options}</select><input type="number" placeholder="Qty" value="${item.quantity || 1}" min="1" class="col-span-8 md:col-span-3 border rounded-lg px-2 py-2 text-sm item-qty outline-none focus:border-emerald-500" oninput="calculateTotal()"><button type="button" onclick="this.parentElement.remove(); calculateTotal();" class="col-span-4 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors text-center">×</button>`;
                container.appendChild(div);
            }
        });
        if (order.items.length === 0) {
            addItem();
        }"""

if target in content:
    content = content.replace(target, replacement)
    with open('public/app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS editOrder")
else:
    print("TARGET NOT FOUND editOrder")

target2 = """            itemsHtml += `
                <div class="grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 edit-item-row">
                    <input type="text" value="${item.description || item.name || ''}" placeholder="Product" class="col-span-12 md:col-span-5 border rounded-lg px-3 py-2 text-sm edit-item-desc outline-none focus:border-emerald-500">
                    <input type="number" value="${qty}" min="1" placeholder="Qty" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-qty outline-none focus:border-emerald-500 text-center font-bold" oninput="updateEditItemAmount(this)">
                    <input type="number" value="${rate}" placeholder="Rate" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-rate outline-none focus:border-emerald-500" oninput="updateEditItemAmount(this)">
                    <input type="number" value="${amount}" placeholder="Amt" class="col-span-4 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-amount outline-none focus:border-emerald-500 bg-gray-50 font-bold" oninput="updateEditTotal()">
                    <button type="button" onclick="this.parentElement.remove(); updateEditTotal();" class="col-span-2 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors">×</button>
                </div>
            `;"""

replacement2 = """            let descOptions = '<option value="">Select Product...</option>';
            if (typeof PRODUCT_LIST !== 'undefined' && Array.isArray(PRODUCT_LIST)) {
                PRODUCT_LIST.forEach(p => {
                    const isSelected = (p.name === (item.description || item.name)) ? 'selected' : '';
                    descOptions += `<option value="${p.name}" data-price="${p.price || 0}" ${isSelected}>${p.name}</option>`;
                });
                if ((item.description || item.name) && !PRODUCT_LIST.find(p => p.name === (item.description || item.name))) {
                    descOptions += `<option value="${item.description || item.name}" data-price="${rate}" selected>${item.description || item.name}</option>`;
                }
            } else {
                descOptions += `<option value="${item.description || item.name}" data-price="${rate}" selected>${item.description || item.name}</option>`;
            }

            itemsHtml += `
                <div class="grid grid-cols-12 gap-2 items-center bg-white/50 p-2 rounded-lg border border-emerald-100 edit-item-row">
                    <select class="col-span-12 md:col-span-5 border rounded-lg px-3 py-2 text-sm edit-item-desc outline-none focus:border-emerald-500" onchange="updateEditItemAmount(this)">
                        ${descOptions}
                    </select>
                    <input type="number" value="${qty}" min="1" placeholder="Qty" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-qty outline-none focus:border-emerald-500 text-center font-bold" oninput="updateEditItemAmount(this)">
                    <input type="number" value="${rate}" placeholder="Rate" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-rate outline-none focus:border-emerald-500" oninput="updateEditItemAmount(this)">
                    <input type="number" value="${amount}" placeholder="Amt" class="col-span-4 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-amount outline-none focus:border-emerald-500 bg-gray-50 font-bold" oninput="updateEditTotal()">
                    <button type="button" onclick="this.parentElement.remove(); updateEditTotal();" class="col-span-2 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors">×</button>
                </div>
            `;"""

if target2 in content:
    content = content.replace(target2, replacement2)
    with open('public/app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS openEditOrderModal")
else:
    print("TARGET NOT FOUND openEditOrderModal")

target3 = """    div.innerHTML = ` 
            <input type="text" placeholder="Product" class="col-span-12 md:col-span-5 border rounded-lg px-3 py-2 text-sm edit-item-desc outline-none focus:border-emerald-500"> 
            <input type="number" placeholder="Qty" value="1" min="1" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-qty outline-none focus:border-emerald-500 text-center font-bold" oninput="updateEditItemAmount(this)"> 
            <input type="number" placeholder="Rate" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-rate outline-none focus:border-emerald-500" oninput="updateEditItemAmount(this)"> 
            <input type="number" placeholder="Amt" class="col-span-4 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-amount outline-none focus:border-emerald-500 bg-gray-50 font-bold" oninput="updateEditTotal()"> 
            <button type="button" onclick="this.parentElement.remove(); updateEditTotal();" class="col-span-2 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors">×</button> `;"""

replacement3 = """    let descOptions = '<option value="">Select Product...</option>';
    if (typeof PRODUCT_LIST !== 'undefined' && Array.isArray(PRODUCT_LIST)) {
        PRODUCT_LIST.forEach(p => {
            descOptions += `<option value="${p.name}" data-price="${p.price || 0}">${p.name}</option>`;
        });
    }

    div.innerHTML = ` 
            <select class="col-span-12 md:col-span-5 border rounded-lg px-3 py-2 text-sm edit-item-desc outline-none focus:border-emerald-500" onchange="updateEditItemAmount(this)">
                ${descOptions}
            </select>
            <input type="number" placeholder="Qty" value="1" min="1" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-qty outline-none focus:border-emerald-500 text-center font-bold" oninput="updateEditItemAmount(this)"> 
            <input type="number" placeholder="Rate" class="col-span-3 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-rate outline-none focus:border-emerald-500" oninput="updateEditItemAmount(this)"> 
            <input type="number" placeholder="Amt" class="col-span-4 md:col-span-2 border rounded-lg px-2 py-2 text-sm edit-item-amount outline-none focus:border-emerald-500 bg-gray-50 font-bold" oninput="updateEditTotal()"> 
            <button type="button" onclick="this.parentElement.remove(); updateEditTotal();" class="col-span-2 md:col-span-1 text-red-500 font-bold hover:bg-red-50 rounded p-1 transition-colors">×</button> `;"""

if target3 in content:
    content = content.replace(target3, replacement3)
    with open('public/app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS addEditItem")
else:
    print("TARGET NOT FOUND addEditItem")

target4 = """function updateEditItemAmount(input) {
    const row = input.closest('.edit-item-row');
    const qty = parseFloat(row.querySelector('.edit-item-qty').value) || 1;
    const rate = parseFloat(row.querySelector('.edit-item-rate').value) || 0;
    const amountInput = row.querySelector('.edit-item-amount');
    amountInput.value = (qty * rate).toFixed(0);
    updateEditTotal();
}"""

replacement4 = """function updateEditItemAmount(input) {
    const row = input.closest('.edit-item-row');
    if (input.classList.contains('edit-item-desc')) {
        const selectedOption = input.options[input.selectedIndex];
        if (selectedOption && selectedOption.dataset.price) {
            row.querySelector('.edit-item-rate').value = selectedOption.dataset.price;
        }
    }
    const qty = parseFloat(row.querySelector('.edit-item-qty').value) || 1;
    const rate = parseFloat(row.querySelector('.edit-item-rate').value) || 0;
    const amountInput = row.querySelector('.edit-item-amount');
    amountInput.value = (qty * rate).toFixed(0);
    updateEditTotal();
}"""

if target4 in content:
    content = content.replace(target4, replacement4)
    with open('public/app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS updateEditItemAmount")
else:
    print("TARGET NOT FOUND updateEditItemAmount")
