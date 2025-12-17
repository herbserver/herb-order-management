// Check MongoDB for employees data
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');

        // Check if employees collection exists
        mongoose.connection.db.listCollections().toArray((err, collections) => {
            if (err) {
                console.error('Error:', err);
                process.exit(1);
            }

            console.log('\n📦 Available Collections:');
            collections.forEach(c => console.log('  -', c.name));

            // Try to find any employee-like data
            const employeeCollections = collections.filter(c =>
                c.name.toLowerCase().includes('employee') ||
                c.name.toLowerCase().includes('user')
            );

            if (employeeCollections.length > 0) {
                console.log('\n👤 Employee-related collections found!');
                employeeCollections.forEach(c => {
                    const collection = mongoose.connection.db.collection(c.name);
                    collection.find({}).toArray((err, docs) => {
                        if (err) console.error('Error reading', c.name, err);
                        else {
                            console.log(`\n${c.name} (${docs.length} documents):`);
                            console.log(JSON.stringify(docs, null, 2));
                        }

                        if (employeeCollections.indexOf(c) === employeeCollections.length - 1) {
                            process.exit(0);
                        }
                    });
                });
            } else {
                console.log('\n⚠️ No employee collections found in MongoDB');
                console.log('Employees are stored in JSON files, not MongoDB');
                process.exit(0);
            }
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
