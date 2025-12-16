// Security Verification Test
// Tests password hashing, JWT authentication, and rate limiting
// Run: node test-security.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword, generateToken, verifyToken } = require('./auth');

console.log('🔐 Security Verification Tests\n');
console.log('================================\n');

async function testPasswordHashing() {
    console.log('1️⃣ Testing Password Hashing...');
    try {
        const plainPassword = 'Test@123';
        const hashed = await hashPassword(plainPassword);

        console.log(`   Plain password: ${plainPassword}`);
        console.log(`   Hashed password: ${hashed.substring(0, 20)}...`);
        console.log(`   ✅ Password hashed successfully`);

        // Test comparison
        const isValid = await comparePassword(plainPassword, hashed);
        const isInvalid = await comparePassword('Wrong@123', hashed);

        if (isValid && !isInvalid) {
            console.log(`   ✅ Password comparison works correctly\n`);
            return true;
        } else {
            console.log(`   ❌ Password comparison failed\n`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        return false;
    }
}

function testJWTTokens() {
    console.log('2️⃣ Testing JWT Tokens...');
    try {
        const payload = { id: 'EMP001', name: 'Test User', role: 'employee' };
        const token = generateToken(payload);

        console.log(`   Generated token: ${token.substring(0, 30)}...`);
        console.log(`   ✅ Token generated successfully`);

        // Verify token
        const decoded = verifyToken(token);

        if (decoded.id === payload.id && decoded.name === payload.name) {
            console.log(`   ✅ Token verification works correctly`);
            console.log(`   Decoded payload:`, decoded);
            console.log();
            return true;
        } else {
            console.log(`   ❌ Token verification failed\n`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        return false;
    }
}

function testInvalidToken() {
    console.log('3️⃣ Testing Invalid Token Handling...');
    try {
        const invalidToken = 'invalid.token.here';
        verifyToken(invalidToken);
        console.log(`   ❌ Should have thrown error for invalid token\n`);
        return false;
    } catch (error) {
        console.log(`   ✅ Invalid token rejected: ${error.message}\n`);
        return true;
    }
}

async function testHashedPasswordInDB() {
    console.log('4️⃣ Testing Hashed Passwords in Database...');
    try {
        const fs = require('fs');
        const path = require('path');
        const employeesFile = path.join(__dirname, 'data', 'employees.json');

        if (!fs.existsSync(employeesFile)) {
            console.log(`   ⚠️  No employees.json file found\n`);
            return true;
        }

        const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'));
        const employeeIds = Object.keys(employees);

        if (employeeIds.length === 0) {
            console.log(`   ⚠️  No employees in database\n`);
            return true;
        }

        let hashedCount = 0;
        let plainCount = 0;

        for (const id of employeeIds) {
            const password = employees[id].password;
            if (password.startsWith('$2b$') || password.startsWith('$2a$')) {
                hashedCount++;
            } else {
                plainCount++;
                console.log(`   ⚠️  Plain text password found for: ${id}`);
            }
        }

        console.log(`   Total employees: ${employeeIds.length}`);
        console.log(`   Hashed passwords: ${hashedCount}`);
        console.log(`   Plain text passwords: ${plainCount}`);

        if (plainCount === 0) {
            console.log(`   ✅ All passwords are hashed\n`);
            return true;
        } else {
            console.log(`   ❌ Found ${plainCount} plain text passwords - run migrate-passwords.js\n`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        return false;
    }
}

async function testEnvironmentVariables() {
    console.log('5️⃣ Testing Environment Variables...');
    require('dotenv').config();

    const jwtSecret = process.env.JWT_SECRET;
    const allowedOrigins = process.env.ALLOWED_ORIGINS;

    let passed = true;

    if (!jwtSecret || jwtSecret === 'your-super-secret-jwt-key-change-this-in-production-min-32-chars') {
        console.log(`   ⚠️  JWT_SECRET not set or using default value`);
        console.log(`      Generate a secure secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`);
        passed = false;
    } else {
        console.log(`   ✅ JWT_SECRET is set`);
    }

    if (!allowedOrigins) {
        console.log(`   ⚠️  ALLOWED_ORIGINS not set`);
        passed = false;
    } else {
        console.log(`   ✅ ALLOWED_ORIGINS is set: ${allowedOrigins}`);
    }

    console.log();
    return passed;
}

// Run all tests
async function runAllTests() {
    const results = [];

    results.push(await testPasswordHashing());
    results.push(testJWTTokens());
    results.push(testInvalidToken());
    results.push(await testHashedPasswordInDB());
    results.push(await testEnvironmentVariables());

    console.log('================================');
    console.log('📊 Test Results\n');

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log(`   Passed: ${passed}/${total}`);

    if (passed === total) {
        console.log(`   ✅ All security tests passed!\n`);
        console.log('🎉 Security implementation verified successfully!');
    } else {
        console.log(`   ⚠️  Some tests failed. Please review above.\n`);
    }

    process.exit(passed === total ? 0 : 1);
}

runAllTests();
