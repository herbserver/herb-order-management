// Password Migration Script
// Run this script ONCE to migrate existing plain text passwords to hashed passwords
// Usage: node migrate-passwords.js

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { hashPassword } = require('./auth');
const { connectDatabase } = require('./database');
const { Department } = require('./models');

const DATA_DIR = path.join(__dirname, 'data');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');
const BACKUP_DIR = path.join(__dirname, 'data-backup');

async function migratePasswords() {
    console.log('🔐 Starting Password Migration...\n');

    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // ==========  MIGRATE EMPLOYEES (JSON) ==========
    console.log('📂 Migrating Employees from JSON file...');

    try {
        if (fs.existsSync(EMPLOYEES_FILE)) {
            // Backup original file
            const backupFile = path.join(BACKUP_DIR, `employees_backup_${Date.now()}.json`);
            fs.copyFileSync(EMPLOYEES_FILE, backupFile);
            console.log(`✅ Employee file backed up to: ${backupFile}`);

            // Read employees
            const employeesData = fs.readFileSync(EMPLOYEES_FILE, 'utf8');
            const employees = JSON.parse(employeesData);

            let migratedCount = 0;
            let skippedCount = 0;

            // Check and migrate each employee
            for (const [id, data] of Object.entries(employees)) {
                if (data.password) {
                    // Check if already hashed (bcrypt hashes start with $2b$)
                    if (data.password.startsWith('$2b$') || data.password.startsWith('$2a$')) {
                        console.log(`⏭️  Skipped ${id} - Already hashed`);
                        skippedCount++;
                        continue;
                    }

                    // Hash the plain text password
                    const hashedPassword = await hashPassword(data.password);
                    employees[id].password = hashedPassword;
                    migratedCount++;
                    console.log(`✅ Migrated employee: ${id} (${data.name})`);
                }
            }

            // Save migrated data
            fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 2), 'utf8');
            console.log(`\n✅ Employee migration complete: ${migratedCount} migrated, ${skippedCount} skipped\n`);
        } else {
            console.log('⚠️  No employees.json file found\n');
        }
    } catch (error) {
        console.error('❌ Error migrating employees:', error.message);
    }

    // ========== MIGRATE DEPARTMENTS (MongoDB) ==========
    console.log('🗄️  Migrating Departments from MongoDB...');

    try {
        const connected = await connectDatabase();

        if (connected) {
            const departments = await Department.find({});
            let migratedCount = 0;
            let skippedCount = 0;

            for (const dept of departments) {
                if (dept.password) {
                    // Check if already hashed
                    if (dept.password.startsWith('$2b$') || dept.password.startsWith('$2a$')) {
                        console.log(`⏭️  Skipped ${dept.departmentId} - Already hashed`);
                        skippedCount++;
                        continue;
                    }

                    // Hash the plain text password
                    const hashedPassword = await hashPassword(dept.password);
                    dept.password = hashedPassword;
                    await dept.save();
                    migratedCount++;
                    console.log(`✅ Migrated department: ${dept.departmentId} (${dept.departmentName})`);
                }

                // Migrate nested employee passwords if any
                if (dept.employees && typeof dept.employees === 'object') {
                    for (const [empId, empData] of Object.entries(dept.employees)) {
                        if (empData.password && !empData.password.startsWith('$2b$')) {
                            const hashedPassword = await hashPassword(empData.password);
                            dept.employees[empId].password = hashedPassword;
                            await dept.save();
                            console.log(`✅ Migrated nested employee: ${empId} in ${dept.departmentId}`);
                        }
                    }
                }
            }

            console.log(`\n✅ Department migration complete: ${migratedCount} migrated, ${skippedCount} skipped\n`);
        } else {
            console.log('⚠️  MongoDB not connected. Skipping department migration.\n');
        }
    } catch (error) {
        console.error('❌ Error migrating departments:', error.message);
    }

    console.log('🎉 Password Migration Complete!');
    console.log(`📁 Backups saved to: ${BACKUP_DIR}`);
    console.log('\n⚠️  IMPORTANT: All users with migrated passwords will need to use their existing passwords.');
    console.log('    The passwords are now securely hashed and cannot be reversed.\n');

    process.exit(0);
}

// Run migration
migratePasswords().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
