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
                const shipmentStatus = trackingData.tracking_data.shipment_status;

                let currentStatus = latestStatus?.current_status || 'In Transit';
                let delivered = (shipmentStatus === 7 || shipmentStatus === '7' || currentStatus.toLowerCase().includes('delivered'));

                return {
                    success: true,
                    awb: awbNumber,
                    currentStatus: delivered ? 'Delivered' : currentStatus,
                    lastUpdate: latestStatus ? `${latestStatus.date || ''} - ${latestStatus.activity || ''}`.trim() : 'No updates',
                    location: latestStatus?.location || 'N/A',
                    delivered: delivered,
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

    // Check Serviceability
    async checkServiceability(pickupPostcode, deliveryPostcode, weight, codAmount) {
        try {
            const token = await this.getToken();
            const url = `${this.baseURL}/courier/serviceability/`;

            const params = {
                pickup_postcode: pickupPostcode || '110001', // Default or Config 
                delivery_postcode: deliveryPostcode,
                weight: weight,
                cod: 1 // 1 for COD, 0 for Prepaid
            };

            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` },
                params: params
            });

            if (response.data && response.data.data && response.data.data.available_courier_companies) {
                return {
                    success: true,
                    couriers: response.data.data.available_courier_companies
                };
            }

            return { success: false, message: 'No couriers available' };

        } catch (error) {
            console.error('❌ Shiprocket Serviceability Error:', error.response?.data || error.message);
            return { success: false, message: error.response?.data?.message || 'Serviceability check failed' };
        }
    }

    // Create Order
    async createOrder(orderData) {
        try {
            const token = await this.getToken();
            const url = `${this.baseURL}/orders/create/adhoc`;

            const response = await axios.post(url, orderData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                orderId: response.data.order_id,
                shipmentId: response.data.shipment_id,
                awb: response.data.awb_code,
                response: response.data
            };

        } catch (error) {
            console.error('❌ Shiprocket Create Order Error:', error.response?.data || error.message);
            if (error.response?.data?.errors) {
                console.error('Validation Errors:', JSON.stringify(error.response.data.errors, null, 2));
            }
            return {
                success: false,
                message: error.response?.data?.message || 'Order creation failed',
                details: error.response?.data?.errors
            };
        }
    }

    // Generate AWB (if not returned in create order)
    async generateAWB(shipmentId, courierId) {
        try {
            const token = await this.getToken();
            const url = `${this.baseURL}/courier/assign/awb`;

            const payload = {
                shipment_id: shipmentId,
                courier_id: courierId
            };

            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.awb_assign_status === 1) {
                return {
                    success: true,
                    awb: response.data.response.data.awb_code,
                    courierName: response.data.response.data.courier_name
                };
            }

            return { success: false, message: response.data.message || 'AWB Generation Failed' };

        } catch (error) {
            console.error('❌ Shiprocket AWB Error:', error.response?.data || error.message);
            return { success: false, message: error.response?.data?.message || 'AWB generation failed' };
        }
    }

    // Get shipment details by shipment ID
    async getShipmentDetails(shipmentId) {
        try {
            const token = await this.getToken();

            const response = await axios.get(`${this.baseURL}/shipments/show/${shipmentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const shipment = response.data?.data;

            if (shipment && shipment.awb_code) {
                return {
                    awb: shipment.awb_code,
                    courier_name: shipment.courier_name,
                    status: shipment.status,
                    shipment_id: shipment.id
                };
            }

            return null;

        } catch (error) {
            console.error(`❌ Shiprocket Get Shipment Error (${shipmentId}):`, error.response?.data || error.message);
            return null;
        }
    }

    // Get order details by our order ID (channel_order_id in Shiprocket)
    async getOrderByChannelId(channelOrderId) {
        try {
            const token = await this.getToken();

            // Search for order using channel_order_id filter
            const response = await axios.get(`${this.baseURL}/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    channel_order_id: channelOrderId
                }
            });

            const orders = response.data?.data;

            if (orders && orders.length > 0) {
                const order = orders[0]; // Get first match
                return {
                    orderId: order.id,
                    awb: order.awb_code || order.shipments?.[0]?.awb,
                    shipmentId: order.shipments?.[0]?.id,
                    courier_name: order.shipments?.[0]?.courier_name,
                    status: order.status
                };
            }

            return null;

        } catch (error) {
            console.error(`❌ Shiprocket Get Order Error (${channelOrderId}):`, error.response?.data || error.message);
            return null;
        }
    }
}

// Export singleton instance
const shiprocketAPI = new ShiprocketAPI();
module.exports = shiprocketAPI;
