#!/bin/sh
# Re-renders the print PDF and the per-card PNGs after editing cards.js or cards.css. Needs Google Chrome and Python 3 with Pillow.
set -e
cd "$(dirname "$0")"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d)
"$CH" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 --print-to-pdf="$PWD/measure-of-faith-set-1.pdf" "file://$PWD/print.html" 2>/dev/null
"$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=3 --virtual-time-budget=8000 --window-size=2112,408 --screenshot="$TMP/row.png" "file://$PWD/preview.html" 2>/dev/null
mkdir -p img
python3 - "$TMP/row.png" <<'PY'
import sys
from PIL import Image
im = Image.open(sys.argv[1]); w = im.size[0] // 8
for i in range(8):
    im.crop((i * w, 0, (i + 1) * w, im.size[1])).convert("RGB").save(f"img/card-{i + 1}.png", optimize=True)
PY
rm -rf "$TMP"
echo "Rendered measure-of-faith-set-1.pdf and img/card-1..8.png"
