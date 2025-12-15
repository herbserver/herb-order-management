@echo off
REM Setup Script for Herb On Naturals Custom Domain
REM This adds herbonnaturals to Windows hosts file

echo.
echo ================================================
echo   HERB ON NATURALS - DOMAIN SETUP
echo ================================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running as Administrator
) else (
    echo [ERROR] This script must run as Administrator!
    echo.
    echo Right-click setup_domain.bat and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo.
echo Adding herbonnaturals to hosts file...
echo.

REM Backup hosts file first
copy %SystemRoot%\System32\drivers\etc\hosts %SystemRoot%\System32\drivers\etc\hosts.backup >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Hosts file backed up
)

REM Check if entry already exists
findstr /C:"herbonnaturals" %SystemRoot%\System32\drivers\etc\hosts >nul 2>&1
if %errorLevel% == 0 (
    echo.
    echo [INFO] herbonnaturals entry already exists in hosts file
    echo.
) else (
    REM Add the entry
    echo 192.168.1.6 herbonnaturals >> %SystemRoot%\System32\drivers\etc\hosts
    if %errorLevel% == 0 (
        echo [OK] herbonnaturals added to hosts file!
        echo.
    ) else (
        echo [ERROR] Failed to add entry
        echo.
        pause
        exit /b 1
    )
)

echo ================================================
echo   SETUP COMPLETE!
echo ================================================
echo.
echo You can now access the application at:
echo   http://herbonnaturals
echo.
echo Next step: Run start.bat as Administrator
echo.
pause
