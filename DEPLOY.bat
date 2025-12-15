@echo off
echo ========================================
echo DEPLOYING TO RENDER - ALL FIXES
echo ========================================
echo.
echo Files being deployed:
echo  - models.js (schema fix)
echo  - dataAccess.js (status filtering fix)
echo  - server.js (duplicate code removal)
echo  - public/index.html (HTML structure fix)
echo.
git add models.js dataAccess.js server.js public/index.html
git commit -m "Fixed all issues: order display, save, and schema validation"
git push origin main
echo.
echo ========================================
echo DEPLOYMENT STARTED!
echo Wait 5-7 minutes for Render to deploy
echo Then test at: herb-order-server.onrender.com
echo ========================================
pause
