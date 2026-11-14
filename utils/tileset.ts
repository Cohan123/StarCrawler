import { CellType } from '../types';

/**
 * Tile-Atlas auf Basis der Cogmind-Font-Sheets (v2025.10.22, Beta 16).
 *
 * Cogmind nennt seine Bitmap-Font-Sheets selbst "Tileset" (Options -> Tiles
 * vs. ASCII, F3). Die Map-Sheets enthalten in den Zeilen 0-3 Textglyphen und
 * in den Zeilen 4-20 die Kachelgrafiken der Karte (Waende, Boden, Maschinen).
 *
 * Herkunft: Cogmind v2025.10.22, `cogmind.x` -> `data/fonts/*.png`, extrahiert
 * nach Tilests/ (Projektgedaechtnis: Projekte/cogmind.md, Wissen/Game-Assets
 * extrahieren.md).
 *
 * Raster der Map-Sheets: 32 Spalten x 21 Zeilen, Zellgroesse je Sheet.
 *
 * ## Zuordnung der Kacheln (empirisch verifiziert)
 *
 * Die Zuordnung wurde per Multi-Scale-Normalized-Cross-Correlation gegen die
 * Referenzgrafiken aus `Bilder/Beispiel/_resources/` bestimmt und anschliessend
 * visuell gegen das echte Cogmind-Rendering (`Beispiel_Level_Tiles.jpg`)
 * geprueft. Die Zuordnung wurde anschliessend fuer **jedes** Map-Sheet
 * (12x12, 14x14, 16x16, 18x18, 20x20) einzeln bestaetigt: die Kacheln
 * liegen in allen Sheets an **denselben Positionen** (gleiches 32x21-Layout,
 * nur unterschiedliche Zellgroesse). Deshalb gilt eine einzige
 * Positions-Tabelle fuer alle Aufloesungen.
 *
 * | ASCII | Bedeutung    | Kachel (col,row) | Bemerkung                       |
 * | ----- | ------------ | ---------------- | ------------------------------- |
 * | #     | Wand         | (2,18)           | X-Kreuz-Block                   |
 * | .     | Boden        | (2,17) / (9,17)  | dunkel, 4 Eckpunkte              |
 * | X     | Aufgang      | (6,17)+(7,17)   | 2 Kacheln breite Rampe           |
 * | †     | Heilstation  | (18,12)          |                                 |
 * | ¶     | Terminal     | (11,16)          |                                 |
 * | o     | Fass         | (5,16)           |                                 |
 * | ¤     | Behaelter    | (8,13)           |                                 |
 * | ©     | Artefakt     | (11,11)          |                                 |
 * | ‡     | Beleuchtung  | -                | kein Tile (nur ASCII/Symbol)    |
 * | ‰     | Strom        | -                | kein Tile (nur ASCII/Symbol)    |
 *
 * ## Einfaerben der Kacheln
 *
 * Die Cogmind-Map-Sheets sind rein graustufen (max(R,G,B)-min(R,G,B) = 0).
 * Cogmind faerbt **nur Objekte** zur Laufzeit ein - im Beispiel-Level ist
 * das Artefakt (11,11) magenta, waehrend die Waende dort ungesaettigt
 * (Sättigung ~ 10) und damit grau bleiben. Die Einfaerbung erfolgt daher
 * ueber die Luminanz der Kachel als Modulator:
 *
 *     result = tint * (luminanz / 255)
 *
 * So bleibt die Kachelstruktur erhalten, waehrend die hellen Anteile in der
 * Zielfarbe erscheinen und die dunklen Anteile schwarz bleiben. Eine harte
 * Schwelle wuerde die Struktur dagegen in einen gefuellten Block zerstauen.
 */

export interface TileRef {
  col: number;
  row: number;
}

/** Zellgroessen der mitgelieferden Map-Sheets (Pixel). */
export const TILESET_SIZES = {
  '_default12x12.png': 12,
  'cogmind16x16.png': 16,
  'cogmind20x20.png': 20,
} as const;

export type TilesetName = keyof typeof TILESET_SIZES;

