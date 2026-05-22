require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('../models');

async function getOrderDetails() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected.');
        const phoneNumbers = ["919354841822", "919582589655"];
        for (const phone of phoneNumbers) {
            console.log(`\nQuerying order for: ${phone}`);
            // Let's strip prefix or check different formats
            const cleanPhone = phone.replace(/^91/, '');
            const orders = await Order.find({
                $or: [
                    { telNo: phone },
                    { mobile: phone },
                    { altNo: phone },
                    { telNo: cleanPhone },
                    { mobile: cleanPhone },
                    { altNo: cleanPhone }
                ]
            }).sort({ createdAt: -1 }).lean();
            console.log(`Found ${orders.length} orders:`);
            orders.forEach(o => {
                console.log(`OrderId: ${o.orderId}, Customer: ${o.customerName}, Status: ${o.status}, EmployeeId: ${o.employeeId}`);
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

getOrderDetails();
