const express = require('express');
const router = express.Router();
const axios = require('axios');

// Send WhatsApp Template Message
router.post('/send', async (req, res) => {
    const { to, templateName, parameters, lang } = req.body;

    const token = process.env.META_WA_ACCESS_TOKEN;
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
        return res.status(500).json({ success: false, message: 'WhatsApp API credentials missing on server.' });
    }

    // Format phone number (must be without + or leading zeros, e.g., 91XXXXXXXXXX)
    let formattedPhone = to;
    if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
    }

    try {
        const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
        
        const data = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
                name: templateName,
                language: {
                    code: lang || "en" // Default to en as seen in other .env file
                },
                components: [
                    {
                        type: "body",
                        parameters: parameters.map(p => ({ type: "text", text: p }))
                    }
                ]
            }
        };

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('WhatsApp API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send WhatsApp message', 
            error: error.response ? error.response.data : error.message 
        });
    }
});

module.exports = router;
