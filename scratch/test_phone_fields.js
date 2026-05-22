require('dotenv').config();
const axios = require('axios');

async function checkFields() {
    const token = process.env.META_WA_ACCESS_TOKEN;
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
    try {
        console.log('Querying phone ID details...');
        const res = await axios.get(`https://graph.facebook.com/v20.0/${phoneId}`, {
            params: {
                access_token: token
            }
        });
        console.log('Fields returned:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('Error:', e.response ? e.response.data : e.message);
    }
}
checkFields();