/** Pfade zu den Sheet-Assets (gebunden ueber import.meta.url, damit sie im Build landen). */
const TILESET_URLS: Record<TilesetName, string> = {
  '_default12x12.png': new URL('../Tilesets/map/_default12x12.png', import.meta.url).href,
  'cogmind16x16.png': new URL('../Tilesets/map/cogmind16x16.png', import.meta.url).href,
  'cogmind20x20.png': new URL('../Tilesets/map/cogmind20x20.png', import.meta.url).href,
};

export const tilesetUrl = (name: TilesetName): string => TILESET_URLS[name];

/** cp437-Art-Sheet mit den Bitmap-Glyphen fuer Entities. */
export const ART_SHEET_URL = new URL('../Tilesets/cp437_16x16.png', import.meta.url).href;

export const TILESETS: { name: TilesetName; label: string }[] = [
  { name: 'cogmind20x20.png', label: 'Gross (20x20)' },
  { name: 'cogmind16x16.png', label: 'Standard (16x16)' },
  { name: '_default12x12.png', label: 'Kompakt (12x12)' },
];

/**
 * Zuordnung der Karten-Zelltypen zu Kacheln im Map-Sheet.
 *
 * Cogmind zeichnet Waende als **einzelne Bloecke** (heller Rahmen mit
 * X-Kreuz), nicht als verbundene Linien. Deshalb gibt es hier bewusst KEIN
 * Wand-Autotiling - jede Wandzelle bekommt dieselbe Block-Kachel.
 */
export const TERRAIN_TILES: Record<CellType, TileRef> = {
  // --- Boden ---
  // (2,17) / (9,17): dunkler Boden mit 4 Eckpunkten (ncc 0.945 gegen das
  // echte Level-Rendering). Beide Kacheln sind identisch.
  [CellType.FLOOR]:               { col: 2,  row: 17 },
  [CellType.RADIATION]:           { col: 13, row: 9  },  // Bodenterror (aufgebrochen)
  [CellType.VACUUM]:              { col: 6,  row: 9  },  // Risse
  [CellType.ELECTRICITY]:         { col: 4,  row: 9  },  // Splitter / Schutt

  // --- Waende ---
  // (2,18): heller X-Kreuz-Block - identisch mit dem Beispielbild
  [CellType.WALL]:                { col: 2,  row: 18 },

  // --- Tueren ---
  [CellType.DOOR_CLOSED]:         { col: 11, row: 13 },
  [CellType.DOOR_OPEN]:           { col: 12, row: 13 },

  // --- Terminals / Stationen ---
  [CellType.TERMINAL_OFF]:        { col: 11, row: 16 },  // Konsole (aus)
  [CellType.TERMINAL_ON]:         { col: 11, row: 16 },  // Konsole (aktiv)
  [CellType.HEALING_TERMINAL]:         { col: 18, row: 12 },
  [CellType.HEALING_TERMINAL_USED]:    { col: 18, row: 12 },

  // --- Objekte ---
  [CellType.ENTRANCE]:            { col: 6,  row: 17 },  // Rampe links
  [CellType.EXIT]:                { col: 7,  row: 17 },  // Rampe rechts
  [CellType.LIGHT_SOURCE]:        { col: 6,  row: 11 },  // Lampe
  [CellType.CHEST_CLOSED]:        { col: 8,  row: 13 },  // Truhe (geschlossen)
  [CellType.CHEST_OPEN]:          { col: 6,  row: 14 },  // Truhe (offen)
  [CellType.BARREL]:              { col: 5,  row: 16 },  // Fass
  [CellType.BARREL_OPEN]:         { col: 10, row: 13 },  // Fass (offen)
  [CellType.ARTIFACT]:            { col: 11, row: 11 },  // Artefakt
  [CellType.SHUTTLE]:             { col: 19, row: 15 },  // Shuttlegeraet
};

/**
 * Boden-Varianten: Cogmind streut die Bodenkacheln variabel, damit der Boden
 * nicht wie ein Raster aus identischen Kacheln wirkt. (2,17) und (9,17) sind
 * identische dunkle Bodenkacheln mit 4 Eckpunkten.
 */
