# Mobile Access Guide - Herb On Naturals

## 📱 **Open on Mobile (Same WiFi)**

### **Requirements:**
1. ✅ Computer (server) running on same WiFi
2. ✅ Mobile on same WiFi network
3. ✅ Server running (start.bat)

---

## 🚀 **Steps:**

### **Step 1: Find Your Computer's IP**

On computer, open Command Prompt and type:
```
ipconfig
```

Look for **"IPv4 Address"** under your WiFi adapter.
Example: `192.168.1.6`

---

### **Step 2: Start Server**

On computer:
- Right-click `start.bat` → Run as administrator
- Server starts on Port 80

---

### **Step 3: Open on Mobile**

On your mobile browser, type:
```
http://192.168.1.6
```
(Use YOUR computer's IP address)

**Done!** Application opens! 🎉

---

## ✅ **Quick Access:**

### **Computer:**
- http://localhost
- http://192.168.1.6

### **Mobile/Tablet (same WiFi):**
- http://192.168.1.6

### **Other Computers (same network):**
- http://192.168.1.6

---

## 🔥 **Pro Tip:**

Save the IP address as a **bookmark** on mobile for quick access!

---

## 🆘 **Troubleshooting:**

**Problem:** Can't connect from mobile

**Solutions:**
1. Check both devices on same WiFi
2. Check Windows Firewall (allow Port 80)
3. Verify server is running (check computer terminal)
4. Try `http://192.168.1.6:80` (with port)

**Firewall Command (run as Admin on computer):**
```powershell
netsh advfirewall firewall add rule name="Herb On Naturals" dir=in action=allow protocol=TCP localport=80
```
