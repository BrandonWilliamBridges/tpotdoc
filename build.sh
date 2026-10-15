#!/bin/sh
# Wraps prototype/index.html (artifact format, no <head>) into a full page in docs/ for GitHub Pages.
set -e
cd "$(dirname "$0")"
mkdir -p docs/img
rm -f docs/img/*.jpg
cp prototype/img/*.jpg docs/img/
mkdir -p docs/printables/measure-of-faith/img
cp printables/measure-of-faith/measure-of-faith-set-1.pdf docs/printables/measure-of-faith/
cp printables/measure-of-faith/img/*.png docs/printables/measure-of-faith/img/
touch docs/.nojekyll
{
  cat <<'EOF'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
EOF
  cat prototype/index.html
  printf '\n</html>\n'
} > docs/index.html
echo "Built docs/index.html"
