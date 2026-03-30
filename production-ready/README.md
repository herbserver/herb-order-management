---
title: HerbServer Order Form
emoji: 🌿
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
app_port: 7860
---

# 🌿 Herb On Naturals - Order Management System

**One-Click Deploy Ready! Local Server Solution**

---

## 📋 Requirements

- ✅ Windows PC (Server)
- ✅ Node.js installed ([Download](https://nodejs.org/))
- ✅ Office WiFi Network

---

## 🚀 Quick Setup (3 Steps Only!)

### **Step 1: Extract & Check Files**
Ensure you have these files:
```
herb-on-naturals/
├── server.js          ✅ Backend server
├── index.html         ✅ Frontend app
├── package.json       ✅ Dependencies
├── setup.bat          ✅ One-click installer
├── start.bat          ✅ One-click starter
└── README.md          ✅ This file
```

### **Step 2: One-Click Install**
1. Double-click `setup.bat`
2. Wait 1-2 minutes (installs dependencies)
3. Done! ✅

### **Step 3: Move & Start**
1. Copy `index.html` to `public/` folder
2. Double-click `start.bat`
3. Server will start! 🎉

---

## 🌐 Access Application

| Device | URL |
|--------|-----|
| **Server PC** | `http://localhost:3000` |
| **Other Office PCs** | `http://192.168.1.6:3000` |
| **Mobile (WiFi)** | `http://192.168.1.6:3000` |

---

## 👥 Default Credentials

### Admin Login:
- **Password:** `admin123`

### Employee Login:
- First register using "Register New Account" button
- Then login with your Employee ID & Password

---

## 📊 Data Storage

All data saved in `data/` folder:
```
data/
├── employees.json           (Employee credentials)
├── unverified_orders.json   (New orders)
├── verified_orders.json     (Verified orders)
└── config.json              (Order ID counter)
```

**⚠️ Backup:** Copy `data/` folder regularly for backup!

---

## 🔧 Troubleshooting

### Problem: "Node.js not found"
**Solution:** Install Node.js from https://nodejs.org/

### Problem: "Port 3000 already in use"
**Solution:** 
1. Open `server.js`
2. Change `const PORT = 3000;` to `const PORT = 3001;`
3. Save and restart

### Problem: "Cannot access from other PC"
**Solution:**
1. Check Windows Firewall (allow port 3000)
2. Verify all devices on same WiFi
3. Ping server: `ping 192.168.1.6`

### Problem: Server IP changed
**Solution:**
1. Open `index.html`
2. Change line: `const API_BASE_URL = 'http://192.168.1.6:3000/api';`
3. Update to new IP

---

## 🛠️ Manual Commands (If Needed)

```bash
# Install dependencies
npm install

# Start server
npm start

# Start with auto-reload (development)
npm run dev
```

---

## 📱 Features

✅ Employee Registration & Login  
✅ Password Reset  
✅ Multi-tab Order Form  
✅ Real-time Order Updates (Admin)  
✅ Verify/Unverify Orders  
✅ Export to CSV  
✅ Multi-device Support  
✅ Centralized Data  

---

## 📞 Support

For issues, check:
1. Server console for errors
2. Browser console (F12)
3. Firewall settings
4. Network connectivity

---

## 🔒 Security Notes

- Server accessible only on **local network**
- Change admin password in `server.js`
- Regular data backups recommended
- Keep server PC secure

---

**Made with ❤️ for Herb On Naturals**

Version: 1.0.0  
Last Updated: 2024
