@echo off
cd /d "c:\Users\Abcom\Desktop\Chandan\New folder"
title Herb On Naturals Server
color 0A


echo.
echo ========================================
echo   HERB ON NATURALS SERVER STARTING...
echo ========================================
echo.
echo Folder: %~dp0
echo Server: http://localhost:3000
echo Custom: http://herbonnaturals:3000 (needs hosts file setup)
echo.
echo IMPORTANT: Running on Port 3000
echo This window must run as ADMINISTRATOR!
echo.
echo DO NOT CLOSE THIS WINDOW!
echo Press Ctrl+C to stop server.
echo.
echo ----------------------------------------
echo.

start http://localhost:3000
node server.js

pause
