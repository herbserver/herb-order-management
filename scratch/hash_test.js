const bcrypt = require('bcrypt');

async function test() {
    const hash1 = '$2b$10$L4PPkRN4FqeeYnIGxbtaueSaOzCI6kAhUFiVp.xeMo7YezJ7IdCVO';
    const hash2 = '$2b$10$zNP/BKQdmD5LHmueBy.U5.RkkBkk6MG1eNQa.HBjNJ5yhTv0Z1zS6';
    const passwords = ['admin123', 'admin', '123456', 'verification', 'ver123', 'password'];
    
    for (const p of passwords) {
        const m1 = await bcrypt.compare(p, hash1);
        const m2 = await bcrypt.compare(p, hash2);
        console.log(`Password: "${p}" | Hash 1 Match: ${m1} | Hash 2 Match: ${m2}`);
    }
}

test();
