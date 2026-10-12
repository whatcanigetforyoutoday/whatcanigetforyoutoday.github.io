# 앱 아이콘 만들기: powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
# 하늘색→남보라 그라데이션 위에 흰 접시와 '뭐' 글자
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'icons'
New-Item -ItemType Directory -Force $out | Out-Null

function New-Icon([int]$size, [string]$file, [bool]$fullBleed, [double]$scale) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'; $g.InterpolationMode = 'HighQualityBicubic'
  $g.Clear([System.Drawing.Color]::Transparent)
  $rect = New-Object System.Drawing.RectangleF 0, 0, $size, $size
  $c1 = [System.Drawing.Color]::FromArgb(255, 0x2A, 0x9B, 0xE8)
  $c2 = [System.Drawing.Color]::FromArgb(255, 0x3B, 0x2E, 0xF2)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $c1, $c2, 45.0
  if ($fullBleed) {
    $g.FillRectangle($brush, $rect)
  } else {
    # 둥근 사각형 (모서리 22%)
    $r = $size * 0.22; $d = $r * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $d, $d, 180, 90); $path.AddArc($size - $d, 0, $d, $d, 270, 90)
    $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90); $path.AddArc(0, $size - $d, $d, $d, 90, 90)
    $path.CloseFigure(); $g.FillPath($brush, $path)
  }
  # 접시 (반투명 흰 원) + 테두리
  $cx = $size / 2; $cy = $size / 2
  $pr = $size * 0.34 * $scale
  $plate = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(46, 255, 255, 255))
  $g.FillEllipse($plate, $cx - $pr, $cy - $pr, $pr * 2, $pr * 2)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(110, 255, 255, 255)), ([Math]::Max(1, $size * 0.012 * $scale))
  $g.DrawEllipse($pen, $cx - $pr, $cy - $pr, $pr * 2, $pr * 2)
  # '뭐'
  $font = New-Object System.Drawing.Font 'Malgun Gothic', ([single]($size * 0.36 * $scale)), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = 'Center'; $sf.LineAlignment = 'Center'
  $txt = New-Object System.Drawing.RectangleF 0, ($size * 0.015), $size, $size
  $g.DrawString([string][char]0xBB50, $font, [System.Drawing.Brushes]::White, $txt, $sf)
  $bmp.Save((Join-Path $out $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

New-Icon 192 'icon-192.png' $false 1.0
New-Icon 512 'icon-512.png' $false 1.0
New-Icon 512 'maskable-512.png' $true 0.8      # 안드로이드 원형·물방울 마스크용 (가운데 80% 안전영역)
New-Icon 192 'maskable-192.png' $true 0.8
New-Icon 180 'apple-touch-icon.png' $true 1.0  # iOS는 모서리를 알아서 둥글게 잘라요
New-Icon 32 'favicon-32.png' $false 1.0
Get-ChildItem $out | Select-Object Name, Length
