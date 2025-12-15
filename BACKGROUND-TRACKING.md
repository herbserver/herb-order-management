# Background Tracking Service - 24/7 Running

## Local Testing

**Start service:**
```bash
node background-tracking.js
```

**Output:**
- Every 5 minutes checks Shiprocket
- Logs "OUT FOR DELIVERY" alerts to console
- Updates order status in database

**Keep running:**
- Open new terminal/PowerShell
- Run: `node background-tracking.js`
- Minimize terminal (don't close!)

## Production Deployment (Render.com)

### Option A: Separate Worker Service (Recommended)

1. **Render Dashboard** → Create New → **Background Worker**
2. Set start command: `node background-tracking.js`
3. Deploy from same GitHub repo
4. Always running 24/7 ✅

### Option B: Add to main server.js

Add at end of `server.js`:
```javascript
// Start background tracking
require('./background-tracking');
```

Server restart = tracking stops temporarily

## Features

✅ **24/7 Monitoring** - Browser closed = still running
✅ **Auto Status Update** - Database me save
✅ **Console Alerts** - Server logs me dikhe ga
✅ **Employee Filter** - Sab orders check

## Future Enhancements

Add in `background-tracking.js`:
- SMS notifications (Twilio)
- WhatsApp alerts (WhatsApp Business API)
- Email notifications (Nodemailer)
- Push notifications (Firebase)

## Best Practice

**Production:**
- Use Render Background Worker
- Add SMS/Email notifications
- Use Redis for notified orders tracking
- Add error monitoring (Sentry)
