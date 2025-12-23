const express = require('express');
const router = express.Router();
const fetchMissingAWB = require('../scripts/fetch_missing_awb');

router.post('/fetch-missing-awb', async (req, res) => {
    try {
        await fetchMissingAWB();
        res.json({ success: true, message: 'AWB fetch completed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
