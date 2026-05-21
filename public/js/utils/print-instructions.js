const MEDICINE_INSTRUCTIONS = {
    "naskhol capsule": "सुबह और शाम एक-एक कैप्सूल दूध या पानी के साथ खाना खाने के बाद लें।",
    "nadiyog capsule": "सुबह और शाम एक-एक कैप्सूल दूध या पानी के साथ खाना खाने के बाद लें।",
    "vedic capsule": "सुबह और शाम एक-एक कैप्सूल दूध या पानी के साथ खाना खाने के बाद लें।",
    "vedic plus tablet": "सुबह और शाम एक-एक टैबलेट दूध या पानी के साथ खाना खाने के बाद लें।",
    "vena -v capsule": "सुबह और शाम एक-एक कैप्सूल दूध या पानी के साथ खाना खाने के बाद लें।",
    "vena-v capsule": "सुबह और शाम एक-एक कैप्सूल दूध या पानी के साथ खाना खाने के बाद लें।",
    "vena v capsule": "सुबह और शाम एक-एक कैप्सूल दूध या पानी के साथ खाना खाने के बाद लें।",
    "painover capsule": "सुबह और शाम एक-एक कैप्सूल दूध या पानी के साथ खाना खाने के बाद लें।",
    "golden capsule {ostrich }": "सुबह और शाम एक-एक कैप्सूल दूध या पानी के साथ खाना खाने के बाद लें।",
    "golden capsule ostrich": "सुबह और शाम एक-एक कैप्सूल दूध या पानी के साथ खाना खाने के बाद लें।",
    "golden capsule": "सुबह और शाम एक-एक कैप्सूल दूध या पानी के साथ खाना खाने के बाद लें।",
    "gaumutra": "सुबह और शाम एक-एक कैप्सूल दूध या पानी के साथ खाना खाने के बाद लें।",
    "vains clean capsule": "सुबह और शाम एक-एक कैप्सूल दूध या पानी के साथ खाना खाने के बाद लें।",
    "pain snap prash": "सुबह और शाम एक-एक चम्मच दूध या पानी के साथ खाना खाने के बाद लें।",
    "paingesic oil spray": "सुबह और शाम प्रभावित जगह पर स्प्रे करके हल्के हाथों से मालिश करें।",
    "herbon tulsi paawan": "5 बूंद सुबह और शाम आधा गिलास पानी में मिलाकर लें।",
    "herb on shape {hos}": "<b>Shape 1:</b> सुबह और शाम एक-एक कैप्सूल खाना खाने से पहले गुनगुने पानी के साथ लें।<br><br><b>Shape 2:</b> सुबह और शाम एक-एक कैप्सूल खाना खाने के बाद गुनगुने पानी के साथ लें।",
    "herb on shape": "<b>Shape 1:</b> सुबह और शाम एक-एक कैप्सूल खाना खाने से पहले गुनगुने पानी के साथ लें।<br><br><b>Shape 2:</b> सुबह और शाम एक-एक कैप्सूल खाना खाने के बाद गुनगुने पानी के साथ लें।"
};

const MEDICINE_MAPPING = {
    // Vedic Capsule
    "vedic-cap": "vedic capsule",
    "vedic cap": "vedic capsule",
    "vedic-capsule": "vedic capsule",
    "vedic capsule": "vedic capsule",
    
    // Vedic Plus Tablet
    "vedic-tab": "vedic plus tablet",
    "vedic tab": "vedic plus tablet",
    "vedic-tablet": "vedic plus tablet",
    "vedic tablet": "vedic plus tablet",
    "vedic plus tablet": "vedic plus tablet",
    "vedic plus": "vedic plus tablet",
    
    // Golden Capsule {Ostrich }
    "ostrich-cap": "golden capsule {ostrich }",
    "ostrich cap": "golden capsule {ostrich }",
    "ostrich capsule": "golden capsule {ostrich }",
    "ostrich": "golden capsule {ostrich }",
    "golden capsule ostrich": "golden capsule {ostrich }",
    "golden capsule {ostrich }": "golden capsule {ostrich }",
    "golden capsule": "golden capsule {ostrich }",
    
    // Paingesic Oil Spray
    "spray oil": "paingesic oil spray",
    "paingesic oil spray": "paingesic oil spray",
    "paingesic oil": "paingesic oil spray",
    "paingesic spray": "paingesic oil spray",
    "oil spray": "paingesic oil spray",
    "spray": "paingesic oil spray",
    "pangasic oil": "paingesic oil spray",
    "pangasic": "paingesic oil spray",
    "pain gesic oil": "paingesic oil spray",
    
    // Painover Capsule
    "painover": "painover capsule",
    "painover capsule": "painover capsule",
    "pain over": "painover capsule",
    "pain over capsule": "painover capsule",
    
    // Nadiyog Capsule
    "nadiyog": "nadiyog capsule",
    "nadiyog capsule": "nadiyog capsule",
    "nadi yog": "nadiyog capsule",
    
    // Naskhol Capsule
    "naskhol": "naskhol capsule",
    "naskhol capsule": "naskhol capsule",
    "nas khol": "naskhol capsule",
    
    // Vena -V Capsule
    "vena-v": "vena -v capsule",
    "vena -v": "vena -v capsule",
    "vena v": "vena -v capsule",
    "vena -v capsule": "vena -v capsule",
    "vena-v capsule": "vena -v capsule",
    "vena v capsule": "vena -v capsule",
    
    // Vains Clean Capsule
    "vains clean": "vains clean capsule",
    "vains clean capsule": "vains clean capsule",
    "vainsclean": "vains clean capsule",
    
    // Pain Snap Prash
    "pain snap": "pain snap prash",
    "pain snap prash": "pain snap prash",
    "painsnap": "pain snap prash",
    
    // Herbon Tulsi Paawan
    "tulsi paawan": "herbon tulsi paawan",
    "tulsi": "herbon tulsi paawan",
    "herbon tulsi paawan": "herbon tulsi paawan",
    "herbon tulsi": "herbon tulsi paawan",
    
    // Herb On Shape {HOS}
    "hos": "herb on shape {hos}",
    "herb on shape": "herb on shape {hos}",
    "herb on shape {hos}": "herb on shape {hos}",
    "shape": "herb on shape {hos}",
    
    // Gaumutra
    "gaumutra": "gaumutra"
};

