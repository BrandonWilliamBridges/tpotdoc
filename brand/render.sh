#!/bin/sh
# Exports tpot-doc-logo.svg to PNG (transparent, 2000px and 512px) and a vector PDF for printers, with fonts loaded.
set -e
cd "$(dirname "$0")"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d)
python3 - "$TMP/logo.html" <<'PY'
import sys
svg = open("tpot-doc-logo.svg").read()
open(sys.argv[1], "w").write(f"""<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&family=Montserrat:wght@700&display=swap">
<style>@page{{size:1000px 1000px;margin:0}}html,body{{margin:0;background:transparent}}svg{{display:block;width:1000px;height:1000px}}</style>
</head><body>{svg}</body></html>""")
PY
"$CH" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=8000 --default-background-color=00000000 --force-device-scale-factor=2 --window-size=1000,1000 --screenshot="$PWD/tpot-doc-logo.png" "file://$TMP/logo.html" 2>/dev/null
"$CH" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=8000 --print-to-pdf="$PWD/tpot-doc-logo.pdf" "file://$TMP/logo.html" 2>/dev/null
python3 -c "from PIL import Image; im=Image.open('tpot-doc-logo.png'); im.resize((512,512), Image.LANCZOS).save('tpot-doc-logo-512.png'); im.resize((64,64), Image.LANCZOS).save('favicon-64.png')"
rm -rf "$TMP"
echo "Exported tpot-doc-logo.png (2000px), tpot-doc-logo-512.png, favicon-64.png, tpot-doc-logo.pdf"
