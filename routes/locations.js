const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const dataAccess = require('../dataAccess');
const { PincodeEntry } = require('../models');

const PINCODES_FILE = path.join(__dirname, '../public/data/pincodes.json');
let pincodeDatabase = [];

try {
    const pincodeData = fs.readFileSync(PINCODES_FILE, 'utf8');
    pincodeDatabase = JSON.parse(pincodeData);
    console.log(`âœ… [Locations] Loaded ${pincodeDatabase.length.toLocaleString()} pincode records`);
} catch (error) {
    console.error('âŒ Error loading pincode database:', error.message);
}

function escapeRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mapLegacyOffice(record) {
    return {
        Name: record.officeName,
        District: record.districtName,
        State: record.stateName,
        Block: record.taluk || '',
        Pincode: record.pincode
    };
}

function normalizeFallbackRecord(record) {
    return {
        officeName: record.officeName,
        pincode: record.pincode,
        taluk: record.taluk || '',
        districtName: record.districtName,
        stateName: record.stateName
    };
}

async function queryMongo(handler) {
    if (!dataAccess.getMongoStatus()) {
        throw new Error('MongoDB connection required for locations');
    }

    return await handler();
}

// Get All States
router.get('/states', async (req, res) => {
    try {
        const mongoStates = await queryMongo(async () => {
            const states = await PincodeEntry.distinct('stateName');
            return states.sort((left, right) => left.localeCompare(right));
        });

        if (mongoStates) {
            return res.json({ success: true, states: mongoStates });
        }

        const states = [...new Set(pincodeDatabase.map((item) => item.stateName))].sort();
        res.json({ success: true, states });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching states' });
    }
});

