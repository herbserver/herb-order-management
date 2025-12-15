# Manual Hosts File Setup - Herb On Naturals

## ⚠️ Automatic script failed - Do this manually:

### **Step-by-Step:**

1. **Press Windows Key** and type: `notepad`
2. **RIGHT CLICK on Notepad** → **Run as administrator**
3. In Notepad: **File → Open**
4. Navigate to: `C:\Windows\System32\drivers\etc`
5. Change "Text Documents (*.txt)" to **"All Files (*.*)"** at bottom
6. Select **`hosts`** file → Open
7. **Scroll to bottom** of file
8. **Add this line at the end:**
   ```
   192.168.1.6 herbonnaturals
   ```
9. **File → Save** (Ctrl+S)
10. **Close Notepad**

---

## ✅ **After Adding:**

Run `start.bat` as Administrator and http://herbonnaturals will work!

---

## 🔍 **Verify It Worked:**

Open Command Prompt and type:
```
ping herbonnaturals
```

Should show: `Reply from 192.168.1.6`

---

## 💡 **Alternative - Use localhost instead:**

If you don't want to edit hosts file, just use:
- **http://localhost** instead of http://herbonnaturals
- Works exactly the same!
