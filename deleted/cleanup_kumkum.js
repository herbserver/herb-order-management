const mongoose = require('mongoose');
require('dotenv').config();
const { Order } = require('./models');

async function checkOrders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const orders = await Order.find({
            $or: [
                { employeeId: 'HON- (008)' },
                { employeeId: 'HON-E008' },
                { employee: /Kumkum/i }
            ]
        });

        // DELETE the malformed order
        const deleteResult = await Order.deleteOne({ orderId: 'Order ID-0086' });
        console.log(`Deleted order result:`, deleteResult);

        // Remove from Department.employees if present
        const { Department } = require('./models');
        const depts = await Department.find({});
        for (const d of depts) {
            if (d.employees && d.employees['HON- (008']) {
                const updatedEmployees = { ...d.employees };
                delete updatedEmployees['HON- (008'];
                await Department.updateOne({ _id: d._id }, { $set: { employees: updatedEmployees } });
                console.log(`Removed malformed ID from department: ${d.departmentName}`);
            }
        }

        const fs = require('fs');
        fs.writeFileSync('investigation_result.json', JSON.stringify({
            deletedOrderId: 'Order ID-0086',
            orderDeleteCount: deleteResult.deletedCount,
            status: 'Cleanup Completed'
        }, null, 2));
        console.log('Cleanup results written to investigation_result.json');

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOrders();
