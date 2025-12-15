// Server API Endpoint - Add to server.js

// PUT /api/orders/:orderId/hold - Put order on hold with expected dispatch date
app.put('/api/orders/:orderId/hold', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { holdReason, expectedDispatchDate, holdBy } = req.body;

        const order = await Order.findOneAndUpdate(
            { orderId },
            {
                status: 'On Hold',
                'holdDetails.isOnHold': true,
                'holdDetails.holdReason': holdReason,
                'holdDetails.expectedDispatchDate': expectedDispatchDate ? new Date(expectedDispatchDate) : null,
                'holdDetails.holdBy': holdBy,
                'holdDetails.holdAt': new Date().toISOString()
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({
            success: true,
            message: 'Order put on hold successfully',
            order
        });
    } catch (error) {
        console.error('Hold order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/orders/:orderId/unhold - Remove order from hold
app.put('/api/orders/:orderId/unhold', async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOneAndUpdate(
            { orderId },
            {
                status: 'Pending',
                'holdDetails.isOnHold': false,
                'holdDetails.holdReason': null,
                'holdDetails.expectedDispatchDate': null
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({
            success: true,
            message: 'Order removed from hold',
            order
        });
    } catch (error) {
        console.error('Unhold order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
