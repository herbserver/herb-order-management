(function () {
    const panel = window.EmployeePanel || (window.EmployeePanel = { core: {}, shared: {}, tabs: {} });
    const ordersApi = panel.shared.ordersApi;

    function getForm() {
        return document.getElementById('orderForm');
    }

    function toProperCase(value) {
        return value ? value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : '';
    }

    function normalizeText(value) {
        const trimmed = String(value || '').trim();
        if (!trimmed) {
            return '';
        }

        if (typeof toTitleCase === 'function') {
            return toTitleCase(trimmed);
        }

        return toProperCase(trimmed);
    }

    function initOrderForm() {
        const form = getForm();
        const itemsContainer = document.getElementById('itemsContainer');
        if (!form || !itemsContainer) {
            return;
        }

        itemsContainer.innerHTML = '';
        addItem();

        ['hNo', 'blockGaliNo', 'villColony', 'po', 'tahTaluka', 'distt', 'state', 'pin', 'landMark'].forEach((fieldName) => {
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (input && !input.dataset.empBound) {
                input.addEventListener('input', updateAddress);
                input.dataset.empBound = 'true';
            }
        });

        const now = new Date();
        const dateInput = form.querySelector('[name="date"]');
        const timeInput = form.querySelector('[name="time"]');

        if (dateInput) {
            dateInput.value = now.toISOString().split('T')[0];
        }

        if (timeInput) {
            timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }

        const totalInput = document.getElementById('totalAmountInput');
        if (totalInput) {
            totalInput.value = '0';
        }

        const remark = document.getElementById('employeeRemark');
        if (remark) {
            remark.value = '';
        }

        updateAddress();
        calculateCOD();
    }

    function addItem() {
        const itemsContainer = document.getElementById('itemsContainer');
        if (!itemsContainer) {
            return;
        }

        const row = document.createElement('div');
        row.className = 'item-row grid grid-cols-12 gap-2 mb-2 items-center';

        const options = (window.PRODUCT_LIST || []).map((product) => {
            return `<option value="${product.name}" data-price="${product.price}">${product.name}</option>`;
        }).join('');

        row.innerHTML = `
            <div class="col-span-6">
                <select class="item-desc w-full p-2 border rounded" onchange="updateTotal(this)">
                    <option value="">Select Product...</option>
                    ${options}
                </select>
            </div>
            <div class="col-span-2">
                <input type="number" class="item-qty w-full p-2 border rounded text-center" value="1" min="1" oninput="updateTotal(this)">
            </div>
            <div class="col-span-3">
                <input type="number" class="w-full p-2 border rounded text-right item-row-total" value="0" oninput="calculateTotal()">
            </div>
            <div class="col-span-1 text-center">
                <button type="button" onclick="this.closest('.item-row').remove(); calculateTotal();" class="text-red-500 font-bold text-xl">x</button>
            </div>
        `;

        itemsContainer.appendChild(row);
    }

    function updateTotal(trigger) {
        const row = trigger?.closest?.('.item-row');
        if (row) {
            const select = row.querySelector('.item-desc');
            const quantityInput = row.querySelector('.item-qty');
            const amountInput = row.querySelector('.item-row-total');

            const price = Number(select?.options?.[select.selectedIndex || 0]?.dataset?.price || 0);
            const quantity = Number(quantityInput?.value || 0);

            if (amountInput && trigger !== amountInput && price > 0 && quantity > 0) {
                amountInput.value = String(price * quantity);
            }
        }

        calculateTotal();
    }

    function calculateTotal() {
        let sum = 0;
        document.querySelectorAll('.item-row .item-row-total').forEach((input) => {
            sum += Number(input.value || 0);
        });

        const totalInput = document.getElementById('totalAmountInput');
        if (totalInput) {
            totalInput.value = String(sum);
        }

        calculateCOD();
    }

    function calculateCOD() {
        const total = Number(document.getElementById('totalAmountInput')?.value || 0);
        const advance = Number(document.querySelector('input[name="advance"]')?.value || 0);
        const codField = document.querySelector('input[name="codAmount"]');
        if (codField) {
            codField.value = String(Math.max(total - advance, 0));
        }
    }

    function collectItems() {
        const items = [];

        document.querySelectorAll('.item-row').forEach((row) => {
            const select = row.querySelector('.item-desc');
            const quantityInput = row.querySelector('.item-qty');
            const amountInput = row.querySelector('.item-row-total');

            if (!select || !select.value) {
                return;
            }

            const quantity = Number(quantityInput?.value || 1);
            const amount = Number(amountInput?.value || 0);
            const price = Number(select.options[select.selectedIndex]?.dataset?.price || 0);
            const rate = quantity > 0 ? Math.round(amount / quantity) : price;

            items.push({
                description: select.value,
                product: select.value,
                quantity,
                amount,
                rate,
                price
            });
        });

        return items;
    }

    function buildOrderPayload(form) {
        const items = collectItems();
        const total = Number(document.getElementById('totalAmountInput')?.value || 0);
        const codAmount = Number(form.codAmount.value || 0);
        const telNo = String(form.telNo.value || '').trim();

        return {
            employeeId: currentUser.id,
            employeeName: currentUser.name,
            employee: currentUser.name,
            customerName: normalizeText(form.customerName.value),
            telNo,
            mobile: telNo,
            address: form.address.value,
            hNo: String(form.hNo.value || '').trim(),
            blockGaliNo: normalizeText(form.blockGaliNo.value),
            villColony: normalizeText(form.villColony.value),
            po: normalizeText(form.po.value),
            tahTaluka: normalizeText(form.tahTaluka.value),
            distt: normalizeText(form.distt.value),
            state: normalizeText(form.state.value),
            pin: String(form.pin.value || '').trim(),
            pincode: String(form.pin.value || '').trim(),
            landMark: normalizeText(form.landMark.value),
            treatment: String(form.treatment.value || '').trim(),
            date: form.date.value,
            time: form.time.value,
            altNo: String(form.altNo.value || '').trim(),
            items,
            total,
            advance: Number(form.advance.value || 0),
            cod: codAmount,
            codAmount,
            remark: document.getElementById('employeeRemark')?.value || '',
            orderType: document.querySelector('input[name="orderType"]:checked')?.value === 'NEW' ? 'Fresh' : 'Reorder'
        };
    }

    async function createOrderRequest(orderData, button, originalText, form) {
        try {
            const data = await ordersApi.createOrder(orderData);

            if (data.success) {
                showSuccessPopup(
                    'Order Saved!',
                    `Order #${data.orderId} created successfully.`,
                    'OK',
                    '#10b981',
                    {
                        type: 'booked',
                        order: {
                            orderId: data.orderId,
                            customerName: orderData.customerName,
                            total: orderData.total,
                            telNo: orderData.telNo
                        }
                    }
                );

                form.reset();
                initOrderForm();
                if (typeof loadMyOrders === 'function') {
                    loadMyOrders(1);
                }
            } else {
                showWarningPopup('Error!', data.message || 'Order save nahi ho paya.');
            }
        } catch (error) {
            console.error(error);
            showWarningPopup('Connection Error', 'Server se connection nahi ho paya.');
        } finally {
            if (button) {
                button.innerText = originalText;
                button.disabled = false;
            }
        }
    }

    function showDuplicateWarning(existingOrder, newOrderData) {
        document.getElementById('duplicateWarningModal')?.remove();

        const createdDate = new Date(existingOrder.createdAt).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const modal = document.createElement('div');
        modal.id = 'duplicateWarningModal';
        modal.className = 'fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleIn">
                <div class="bg-gradient-to-r from-orange-500 to-red-500 p-5 text-white">
                    <div class="flex items-center gap-3">
                        <div>
                            <h3 class="text-xl font-bold">Duplicate Order Warning</h3>
                            <p class="text-white/80 text-sm">Same mobile number ka order already hai</p>
                        </div>
                    </div>
                </div>
                <div class="p-5 bg-orange-50 border-b border-orange-100">
                    <p class="text-xs font-bold text-orange-600 uppercase mb-3">Existing Order Details</p>
                    <div class="bg-white rounded-xl p-4 border border-orange-200 space-y-2">
                        <div class="flex justify-between"><span class="text-gray-500">Order ID:</span><span class="font-bold text-gray-800">${existingOrder.orderId}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Customer:</span><span class="font-bold text-gray-800">${existingOrder.customerName}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Mobile:</span><span class="font-mono text-gray-800">${existingOrder.telNo}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Status:</span><span class="font-bold text-blue-600">${existingOrder.status}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Amount:</span><span class="font-bold text-green-600">Rs ${existingOrder.total}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Created:</span><span class="text-gray-600 text-sm">${createdDate}</span></div>
                    </div>
                </div>
                <div class="p-5 space-y-3">
                    <p class="text-sm text-gray-600 text-center mb-4">Kya aap phir bhi naya order create karna chahte ho?</p>
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="document.getElementById('duplicateWarningModal').remove()" class="bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                        <button onclick="forceCreateOrder()" class="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all">Create Anyway</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        window._pendingOrderData = newOrderData;
    }

    async function forceCreateOrder() {
        const orderData = window._pendingOrderData;
        if (!orderData) {
            return;
        }

        document.getElementById('duplicateWarningModal')?.remove();

        const form = getForm();
        const button = document.querySelector('#orderForm button[onclick="saveOrder()"]');
        const originalText = button?.innerText || 'SAVE ORDER';

        if (button) {
            button.innerText = 'Saving...';
            button.disabled = true;
        }

        await createOrderRequest(orderData, button, originalText, form);
        window._pendingOrderData = null;
    }

    async function saveOrder() {
        const form = getForm();
        if (!form) {
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const payload = buildOrderPayload(form);
        const missingFields = [
            { value: form.customerName.value, label: 'Customer Name' },
            { value: form.telNo.value, label: 'Mobile Number' },
            { value: form.villColony.value, label: 'Village/Colony' },
            { value: form.distt.value, label: 'District' },
            { value: form.state.value, label: 'State' },
            { value: form.pin.value, label: 'Pincode' }
        ].filter((item) => !String(item.value || '').trim());

        if (missingFields.length > 0) {
            showWarningPopup(
                'Zaroori Details Gayab Hain!',
                `Kripya ye fields bharlein:\n- ${missingFields.map((item) => item.label).join('\n- ')}`
            );
            return;
        }

        if (form.telNo.value.length !== 10) {
            showWarningPopup('Mobile Number Galat Hai', 'Mobile number poore 10 digit ka hona chahiye.');
            return;
        }

        if (payload.items.length === 0) {
            showWarningPopup('Item Add Karein', 'Kam se kam ek product select karna zaroori hai.');
            return;
        }

        const button = document.querySelector('#orderForm button[onclick="saveOrder()"]');
        const originalText = button?.innerText || 'SAVE ORDER';

        try {
            if (button) {
                button.innerText = 'Checking...';
                button.disabled = true;
            }

            const duplicateCheck = await ordersApi.checkDuplicate({
                telNo: payload.telNo,
                customerName: payload.customerName
            });

            if (duplicateCheck.success && duplicateCheck.isDuplicate) {
                if (button) {
                    button.innerText = originalText;
                    button.disabled = false;
                }
                showDuplicateWarning(duplicateCheck.existingOrder, payload);
                return;
            }

            if (button) {
                button.innerText = 'Saving...';
            }

            await createOrderRequest(payload, button, originalText, form);
        } catch (error) {
            console.error(error);
            showWarningPopup('Connection Error', 'Server se connection nahi ho paya. Please retry karein.');
            if (button) {
                button.innerText = originalText;
                button.disabled = false;
            }
        }
    }

    function filterPOList(query) {
        const normalized = String(query || '').trim().toLowerCase();
        document.querySelectorAll('#poSuggestions .po-item').forEach((item) => {
            const name = item.getAttribute('data-name') || '';
            item.style.display = !normalized || name.includes(normalized) ? '' : 'none';
        });
    }

    function selectPOFromPincode(poName) {
        const form = getForm();
        if (!form) {
            return;
        }

        form.po.value = poName;
        document.getElementById('poSuggestions')?.classList.add('hidden');
        updateAddress();
    }

    async function fetchPincodeDetails(pincode) {
        const normalizedPin = String(pincode || '').trim();
        const suggestList = document.getElementById('poSuggestions');
        const form = getForm();

        if (!suggestList || !form || normalizedPin.length !== 6) {
            if (suggestList && normalizedPin.length < 6) {
                suggestList.classList.add('hidden');
            }
            return;
        }

        suggestList.innerHTML = '<li class="px-4 py-2 text-gray-500 text-sm">Loading P.O...</li>';
        suggestList.classList.remove('hidden');

        try {
            const response = await fetch(`${API_URL}/locations/pincode/${encodeURIComponent(normalizedPin)}`);
            const data = await response.json();
            const result = data?.[0];

            if (result?.Status !== 'Success' || !Array.isArray(result.PostOffice) || result.PostOffice.length === 0) {
                suggestList.classList.add('hidden');
                return;
            }

            const firstOffice = result.PostOffice[0];
            form.state.value = firstOffice.State || form.state.value;
            form.distt.value = firstOffice.District || form.distt.value;
            form.tahTaluka.value = firstOffice.Block || form.tahTaluka.value;
            updateAddress();

            const sortedOffices = [...result.PostOffice].sort((left, right) => left.Name.localeCompare(right.Name));
            let html = `
                <div class="sticky top-0 bg-white border-b border-gray-200 p-2 z-10">
                    <input
                        type="text"
                        placeholder="Search Post Office..."
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                        oninput="filterPOList(this.value)"
                        onclick="event.stopPropagation()">
                    <div class="text-xs text-gray-400 mt-1">${sortedOffices.length} Post Offices</div>
                </div>
            `;

            sortedOffices.forEach((office) => {
                html += `
                    <li class="po-item px-4 py-2 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-none text-sm"
                        data-name="${String(office.Name || '').toLowerCase()}"
                        onclick="selectPOFromPincode('${String(office.Name || '').replace(/'/g, "\\'")}')">
                        ${office.Name}
                    </li>
                `;
            });

            suggestList.innerHTML = html;
            suggestList.classList.remove('hidden');
        } catch (error) {
            console.error('Pincode fetch error', error);
            suggestList.classList.add('hidden');
        }
    }

    let districtTimeout;
    async function handleDistrictInput(query) {
        const box = document.getElementById('districtSuggestions');
        if (!box) {
            return;
        }

        window.clearTimeout(districtTimeout);
        if (!query || query.length < 2) {
            box.classList.add('hidden');
            return;
        }

        districtTimeout = window.setTimeout(async () => {
            try {
                const response = await fetch(`${API_URL}/locations/search-district?q=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data.success && data.districts.length > 0) {
                    const uniqueDistricts = new Map();
                    data.districts.forEach((district) => uniqueDistricts.set(district.district, district.state));

                    box.innerHTML = Array.from(uniqueDistricts.entries()).map(([district, state]) => `
                        <li class="px-4 py-2 hover:bg-emerald-50 cursor-pointer border-b" onclick="selectDistrict('${district.replace(/'/g, "\\'")}', '${state.replace(/'/g, "\\'")}')">
                            <div class="font-bold">${district}</div>
                            <div class="text-xs text-gray-500">${state}</div>
                        </li>
                    `).join('');
                    box.classList.remove('hidden');
                } else {
                    box.classList.add('hidden');
                }
            } catch (error) {
                console.error(error);
            }
        }, 300);
    }

    function selectDistrict(district, state) {
        const form = getForm();
        if (!form) {
            return;
        }

        form.distt.value = district;
        form.state.value = state;
        document.getElementById('districtSuggestions')?.classList.add('hidden');
        updateAddress();
    }

    let poTimeout;
    async function handlePostOfficeInput(query) {
        const box = document.getElementById('poSuggestions');
        if (!box) {
            return;
        }

        window.clearTimeout(poTimeout);
        if (!query || query.length < 2) {
            box.classList.add('hidden');
            return;
        }

        poTimeout = window.setTimeout(async () => {
            try {
                const response = await fetch(`${API_URL}/locations/search-po?q=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data.success && data.offices.length > 0) {
                    box.innerHTML = data.offices.map((office) => `
                        <li class="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b" onclick="selectPO('${office.office.replace(/'/g, "\\'")}', '${office.pincode}', '${office.taluk.replace(/'/g, "\\'")}', '${office.district.replace(/'/g, "\\'")}', '${office.state.replace(/'/g, "\\'")}')">
                            <div class="flex justify-between font-bold"><span>${office.office}</span><span class="text-xs bg-blue-100 text-blue-800 px-1 rounded">${office.pincode}</span></div>
                            <div class="text-xs text-gray-500">${office.taluk}, ${office.district}</div>
                        </li>
                    `).join('');
                    box.classList.remove('hidden');
                } else {
                    box.classList.add('hidden');
                }
            } catch (error) {
                console.error(error);
            }
        }, 300);
    }

    function selectPO(office, pin, taluk, district, state) {
        const form = getForm();
        if (!form) {
            return;
        }

        form.po.value = office;
        form.pin.value = pin;
        form.tahTaluka.value = taluk;
        form.distt.value = district;
        form.state.value = state;
        document.getElementById('poSuggestions')?.classList.add('hidden');
        updateAddress();
    }

    function updateAddress() {
        const form = getForm();
        if (!form) {
            return;
        }

        let houseNumber = form.hNo.value.trim();
        if (houseNumber && !Number.isNaN(Number(houseNumber))) {
            houseNumber = `H.No ${houseNumber}`;
        }

        const village = form.villColony.value.trim();
        let addressStart = '';

        if (houseNumber && village) addressStart = `${houseNumber}, Village ${toProperCase(village)}`;
        else if (houseNumber) addressStart = houseNumber;
        else if (village) addressStart = `Village ${toProperCase(village)}`;

        const parts = [
            addressStart,
            form.blockGaliNo.value.trim() ? toProperCase(form.blockGaliNo.value.trim()) : '',
            form.landMark.value.trim() ? `Landmark: ${toProperCase(form.landMark.value.trim())}` : '',
            form.po.value.trim() ? `PO: ${toProperCase(form.po.value.trim())}` : '',
            toProperCase(form.tahTaluka.value.trim()),
            toProperCase(form.distt.value.trim()),
            toProperCase(form.state.value.trim()),
            form.pin.value.trim() ? `PIN: ${form.pin.value.trim()}` : ''
        ].filter(Boolean);

        form.address.value = parts.join(', ');
    }

    panel.shared.orderForm = {
        addItem,
        calculateCOD,
        calculateTotal,
        fetchPincodeDetails,
        filterPOList,
        forceCreateOrder,
        handleDistrictInput,
        handlePostOfficeInput,
        initOrderForm,
        saveOrder,
        selectDistrict,
        selectPOFromPincode,
        selectPO,
        updateAddress,
        updateTotal
    };

    window.addItem = addItem;
    window.calculateCOD = calculateCOD;
    window.calculateTotal = calculateTotal;
    window.fetchPincodeDetails = fetchPincodeDetails;
    window.filterPOList = filterPOList;
    window.forceCreateOrder = forceCreateOrder;
    window.handleDistrictInput = handleDistrictInput;
    window.handlePostOfficeInput = handlePostOfficeInput;
    window.initOrderForm = initOrderForm;
    window.saveOrder = saveOrder;
    window.selectDistrict = selectDistrict;
    window.selectPOFromPincode = selectPOFromPincode;
    window.selectPO = selectPO;
    window.updateAddress = updateAddress;
    window.updateTotal = updateTotal;
})();
