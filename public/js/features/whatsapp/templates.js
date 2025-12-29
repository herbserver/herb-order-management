/**
 * WhatsApp Templates Module
 * Contains all WhatsApp message templates in Hinglish
 */

// Fallback WhatsApp Templates - Hinglish Version (Consistent across all files)
if (typeof whatsappTemplates === 'undefined') {
    var whatsappTemplates = {
        booked: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

✅ Aapka order confirm ho gaya hai!

📦 *ORDER DETAILS*
▸ Order No: *${order.orderId}*
▸ Total Amount: *Rs. ${order.total || 0}*
▸ Advance Paid: Rs. ${order.advance || 0}
▸ COD Amount: *Rs. ${order.codAmount || order.cod || 0}*

📞 Hamari team jaldi hi aapko call karegi address verify karne ke liye.

⚠️ *IMPORTANT*
🚫 Product milne se pehle OTP share NA karein!

_Team Herb On Naturals_ 💚
🌐 herbonnaturals.in`,

        verified: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

✅ Aapka order *VERIFY* ho gaya hai!

📦 *ORDER: ${order.orderId}*

💰 *PAYMENT INFO*
▸ Total: Rs. ${order.total || 0}
▸ Paid: Rs. ${order.advance || 0}
▸ COD: *Rs. ${order.codAmount || order.cod || 0}*

📦 Order packing ho raha hai. Tracking details jaldi milenge!

🔐 *YAAD RAKHEIN*
🚫 Product check kiye bina OTP share NA karein!

_Team Herb On Naturals_ 💚`,

        dispatched: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

🚚 Aapka order *DISPATCH* ho gaya hai!

📦 *ORDER: ${order.orderId}*

📍 *TRACKING INFO*
▸ AWB No: *${order.shiprocket?.awb || order.tracking?.trackingId || 'Processing'}*
▸ Courier: *${order.shiprocket?.courierName || order.tracking?.courier || 'Processing'}*

💰 *PAYMENT*
▸ Total: Rs. ${order.total || 0}
▸ COD: *Rs. ${order.codAmount || order.cod || 0}*

🔗 Track karein: shiprocket.co/tracking

📋 *ZARURI BAATEIN*
📱 Phone ON rakhein
💵 COD amount ready rakhein
👀 Pehle product check karein
🔐 Phir OTP dein

_Happy Shopping!_ 🛍️
_Team Herb On Naturals_ 💚`,

        out_for_delivery: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

🏃 *AJ DELIVERY HOGI!*

📦 Order: *${order.orderId}*
💵 COD: *Rs. ${order.codAmount || order.cod || 0}*

🏠 Aaj aapka parcel aane wala hai, please available rahein.

⚠️ *YAAD RAKHEIN*
👀 Pehle product check karein, phir OTP dein!

_Team Herb On Naturals_ 💚`,

        delivered: (order) => `🌿 *_HERB ON NATURALS_* 🌿
_____________________

Namaste *${order.customerName}* ji! 🙏

🎉 *ORDER DELIVER HO GAYA!*

📦 Order: ${order.orderId}

🙏 Hamare saath shopping karne ke liye dhanyavaad!

⭐ Hume umeed hai ki aapko products pasand aayenge. Apna feedback zarur share karein - yeh hamare liye bahut important hai!

🛒 Dobara shopping karein: herbonnaturals.in

_Warm regards,_ 💚
_Team Herb On Naturals_`
    };
}
