# 🚀 RENDER DEPLOYMENT - STEP BY STEP

## Part 1: Commit Code to GitHub

### 1. Open VS Code Source Control
- Press `Ctrl + Shift + G`
- You'll see modified files:
  - `background-tracking.js` (NEW)
  - `auto-tracking.js` (modified)
  - `public/index.html` (modified)
  - `models.js`, `server.js`, etc.

### 2. Stage All Files
- Click **"+"** next to "Changes" to stage all

### 3. Commit
**Message:**
```
Production: Order tracking + Shiprocket integration + 24/7 background worker
```
Click **✓ Commit**

### 4. Push to GitHub
- Click **"Sync Changes"** or **"Push"** button
- Wait for push to complete

---

## Part 2: Deploy Background Worker to Render

### 1. Open Render Dashboard
**URL:** https://dashboard.render.com

### 2. Create New Background Worker
- Click **"New +"** button (top right)
- Select **"Background Worker"**

### 3. Connect Repository
- Select your GitHub repo: **"Herb Server Order Form"** (or whatever name)
- Click **"Connect"**

### 4. Configure Worker

**Fill these fields:**

| Field | Value |
|-------|-------|
| **Name** | `herb-tracking-worker` |
| **Region** | Singapore (same as main server) |
| **Branch** | `main` |
| **Build Command** | Leave blank |
| **Start Command** | `node background-tracking.js` |

### 5. Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these 3 variables (SAME as main server):

```
MONGODB_URI = mongodb+srv://...your-connection-string...
SHIPROCKET_API_EMAIL = api.herbonnaturals@gmail.com
SHIPROCKET_API_PASSWORD = your_password_here
```

### 6. Create Worker
- Click **"Create Background Worker"**
- Wait 2-3 minutes for deployment

### 7. Check Logs
- Click **"Logs"** tab
- You should see:
```
🚀 Starting Background Tracking Service...
⏰ Check interval: 5 minutes
🔔 Checking for Out for Delivery orders...
```

---

## Part 3: Deploy Main Server (if needed)

Your main server already deployed? Just:
1. Render auto-deploys from GitHub push
2. Wait 5-7 minutes
3. Check deployment status

---

## ✅ Verification

### Background Worker Logs:
Every 5 minutes you'll see:
```
📦 Found X dispatched orders to track
✅ Check complete
```

When "Out for Delivery":
```
═══════════════════════════════════
🔔 OUT FOR DELIVERY ALERT!
Order ID: HON7417
Customer: Test Customer
Phone: 9876543210
═══════════════════════════════════
```

### Browser Alerts:
- Login as Employee/Admin/Dispatch
- Automatic popup + sound when Out for Delivery

---

## 🎉 Done!

**System now:**
- ✅ 24/7 background tracking
- ✅ Browser alerts when logged in
- ✅ Database auto-updates
- ✅ Ready for production!

**Boss ko demo ready hai!** 🚀
