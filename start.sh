#!/bin/bash
# StarCrawler Linux Starter - nutze dev oder preview
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

if [ ! -d "node_modules" ]; then
  echo "[StarCrawler] Installiere Dependencies..."
  npm install
fi

MODE="${1:-dev}"
if [ "$MODE" = "build" ] || [ "$MODE" = "preview" ]; then
  echo "[StarCrawler] Baue Produktion (vite build)..."
  npm run build
  echo "[StarCrawler] Starte Preview auf http://localhost:4173"
  npm run preview -- --host 0.0.0.0 --port 4173
elif [ "$MODE" = "dev" ]; then
  echo "[StarCrawler] Starte Dev-Server auf http://localhost:3000"
  npm run dev -- --host 0.0.0.0 --port 3000
else
  echo "Usage: ./start.sh [dev|preview|build]"
  exit 1
fi
