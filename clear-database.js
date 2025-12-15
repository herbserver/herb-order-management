// Clear and Re-migrate Data
require('dotenv').config();
const mongoose = require('mongoose');

async function clearDatabase() {
    try {
        console.log('🧹 Clearing existing MongoDB data...\n');

        const mongoURI = process.env.MONGODB_URI;
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB\n');

        // Drop all collections to start fresh
        const collections = await mongoose.connection.db.listCollections().toArray();

        for (const collection of collections) {
            console.log(`   Dropping collection: ${collection.name}`);
            await mongoose.connection.db.dropCollection(collection.name);
        }

        console.log('\n✅ Database cleared! All collections dropped.');
        console.log('Now run: node migrate-data.js\n');

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

clearDatabase();
