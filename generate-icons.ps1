# generate-icons.ps1
# Generates placeholder brand-coloured PNG icons and a favicon.ico
# using only .NET/GDI+ (no external tools required).
# Run from the portfolio root:
#   powershell -ExecutionPolicy Bypass -File generate-icons.ps1

Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "assets\img"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force $outDir | Out-Null }

function Make-PNG {
  param(
    [string]$Path,
    [int]$Width,
    [int]$Height,
    [string]$Label = ""
  )
  $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)
  $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  # Background: #0E1013
  $bgColor = [System.Drawing.Color]::FromArgb(255, 14, 16, 19)
  $gfx.Clear($bgColor)

  # Accent dot (top-right area)
  $accentColor = [System.Drawing.Color]::FromArgb(255, 91, 111, 255)
  $brush = New-Object System.Drawing.SolidBrush($accentColor)
  $dotR = [Math]::Max(4, [int]($Width * 0.09))
  $gfx.FillEllipse($brush, ($Width - $dotR*2 - [int]($Width*0.06)), [int]($Height*0.06), $dotR*2, $dotR*2)
  $brush.Dispose()

  # "PH" text centered
  $textColor = [System.Drawing.Color]::FromArgb(255, 245, 243, 238)
  $textBrush = New-Object System.Drawing.SolidBrush($textColor)
  $fontSize = [Math]::Max(8, [int]($Width * 0.38))

  # Try Space Grotesk first, fall back to Arial Bold
  $fontFamily = "Space Grotesk"
  try {
    $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold)
  } catch {
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
  }

  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF(0, 0, $Width, $Height)
  $gfx.DrawString("PH", $font, $textBrush, $rect, $sf)

  $font.Dispose()
  $textBrush.Dispose()
  $sf.Dispose()
  $gfx.Dispose()

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "  Created: $Path ($Width x $Height)"
}

function Make-OG {
  param([string]$Path)
  $w = 1200; $h = 630
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)
  $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $bgColor = [System.Drawing.Color]::FromArgb(255, 14, 16, 19)
  $gfx.Clear($bgColor)

  # Accent bar along left edge
  $accentColor = [System.Drawing.Color]::FromArgb(255, 91, 111, 255)
  $accentBrush = New-Object System.Drawing.SolidBrush($accentColor)
  $gfx.FillRectangle($accentBrush, 0, 0, 8, $h)
  $accentBrush.Dispose()

  # Line colour border
  $lineColor = [System.Drawing.Color]::FromArgb(255, 42, 45, 51)
  $linePen = New-Object System.Drawing.Pen($lineColor, 1)
  $gfx.DrawRectangle($linePen, 32, 48, $w - 64, $h - 96)
  $linePen.Dispose()

  $textColor = [System.Drawing.Color]::FromArgb(255, 245, 243, 238)
  $textBrush = New-Object System.Drawing.SolidBrush($textColor)
  $mutedColor = [System.Drawing.Color]::FromArgb(180, 245, 243, 238)
  $mutedBrush = New-Object System.Drawing.SolidBrush($mutedColor)

  try { $nameFont = New-Object System.Drawing.Font("Space Grotesk", 72, [System.Drawing.FontStyle]::Bold) }
  catch { $nameFont = New-Object System.Drawing.Font("Arial", 72, [System.Drawing.FontStyle]::Bold) }
  try { $roleFont = New-Object System.Drawing.Font("Space Grotesk", 32, [System.Drawing.FontStyle]::Regular) }
  catch { $roleFont = New-Object System.Drawing.Font("Arial", 32, [System.Drawing.FontStyle]::Regular) }

  $gfx.DrawString("Prathamesh Hegde", $nameFont, $textBrush, 80, 220)
  $gfx.DrawString("Student · hegdepratham.github.io", $roleFont, $mutedBrush, 82, 320)

  $nameFont.Dispose(); $roleFont.Dispose()
  $textBrush.Dispose(); $mutedBrush.Dispose()
  $gfx.Dispose()

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "  Created: $Path (1200 x 630)"
}

function Make-ICO {
  param([string]$Path, [string]$PngPath)
  # Write a minimal ICO wrapper around the 32x32 PNG
  # ICO format: 6-byte header + 16-byte dir entry + PNG data
  $pngBytes = [System.IO.File]::ReadAllBytes($PngPath)
  $stream = New-Object System.IO.MemoryStream

  # ICONDIR header (6 bytes)
  $stream.WriteByte(0); $stream.WriteByte(0)   # Reserved
  $stream.WriteByte(1); $stream.WriteByte(0)   # Type = 1 (ICO)
  $stream.WriteByte(1); $stream.WriteByte(0)   # Count = 1

  # ICONDIRENTRY (16 bytes)
  $stream.WriteByte(32)  # Width (0 = 256)
  $stream.WriteByte(32)  # Height
  $stream.WriteByte(0)   # Color count (0 = >256)
  $stream.WriteByte(0)   # Reserved
  $stream.WriteByte(1); $stream.WriteByte(0)   # Planes
  $stream.WriteByte(32); $stream.WriteByte(0)  # Bit count
  # Size of PNG data (4 bytes LE)
  $sz = $pngBytes.Length
  $stream.WriteByte($sz -band 0xFF)
  $stream.WriteByte(($sz -shr 8) -band 0xFF)
  $stream.WriteByte(($sz -shr 16) -band 0xFF)
  $stream.WriteByte(($sz -shr 24) -band 0xFF)
  # Offset to PNG data = 6 + 16 = 22 (4 bytes LE)
  $stream.WriteByte(22); $stream.WriteByte(0); $stream.WriteByte(0); $stream.WriteByte(0)

  $stream.Write($pngBytes, 0, $pngBytes.Length)
  [System.IO.File]::WriteAllBytes($Path, $stream.ToArray())
  $stream.Dispose()
  Write-Host "  Created: $Path (ICO wrapping 32x32 PNG)"
}

Write-Host "`nGenerating icons..."

$png32Path = Join-Path $outDir "icon-32.png"
Make-PNG -Path $png32Path           -Width 32   -Height 32
Make-PNG -Path (Join-Path $outDir "apple-touch-icon.png") -Width 180  -Height 180
Make-PNG -Path (Join-Path $outDir "icon-192.png")         -Width 192  -Height 192
Make-PNG -Path (Join-Path $outDir "icon-512.png")         -Width 512  -Height 512
Make-OG  -Path (Join-Path $outDir "og.png")
Make-ICO -Path (Join-Path $outDir "favicon.ico") -PngPath $png32Path

Write-Host "`nDone. All icon files written to $outDir"
