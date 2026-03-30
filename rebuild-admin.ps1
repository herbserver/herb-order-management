$basePath = $PSScriptRoot
$adminOutPath = Join-Path $basePath "public\admin.html"

# Get original index from git (clean UTF-8 source)
$gitOutput = & git show HEAD:public/index.html
$origText = $gitOutput -join "`n"
$origLines = $origText -split "`n"

Write-Host "Git source lines: $($origLines.Count)"
Write-Host "Test emoji line 1553: $($origLines[1552])"

# Build the HTML using StringBuilder (preserves UTF-8)
$sb = [System.Text.StringBuilder]::new(250000)

$head = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Herb On Naturals - Admin Dashboard</title>
    <link rel="dns-prefetch" href="https://cdn.tailwindcss.com">
    <link rel="dns-prefetch" href="https://fonts.googleapis.com">
    <link rel="preload" href="styles.css" as="style">
    <link rel="preload" href="js/core/config.js" as="script">
    <link rel="preload" href="js/core/session.js" as="script">
    <script src="https://cdn.tailwindcss.com" defer></script>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js" async></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" async></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<div id="app">
"@

$sb.Append($head) | Out-Null

# Admin Panel block: lines 1522-2553 in original (0-indexed: 1521-2552)
for ($i = 1521; $i -le 2552; $i++) {
    $sb.AppendLine($origLines[$i]) | Out-Null
}

# Global Modals (dispatch, orderDetail, orderModal): lines 1446-1520 (0-indexed: 1445-1519)
for ($i = 1445; $i -le 1519; $i++) {
    $sb.AppendLine($origLines[$i]) | Out-Null
}

# District Explorer + Edit Order + Tracking modals: lines 2556-2975 (0-indexed: 2555-2974)
for ($i = 2555; $i -le 2974; $i++) {
    $sb.AppendLine($origLines[$i]) | Out-Null
}

$sb.AppendLine('</div>') | Out-Null

# WhatsApp and auto-tracking scripts (lines 2646-2647, 0-indexed: 2645-2646)
$sb.AppendLine($origLines[2645]) | Out-Null
$sb.AppendLine($origLines[2646]) | Out-Null

# Core scripts (lines 2991-3050, 0-indexed: 2990-3049)
for ($i = 2990; $i -le 3049; $i++) {
    $sb.AppendLine($origLines[$i]) | Out-Null
}

$sb.AppendLine('    <script src="/socket.io/socket.io.js"></script>') | Out-Null

$initScript = @'

    <!-- Admin Auto-Init -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            console.log('[Admin] Page init...');
            var sessionResult = (typeof loadSession === 'function') ? loadSession() : null;
            var type = null;
            if (sessionResult === true || sessionResult) {
                type = (typeof currentUserType !== 'undefined') ? currentUserType : null;
            }
            if (type !== 'admin') {
                console.log('[Admin] Not admin, redirecting to /login.');
                window.location.href = '/login';
                return;
            }
            var adminPanel = document.getElementById('adminPanel');
            if (adminPanel) adminPanel.classList.remove('hidden');
            if (typeof switchAdminTab === 'function') switchAdminTab('pending');
            console.log('[Admin] Panel ready!');
        });
    </script>
'@

$sb.Append($initScript) | Out-Null
$sb.AppendLine('</body>') | Out-Null
$sb.AppendLine('</html>') | Out-Null

# Write as UTF-8 without BOM
$finalText = $sb.ToString()
[System.IO.File]::WriteAllText($adminOutPath, $finalText, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "admin.html written: $([System.IO.File]::ReadAllBytes($adminOutPath).Length) bytes"

# Verify emoji
$verLines = $finalText -split "`n"
Write-Host "Line 22 (adminPanel div): $($verLines[21])"
Write-Host "Line 55 (emoji test): $($verLines[54])"
