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
        if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.token;
        }

        try {
            const response = await axios.post(`${this.baseURL}/auth/login`, {
                email: process.env.SHIPROCKET_API_EMAIL,
                password: process.env.SHIPROCKET_API_PASSWORD
            });

            this.token = response.data.token;
            this.tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
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
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
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
            return { success: false, message: 'No tracking data found' };
        } catch (error) {
            console.error('❌ Shiprocket Tracking Error:', error.response?.data || error.message);
            return { success: false, message: 'Tracking failed' };
        }
    }

    async getShipmentDetails(shipmentId) {
        try {
            const token = await this.getToken();
            const response = await axios.get(`${this.baseURL}/shipments/show/${shipmentId}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            const shipment = response.data?.data;
            if (shipment && shipment.awb_code) {
                return {
                    success: true,
                    awb: shipment.awb_code,
                    shipmentId: shipment.id,
                    courierName: shipment.courier || shipment.sr_courier_name || shipment.courier_name,
                    status: shipment.status
                };
            }
            return null;
        } catch (error) {
            console.error(`❌ Shiprocket Get Shipment Error (${shipmentId}):`, error.response?.data || error.message);
            return null;
        }
    }

    // Deep Scanning Search (Up to 500 orders)
    async getOrderByChannelId(channelOrderId, customerMobile = null, customerName = null, location = {}) {
        try {
            const token = await this.getToken();
            const targetId = String(channelOrderId || '').trim().toUpperCase();
            const targetMobile = customerMobile ? String(customerMobile).replace(/\D/g, '').slice(-10) : null;
            const targetName = customerName ? String(customerName).trim().toLowerCase() : null;
            const targetCity = location.city ? String(location.city).trim().toLowerCase() : null;
            const targetPin = location.pincode ? String(location.pincode).replace(/\D/g, '') : null;

            console.log(`📡 Deep Sync: Searching ${targetId} | Mobile: ${targetMobile || 'N/A'}`);

            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

            // 1. Precise Filter Search (Page 1)
            const resFilter = await axios.get(`${this.baseURL}/orders`, {
                headers,
                params: { channel_order_id: channelOrderId, per_page: 50 }
            });
            let match = this._findMatch(resFilter.data?.data || [], targetId, targetMobile, targetName, targetCity, targetPin);
            if (match) return this._formatMatch(match);

            // 2. Wide Deep Scan (Pages 1-5)
            for (let page = 1; page <= 5; page++) {
                console.log(`🔍 [Page ${page}/5] Deep Scanning 100 orders...`);
                const resPage = await axios.get(`${this.baseURL}/orders`, {
                    headers,
                    params: { per_page: 100, page: page }
                });
                match = this._findMatch(resPage.data?.data || [], targetId, targetMobile, targetName, targetCity, targetPin);
                if (match) return this._formatMatch(match);

                // If the page has fewer than 100 orders, we've reached the end
                if ((resPage.data?.data || []).length < 100) break;
            }

            return null;
        } catch (error) {
            console.error(`❌ Deep Sync Error (${channelOrderId}):`, error.response?.data || error.message);
            return null;
        }
    }

    _formatMatch(matchedOrder) {
        const shipment = matchedOrder.shipments?.[0] || {};
        const courier = shipment.courier || shipment.sr_courier_name || shipment.courier_name || matchedOrder.courier_name;
        console.log(`✅ [MATCH] SR ID: ${matchedOrder.id} | AWB: ${matchedOrder.awb_code || shipment.awb} | Courier: ${courier}`);
        return {
            success: true,
            orderId: matchedOrder.id,
            awb: matchedOrder.awb_code || shipment.awb,
            shipmentId: shipment.id,
            courierName: courier,
            status: matchedOrder.status
        };
    }

    _findMatch(orders, targetId, targetMobile, targetName, targetCity, targetPin) {
        if (!orders || orders.length === 0) return null;

        const normalize = (val) => String(val || '').replace(/ORDER\s*ID\s*-/gi, '').trim().toUpperCase();
        const normTargetId = normalize(targetId);

        for (const o of orders) {
            const cId = normalize(o.channel_order_id);
            const cMobFull = String(o.customer_phone || o.billing_phone || '').replace(/\D/g, '');
            const cMob10 = cMobFull.slice(-10);
            const cName = String(o.customer_name || o.billing_name || '').trim().toLowerCase();
            const cCity = String(o.customer_city || o.billing_city || '').trim().toLowerCase();
            const cPin = String(o.customer_pincode || o.billing_pincode || '').replace(/\D/g, '');

            // --- VITAL: ANTI-GALAT LOGIC (MOBILE COLLISION) ---
            // If phone numbers are available and different, it MUST be a different person.
            if (targetMobile && cMob10 && targetMobile !== cMob10) {
                // console.log(`⏩ [Skip] Mobile collision: ${cId} (${cMob10}) vs Target (${targetMobile})`);
                continue;
            }

            // --- MATCH CRITERIA ---
            const isIdMatch = (normTargetId.length > 1 && cId === normTargetId);
            const isMobileMatch = (targetMobile && cMob10 === targetMobile);
            const isNameMatch = (targetName && (cName === targetName || cName.includes(targetName)));
            const isCityMatch = (targetCity && (cCity === targetCity || cCity.includes(targetCity)));

            // Accept if:
            // 1. ID Matches perfectly
            if (isIdMatch) {
                console.log(`✅ [ID MATCH] ${cId} for Target ${normTargetId}`);
                return o;
            }

            // 2. Mobile Matches perfectly (highest non-ID confidence)
            if (isMobileMatch) {
                console.log(`✅ [MOBILE MATCH] ${cMob10} for Order ${cId}`);
                return o;
            }

            // 3. Name matches AND City matches (prevents common name crossover)
            if (isNameMatch && isCityMatch && targetCity) {
                console.log(`✅ [NAME/CITY MATCH] ${cName}/${cCity} for Order ${cId}`);
                return o;
            }
        }
        return null;
    }
}

const shiprocketAPI = new ShiprocketAPI();
module.exports = shiprocketAPI;
