<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# StarCrawler

**Ein klassisches Roguelike-RPG im ASCII-Look – Exploration, Atmosphäre und kosmische Mystery in prozedural generierten Raumstationen.**

StarCrawler ist ein Survival-Horror-Roguelike: du erkundest verlassene, prozedural erzeugte Raumstationen, sammelst Waffen und Ausrüstung, hackst Terminale, meidest Strahlung und Vakuum und dringt bis zum Shuttlevel vor. Der Look ist bewusst reduziert: ASCII-Raster, Monospace, Terminal-Events.

| | |
|---|---|
| **Version** | 0.4.0 |
| **Plattformen** | Linux (x64, AppImage), Windows/macOS via Electron-Build, Web (Vite) |
| **Stack** | React 19, TypeScript, Vite 6, Electron 44, Google GenAI (Gemini 2.5 Flash) |
| **Grafik** | Cogmind-Tilesets (v2025.10.22) – Bitmap-Font-Sheets, Raster 32×21 |
| **KI-Feature** | Generierte Logbucheinträge als Lore-Meister (optional, mit API-Key) |

## Features

- **Grafische Kartendarstellung** – die Karte wird als echte Kachelgrafik gerendert (Cogmind-Tilesets), umschaltbar auf das klassische ASCII-Grid (**F3**)
- **Prozedurale Raumstationen** – jeder Sektor wird neu generiert, inkl. Wände, Türen, Terminale, Med-Stationen, Container, Fässer und Artefakte
- **15 Sektoren Tiefe** – je tiefer, desto feindseliger; am Ende wartet das Shuttlevel
- **7 Charakterklassen** – Marine, Techniker, Scout, Scavenger, Cyborg, Sprengmeister und Subject D (jeder mit eigenen Stärken, Schwächen und Startausrüstung)
- **Fog of War** – sichtbare Zellen hell, nur aufgedeckte abgedunkelt, unerreichbare schwarz
- **Wand-Autotiling** – Wandkacheln werden automatisch passend zu den Nachbarn gewählt (Ecken, Kanten, T-Stücke)
- **Minimap, Shop, Level-Auswahl, Wiki, Handbuch und Highscore-Liste**
- **Kampfsystem** – Nahkampf und Fernkampf, Waffenreichweiten, Trefferboni, Kritische Treffer, Panzerung, Statuseffekte
- **Gefahrenzonen** – Strahlung (Hüllenkorrosion) und Vakuum (Sauerstoffvorrat)
- **Inventar, Quick-Slots, Verkaufsshop, Waffenkiste, lootbare Gegner**
- **Moderne Effekte (Canvas-Renderer)** – Partikel, weiche Beleuchtung und glühende Projektile, siehe unten
- **KI-Lore** – optional generiert Gemini 2.5 Flash fragmentierte, verstörende Logbucheinträge (mit statischem Fallback ohne Key)
- **Speichern/Fortsetzen** – lokaler Spielstand, pausiert jederzeit über „Speichern und Beenden"

## Grafik / Tilesets (v0.4.0)

Die Karte wird über **Cogmind-Tilesets** gerendert: Cogmind hat keine klassischen Bild-Tilesets, sondern **Bitmap-Font-Sheets**, die das Spiel selbst „Tileset" nennt (Options → *Tiles* vs. *ASCII*, F3). Genau diese Sheets liegen StarCrawler zugrunde.

| Datei | Inhalt |
|---|---|
| `Tilesets/map/cogmind20x20.png` | Standard-Set (32×21 Raster, 20 px Zellen) |
| `Tilesets/map/cogmind16x16.png` | Standard-Set (16 px Zellen) |
| `Tilesets/map/_default12x12.png` | Kompaktes Set (12 px Zellen) |
| `Tilesets/cp437_16x16.png` | cp437-Bitmap-Font für Spieler, Gegner und Objekte |

Alle Map-Sheets teilen dasselbe 32×21-Layout – die Kachel an Position (col,row) ist in jeder Auflösung dieselbe Grafik. Die Zuordnung unten gilt daher für **alle drei** Größen.

### ASCII-Symbol → Cogmind-Kachel

