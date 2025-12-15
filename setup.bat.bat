@echo off
cd /d "%~dp0"
echo ========================================
echo   HERB ON NATURALS - ONE CLICK SETUP
echo ========================================
echo.
echo Current Directory: %CD%
echo.

echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found!
echo.

echo [2/3] Installing dependencies...
echo Please wait, this may take 1-2 minutes...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Installation failed!
    pause
    exit /b 1
)
echo ✓ Dependencies installed successfully!
echo.

echo [3/3] Creating data folder...
if not exist "data" mkdir data
if not exist "public" mkdir public
echo ✓ Folders created!
echo.

echo ========================================
echo   SETUP COMPLETE! 
echo ========================================
echo.
echo Next Steps:
echo 1. Copy index.html to 'public' folder
echo 2. Double-click 'start.bat' to run server
echo 3. Open browser: http://192.168.1.6:3000
echo.
echo Press any key to exit...
pause >nul
