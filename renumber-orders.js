const { connectDatabase, Order } = require('./database');
const dataAccess = require('./dataAccess');

async function renumberOrders() {
    try {
        await connectDatabase();
        console.log('✅ Connected to database');

        // Define the cutoff date: December 17, 2025
        const cutoffDate = new Date('2025-12-17T00:00:00Z');
        console.log(`📅 Renumbering orders from: ${cutoffDate.toISOString()}`);

        // Fetch all orders from Dec 17 onwards, sorted by timestamp (oldest first)
        const orders = await Order.find({
            timestamp: { $gte: cutoffDate.toISOString() }
        }).sort({ timestamp: 1 }); // 1 = ascending (oldest first)

        console.log(`📦 Found ${orders.length} orders to renumber`);

        if (orders.length === 0) {
            console.log('⚠️ No orders found from Dec 17 onwards');
            process.exit(0);
        }

        // Create backup
        const fs = require('fs');
        const backupPath = `./order-backup-${Date.now()}.json`;
        fs.writeFileSync(backupPath, JSON.stringify(orders, null, 2));
        console.log(`💾 Backup created: ${backupPath}`);

        // Renumber orders
        console.log('\n🔄 Starting renumbering...\n');

        for (let i = 0; i < orders.length; i++) {
            const newOrderId = `Order ID-${String(i + 1).padStart(4, '0')}`;
            const oldOrderId = orders[i].orderId;

            await Order.updateOne(
                { _id: orders[i]._id },
                { $set: { orderId: newOrderId } }
            );

            console.log(`✅ ${oldOrderId} → ${newOrderId}`);
        }

        // Update the order counter for next new order
        const nextCounter = orders.length + 1;
        await dataAccess.updateShiprocketConfig({ shiprocketOrderCounter: nextCounter });
        console.log(`\n📊 Order counter updated to: ${nextCounter}`);
        console.log(`📌 Next new order will be: Order ID-${String(nextCounter).padStart(4, '0')}`);

        console.log('\n✅ Renumbering completed successfully!');
        console.log(`📦 Total orders renumbered: ${orders.length}`);
        console.log(`💾 Backup file: ${backupPath}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
renumberOrders();
