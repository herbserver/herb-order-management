const text1 = "मुफ्त सलाह चाहिए";
const text2 = "मुफ़्त सलाह चाहिए"; // with nukta

function check(text) {
    const cleanText = text.toLowerCase().trim();
    console.log(`\nTesting text: "${text}"`);
    console.log(`Length: ${text.length}`);
    console.log(`CleanText bytes:`, Buffer.from(cleanText, 'utf-8'));

    const isConsultationButton = cleanText.includes('मुफ्त सलाह चाहिए') || 
                                 cleanText.includes('फ्री डाइट प्लान चाहिए') || 
                                 cleanText.includes('vip डिस्काउंट') || 
                                 cleanText.includes('हेल्थ एक्सपर्ट से बात करें') ||
                                 cleanText.includes('कॉल कराएं') ||
                                 cleanText.includes('सलाह चाहिए');
                                 
    console.log('isConsultationButton:', isConsultationButton);
}

check(text1);
check(text2);
check("मुफ़्त सलाह चाहिए"); // common variant
