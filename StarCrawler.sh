#!/bin/bash
# StarCrawler Starter - waehlt das neueste verfuegbare Build
DIR="$(cd "$(dirname "$0")" && pwd)"

# neuestes AppImage finden
APPIMAGE="$(ls -1t "$DIR"/release/StarCrawler-*.AppImage 2>/dev/null | head -n 1)"

if [ -n "$APPIMAGE" ] && [ -x "$APPIMAGE" ]; then
  exec "$APPIMAGE" --no-sandbox "$@"
elif [ -x "$DIR/release/linux-unpacked/starcrawler" ]; then
  exec "$DIR/release/linux-unpacked/starcrawler" --no-sandbox "$@"
else
  cd "$DIR" || exit 1
  exec npx electron --no-sandbox . "$@"
fi
