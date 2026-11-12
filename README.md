<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# StarCrawler

**Ein klassisches Roguelike-RPG im ASCII-Look – Exploration, Atmosphäre und kosmische Mystery in prozedural generierten Raumstationen.**

StarCrawler ist ein Survival-Horror-Roguelike: du erkundest verlassene, prozedural erzeugte Raumstationen, sammelst Waffen und Ausrüstung, hackst Terminale, meidest Strahlung und Vakuum und dringt bis zum Shuttlevel vor. Der Look ist bewusst reduziert: ASCII-Raster, Monospace, Terminal-Events.

| | |
|---|---|
| **Version** | 0.2.0 |
| **Plattformen** | Linux (x64, AppImage), Windows/macOS via Electron-Build, Web (Vite) |
| **Stack** | React 19, TypeScript, Vite 6, Electron 44, Google GenAI (Gemini 2.5 Flash) |
| **KI-Feature** | Generierte Logbucheinträge als Lore-Meister (optional, mit API-Key) |

## Features

- **Prozedurale Raumstationen** – jeder Sektor wird neu generiert, inkl. Wände, Türen, Terminale, Med-Stationen, Container, Fässer und Artefakte
- **15 Sektoren Tiefe** – je tiefer, desto feindseliger; am Ende wartet das Shuttlevel
- **7 Charakterklassen** – Marine, Techniker, Scout, Scavenger, Cyborg, Sprengmeister und Subject D (jeder mit eigenen Stärken, Schwächen und Startausrüstung)
- **Ascii-UI mit ASCII-Rendering**, Fog of War, Minimap, Shop, Level-Auswahl, Wiki, Handbuch und Highscore-Liste
- **Kampfsystem** – Nahkampf und Fernkampf, Waffenreichweiten, Trefferboni, Kritische Treffer, Panzerung, Statuseffekte
- **Gefahrenzonen** – Strahlung (Hüllenkorrosion) und Vakuum (Sauerstoffvorrat)
- **Inventar, Quick-Slots, Verkaufsshop, Waffenkiste, lootbare Gegner**
- **KI-Lore** – optional generiert Gemini 2.5 Flash fragmentierte, verstörende Logbucheinträge (mit statischem Fallback ohne Key)
- **Speichern/Fortsetzen** – lokaler Spielstand, pausiert jederzeit über „Speichern und Beenden"

## Installation

### Linux – AppImage (empfohlen, eigenständig)

```bash
chmod +x StarCrawler-0.2.0.AppImage
./StarCrawler-0.2.0.AppImage --no-sandbox
```

Desktop-Eintrag installieren:

```bash
cp StarCrawler-Native.desktop ~/.local/share/applications/
update-desktop-database ~/.local/share/applications/
```

### Web / Entwicklung

**Voraussetzungen:** Node.js 18+

```bash
npm install
# Optional: GEMINI_API_KEY für KI-Logbucheinträge
echo "GEMINI_API_KEY=dein-key" > .env.local
npm run dev            # http://localhost:3000
```

Ohne API-Key läuft das Spiel vollständig – Lore-Einträge fallen dann auf statische Texte zurück.

### Electron (Desktop-Entwicklung)

```bash
npm run electron:dev       # Vite (3000) + Electron mit Hot-Reload
npm run electron           # Electron gegen dist/
npm run build:electron     # AppImage + entpacktes Verzeichnis bauen
```

## Projektstruktur

```text
├── App.tsx              # Haupt-UI, Menü/Spiel-Views, Musik-Logik
├── components/          # GameScreen, SidePanel, MessageLog, Shop, Wiki, ...
├── hooks/useGameLogic   # Spielschleife, Turns, KI, Kampf, Inventar
├── data/                # Items, Gegner, Initialzustand
├── utils/               # Map-Generator, Sichtbarkeit, Pathfinder, Audio, Saves
├── services/            # Gemini-Integration (Logbuch-Generator)
├── electron/            # main.cjs / preload.cjs (Desktop-Shell)
├── Musik/ Bilder/       # Soundtracks, Sprites, Item-Bilder
└── vite.config.ts       # Build-Config (base './' für file://)
```

## Steuerung

- **Bewegen:** WASD, Pfeiltasten, Klick auf Karte (Auto-Walk)
- **Interagieren:** `E` (Terminal, Container, Med-Station, Fässer)
- **Schießen:** `F` auf nächsten sichtbaren Gegner
- **Schnellplätze:** `1` / `2`
- **Minimap:** `M`
- **Neuer Lauf:** `N`

## Builds

| Befehl | Ergebnis |
|---|---|
| `npm run build` | Web-Build nach `dist/` |
| `npm run build:electron:dir` | Entpacktes Electron-Verzeichnis |
| `npm run build:electron` | AppImage + entpacktes Verzeichnis (`release/`) |

Details zur Linux-App: [LINUX_APP_README.md](LINUX_APP_README.md)

## Credits

Entwickelt mit Google AI Studio. Danke an die Community für Feedback und Ideen.
