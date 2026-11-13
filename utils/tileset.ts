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
 * Die Zuordnung der Kacheln wurde **empirisch** am Beispielbild
 * (`Bilder/Beispiel/Beispiel_Level_Tiles.jpg`) ermittelt: fuer jede Kachel
 * wurden die hellen Randlinien gemessen bzw. das Muster mit dem Beispiel
 * verglichen (siehe `Wissen/Game-Assets extrahieren`, Schritt 7).
 */

export interface TileRef {
  col: number;
  row: number;
}

/** Zellgroessen der mitgelieferten Map-Sheets (Pixel). */
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
  { name: '_default12x12.png', label: 'Kompakt (12x12)' },
  { name: 'cogmind16x16.png', label: 'Standard (16x16)' },
  { name: 'cogmind20x20.png', label: 'Gross (20x20)' },
];

/**
 * Zuordnung der Karten-Zelltypen zu Kacheln im Map-Sheet.
 *
 * Cogmind zeichnet Waende als **einzelne Bloecke** (heller Rahmen, heller
 * Kern), nicht als verbundene Linien. Deshalb gibt es hier bewusst KEIN
 * Wand-Autotiling - jede Wandzelle bekommt dieselbe Block-Kachel.
 *
 * Zeilen 9-10  = Boden (glatt, Risse, Schutt, Randstuecke)
 * Zeilen 11-17 = Waende, Tueren, Maschinen, Leitungen, Leitern, Gebaeude
 * Zeilen 18-20 = Paneele, Kisten, Marker, Rand-/Anschnittkacheln
 */
export const TERRAIN_TILES: Record<CellType, TileRef> = {
  // --- Boden ---
  // (1,9) / (2,9): dunkler Boden mit feinem Punktraster (aus dem Beispielbild)
  [CellType.FLOOR]:               { col: 1,  row: 9  },
  [CellType.RADIATION]:           { col: 13, row: 9  },  // Bodenterror (aufgebrochen)
  [CellType.VACUUM]:              { col: 6,  row: 9  },  // Risse
  [CellType.ELECTRICITY]:         { col: 4,  row: 9  },  // Splitter / Schutt

  // --- Waende ---
  // (3,18): heller Rahmen + heller Kern - identisch mit dem Beispielbild
  [CellType.WALL]:                { col: 3,  row: 18 },

  // --- Tueren ---
  [CellType.DOOR_CLOSED]:         { col: 11, row: 13 },
  [CellType.DOOR_OPEN]:           { col: 12, row: 13 },

  // --- Terminals / Stationen ---
  [CellType.TERMINAL_OFF]:        { col: 1,  row: 11 },  // Konsole (aus)
  [CellType.TERMINAL_ON]:         { col: 0,  row: 13 },  // Konsole (aktiv)
  [CellType.HEALING_TERMINAL]:         { col: 9,  row: 13 },
  [CellType.HEALING_TERMINAL_USED]:    { col: 9,  row: 13 },

  // --- Objekte ---
  [CellType.ENTRANCE]:            { col: 15, row: 19 },
  [CellType.EXIT]:                { col: 14, row: 19 },
  [CellType.LIGHT_SOURCE]:        { col: 6,  row: 11 },  // Lampe
  [CellType.CHEST_CLOSED]:        { col: 3,  row: 19 },  // Truhe (geschlossen)
  [CellType.CHEST_OPEN]:          { col: 2,  row: 19 },  // Truhe (offen)
  [CellType.BARREL]:              { col: 2,  row: 19 },  // Fass
  [CellType.BARREL_OPEN]:         { col: 3,  row: 19 },
  [CellType.ARTIFACT]:            { col: 4,  row: 18 },  // Artefakt-Paneel
  [CellType.SHUTTLE]:             { col: 19, row: 15 },  // Shuttlegeraet
};

/**
 * Boden-Varianten: Cogmind streut die Bodenkacheln variabel, damit der Boden
 * nicht wie ein Raster aus identischen Kacheln wirkt. Die dunkelsten
 * Kacheln (Mittel 13-25, max 115) entsprechen dem Beispielboden (dunkle
 * Raster mit feinen Punkten). Schutt-Level steigen nach rechts in Zeile 9.
 */
export const FLOOR_VARIANTS: TileRef[] = [
  { col: 30, row: 9 },
  { col: 31, row: 9 },
  { col: 30, row: 9 },
  { col: 31, row: 9 },
];

/**
 * Zeichen fuer Entities (Spieler, Gegner, Geraete). Sie werden ueber das
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
