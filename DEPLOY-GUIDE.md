# 🚀 DEPLOYMENT STEPS - VS CODE

## Quick Deployment Guide

### 1. Open VS Code Source Control
- Press `Ctrl + Shift + G`
- Or click 3rd icon in left sidebar (branch symbol)

### 2. Stage All Changes
You'll see these modified files:
- ✅ `models.js` - Complete schema
- ✅ `server.js` - Shiprocket endpoints
- ✅ `shiprocket.js` - NEW tracking module
- ✅ `public/index.html` - Auto-tracking init
- ✅ `public/auto-tracking.js` - NEW alert system
- ✅ `package.json` - axios added

Click **"+"** next to "Changes" to stage all

### 3. Commit
In message box type:
```
Complete: Order details + Shiprocket tracking + Out for Delivery alerts
```

Click **✓ Commit** button

### 4. Push to Production
Click **"Sync Changes"** button (↑↓ arrows)

### 5. Wait for Render Deployment
- Go to: https://dashboard.render.com
- Check your service deployment
- Wait 5-7 minutes

### 6. Test Production
Visit: https://herb-order-server.onrender.com
- Register employee
- Create order
- Check all features

## ✅ All Features Ready!

Everything tested locally and ready for production! 🎉
