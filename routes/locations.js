const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load Pincode Database in Memory
const PINCODES_FILE = path.join(__dirname, '../public/data/pincodes.json');
let pincodeDatabase = [];
try {
    const pincodeData = fs.readFileSync(PINCODES_FILE, 'utf8');
    pincodeDatabase = JSON.parse(pincodeData);
    console.log(`✅ [Locations] Loaded ${pincodeDatabase.length.toLocaleString()} pincode records`);
} catch (error) {
    console.error('❌ Error loading pincode database:', error.message);
}

// Get All States
router.get('/states', (req, res) => {
    try {
        const states = [...new Set(pincodeDatabase.map(item => item.stateName))].sort();
        res.json({ success: true, states });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching states' });
    }
});

// Get Districts by State
router.get('/districts', (req, res) => {
    const state = req.query.state;
    if (!state) return res.status(400).json({ success: false, message: 'State is required' });
    try {
        const districts = [...new Set(pincodeDatabase.filter(item => item.stateName.toLowerCase() === state.toLowerCase()).map(item => item.districtName))].sort();
        res.json({ success: true, districts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching districts' });
    }
});

// Search Districts
router.get('/search-district', (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) return res.json({ success: true, districts: [] });
    try {
        const q = query.toLowerCase();
        const results = [];
        const seen = new Set();
        for (const item of pincodeDatabase) {
            if (item.districtName.toLowerCase().includes(q)) {
                const key = `${item.districtName}|${item.stateName}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    results.push({ district: item.districtName, state: item.stateName });
                }
            }
            if (results.length > 50) break;
        }
        res.json({ success: true, districts: results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error searching districts' });
    }
});

// Search Post Offices
router.get('/search-po', (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) return res.json({ success: true, offices: [] });
    try {
        const q = query.toLowerCase();
        const results = [];
        for (const item of pincodeDatabase) {
            if (item.officeName.toLowerCase().includes(q) || (item.taluk && item.taluk.toLowerCase().includes(q))) {
                results.push({
                    office: item.officeName,
                    pincode: item.pincode,
                    taluk: item.taluk,
                    district: item.districtName,
                    state: item.stateName
                });
            }
            if (results.length > 50) break;
        }
        res.json({ success: true, offices: results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error' });
    }
});

// Pincode Lookup (Legacy Format Support)
router.get('/pincode/:pincode', (req, res) => {
    const pincode = req.params.pincode;
    try {
        const records = pincodeDatabase.filter(item => item.pincode == pincode);
        if (records.length === 0) return res.json([{ Status: "Error", Message: "No records found", PostOffice: null }]);
        const postOffices = records.map(item => ({
            Name: item.officeName,
            District: item.districtName,
            State: item.stateName,
            Block: item.taluk,
            Pincode: item.pincode
        }));
        res.json([{ Status: "Success", Message: "Found records", PostOffice: postOffices }]);
    } catch (error) {
        res.status(500).json([{ Status: "Error" }]);
    }
});

module.exports = router;
