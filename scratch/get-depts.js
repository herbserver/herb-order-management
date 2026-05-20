const mongoose = require('mongoose');
const { Department } = require('../models');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const depts = await Department.find({}).lean();
    console.log('DEPARTMENTS IN DATABASE:');
    console.log(JSON.stringify(depts, null, 2));
    await mongoose.disconnect();
}

run().catch(console.error);
