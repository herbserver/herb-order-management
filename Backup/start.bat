@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Herb On Naturals Server
color 0A

echo ========================================
echo   HERB ON NATURALS SERVER STARTING...
echo ========================================
echo.
echo Current Dir: %cd%
echo Server:      http://localhost:3000
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [!] node_modules folder not found.
    echo [!] Running npm install...
    call npm install
)

echo [!] Starting Node.js server...
echo [!] DO NOT CLOSE THIS WINDOW!
echo [!] Press Ctrl+C to stop the server.
echo.
echo ----------------------------------------
echo.

:: Automatically open browser
start http://localhost:3000

:: Start server
node server.js

pause
