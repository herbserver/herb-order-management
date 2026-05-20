const { Order } = require('./models');
const { sendMetaMessageInternal } = require('./routes/whatsapp');

let isRunning = false;

async function checkDeliveryFollowUps() {
    if (isRunning) return;
    isRunning = true;

    try {
        console.log('\n⏰ [Follow-up] Checking for orders delivered ~24 hours ago...');

        // 24 hours ago and 48 hours ago boundaries
        const now = Date.now();
        const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
        const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);

        // Find delivered orders that haven't received follow-up yet
        const orders = await Order.find({
            status: 'Delivered',
            deliveredAt: {
                $exists: true,
                $ne: '',
                $lte: twentyFourHoursAgo.toISOString(),
                $gte: fortyEightHoursAgo.toISOString()
            },
            followUpSent: { $ne: true }
        });

        if (orders.length === 0) {
            console.log('ℹ️ [Follow-up] No orders matching delivery window (24h-48h ago) for follow-up.');
            return;
        }

        console.log(`✉️ [Follow-up] Found ${orders.length} orders to send follow-up.`);

        for (const order of orders) {
            try {
                const phone = order.telNo || order.mobile || order.altNo;
                if (!phone) {
                    console.warn(`⚠️ [Follow-up] Order ${order.orderId} is missing phone number.`);
                    // Mark as sent so we don't keep trying and spamming console
                    await Order.updateOne({ _id: order._id }, { $set: { followUpSent: true } });
                    continue;
                }

                // Send the Meta template message
                // Template name: 'delivery_followup'
                // Parameters: [Customer Name, Order ID]
                console.log(`📤 [Follow-up] Sending follow-up template to ${order.customerName} (${phone})...`);

                await sendMetaMessageInternal({
                    to: phone,
                    type: 'template',
                    templateName: 'delivery_followup',
                    parameters: [order.customerName, order.orderId],
                    lang: 'hi', // Hindi language
                    customerName: order.customerName,
                    orderId: order.orderId
                });

                // Update order to mark follow-up as sent
                await Order.updateOne(
                    { _id: order._id },
                    { $set: { followUpSent: true } }
                );

                console.log(`✅ [Follow-up] Successfully sent follow-up to ${order.customerName} (#${order.orderId})`);

                // 2 seconds delay between messages to avoid rate limits
                await new Promise(r => setTimeout(r, 2000));

            } catch (err) {
                console.error(`❌ [Follow-up] Error sending follow-up for order ${order.orderId}:`, err.message);
                // Also mark as sent on failure if the error is terminal (e.g. invalid phone number according to Meta)
                // so we don't block the loop on future runs.
                if (err.message.includes('phone') || err.message.includes('format')) {
                    await Order.updateOne({ _id: order._id }, { $set: { followUpSent: true } });
                }
            }
        }

    } catch (e) {
        console.error('❌ [Follow-up] Error in checkDeliveryFollowUps:', e.message);
    } finally {
        isRunning = false;
    }
}

function startFollowUpService(intervalMinutes = 30) {
    console.log(`🚀 [Follow-up Service] Started. Checking every ${intervalMinutes} minutes.`);
    
    // Initial run after 1 minute of startup
    setTimeout(checkDeliveryFollowUps, 60 * 1000);

    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(checkDeliveryFollowUps, intervalMs);
}

module.exports = {
    startFollowUpService,
    checkDeliveryFollowUps
};
