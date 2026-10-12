# 링크 미리보기 이미지(1200x630) 만들기: powershell -ExecutionPolicy Bypass -File tools\make-og.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$W = 1200; $H = 630
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
$rect = New-Object System.Drawing.RectangleF 0, 0, $W, $H
$c1 = [System.Drawing.Color]::FromArgb(255, 0x2A, 0x9B, 0xE8)
$c2 = [System.Drawing.Color]::FromArgb(255, 0x3B, 0x2E, 0xF2)
$g.FillRectangle((New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $c1, $c2, 25.0), $rect)

# 왼쪽: 접시 + '뭐'
$cx = 300; $cy = 315; $pr = 170
$g.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(46, 255, 255, 255))), $cx - $pr, $cy - $pr, $pr * 2, $pr * 2)
$g.DrawEllipse((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 255, 255, 255)), 5), $cx - $pr, $cy - $pr, $pr * 2, $pr * 2)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = 'Center'; $sf.LineAlignment = 'Center'
$fBig = New-Object System.Drawing.Font 'Malgun Gothic', 190, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString([string][char]0xBB50, $fBig, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF ($cx - 200), ($cy - 192), 400, 400), $sf)

# 오른쪽: 제목과 설명
$left = New-Object System.Drawing.StringFormat
$fTitle = New-Object System.Drawing.Font 'Malgun Gothic', 96, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$fSub = New-Object System.Drawing.Font 'Malgun Gothic', 38, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$sub = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(225, 255, 255, 255))
$title = [string][char]0xC624 + [char]0xB298 + ' ' + [char]0xBB50 + ' ' + [char]0xBA39 + [char]0xC9C0   # 오늘 뭐 먹지
$g.DrawString($title, $fTitle, [System.Drawing.Brushes]::White, 520, 190, $left)
$line1 = '회사 근처 걸어갈 수 있는 곳 중'; $line2 = '점심·저녁 메뉴를 골라드려요'
$g.DrawString($line1, $fSub, $sub, 528, 330, $left)
$g.DrawString($line2, $fSub, $sub, 528, 385, $left)

$bmp.Save((Join-Path $root 'icons\og-image.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
'icons\og-image.png'
