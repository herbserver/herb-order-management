// Direct MongoDB fix for HON-D002
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixDeptType() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected\n');

        const db = client.db('herbserver');
        const result = await db.collection('departments').updateOne(
            { deptId: 'HON-D002' },
            { $set: { type: 'delivery' } }
        );

        console.log('Updated:', result.modifiedCount);

        // Verify
        const dept = await db.collection('departments').findOne({ deptId: 'HON-D002' });
        console.log('\n✅ Department:', dept.deptId);
        console.log('   Name:', dept.name);
        console.log('   Type:', dept.type);

    } finally {
        await client.close();
    }
}

fixDeptType();
