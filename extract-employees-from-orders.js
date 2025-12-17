// Extract employee IDs from orders in MongoDB  
const mongoose = require('mongoose');
const fs = require('fs');
const { Order } = require('./models');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB\n');

        // Get all orders
        const orders = await Order.find({}).sort({ timestamp: -1 });
        console.log(`📦 Total Orders: ${orders.length}\n`);

        // Extract unique employees from orders
        const employeeMap = {};
        orders.forEach(order => {
            if (order.employeeId) {
                if (!employeeMap[order.employeeId]) {
                    employeeMap[order.employeeId] = {
                        id: order.employeeId,
                        name: order.employee || 'Unknown',
                        firstOrderDate: order.timestamp,
                        orderCount: 0
                    };
                }
                employeeMap[order.employeeId].orderCount++;
            }
        });

        const employees = Object.values(employeeMap);
        console.log(`👤 Employees found: ${employees.length}\n`);

        // Generate employees.json with placeholder password
        const hash = "$2b$10$PeLwFfbCa8AlM3pOEuZr1xyqxODSYCyq"; // Password: 123456
        const employeesJson = {};
        employees.forEach(emp => {
            employeesJson[emp.id] = {
                name: emp.name,
                password: hash,
                createdAt: emp.firstOrderDate
            };
        });

        // Save to file
        fs.writeFileSync('recovered-employees.json', JSON.stringify(employeesJson, null, 2));
        console.log('✅ Saved to: recovered-employees.json');

        // Print summary
        console.log('\n📋 Employee Summary:');
        console.log('='.repeat(70));
        employees.forEach((emp, idx) => {
            console.log(`${idx + 1}. ${emp.id} - ${emp.name} (${emp.orderCount} orders)`);
        });
        console.log('='.repeat(70));
        console.log(`\n✅ Total: ${employees.length} employees recovered!`);
        console.log('\n🔑 Default Password for ALL: 123456');
        console.log('   (Users should reset their passwords)\n');

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
