# Background Tracking Service - 24/7 Running

The background tracking service is now **automatically integrated** into the main server. When you run `start.bat` or `node server.js`, the tracking service starts automatically after the database connects.

## Features

✅ **Auto Status Sync** - Automatically marks orders as **Delivered** in the database when they are delivered in Shiprocket.
✅ **Cancellation Sync** - Updates orders to **Cancelled** if the tracking status shows RTO or Cancelled.
✅ **Out for Delivery Alerts** - Logs and tracks "Out for Delivery" events.
✅ **Hold Reminders** - Reminds about hold orders scheduled for dispatch today.
✅ **24/7 Tracking** - Runs as long as the server is running.

## Local Execution

Just run your normal start script:
```bash
start.bat
```
The server will log tracking updates directly to the console.

## Configuration

- **Sync Interval**: Every 5 minutes (Real-time tracking for all active orders).
- **Reminders**: Every 1 hour.

## Production (Render.com)

Since it is integrated into `server.js`, your main Web Service will handle tracking. No separate worker is required unless you have a very high volume of orders.
