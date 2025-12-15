// Shiprocket Integration Module
const axios = require('axios');

class ShiprocketAPI {
    constructor() {
        this.baseURL = 'https://apiv2.shiprocket.in/v1/external';
        this.token = null;
        this.tokenExpiry = null;
    }

    // Get authentication token
    async getToken() {
        // Check if existing token is still valid
        if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.token;
        }

        try {
            const response = await axios.post(`${this.baseURL}/auth/login`, {
                email: process.env.SHIPROCKET_API_EMAIL,
                password: process.env.SHIPROCKET_API_PASSWORD
            });

            this.token = response.data.token;
            // Token valid for 10 days, but we'll refresh after 9 days
            this.tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

            console.log('✅ Shiprocket: Token obtained successfully');
            return this.token;
        } catch (error) {
            console.error('❌ Shiprocket Auth Error:', error.response?.data || error.message);
            throw new Error('Shiprocket authentication failed');
        }
    }

    // Track shipment by AWB number
    async trackShipment(awbNumber) {
        try {
            const token = await this.getToken();

            const response = await axios.get(`${this.baseURL}/courier/track/awb/${awbNumber}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const trackingData = response.data;

            if (trackingData && trackingData.tracking_data) {
                const shipmentTrack = trackingData.tracking_data.shipment_track || [];
                const latestStatus = shipmentTrack.length > 0 ? shipmentTrack[0] : null;

                return {
                    success: true,
                    awb: awbNumber,
                    currentStatus: latestStatus?.current_status || 'In Transit',
                    lastUpdate: latestStatus ? `${latestStatus.date} - ${latestStatus.activity}` : 'No updates',
                    location: latestStatus?.location || 'N/A',
                    delivered: trackingData.tracking_data.shipment_status === 7, // 7 = Delivered
                    allScans: shipmentTrack.map(scan => ({
                        date: scan.date,
                        activity: scan.activity,
                        location: scan.location,
                        status: scan.current_status
                    }))
                };
            }

            return {
                success: false,
                message: 'No tracking data found'
            };

        } catch (error) {
            console.error('❌ Shiprocket Tracking Error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Tracking failed'
            };
        }
    }

    // Get shipment details by order ID
    async getShipmentByOrderId(orderId) {
        try {
            const token = await this.getToken();

            const response = await axios.get(`${this.baseURL}/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    channel_order_id: orderId
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Shiprocket Order Error:', error.response?.data || error.message);
            return null;
        }
    }
}

// Export singleton instance
const shiprocketAPI = new ShiprocketAPI();
module.exports = shiprocketAPI;
