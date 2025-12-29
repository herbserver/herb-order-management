/**
 * Migration Script: Fix Order Type for All Orders
 * 
 * This script will:
 * 1. Load all orders from database
 * 2. Sort them by timestamp (oldest first)
 * 3. For each customer's first order → set orderType = 'Fresh'
 * 4. For each customer's subsequent orders → set orderType = 'Reorder'
 */

const mongoose = require('mongoose');
const Order = require('./models').Order;

// Database connection string
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/herb-orders';

async function migrateOrderTypes() {
    try {
        console.log('🔄 Starting Order Type Migration...\n');

        // Connect to database
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB\n');

        // Get all orders sorted by timestamp (oldest first)
        const orders = await Order.find({}).sort({ timestamp: 1 });
        console.log(`📊 Total Orders Found: ${orders.length}\n`);

        // Track customers and their order count
        const customerOrderMap = new Map();
        let freshCount = 0;
        let reorderCount = 0;
        let updatedCount = 0;

        // Process each order
        for (const order of orders) {
            const mobile = order.telNo;

            if (!mobile) {
                console.log(`⚠️  Skipping order ${order.orderId} - No mobile number`);
                continue;
            }

            // Check if this customer has ordered before
            const previousOrders = customerOrderMap.get(mobile) || 0;

            let newOrderType;
            if (previousOrders === 0) {
                // First order for this customer
                newOrderType = 'Fresh';
                freshCount++;
            } else {
                // Customer has ordered before
                newOrderType = 'Reorder';
                reorderCount++;
            }

            // Update order type if it's different or missing
            if (order.orderType !== newOrderType) {
                order.orderType = newOrderType;
                await order.save();
                updatedCount++;
                console.log(`✓ ${order.orderId}: ${mobile} → ${newOrderType}`);
            }

            // Increment customer's order count
            customerOrderMap.set(mobile, previousOrders + 1);
        }

        console.log('\n📈 Migration Complete!\n');
        console.log('═══════════════════════════════');
        console.log(`Total Orders: ${orders.length}`);
        console.log(`Fresh Orders: ${freshCount} (🆕 First-time customers)`);
        console.log(`Re-Orders: ${reorderCount} (🔄 Repeat customers)`);
        console.log(`Updated Orders: ${updatedCount}`);
        console.log('═══════════════════════════════\n');

        // Close connection
        await mongoose.connection.close();
        console.log('✅ Database connection closed\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Migration Error:', error);
        process.exit(1);
    }
}

// Run migration
migrateOrderTypes();
