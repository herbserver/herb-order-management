# Render Deployment Fix Guide

## Issue
"Server se connect nahi ho paya!" error on Render deployment

## Root Cause
Frontend is trying to connect to `localhost` instead of actual Render URL, and CORS is not configured for production domain.

## Solution Steps

### 1. Update Environment Variables on Render

Go to your Render dashboard → Your service → Environment tab

Add these environment variables:

```
PORT=3000
NODE_ENV=production

# MongoDB (if using)
MONGODB_URI=mongodb+srv://your-connection-string

# JWT Secret - Generate a strong one
JWT_SECRET=generate-with-command-below

# CORS - Add your Render URL
ALLOWED_ORIGINS=https://your-app-name.onrender.com

# Shiprocket (if using)
SHIPROCKET_API_EMAIL=your-email
SHIPROCKET_API_PASSWORD=your-password
```

### 2. Generate JWT Secret

Run this command locally and copy the output:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste this as JWT_SECRET value in Render.

### 3. Get Your Render URL

Your Render URL will be something like:
- `https://your-app-name.onrender.com`
- Or custom domain if configured

Copy this URL.

### 4. Update ALLOWED_ORIGINS

In Render environment variables, set:
```
ALLOWED_ORIGINS=https://your-app-name.onrender.com,https://www.your-app-name.onrender.com
```

(Include both with and without www if applicable)

### 5. Redeploy

After updating environment variables:
1. Render will automatically redeploy
2.  Wait for deployment to complete (check logs)
3. Test the URL

### 6. Verify CORS Setup

The server code already has CORS configured to read from `ALLOWED_ORIGINS`:

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
```

This will only allow requests from your Render domain.

## Troubleshooting

### If still showing connection error:

1. **Check Render Logs**
   - Go to Render dashboard → Logs tab
   - Look for startup errors
   - Ensure server started on correct PORT

2. **Verify Environment Variables**
   - All required variables are set
   - No typos in ALLOWED_ORIGINS
   - JWT_SECRET is present

3. **Test Direct API**
   - Try: `https://your-app-name.onrender.com/api/health`
   - Should return: `{"success":true,"status":"ok"}`

4. **Check Browser Console**
   - Open DevTools → Console
   - Look for CORS errors
   - Check what URL frontend is trying to connect to

### Common Fixes:

**If CORS error:**
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```
→ Double check ALLOWED_ORIGINS includes your Render URL

**If "ERR_CONNECTION_REFUSED":**
```
Failed to fetch
```
→ Server not running, check Render logs for errors

**If MongoDB connection error:**
→ Verify MONGODB_URI is correct and MongoDB Atlas allows Render IPs

## Quick Check Commands

After deployment, test these URLs in browser:

1. **Health Check:**
   ```
   https://your-app-name.onrender.com/api/health
   ```
   Should show: `{"success":true,"status":"ok"}`

2. **Main App:**
   ```
   https://your-app-name.onrender.com
   ```
   Should load login page without "Server se connect nahi ho paya!" error

## Success Indicators

✅ Login page loads without error message  
✅ Can login with employee/department credentials  
✅ Orders can be created and viewed  
✅ No CORS errors in browser console  

## Additional Notes

- **First Deploy:** Render free tier may take 1-2 minutes to start server
- **Sleep Mode:** Free tier sleeps after inactivity, first request may be slow
- **Logs:** Always check Render logs for detailed error messages
- **HTTPS:** Render provides HTTPS automatically, always use `https://` in ALLOWED_ORIGINS

---

**Need Help?**

Check:
1. Render service logs for errors
2. Browser DevTools console for frontend errors
3. Network tab to see what URLs are being called
