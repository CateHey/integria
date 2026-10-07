# Exporta el icono y los banners a PNG con Edge en modo headless.
# Uso: powershell -ExecutionPolicy Bypass -File brand\render.ps1
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$brand = $PSScriptRoot
$out = Join-Path $brand "export"
New-Item -ItemType Directory -Force $out | Out-Null
$edgeProfile = Join-Path $env:TEMP "integria-edge-render"

function Shot($url, $file, $w, $h) {
  $path = Join-Path $out $file
  & $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
    --user-data-dir="$edgeProfile" --virtual-time-budget=3000 --default-background-color=00000000 `
    --window-size="$w,$h" --screenshot="$path" $url | Out-Null
  Write-Output "$file  ($w x $h)"
}

$base = "file:///" + ($brand -replace '\\', '/')

# Banners
Shot "$base/banner.html?f=og" "og-image.png" 1200 630
Shot "$base/banner.html?f=li" "linkedin-banner.png" 1584 396

# Iconos: se envuelven en una página del tamaño exacto
$icon = Get-Content (Join-Path $brand "icon.svg") -Raw
$square = $icon -replace 'rx="112"', 'rx="0"'   # iOS redondea solo las esquinas
$sizes = @(
  @{ file = "icon-512.png"; size = 512; svg = $icon },
  @{ file = "icon-192.png"; size = 192; svg = $icon },
  @{ file = "apple-touch-icon.png"; size = 180; svg = $square }
)
foreach ($s in $sizes) {
  $html = Join-Path $out "_tmp.html"
  "<html><body style='margin:0;background:transparent'><div style='width:$($s.size)px;height:$($s.size)px'>$($s.svg -replace '<svg ', '<svg width=""100%"" height=""100%"" ')</div></body></html>" | Out-File $html -Encoding utf8
  Shot ("file:///" + ($html -replace '\\', '/')) $s.file $s.size $s.size
}
$fav = Get-Content (Join-Path $brand "favicon.svg") -Raw
$html = Join-Path $out "_tmp.html"
"<html><body style='margin:0'><div style='width:32px;height:32px'>$($fav -replace '<svg ', '<svg width=""100%"" height=""100%"" ')</div></body></html>" | Out-File $html -Encoding utf8
Shot ("file:///" + ($html -replace '\\', '/')) "favicon-32.png" 32 32
Remove-Item $html
