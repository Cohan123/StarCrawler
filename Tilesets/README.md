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

Alle Map-Sheets teilen **dasselbe 32×21-Layout** — die Kachel an Position
(col,row) ist in jeder Auflösung dieselbe Grafik. Die Zuordnung unten gilt
daher für 12×12, 14×14, 16×16, 18×18 **und** 20×20.

## Kachel-Zuordnung (ASCII → Cogmind-Kachel)

Die Zuordnung wurde per Multi-Scale-Normalized-Cross-Correlation gegen die
Referenzgrafiken in `Bilder/Beispiel/_resources/` bestimmt und anschließend
visuell gegen das echte Cogmind-Rendering (`Beispiel_Level_Tiles.jpg`) sowie
gegen jedes einzelne Map-Sheet geprüft.

| ASCII | Bedeutung | Kachel | Farbe (Objekte) |
| --- | --- | --- | --- |
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

### Einfärben

Die Map-Sheets sind **rein graustufen** (max(R,G,B)−min(R,G,B) = 0 im ganzen
Sheet). Cogmind färbt zur Laufzeit **nur Objekte** ein – im Beispiel-Level ist
das Artefakt (11,11) magenta, während die Wände dort ungesättigt (Sättigung
≈ 10) und damit grau bleiben.

Die Formel lautet `result = tint · (luminanz / 255)`: die Luminanz moduliert
die Zielfarbe, sodass die Kachelstruktur erhalten bleibt. Eine harte Schwelle
würde die Struktur (X-Kreuz der Wand) in einen gefüllten Block zerstauen.

Das cp437-Sheet ist rein schwarz/weiß (kein Alpha-Kanal). Die Einfärbung der
Entities erfolgt deshalb über eine Luminanz-Maske in `components/TileCanvas.tsx`.

## Verwendung im Code

- `utils/tileset.ts` – Zuordnung Zelltyp → Kachel, Einfärbung, cp437-Glyphen
- `components/TileCanvas.tsx` – Canvas-Renderer für Terrain, Fog of War und Entities
- `components/GameScreen.tsx` – Umschalter zwischen Grafik und ASCII (**F3**)

---

Grafik von Cogmind (Bay 12 Games), extrahiert für StarCrawler.
