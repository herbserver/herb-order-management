require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

async function testSingle() {
    const token = process.env.META_WA_ACCESS_TOKEN;
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
    
    console.log('Phone ID:', phoneId);
    console.log('Token length:', token ? token.length : 0);

    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    
    const data = {
        messaging_product: 'whatsapp',
        to: '919286330433', // Farid's phone number
        type: 'template',
        template: {
            name: 'delivery_followup',
            language: { code: 'en' },
            components: [{
                type: 'body',
                parameters: [
                    { type: 'text', text: 'Farid' },
                    { type: 'text', text: 'Order ID-8635' }
                ]
            }]
        }
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Success response:', response.data);
    } catch (error) {
        console.error('Status:', error.response ? error.response.status : 'No response');
        console.error('Error Data:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

testSingle();