function normalizeMedicineName(name) {
    if (!name) return "";
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function getMedicineIcon(itemName) {
    const normalized = itemName.toLowerCase();
    if (normalized.includes("oil") || normalized.includes("spray")) return "🧴";
    if (normalized.includes("tulsi") || normalized.includes("liquid") || normalized.includes("gaumutra")) return "💧";
    if (normalized.includes("prash")) return "🥄";
    if (normalized.includes("tablet") || normalized.includes("tab")) return "💊";
    return "💊"; // Default
}

function getInstructionsForOrder(orderData) {
    let items = [];
    
    // Support different formats of order.items
    if (orderData.items && Array.isArray(orderData.items)) {
        orderData.items.forEach(item => {
            if (typeof item === 'string') {
                items.push(item);
            } else if (item.description) {
                items.push(item.description);
            } else if (item.name) {
                items.push(item.name);
            } else if (item.productName) {
                items.push(item.productName);
            }
        });
    }

    if (items.length === 0) {
        return [];
    }

    const matchedInstructions = [];
    
    items.forEach(itemName => {
        const normalized = normalizeMedicineName(itemName);
        
        // 1. Try exact match in mapping
        let standardKey = MEDICINE_MAPPING[normalized];
        
        // 2. Try partial match in mapping if not found
        if (!standardKey) {
            for (const [key, val] of Object.entries(MEDICINE_MAPPING)) {
                if (normalized.includes(key) || key.includes(normalized)) {
                    standardKey = val;
                    break;
                }
            }
        }
        
        // 3. If standardKey found and has instructions, use it
        if (standardKey && MEDICINE_INSTRUCTIONS[standardKey]) {
            matchedInstructions.push({
                name: itemName,
                instruction: MEDICINE_INSTRUCTIONS[standardKey],
                icon: getMedicineIcon(standardKey)
            });
            return;
        }

        // 4. Fallback: Exact match in MEDICINE_INSTRUCTIONS
        if (MEDICINE_INSTRUCTIONS[normalized]) {
            matchedInstructions.push({
                name: itemName,
                instruction: MEDICINE_INSTRUCTIONS[normalized],
                icon: getMedicineIcon(normalized)
            });
            return;
        }

        // 5. Fallback: Partial match in MEDICINE_INSTRUCTIONS
        for (const [key, instruction] of Object.entries(MEDICINE_INSTRUCTIONS)) {
            if (normalized.includes(key) || key.includes(normalized)) {
                matchedInstructions.push({
                    name: itemName,
                    instruction: instruction,
                    icon: getMedicineIcon(key)
                });
                return;
            }
        }
    });

    return matchedInstructions;
}

async function printMedicineInstructions(orderId, orderData = null) {
    if (!orderData || !orderData.items) {
        try {
            const response = await fetch(`/api/orders/${orderId}`);
            if (response.ok) {
                orderData = await response.json();
            } else {
                alert("Could not fetch order details for printing instructions.");
                return;
            }
        } catch (error) {
            console.error("Error fetching order for print:", error);
            alert("Error fetching order details.");
            return;
        }
    }

    if (!orderData) {
        alert("Order details not found.");
        return;
    }

    const instructionsList = getInstructionsForOrder(orderData);

    if (instructionsList.length === 0) {
        alert("No specific instructions found for the medicines in this order.");
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print instructions.");
        return;
    }

    let itemsHtml = '';
    instructionsList.forEach(item => {
        itemsHtml += `
            <div class="medicine-card">
                <div class="medicine-header">
                    <span class="medicine-icon">${item.icon}</span>
                    <span class="medicine-name">${item.name}</span>
                </div>
                <div class="medicine-body">
                    <div class="instruction-label">उपयोग विधि (How to Use):</div>
                    <div class="instruction-text">${item.instruction}</div>
                </div>
            </div>
        `;
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="hi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>How to Use - ${orderId}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800&display=swap');
            
            @page {
                margin: 0;
            }
            body {
                font-family: 'Mukta', sans-serif, Arial;
                margin: 0;
                padding: 12px;
                color: #000;
                width: 80mm;
                box-sizing: border-box;
                font-size: 13.5px;
                background-color: #fff;
                line-height: 1.35;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            /* Logo & Header section */
            .brand-container {
                text-align: center;
                border: 3px double #000;
                padding: 10px 6px;
                margin-bottom: 12px;
                border-radius: 4px;
            }
            .brand-badge {
                display: inline-block;
                border: 1px solid #000;
                font-size: 9px;
                font-weight: 800;
                padding: 1px 6px;
                border-radius: 2px;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                margin-bottom: 4px;
            }
            .brand-name {
                font-size: 21px;
                font-weight: 800;
                letter-spacing: 1px;
                margin: 0;
                line-height: 1.1;
                text-transform: uppercase;
            }
            .brand-tagline {
                font-size: 11px;
                margin-top: 3px;
                letter-spacing: 0.5px;
                font-weight: 600;
            }
            
            /* Order Meta Table */
            .meta-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 12px;
                font-size: 12px;
            }
            .meta-table td {
                padding: 3px 0;
                border-bottom: 1px dashed #ccc;
            }
            .meta-label {
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .meta-value {
                text-align: right;
                font-weight: 600;
            }
            .font-mono {
                font-family: monospace, Courier;
                font-size: 13px;
            }
            
            /* Main Heading */
            .section-heading {
                background: #000;
                color: #fff;
                text-align: center;
                font-size: 14px;
                font-weight: bold;
                padding: 4px 0;
                border-radius: 3px;
                letter-spacing: 1px;
                margin-bottom: 14px;
                text-transform: uppercase;
            }
            
            /* Medicine Cards */
            .medicine-card {
                border: 1.5px solid #000;
                border-radius: 6px;
                padding: 8px 10px;
                margin-bottom: 10px;
                page-break-inside: avoid;
                box-shadow: 2px 2px 0px #000;
            }
            .medicine-header {
                display: flex;
                align-items: center;
                border-bottom: 1.5px solid #000;
                padding-bottom: 5px;
                margin-bottom: 6px;
            }
            .medicine-icon {
                font-size: 19px;
                margin-right: 6px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            .medicine-name {
                font-size: 15px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .instruction-label {
                font-size: 10.5px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #333;
                margin-bottom: 2px;
            }
            .instruction-text {
                font-size: 13.5px;
                font-weight: bold;
                line-height: 1.45;
            }
            
            /* Footer */
            .footer {
                text-align: center;
                margin-top: 18px;
                border-top: 2px dashed #000;
                padding-top: 10px;
            }
            .wish-hi {
                font-size: 14px;
                font-weight: 800;
                margin-bottom: 2px;
            }
            .wish-en {
                font-size: 11px;
                font-weight: bold;
                font-style: italic;
                margin-bottom: 8px;
            }
            .support-info {
                font-size: 11px;
                font-weight: 700;
                line-height: 1.4;
                border: 1px dashed #555;
                padding: 6px;
                border-radius: 4px;
                display: inline-block;
                width: 90%;
            }
            
            @media print {
                body {
                    width: 80mm;
                    padding: 8px;
                }
            }
        </style>
    </head>
    <body>
        <div class="brand-container">
            <span class="brand-badge">Prescription Slip</span>
            <h1 class="brand-name">Herb On Naturals</h1>
            <div class="brand-tagline">✦ Pure · Natural · Effective ✦</div>
        </div>
        
        <table class="meta-table">
            <tr>
                <td class="meta-label">Order ID</td>
                <td class="meta-value font-mono">${orderId}</td>
            </tr>
            <tr>
                <td class="meta-label">Date</td>
                <td class="meta-value">${new Date().toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</td>
            </tr>
        </table>
        
        <div class="section-heading">दवाई उपयोग विधि (How to Use)</div>
        
        ${itemsHtml}
        
        <div class="footer">
            <div class="wish-hi">आपके बेहतर स्वास्थ्य की कामना!</div>
            <div class="wish-en">Wishing you a happy and healthy life!</div>
            <div class="support-info">
                <div>📞 Customer Support: +91 99117 99660</div>
                <div>🌐 Website: www.herbonnaturals.com</div>
            </div>
        </div>

        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                    window.close();
                }, 500);
            }
        </script>
    </body>
    </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