| ASCII | Bedeutung | Kachel | Farbe (Objekte) |
|---|---|---|---|
| `#` | Wand | (2,18) X-Kreuz-Block | – (bleibt grau) |
| `.` | Boden | (2,17) / (9,17) | – (bleibt grau) |
| `X` | Aufgang/Abgang | (6,17)+(7,17), 2 Zellen breit | orange |
| `†` | Heilstation | (18,12) | rot aktiv / grau deaktiv |
| `¶` | Terminal | (11,16) | grün aktiv / blau deaktiv |
| `o` | Fass | (5,16) | orange aktiv / ocker deaktiv |
| `¤` | Behälter | (8,13) | orange aktiv / ocker deaktiv |
| `©` | Artefakt | (11,11) | gelb |
| `‡` | Beleuchtung | – | gelb (nur ASCII) |
| `‰` | Strom | – | gelb (nur ASCII) |

Die Map-Sheets sind rein graustufen; Cogmind färbt zur Laufzeit **nur Objekte** ein (`result = tint · (luminanz / 255)`). Wände und Boden bleiben unverändert grau.

**Umsetzung:**
- `components/TileCanvas.tsx` – zeichnet Terrain, Fog of War und Entities auf ein Canvas
- `utils/tileset.ts` – Zuordnung Zelltyp → Kachel, Einfärbung, cp437-Glyphen
- **F3** schaltet zwischen Grafik- und ASCII-Darstellung um
- Drei Tileset-Größen umschaltbar (12×12 / 16×16 / 20×20)
- Kamera folgt dem Spieler, im Grafik-Modus mit weicher Nachführung

Die Zuordnung der Kacheln wurde **empirisch** ermittelt: per Multi-Scale-Normalized-Cross-Correlation gegen die Referenzgrafiken, anschließend visuell gegen das echte Cogmind-Rendering und jedes einzelne Map-Sheet geprüft (`utils/tileset.ts`, `Tilesets/README.md`).

Herkunft: Cogmind v2025.10.22 (Beta 16), extrahiert nach `Tilests/` – siehe Projektgedächtnis (`Projekte/cogmind.md`, `Wissen/Game-Assets extrahieren.md`).

## Effekte (v0.3.0)

Das Spiel nutzt eine **zweistufige Canvas-Effekt-Schicht** (`components/FxLayer.tsx`), die additiv über dem ASCII-Grid liegt:

| Effekt | Umsetzung |
|---|---|
| **Partikel** | Funken und fallende Glut mit eigener Physik (Geschwindigkeit, Verzögerung, Gravitation) – explosionsartig, stoßweise, radial |
| **Explosionen** | Expandierender Ring aus Glyphen + Funkenwolke + aufblitzendes Licht, das sich ausdehnt und ausklingt |
| **Glühende Projektile** | Leuchtender Kopf mit weichem Halo, nachziehende Leuchtspur aus 7 Partikeln und Lichtfahne auf der Flugbahn |
| **Mündungsfeuer** | Kurzer, heller Blitz am Abschusspunkt |
| **Weiche Beleuchtung** | Radiale Lichtpools für Lichtquellen, Terminals, Artefakte, Med-Stationen, Turrets, Schilde und den Scheinwerfer des Spielers |
| **Novas** | Gefüllte Scheibe mit Partikelring (EMP, Fackel, Scan, erfolgreicher Hack) |

Die Effekte werden zentral in `utils/effects.ts` erzeugt (`createExplosion`, `createNova`, `createProjectile`, `createImpact`, `createMuzzleFlash`) und über eine eigene `requestAnimationFrame`-Schleife gezeichnet – das 80×35-ASCII-Grid bleibt davon unberührt und läuft mit 60 FPS.


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
├── components/          # GameScreen, TileCanvas, FxLayer, SidePanel, Shop, Wiki, ...
├── hooks/useGameLogic   # Spielschleife, Turns, KI, Kampf, Inventar
├── data/                # Items, Gegner, Initialzustand
├── utils/               # Map-Generator, Sichtbarkeit, Pathfinder, Audio, Saves, effects, tileset
├── services/            # Gemini-Integration (Logbuch-Generator)
├── electron/            # main.cjs / preload.cjs (Desktop-Shell)
├── Tilesets/            # Cogmind-Map-Sheets + cp437-Art-Sheet
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
- **Grafik ↔ ASCII:** `F3` (wie im Cogmind-Original)
- **Zoom:** `+` / `-` (Buttons oben rechts)

## Builds

| Befehl | Ergebnis |
|---|---|
| `npm run build` | Web-Build nach `dist/` |
| `npm run build:electron:dir` | Entpacktes Electron-Verzeichnis |
| `npm run build:electron` | AppImage + entpacktes Verzeichnis (`release/`) |

Details zur Linux-App: [LINUX_APP_README.md](LINUX_APP_README.md)

## Credits

Entwickelt mit Google AI Studio. Danke an die Community für Feedback und Ideen.
