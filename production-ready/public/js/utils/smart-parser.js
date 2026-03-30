/**
 * Smart Text Parser for Indian Addresses (AI Form Assistant)
 * Optimized for typical WhatsApp order formats.
 */

const SmartParser = {
    // Regex Patterns
    patterns: {
        mobile: /(\+91[\-\s]?)?[6-9]\d{9}/g,
        pincode: /\b[1-9][0-9]{5}\b/g,
        houseNo: /(?:H\.?\s*No\.?|House\s*No\.?|Flat\s*No\.?|Shop\s*No\.?|Plot\s*No\.?|#)\s*([0-9A-Za-z\/\-]+)/i,
        village: /(?:Vill\.?|Village|V\.?P\.?O\.?)\s*[\-:]?\s*([A-Za-z\s]+?)(?=(?:P\.?O\.?|Post|Distt|District|State|Pin|Mob|Near|Opp)|$)/i,
        postOffice: /(?:[V\.]?P\.?O\.?|Post\s*Office|P\.?O\.?)\s*[\-:]?\s*([A-Za-z\s]+?)(?=(?:Distt|District|State|Pin|Mob|Near|Opp)|$)/i,
        district: /(?:Distt\.?|District|Dist\.?)\s*[\-:]?\s*([A-Za-z\s]+?)(?=(?:State|Pin|Mob|Near|Opp)|$)/i,
        state: /(?:State)\s*[\-:]?\s*([A-Za-z\s]+?)(?=(?:Pin|Mob)|$)/i,
        landmark: /(?:Near|Opp\.?|Behind|Adj\.?|Landmark)\s*[\-:]?\s*([A-Za-z0-9\s,\.]+)/i,
        galiNo: /(?:Gali\s*No\.?|Lane\s*No\.?|Block|Gali)\s*([A-Za-z0-9\/\-]+)/i
    },

    /**
     * Parse unstructured text into structured order data
     * @param {string} text - The raw text from WhatsApp/Notes
     * @returns {Object} format - { customerName, mobile, address, ... }
     */
    parse(text) {
        if (!text) return null;

        // Normalize text
        const cleanText = text.replace(/\*/g, '').replace(/[\r\n]+/g, '\n').trim(); // Remove WhatsApp bold markers and normalize newlines
        const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l);

        let data = {
            customerName: '',
            mobile: '',
            alternatMobile: '',
            address: '', // Full address for display
            hNo: '',
            blockGaliNo: '',
            villColony: '',
            landMark: '',
            po: '',
            tahTaluka: '',
            distt: '',
            state: '',
            pin: '',
            products: []
        };

        // 1. Extract Mobile Numbers (High Confidence)
        const mobiles = cleanText.match(this.patterns.mobile);
        if (mobiles) {
            data.mobile = mobiles[0].replace(/\D/g, '').slice(-10);
            if (mobiles.length > 1) {
                data.alternatMobile = mobiles[1].replace(/\D/g, '').slice(-10);
            }
        }

        // 2. Extract Pincode (High Confidence)
        const pins = cleanText.match(this.patterns.pincode);
        if (pins) {
            data.pin = pins[0];
        }

        // 3. Extract Explicit Fields using Regex
        const hNoMatch = cleanText.match(this.patterns.houseNo);
        if (hNoMatch) data.hNo = hNoMatch[1].trim();

        const galiMatch = cleanText.match(this.patterns.galiNo);
        if (galiMatch) data.blockGaliNo = galiMatch[0].trim();

        const villMatch = cleanText.match(this.patterns.village);
        if (villMatch) data.villColony = villMatch[1].trim().replace(/,$/, '');

        const poMatch = cleanText.match(this.patterns.postOffice);
        if (poMatch) data.po = poMatch[1].trim().replace(/,$/, '');

        const distMatch = cleanText.match(this.patterns.district);
        if (distMatch) data.distt = distMatch[1].trim().replace(/,$/, '');

        const stateMatch = cleanText.match(this.patterns.state);
        if (stateMatch) data.state = stateMatch[1].trim().replace(/,$/, '');

        // Auto-detect State if simple string match
        if (!data.state) {
            const commonStates = ['Delhi', 'Haryana', 'Punjab', 'Uttar Pradesh', 'Rajasthan', 'Bihar', 'Mumbai', 'Maharashtra', 'Gujarat', 'West Bengal', 'Karnataka', 'Tamil Nadu', 'Kerala', 'MP', 'Madhya Pradesh'];
            for (const st of commonStates) {
                if (cleanText.toLowerCase().includes(st.toLowerCase())) {
                    data.state = st;
                    break;
                }
            }
        }

        const landmarkMatch = cleanText.match(this.patterns.landmark);
        if (landmarkMatch) data.landMark = landmarkMatch[0].trim();

        // 4. Heuristic for Name
        for (let i = 0; i < Math.min(lines.length, 3); i++) {
            let line = lines[i];

            // Strip common prefixes
            line = line.replace(/^(Deliver to|To|Name|Customer|Client|Sending to)\s*[\-:]?\s*/i, '').trim();

            if (!/\d/.test(line) && !line.toLowerCase().includes('address') && !line.toLowerCase().includes('vill')) {
                if (line.length > 2 && line.length < 35) {
                    data.customerName = this.toTitleCase(line);
                    break;
                }
            }
        }

        // 5. Construct "Full Address"
        let builtAddr = [];
        if (data.hNo) builtAddr.push(`H.No ${data.hNo}`);
        if (data.blockGaliNo) builtAddr.push(data.blockGaliNo);
        if (data.villColony) builtAddr.push(data.villColony);
        if (data.landMark) builtAddr.push(data.landMark);
        if (data.po) builtAddr.push(`PO ${data.po}`);
        if (data.distt) builtAddr.push(`Dist ${data.distt}`);
        if (data.state) builtAddr.push(data.state);
        if (data.pin) builtAddr.push(data.pin);

        // If builtAddr is very short, fallback to original lines (minus name/mobile lines)
        if (builtAddr.length < 3) {
            const addrLines = lines.filter(l =>
                !l.includes(data.customerName) &&
                !l.includes(data.mobile) &&
                !l.toLowerCase().includes(data.customerName.toLowerCase())
            );
            data.address = addrLines.join(', ');
        } else {
            data.address = builtAddr.join(', ');
        }

        return data;
    },

    toTitleCase(str) {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartParser;
} else {
    window.SmartParser = SmartParser;
}