// Get Districts by State
router.get('/districts', async (req, res) => {
    const state = req.query.state;
    if (!state) {
        return res.status(400).json({ success: false, message: 'State is required' });
    }

    try {
        const mongoDistricts = await queryMongo(async () => {
            const districts = await PincodeEntry.distinct('districtName', {
                stateName: { $regex: `^${escapeRegex(state)}$`, $options: 'i' }
            });
            return districts.sort((left, right) => left.localeCompare(right));
        });

        if (mongoDistricts) {
            return res.json({ success: true, districts: mongoDistricts });
        }

        const districts = [...new Set(
            pincodeDatabase
                .filter((item) => item.stateName.toLowerCase() === state.toLowerCase())
                .map((item) => item.districtName)
        )].sort();

        res.json({ success: true, districts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching districts' });
    }
});

// Get Post Offices by District
router.get('/district/:district', async (req, res) => {
    const district = req.params.district;

    try {
        const mongoRecords = await queryMongo(async () => {
            return PincodeEntry.find({
                districtName: { $regex: `^${escapeRegex(district)}$`, $options: 'i' }
            })
                .sort({ officeName: 1 })
                .select('officeName pincode taluk districtName stateName -_id')
                .lean();
        });

        if (mongoRecords) {
            return res.json({
                success: true,
                offices: mongoRecords.map(mapLegacyOffice)
            });
        }

        const offices = pincodeDatabase
            .filter((item) => item.districtName.toLowerCase() === district.toLowerCase())
            .sort((left, right) => left.officeName.localeCompare(right.officeName))
            .map((item) => mapLegacyOffice(normalizeFallbackRecord(item)));

        res.json({ success: true, offices });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching district post offices' });
    }
});

// Search Districts
router.get('/search-district', async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) {
        return res.json({ success: true, districts: [] });
    }

    try {
        const mongoResults = await queryMongo(async () => {
            const records = await PincodeEntry.find({
                districtName: { $regex: escapeRegex(query), $options: 'i' }
            })
                .select('districtName stateName -_id')
                .limit(100)
                .lean();

            const seen = new Set();
            const districts = [];
            records.forEach((record) => {
                const key = `${record.districtName}|${record.stateName}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    districts.push({ district: record.districtName, state: record.stateName });
                }
            });

            return districts.slice(0, 50);
        });

        if (mongoResults) {
            return res.json({ success: true, districts: mongoResults });
        }

        const lowerQuery = query.toLowerCase();
        const results = [];
        const seen = new Set();
        for (const item of pincodeDatabase) {
            if (item.districtName.toLowerCase().includes(lowerQuery)) {
                const key = `${item.districtName}|${item.stateName}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    results.push({ district: item.districtName, state: item.stateName });
                }
            }
            if (results.length >= 50) {
                break;
            }
        }

        res.json({ success: true, districts: results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error searching districts' });
    }
});

// Search Post Offices
router.get('/search-po', async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) {
        return res.json({ success: true, offices: [] });
    }

    try {
        const mongoResults = await queryMongo(async () => {
            const records = await PincodeEntry.find({
                $or: [
                    { officeName: { $regex: escapeRegex(query), $options: 'i' } },
                    { taluk: { $regex: escapeRegex(query), $options: 'i' } }
                ]
            })
                .sort({ officeName: 1 })
                .limit(50)
                .select('officeName pincode taluk districtName stateName -_id')
                .lean();

            return records.map((record) => ({
                office: record.officeName,
                pincode: record.pincode,
                taluk: record.taluk || '',
                district: record.districtName,
                state: record.stateName
            }));
        });

        if (mongoResults) {
            return res.json({ success: true, offices: mongoResults });
        }

        const lowerQuery = query.toLowerCase();
        const results = [];
        for (const item of pincodeDatabase) {
            if (
                item.officeName.toLowerCase().includes(lowerQuery) ||
                (item.taluk && item.taluk.toLowerCase().includes(lowerQuery))
            ) {
                results.push({
                    office: item.officeName,
                    pincode: item.pincode,
                    taluk: item.taluk,
                    district: item.districtName,
                    state: item.stateName
                });
            }
            if (results.length >= 50) {
                break;
            }
        }

        res.json({ success: true, offices: results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error searching post offices' });
    }
});

// Lookup Post Office by Name
router.get('/postoffice/:officeName', async (req, res) => {
    const officeName = req.params.officeName;

    try {
        const mongoRecords = await queryMongo(async () => {
            return PincodeEntry.find({
                officeName: { $regex: `^${escapeRegex(officeName)}$`, $options: 'i' }
            })
                .sort({ pincode: 1 })
                .select('officeName pincode taluk districtName stateName -_id')
                .lean();
        });

        if (mongoRecords) {
            const postOffices = mongoRecords.map(mapLegacyOffice);
            return res.json([{
                Status: postOffices.length > 0 ? 'Success' : 'Error',
                Message: postOffices.length > 0 ? 'Found records' : 'No records found',
                PostOffice: postOffices.length > 0 ? postOffices : null
            }]);
        }

        const postOffices = pincodeDatabase
            .filter((item) => item.officeName.toLowerCase() === officeName.toLowerCase())
            .map((item) => mapLegacyOffice(normalizeFallbackRecord(item)));

        res.json([{
            Status: postOffices.length > 0 ? 'Success' : 'Error',
            Message: postOffices.length > 0 ? 'Found records' : 'No records found',
            PostOffice: postOffices.length > 0 ? postOffices : null
        }]);
    } catch (error) {
        res.status(500).json([{ Status: 'Error', Message: 'Server error', PostOffice: null }]);
    }
});

// Pincode Lookup (Legacy Format Support)
router.get('/pincode/:pincode', async (req, res) => {
    const pincode = Number(req.params.pincode);

    try {
        const mongoRecords = await queryMongo(async () => {
            return PincodeEntry.find({ pincode })
                .sort({ officeName: 1 })
                .select('officeName pincode taluk districtName stateName -_id')
                .lean();
        });

        if (mongoRecords) {
            const postOffices = mongoRecords.map(mapLegacyOffice);
            return res.json([{
                Status: postOffices.length > 0 ? 'Success' : 'Error',
                Message: postOffices.length > 0 ? 'Found records' : 'No records found',
                PostOffice: postOffices.length > 0 ? postOffices : null
            }]);
        }

        const records = pincodeDatabase.filter((item) => Number(item.pincode) === pincode);
        const postOffices = records.map((item) => mapLegacyOffice(normalizeFallbackRecord(item)));

        res.json([{
            Status: postOffices.length > 0 ? 'Success' : 'Error',
            Message: postOffices.length > 0 ? 'Found records' : 'No records found',
            PostOffice: postOffices.length > 0 ? postOffices : null
        }]);
    } catch (error) {
        res.status(500).json([{ Status: 'Error', Message: 'Server error', PostOffice: null }]);
    }
});

module.exports = router;
