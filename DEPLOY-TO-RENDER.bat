@echo off
echo ================================================
echo    FINAL DEPLOYMENT TO RENDER.COM
echo ================================================
echo.

echo [1/5] Checking MongoDB Connection...
node test-mongo.js
if errorlevel 1 (
    echo.
    echo ERROR: MongoDB connection failed!
    echo Please check MONGODB_URI in .env file
    pause
    exit /b 1
)

echo.
echo [2/5] Generating JWT Secret...
echo Copy this JWT_SECRET to Render environment variables:
echo.
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
echo.

echo [3/5] Current Environment Variables:
echo.
type .env
echo.

echo [4/5] Testing Server Locally...
echo Starting server for 10 seconds...
start /B npm start
timeout /t 10 /nobreak >nul
echo.

echo [5/5] Deployment Instructions:
echo.
echo 1. Go to https://dashboard.render.com
echo 2. Select your service
echo 3. Click Environment tab
echo 4. Add these variables:
echo    - MONGODB_URI (from .env)
echo    - JWT_SECRET (generated above)
echo    - ALLOWED_ORIGINS=https://your-app.onrender.com
echo    - NODE_ENV=production
echo    - PORT=3000
echo.
echo 5. Save and wait for auto-redeploy
echo 6. Test: https://your-app.onrender.com
echo.

echo ================================================
echo    READY TO DEPLOY!
echo ================================================
echo.
echo Press any key to open Render dashboard...
pause >nul
start https://dashboard.render.com

echo.
echo After deployment, verify:
echo [ ] Login page loads without error
echo [ ] Register new employee works
echo [ ] Employee persists after restart
echo [ ] Orders save correctly
echo [ ] Admin panel shows employee
echo.
pause
