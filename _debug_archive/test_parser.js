const SmartParser = require('../public/js/utils/smart-parser');

const testCases = [
    `Raju Kumar
    9876543210
    House No 123, Sector 5
    Near Shiv Mandir
    Gurgaon, Haryana 122001`,

    `Deliver to: Amit Singh, Vill: Rampur, PO: Shyamnagar, Distt: Patna, Bihar - 800001. Mob: +91-9988776655`,

    `Sunita Devi
    H.No 45/2, Gali No 4
    Mohan Garden
    New Delhi 110059
    Phone 9811223344`
];

console.log('--- STARTING PARSER TEST ---\n');

testCases.forEach((text, i) => {
    console.log(`\nCase ${i + 1}:`);
    console.log('Input:', text.replace(/\n/g, ' | '));
    const result = SmartParser.parse(text);
    console.log('Result:', JSON.stringify(result, null, 2));
});

console.log('\n--- END TEST ---');