export const FLOOR_VARIANTS: TileRef[] = [
  { col: 2, row: 17 },
  { col: 9, row: 17 },
];

/**
 * Einfaerbung der Kacheln (Cogmind faerbt die Map-Kacheln zur Laufzeit ein).
 *
 * Die Cogmind-Map-Sheets sind rein graustufen (max(R,G,B)-min(R,G,B) = 0 im
 * ganzen Sheet). Cogmind faerbt **nur Objekte** ein - im Beispiel-Level ist
 * das Artefakt (11,11) magenta, waehrend die Waende dort ungesaettigt
 * (max(R,G,B)-min(R,G,B) ~ 10) und damit grau bleiben.
 *
 * `null` = Originalfarben (unfaerbt). Werte sind CSS-Farben; die
 * Kachel-Luminanz moduliert die Zielfarbe.
 */
export const TILE_TINTS: Partial<Record<CellType, string>> = {
  [CellType.ENTRANCE]:          '#fb923c',  // orange
  [CellType.EXIT]:              '#fb923c',  // orange
  [CellType.HEALING_TERMINAL]:  '#ef4444',  // rot (aktiv)
  [CellType.HEALING_TERMINAL_USED]: '#9ca3af',  // grau (deaktiv)
  [CellType.TERMINAL_ON]:       '#22c55e',  // gruen (aktiv)
  [CellType.TERMINAL_OFF]:      '#3b82f6',  // blau (deaktiv)
  [CellType.BARREL]:            '#fb923c',  // orange (aktiv)
  [CellType.BARREL_OPEN]:       '#d97706',  // ocker (deaktiv)
  [CellType.CHEST_CLOSED]:      '#fb923c',  // orange (aktiv)
  [CellType.CHEST_OPEN]:        '#d97706',  // ocker (deaktiv)
  [CellType.ARTIFACT]:          '#facc15',  // gelb
  [CellType.LIGHT_SOURCE]:      '#fde047',  // gelb (Beleuchtung)
  [CellType.ELECTRICITY]:       '#fde047',  // gelb (Strom)
  [CellType.RADIATION]:         '#22c55e',
};

/**
 * Zeichen fuer Entities (Spieler, Bosse, Geraete). Sie werden ueber das
 * cp437-Art-Sheet gerendert (16x16-Raster, vollstaendige Code-Page-437).
 */
export const CP437_FALLBACK: Record<string, number> = {
  'Ω': 0xe6,  // Phi
  'Φ': 0xe6,
  '€': 0x9c,  // Euro-Zeichen (CP437 0x9C)
  'Ψ': 0xea,  // Omega
  'Œ': 0xea,
  '‰': 0x89,  // Promille
  '†': 0x86,  // Gekreuz
  '‡': 0x87,  // Doppelkreuz
  '©': 0x3f,  // (c) - Fallback Fragezeichen
  '≈': 0xf1,  // approximately
  '±': 0xf1,
  '¤': 0x24,  // Dollar
};

/** cp437-Index eines Zeichens (oder undefined). */
export const cp437Index = (char: string): number | undefined => {
  if (char.length === 0) return undefined;
  const code = char.charCodeAt(0);
  if (code >= 0x20 && code <= 0x7e) return code;
  const fb = CP437_FALLBACK[char];
  if (fb !== undefined) return fb;
  return undefined;
};

/**
 * Eigene Glyphen fuer Spieler und Bosse - im cp437-Sheet gibt es passende
 * Symbole, die besser funktionieren als die ASCII-Zeichen aus dem Spiel.
 */
export const SPRITE_INDEX = {
  /** Spieler: Kontroll-Gesicht */
  player: 0x01,
  /** Boss: Totenkopf */
  boss: 0x1f,
  /** Gegner-Roboter: Kreisauge */
  robot: 0x09,
  /** Drohne: Pfeil nach oben */
  drone: 0x19,
  /** Terminal/Konsole */
  terminal: 0x0e,
  /** Gegenstand auf dem Boden: Stern */
  item: 0x2a,
  /** Barriere: Gleichheitszeichen */
  barrier: 0x3d,
} as const;
