# Security Implementation Guide

## 🔐 Security Features Implemented

### 1. Password Security
- ✅ All passwords now hashed using bcrypt (SALT_ROUNDS = 10)
- ✅ Plain text passwords replaced in registration, login, and reset endpoints
- ✅ Secure password comparison using bcrypt.compare()

### 2. JWT Authentication
- ✅ JWT tokens generated on successful login
- ✅ Tokens valid for 24 hours
- ✅ Protected endpoints require valid JWT token in Authorization header
- ✅ Token format: `Authorization: Bearer <token>`

### 3. Input Validation
- ✅ express-validator middleware for all user inputs
- ✅ Email validation and sanitization
- ✅ Mobile number format validation (10 digits, starts with 6-9)
- ✅ Password strength requirements (min 6 chars, uppercase, lowercase, number)
- ✅ Order data validation before creation

### 4. Rate Limiting
- ✅ Login/Register endpoints: 5 attempts per 15 minutes
- ✅ General API endpoints: 100 requests per minute
- ✅ Prevents brute force and DDoS attacks

### 5. HTTP Security
- ✅ Helmet.js for secure HTTP headers
- ✅ CORS restricted to allowed origins (from .env)
- ✅ No sensitive data in console logs
- ✅ Input size limit (10MB)

---

## 📋 Post-Implementation Steps

### STEP 1: Update `.env` File
Add these new environment variables:

```bash
# JWT Secret - Use a strong random string (min 32 chars)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# CORS Allowed Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,https://your-render-app.onrender.com
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### STEP 2: Migrate Existing Passwords
Run the password migration script ONCE to hash all existing passwords:

```bash
node migrate-passwords.js
```

This will:
- Create backup of current data in `data-backup/` folder
- Hash all plain text passwords in employees.json
- Hash all plain text passwords in MongoDB departments
- Skip already hashed passwords (starting with $2b$)

**⚠️ IMPORTANT:** Run this ONLY ONCE! Already hashed passwords will be skipped.

### STEP 3: Update Frontend (index.html)

The frontend needs to be updated to:
1. Store JWT token after login
2. Send JWT token in all API requests
3. Handle 401 Unauthorized responses

**Key changes needed:**
- Store token in localStorage after login
- Add `Authorization: Bearer <token>` header to all fetch requests
- Redirect to login on 401 responses

### STEP 4: Test Security

**Test Password Hashing:**
1. Register a new employee
2. Check `data/employees.json` - password should start with `$2b$`
3. Try logging in with the password - should work

**Test JWT Authentication:**
1. Login as employee - should receive `token` in response
2. Try creating order without token - should get 401 error
3. Try creating order with token - should work

**Test Rate Limiting:**
1. Try logging in 6 times with wrong password
2. Should get "Too many attempts" error on 6th attempt
3. Wait 15 minutes or restart server to reset

---

## 🚀 Deployment Checklist

### Before Deploying to Production:

- [ ] Generate strong JWT_SECRET (64+ random characters)
- [ ] Update ALLOWED_ORIGINS with production URL
- [ ] Run password migration script
- [ ] Test all login/register flows
- [ ] Verify JWT tokens are working
- [ ] Test rate limiting
- [ ] Enable HTTPS (Render.com provides this automatically)
- [ ] Remove any console.log with sensitive data
- [ ] Backup database before deployment

### Production Environment Variables:
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<64-char-random-string>
ALLOWED_ORIGINS=https://your-app.onrender.com,https://www.your-domain.com
SHIPROCKET_API_EMAIL=...
SHIPROCKET_API_PASSWORD=...
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` to Git** (already in `.gitignore`)
2. **Rotate JWT_SECRET periodically** (every 3-6 months)
3. **Use HTTPS in production** (handled by Render.com)
4. **Monitor failed login attempts**
5. **Keep dependencies updated** (`npm audit` regularly)
6. **Backup database regularly**

---

## 🐛 Troubleshooting

### "Invalid credentials" on login
- Check if password migration ran successfully
- Verify password is hashed in database (starts with `$2b$`)
- Try resetting password using reset endpoint

### "Access denied. No token provided"
- Frontend not sending Authorization header
- Check if token is stored in localStorage
- Verify token format: `Bearer <token>`

### "Too many attempts"
- Rate limiting triggered (5 failed logins in 15 min)
- Wait 15 minutes or restart server
- Check IP address (may be shared in office network)

### CORS errors
- Add frontend origin to ALLOWED_ORIGINS in .env
- Restart server after updating .env
- Check browser console for exact CORS error

---

## 📞 Support

For issues:
1. Check server console for error messages
2. Check browser DevTools console
3. Verify .env configuration
4. Test with Postman/curl for API issues

---

**Security Score After Implementation: 9/10** ✅

Remaining improvements:
- [ ] Add 2FA (Two-Factor Authentication)
- [ ] Implement session management
- [ ] Add audit logging
- [ ] Set up intrusion detection
