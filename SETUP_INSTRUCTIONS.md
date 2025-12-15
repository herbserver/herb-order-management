# Herb On Naturals - Setup Instructions

## 🚀 Quick Start (One-Time Setup)

### Step 1: Setup Custom Domain
1. **Right-click** `setup_domain.bat`
2. Select **"Run as administrator"**
3. Wait for "SETUP COMPLETE!" message

This adds `herbonnaturals` to your Windows hosts file.

---

### Step 2: Start Server
1. **Right-click** `start.bat`
2. Select **"Run as administrator"**
3. Browser will open automatically at http://herbonnaturals

---

## ✅ What Each File Does:

- **`setup_domain.bat`** - One-time setup (adds herbonnaturals to hosts)
- **`start.bat`** - Start server (run every time you want to use the app)

---

## 💡 Important Notes:

⚠️ **Both scripts MUST run as Administrator** (because Port 80 and hosts file need admin rights)

🔄 **If herbonnaturals doesn't work:**
- Check if hosts file has the entry: `C:\Windows\System32\drivers\etc\hosts`
- Should contain: `192.168.1.6 herbonnaturals`
- Re-run `setup_domain.bat` as Administrator

📌 **Alternative Access:**
- `http://localhost` also works
- `http://192.168.1.6` also works

---

## 🆘 Troubleshooting:

**Problem:** "This site can't be reached"
**Solution:** Run `setup_domain.bat` as Administrator again

**Problem:** "Port 80 already in use"
**Solution:** Stop other web servers or use different port in server.js

**Problem:** Server not starting
**Solution:** Make sure you're running `start.bat` as Administrator
