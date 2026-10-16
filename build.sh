#!/bin/sh
# Builds docs/ (what GitHub Pages serves). All the work, including the search and AI-search files, is in build.py.
set -e
cd "$(dirname "$0")"
python3 build.py
