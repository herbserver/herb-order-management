require('dotenv').config();
const axios = require('axios');

async function testLanguages() {
    const token = process.env.META_WA_ACCESS_TOKEN;
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
    const testTo = '919354841822'; // Use the phone number from the user's screenshot

    if (!token || !phoneId) {
        console.error('Error: Credentials missing.');
        return;
    }

    const languagesToTest = ['hi', 'en', 'en_US', 'en_GB'];

    for (const lang of languagesToTest) {
        console.log(`\n========================================`);
        console.log(`Testing template "varicose_veins_wellness" with language: "${lang}"`);
        console.log(`========================================`);

        const payload = {
            messaging_product: 'whatsapp',
            to: testTo,
            type: 'template',
            template: {
                name: 'varicose_veins_wellness',
                language: { code: lang },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: 'hardeep pal' },
                            { type: 'text', text: 'Varicose Veins' }
                        ]
                    }
                ]
            }
        };

        try {
            const res = await axios.post(`https://graph.facebook.com/v20.0/${phoneId}/messages`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`SUCCESS! Message sent successfully with lang "${lang}". Message ID:`, res.data?.messages?.[0]?.id);
            break; // Stop testing other languages if one succeeds!
        } catch (err) {
            console.error(`FAILED with lang "${lang}"!`);
            if (err.response) {
                console.error('Status:', err.response.status);
                console.error('Error Details:', JSON.stringify(err.response.data, null, 2));
            } else {
                console.error(err.message);
            }
        }
    }
}

testLanguages();
