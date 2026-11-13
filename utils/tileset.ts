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
 * Zeilen 4-8   = Wandkanten/Ecken/Linien
 * Zeilen 9-10  = Boden (glatt, Risse, Schutt, Randstuecke)
 * Zeilen 11-17 = Waende, Tueren, Maschinen, Leitungen, Leitern, Gebaeude
 * Zeilen 18-20 = Paneele, Kisten, Marker, Rand-/Anschnittkacheln
 */
export const TERRAIN_TILES: Record<CellType, TileRef> = {
  // --- Boden ---
  [CellType.FLOOR]:               { col: 0,  row: 9  },  // glatter Boden
  [CellType.RADIATION]:           { col: 13, row: 9  },  // Bodenterror
  [CellType.VACUUM]:              { col: 1,  row: 9  },  // Risse
  [CellType.ELECTRICITY]:         { col: 4,  row: 9  },  // Splitter

  // --- Waende (Basis-Kachel; Kanten kommen per Autotiling dazu) ---
  [CellType.WALL]:                { col: 7,  row: 17 },

  // --- Tueren ---
  [CellType.DOOR_CLOSED]:         { col: 11, row: 13 },  // Tuer (geschlossen)
  [CellType.DOOR_OPEN]:           { col: 12, row: 13 },  // Tuer (offen)

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
 * Wand-Autotiling: Die Kachel wird nach den vier Nachbarn (N/O/S/W)
 * gewaehlt. Die Kacheln liegen in den Zeilen 4-7 des Map-Sheets.
 *
 * Bitmaske: 1 = Norden, 2 = Osten, 4 = Sueden, 8 = Westen. Das Bit ist
 * gesetzt, wenn an dieser Seite KEINE Wandkante liegt (also der Nachbar
 * keine Wand ist) - dann zeichnet die Kachel hier eine Kante.
 *
 * Die Zuordnung wurde empirisch aus dem Sheet ermittelt: fuer jede Kachel
 * wurden die hellen Randlinien gemessen und so die Maske bestimmt.
 */
export const WALL_EDGE_TILES: Record<number, TileRef> = {
  0:  { col: 11, row: 4 },  // geschlossen (keine Kante)
  3:  { col: 7,  row: 4 },  // Kante oben + rechts
  5:  { col: 0,  row: 4 },  // Kante oben + unten
  6:  { col: 8,  row: 4 },  // Kante rechts + unten
  7:  { col: 5,  row: 4 },  // Ecke oben links
  9:  { col: 10, row: 4 },  // Ecke oben rechts
  10: { col: 1,  row: 4 },  // Kante links + rechts
  11: { col: 4,  row: 4 },  // Ecke oben links
  12: { col: 9,  row: 4 },  // Kante unten + links
  13: { col: 3,  row: 4 },  // Ecke unten links
  14: { col: 6,  row: 4 },  // Ecke unten rechts
  15: { col: 2,  row: 4 },  // T-Stuecke (alle Seiten)
  // Einzelkanten aus den Zeilen 11-13:
  2:  { col: 8,  row: 11 },  // nur rechts
  4:  { col: 13, row: 11 },  // nur unten
  8:  { col: 1,  row: 11 },  // nur links
  // Maske 1 (nur oben) existiert im Sheet nicht -> naechstliegende Variante
  1:  { col: 8,  row: 11 },
};

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
  /** Spieler: Kontroll-Gesicht (cp437 0x01) */
  player: 0x01,
  /** Boss: Totenkopf-Zeichen */
  boss: 0x1f,
  /** Gegner-Roboter: Kreisauge */
  robot: 0x09,
  /** Drohne: Pfeil nach oben */
  drone: 0x18,
  /** Terminal/Konsole */
  terminal: 0x0e,
  /** Gegenstand auf dem Boden: Stern */
  item: 0x2a,
  /** Barriere:equals */
  barrier: 0x3d,
} as const;
