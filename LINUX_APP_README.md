# StarCrawler - Eigenständige Linux App

Version **0.2.0** – Electron 44.4.3, electron-builder 26.15.3, x64
Getestet auf Linux Mint 22.3 (Ubuntu 24.04 Basis).

## Fertige Builds
- `release/StarCrawler-0.2.0.AppImage` (ca. 209 MB) – portable, Doppelklick oder Terminal
- `release/linux-unpacked/starcrawler` (ca. 219 MB) – entpacktes Verzeichnis, direkt ausführbar
- `dist/` – reiner Web-Build für Browser oder Electron

## Starten

### 1. AppImage (empfohlen, eigenständig)
```bash
chmod +x release/StarCrawler-0.2.0.AppImage
./release/StarCrawler-0.2.0.AppImage --no-sandbox
# oder via Wrapper:
./StarCrawler.sh
```

### 2. Unpacked (für Entwicklung/Debug)
```bash
./release/linux-unpacked/starcrawler --no-sandbox
```

### 3. Desktop-Eintrag installieren
```bash
cp StarCrawler-Native.desktop ~/.local/share/applications/
update-desktop-database ~/.local/share/applications/
# dann im Startmenü "StarCrawler" suchen
```

### 4. Dev-Modus (Hot-Reload mit Vite)
```bash
npm run electron:dev   # startet Vite auf 3000 + Electron mit URL
# einzeln:
npm run dev            # nur Vite http://localhost:3000
npm run electron       # nur Electron (lädt dist/index.html)
```

## Entwickler-Kommandos
```bash
npm run build                  # nur Vite build -> dist/
npm run build:electron:dir     # + unpacked (ohne Installer)
npm run build:electron         # + AppImage + dir
./start.sh dev                 # Web-Server-Script
./start.sh preview             # Web Preview auf 4173
```

## Tastenkürzel in der App
- `F12` – DevTools
- `Ctrl+R` – Neuladen
- `M` – Minimap, `E` – Interaktion, `F` – Schießen, `1`/`2` – Quick-Slots, `N` – neuer Lauf

## Technische Änderungen gegenüber 0.1.7
- `vite.config.ts` – `base: './'` für `file://`-Protokoll
- `electron/main.cjs` + `electron/preload.cjs` (CommonJS, da `"type": "module"`)
- `package.json` – `main`, `build`-Block für electron-builder, `author`/`description` für .deb
- `.gitignore` – `release/` und `out/` ergänzt
- `StarCrawler.sh` – Starter mit Fallback-Kette (AppImage → unpacked → npx electron)
- `StarCrawler-Native.desktop` – Menüeintrag für die Desktop-Umgebung
