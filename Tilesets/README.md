# Tilesets

Grafik-Sheets aus **Cogmind** (Bay 12 Games, v2025.10.22, Beta 16).

Cogmind hat keine klassischen Bild-Tilesets, sondern **Bitmap-Font-Sheets**, die
das Spiel selbst als „Tileset" bezeichnet (Options-Menü: *Tiles* vs. *ASCII*,
umschalten mit **F3**). Genau diese Sheets bilden die Grundlage der grafischen
Kartendarstellung in StarCrawler.

## Herkunft

| Quelle | Pfad |
| --- | --- |
| Map-Sheets | `Cogmind.v2025.10.22/cogmind.x` (ZIP, via PHYSFS) → `data/fonts/*.png` |
| Art-Sheet | `Cogmind.v2025.10.22/Tilests/sheets/art/cp437_16x16.png` |

`cogmind.x` ist ein ZIP-Archiv, das das Spiel über PHYSFS einbindet. Die Sheets
wurden bit-identisch kopiert (SHA-256 geprüft) und nach
`~/Dokumente/Decompiling_Games/Cogmind.v2025.10.22/Tilests/` einsortiert.

Details im Projektgedächtnis: `Projekte/cogmind.md` (Abschnitt *Tilesets*) und
`Wissen/Game-Assets extrahieren.md`.

## Dateien

| Datei | Raster | Zellgröße | Verwendung |
| --- | --- | --- | --- |
| `map/cogmind16x16.png` | 32 × 21 | 16 px | Standard-Tileset (Terrain) |
| `map/cogmind20x20.png` | 32 × 21 | 20 px | Großes Tileset |
| `map/_default12x12.png` | 32 × 21 | 12 px | Kompaktes Tileset |
| `cp437_16x16.png` | 16 × 16 | 16 px | cp437-Bitmap-Font für Spieler, Gegner, Objekte |

## Aufbau der Map-Sheets

| Zeile | Inhalt |
| --- | --- |
| 0–3 | Textglyphen (Sonderzeichen, Ziffern, A–Z, a–z) |
| 4–8 | Wandkanten, Ecken, Linien |
| 9–10 | Boden: glatter Boden, Risse, Schutt, Bodenterror |
| 11–17 | Wände, Türen, Maschinen, Leitungen, Leitern, Gebäudeteile |
| 18–20 | Paneele, Kisten, Marker, Rand-/Anschnittkacheln |

Das cp437-Sheet ist rein schwarz/weiß (kein Alpha-Kanal). Die Einfärbung der
Entities erfolgt deshalb über eine Luminanz-Maske in `components/TileCanvas.tsx`.

## Verwendung im Code

- `utils/tileset.ts` – Zuordnung Zelltyp → Kachel, Wand-Autotiling, cp437-Glyphen
- `components/TileCanvas.tsx` – Canvas-Renderer für Terrain, Fog of War und Entities
- `components/GameScreen.tsx` – Umschalter zwischen Grafik und ASCII (**F3**)

Die Zuordnung der Kacheln wurde empirisch ermittelt: für jede Kachel wurden die
hellen Randlinien gemessen und daraus die Wandmaske bestimmt.

---

Grafik von Cogmind (Bay 12 Games), extrahiert für StarCrawler.
