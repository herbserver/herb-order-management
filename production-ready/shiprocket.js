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
            console.log('🔍 Shiprocket Raw Response for AWB', awbNumber, ':', JSON.stringify(trackingData, null, 2));

            if (trackingData && trackingData.tracking_data) {
                const td = trackingData.tracking_data;
                const shipmentTrack = td.shipment_track || [];
                const latestStatus = shipmentTrack.length > 0 ? shipmentTrack[0] : null;
                const shipmentStatus = td.shipment_status;
                const trackStatus = td.track_status || 0;

                // === COMPREHENSIVE SCAN EXTRACTION ===
                // Look for activities in ALL possible locations
                let allActivities = [];

                // 1. Check tracking_data.shipment_track_activities (most common)
                if (td.shipment_track_activities && Array.isArray(td.shipment_track_activities)) {
                    allActivities = [...allActivities, ...td.shipment_track_activities];
                    console.log('📦 Found shipment_track_activities:', td.shipment_track_activities.length, 'items');
                }

                // 2. Check inside each shipment_track entry
                shipmentTrack.forEach((track, idx) => {
                    if (track.shipment_track_activities && Array.isArray(track.shipment_track_activities)) {
                        allActivities = [...allActivities, ...track.shipment_track_activities];
                        console.log(`📦 Found activities in shipment_track[${idx}]:`, track.shipment_track_activities.length, 'items');
                    }
                    if (track.scans && Array.isArray(track.scans)) {
                        allActivities = [...allActivities, ...track.scans];
                        console.log(`📦 Found scans in shipment_track[${idx}]:`, track.scans.length, 'items');
                    }
                });

                // 3. Check tracking_data.scans
                if (td.scans && Array.isArray(td.scans)) {
                    allActivities = [...allActivities, ...td.scans];
                    console.log('📦 Found td.scans:', td.scans.length, 'items');
                }

                // 4. Check tracking_data.track_activities
                if (td.track_activities && Array.isArray(td.track_activities)) {
                    allActivities = [...allActivities, ...td.track_activities];
                    console.log('📦 Found track_activities:', td.track_activities.length, 'items');
                }

                // 5. If still empty, create entries from shipment_track status updates
                if (allActivities.length === 0 && shipmentTrack.length > 0) {
                    console.log('📦 No activities found, creating from shipment_track statuses');
                    shipmentTrack.forEach(track => {
                        allActivities.push({
                            date: track.updated_time_stamp || track.date || '',
                            activity: track.current_status || track.activity || 'Status Update',
                            location: track.location || track.origin || 'N/A',
                            status: track.current_status || ''
                        });
                    });
                }

                // Remove duplicates based on date + activity
                const seen = new Set();
                allActivities = allActivities.filter(item => {
                    const key = `${item.date || ''}-${item.activity || ''}-${item.location || ''}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                // Sort by date descending (newest first)
                allActivities.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

                console.log('📦 Total unique activities:', allActivities.length);

                // Shiprocket Status Code Mapping (Official)
                const statusCodeMap = {
                    1: 'AWB Assigned',
                    2: 'Label Generated',
                    3: 'Pickup Scheduled/Generated',
                    4: 'Pickup Queued',
                    5: 'Manifest Generated',
                    6: 'Shipped',
                    7: 'Delivered',
                    8: 'Cancelled',
                    9: 'RTO Initiated',
                    10: 'RTO Delivered',
                    11: 'Pending',
                    12: 'Lost',
                    13: 'Pickup Error',
                    14: 'RTO Acknowledged',
                    15: 'Pickup Rescheduled',
                    16: 'Cancellation Requested',
                    17: 'Out For Delivery',
                    18: 'In Transit',
                    19: 'Out For Pickup',
                    20: 'Pickup Exception',
                    21: 'Undelivered',
                    22: 'Delayed',
                    23: 'Partial Delivered',
                    24: 'Destroyed',
                    25: 'Damaged',
                    26: 'Fulfilled',
                    38: 'Reached at Destination',
                    39: 'Misrouted',
                    40: 'RTO_NDR',
                    41: 'RTO_OFD',
                    42: 'Picked Up',
                    43: 'Self Fulfilled',
                    44: 'DISPOSED_OFF',
                    45: 'Cancelled Before Dispatched',
                    46: 'RTO In Transit',
                    47: 'QC Failed',
                    48: 'Reached Warehouse',
                    49: 'Custom Cleared',
                    50: 'In Flight',
                    51: 'Handover to Courier',
                    52: 'Shipment Booked'
                };

                // Get current status from multiple sources (prioritize API codes)
                let currentStatus = '';

                // Priority 1: Use shipment_status code from API
                if (shipmentStatus && statusCodeMap[shipmentStatus]) {
                    currentStatus = statusCodeMap[shipmentStatus];
                }
                // Priority 2: Use track_status code
                else if (trackStatus && statusCodeMap[trackStatus]) {
                    currentStatus = statusCodeMap[trackStatus];
                }
                // Priority 3: Use current_status from shipment_track
                else if (latestStatus?.current_status) {
                    currentStatus = latestStatus.current_status;
                }
                // Priority 4: Use sr-status-label from latest activity
                else if (allActivities.length > 0 && allActivities[0]['sr-status-label']) {
                    currentStatus = allActivities[0]['sr-status-label'];
                }
                // Priority 5: Use activity description
                else if (allActivities.length > 0 && allActivities[0].activity) {
                    currentStatus = allActivities[0].activity;
                }
                // Fallback
                else {
                    currentStatus = td.current_status || 'In Transit';
                }

                console.log('📊 Status from API - shipment_status:', shipmentStatus, '| track_status:', trackStatus, '| Resolved:', currentStatus);

                let delivered = (shipmentStatus === 7 || shipmentStatus === '7' ||
                    trackStatus === 7 ||
                    currentStatus.toLowerCase().includes('delivered'));

                // Courier name - Multiple fallbacks
                let courierName = latestStatus?.courier_name || td.courier_name || 'Shiprocket';
                let edd = latestStatus?.edd || td.edd || td.etd || '';

                // Origin & Destination - Check multiple sources
                let origin = latestStatus?.origin || td.pickup_location || '';
                let destination = latestStatus?.destination || td.destination || '';

                // Try to extract from activities if still empty
                if ((!origin || origin === 'N/A') && allActivities.length > 0) {
                    const lastActivity = allActivities[allActivities.length - 1];
                    origin = lastActivity?.location || '';
                }
                if ((!destination || destination === 'N/A') && allActivities.length > 0) {
                    destination = allActivities[0]?.location || '';
                }

                // Weight and Packages
                let weight = latestStatus?.weight || td.weight || '';
                let packages = latestStatus?.packages || td.packages || 1;

                // Current location from latest activity
                let location = allActivities.length > 0
                    ? allActivities[0].location
                    : (latestStatus?.location || latestStatus?.current_status_location || 'In Transit');

                return {
                    success: true,
                    awb: awbNumber,
                    courierName: courierName,
                    currentStatus: delivered ? 'Delivered' : currentStatus,
                    lastUpdate: allActivities.length > 0
                        ? allActivities[0].date
                        : (latestStatus?.updated_time_stamp || latestStatus?.date || td.updated_at || 'No updates'),
                    location: location,
                    edd: edd,
                    delivered: delivered,
                    // Comprehensive Details
                    origin: origin || 'N/A',
                    destination: destination || 'N/A',
                    pickupDate: latestStatus?.pickup_date || td.pickup_date || '',
                    deliveredDate: latestStatus?.delivered_date || td.delivered_date || '',
                    weight: weight,
                    packages: packages,
                    deliveredTo: latestStatus?.delivered_to || td.delivered_to || '',
                    podStatus: latestStatus?.pod_status || td.pod_status || '',

                    // Return all scan activities
                    allScans: allActivities.length > 0 ? allActivities.map(scan => ({
                        date: scan.date || scan.updated_at || '',
                        activity: scan.activity || scan['sr-status'] || 'Update',
                        location: scan.location || 'N/A',
                        status: scan['sr-status-label'] || scan.status || scan.activity || currentStatus
                    })) : shipmentTrack.map(scan => ({
                        date: scan.updated_time_stamp || scan.date || '',
                        activity: scan.activity || scan.current_status || 'Update',
                        location: scan.location || scan.origin || 'N/A',
                        status: scan.current_status || ''
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

    // Create order in Shiprocket
    async createOrder(orderData) {
        try {
            const token = await this.getToken();
            console.log('📦 Creating Shiprocket order...');

            const response = await axios.post(`${this.baseURL}/orders/create/adhoc`, orderData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = response.data;
            console.log('📡 Shiprocket Create Order Response:', result);

            if (result && (result.order_id || result.shipment_id)) {
                return {
                    success: true,
                    orderId: result.order_id,
                    shipmentId: result.shipment_id,
                    awb: result.awb_code || null,
                    courierName: result.courier_name || null,
                    message: 'Order created successfully'
                };
            } else {
                return {
                    success: false,
                    message: result.message || 'Failed to create order',
                    details: result.errors || result
                };
            }
        } catch (error) {
            console.error('❌ Shiprocket Create Order Error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                details: error.response?.data?.errors || error.response?.data
            };
        }
    }

    // Check serviceability for delivery pincode
    async checkServiceability(pickupPostcode, deliveryPostcode, weight = 0.5, codAmount = 0) {
        try {
            const token = await this.getToken();

            const response = await axios.get(`${this.baseURL}/courier/serviceability/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    pickup_postcode: pickupPostcode,
                    delivery_postcode: deliveryPostcode,
                    weight: weight,
                    cod: codAmount > 0 ? 1 : 0
                }
            });

            const result = response.data;

            if (result && result.data && result.data.available_courier_companies) {
                return {
                    success: true,
                    serviceable: result.data.available_courier_companies.length > 0,
                    couriers: result.data.available_courier_companies.map(c => ({
                        id: c.courier_company_id,
                        name: c.courier_name,
                        rate: c.rate,
                        estimatedDays: c.etd
                    }))
                };
            }

            return {
                success: false,
                serviceable: false,
                message: 'Pincode not serviceable'
            };
        } catch (error) {
            console.error('❌ Shiprocket Serviceability Error:', error.response?.data || error.message);
            return {
                success: false,
                serviceable: false,
                message: error.response?.data?.message || error.message
            };
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
