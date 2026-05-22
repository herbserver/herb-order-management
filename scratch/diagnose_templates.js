require('dotenv').config();
const axios = require('axios');

async function diagnose() {
    const token = process.env.META_WA_ACCESS_TOKEN;
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
        console.error('Error: Credentials missing.');
        return;
    }

    try {
        console.log('--- Step 1: Getting WABA ID from Phone ID ---');
        const phoneRes = await axios.get(`https://graph.facebook.com/v20.0/${phoneId}`, {
            params: {
                fields: 'whatsapp_business_account',
                access_token: token
            }
        });
        
        const wabaId = phoneRes.data?.whatsapp_business_account?.id;
        console.log('Phone ID:', phoneId);
        console.log('WABA ID:', wabaId);

        if (!wabaId) {
            console.error('Failed to get WABA ID.');
            return;
        }

        console.log('\n--- Step 2: Fetching All Approved Message Templates ---');
        const templatesRes = await axios.get(`https://graph.facebook.com/v20.0/${wabaId}/message_templates`, {
            params: {
                limit: 100,
                access_token: token
            }
        });

        const templates = templatesRes.data?.data || [];
        console.log(`Total Templates found: ${templates.length}`);
        
        templates.forEach(t => {
            console.log(`\n- Name: "${t.name}" | Status: ${t.status} | Language: ${t.language}`);
            t.components?.forEach(c => {
                if (c.type === 'BODY') {
                    console.log(`  Body text: "${c.text}"`);
                }
                if (c.type === 'BUTTONS') {
                    console.log(`  Buttons:`, JSON.stringify(c.buttons));
                }
            });
        });

        console.log('\n--- Step 3: Attempting Test Template Send (Varicose Veins Wellness) ---');
        const testTo = '919354841822'; // Use the phone number from the user's screenshot
        
        const testPayload = {
            messaging_product: 'whatsapp',
            to: testTo,
            type: 'template',
            template: {
                name: 'varicose_veins_wellness',
                language: { code: 'hi' }, // Let's try 'hi' and 'en'
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

        console.log('Sending test payload with lang "hi":', JSON.stringify(testPayload, null, 2));
        try {
            const sendRes = await axios.post(`https://graph.facebook.com/v20.0/${phoneId}/messages`, testPayload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Success! Message ID:', sendRes.data?.messages?.[0]?.id);
        } catch (sendErr) {
            console.error('Test Send Failed!');
            if (sendErr.response) {
                console.error('Meta API Error Details:', JSON.stringify(sendErr.response.data, null, 2));
            } else {
                console.error(sendErr.message);
            }
        }

    } catch (e) {
        console.error('Diagnosis error:', e.response ? e.response.data : e.message);
    }
}

diagnose();
