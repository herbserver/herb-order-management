$t = [System.IO.File]::ReadAllText("public\admin.html", [System.Text.Encoding]::UTF8)
$l = $t -split "`n"
Write-Host "Lines: $($l.Count)"
Write-Host "Line 22: $($l[21])"
Write-Host "Line 55: $($l[54])"
Write-Host "Bytes: $([System.IO.File]::ReadAllBytes("public\admin.html").Length)"
