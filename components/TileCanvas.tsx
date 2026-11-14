import React, { useEffect, useMemo, useRef } from 'react';
import { CellType, DeployedDevice, Enemy, GroundItem, Position } from '../types';
import { MAP_HEIGHT, MAP_WIDTH } from '../utils/gameConfig';
import { cp437Index, SPRITE_INDEX, TERRAIN_TILES, FLOOR_VARIANTS, TILE_TINTS, TILESET_SIZES, tilesetUrl, ART_SHEET_URL, TilesetName } from '../utils/tileset';

/**
 * Grafischer Karten-Renderer auf Basis der Cogmind-Tilesets.
 *
 * Zeichnet die Karte als echte Kachelgrafik (statt ASCII-Zeichen) auf ein
 * Canvas. Fog of War wird ueber Helligkeit gesteuert: sichtbare Zellen voll,
 * nur aufgedeckte Zellen abgedunkelt, unerreichbare schwarz.
 *
 * Nebenschicht: Das cp437-Art-Sheet liefert Bitmap-Glyphen fuer Spieler,
 * Gegner, Gegenstaende und Geraete.
 */

interface TileCanvasProps {
  map: CellType[][];
  playerPos: Position;
  visibleCells: Set<string>;
  revealedCells: Set<string>;
  enemies: Enemy[];
  groundItems: GroundItem[];
  discharges: { position: Position }[];
  deployedDevices: DeployedDevice[];
  playerHurt: boolean;
  tileset: TilesetName;
  onTileClick: (x: number, y: number) => void;
  onTileHover: (x: number, y: number) => void;
  /** Referenz auf das Canvas-Element (fuer die Effekt-Ebene darueber). */
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  /** Referenz auf den umschliessenden Container (fuer die Effekt-Ebene). */
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

/** Hex-Farbe mit Alphawert als rgba()-String. */
const hexToRgba = (hex: string, alpha: number): string => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/** Hex-Farbe als RGB-Tupel (0-255). */
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
};

/** Sichtbarkeit einer Zelle: 0 = unbekannt, 1 = aufgedeckt, 2 = sichtbar. */
const visibilityOf = (
  visibleCells: Set<string>,
  revealedCells: Set<string>,
  x: number,
  y: number
): number => {
  const coord = `${x},${y}`;
  if (visibleCells.has(coord)) return 2;
  if (revealedCells.has(coord)) return 1;
  return 0;
};

const TileCanvas: React.FC<TileCanvasProps> = ({
  map,
  playerPos,
  visibleCells,
  revealedCells,
  enemies,
  groundItems,
  discharges,
  deployedDevices,
  playerHurt,
  tileset,
  onTileClick,
  onTileHover,
  canvasRef: externalCanvasRef,
  containerRef: externalContainerRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas-Element nach aussen durchreichen
  useEffect(() => {
    if (externalCanvasRef) {
      externalCanvasRef.current = canvasRef.current;
    }
    if (externalContainerRef) {
      externalContainerRef.current = containerRef.current;
    }
  }, [externalCanvasRef, externalContainerRef]);

  const cellSize = TILESET_SIZES[tileset];
  const mapUrl = tilesetUrl(tileset);
  const artUrl = ART_SHEET_URL;

  const imagesRef = useRef<{ map: HTMLImageElement | null; art: HTMLImageElement | null }>({
    map: null,
    art: null,
  });

  // Masken der cp437-Glyphen (nur helle Pixel), einmalig beim Laden berechnet
  const glyphMaskRef = useRef<Map<number, ImageData>>(new Map());

  // Eingefaerbte Kacheln: Cogmind faerbt die Map-Kacheln zur Laufzeit ein
  // (das Sheet ist rein grau, im Spiel erscheinen z.B. Artefakte magenta).
  // Cache-Key: Tilesetname + Kachelposition + Zielfarbe.
  const tintedTileCache = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const buildGlyphMasks = (img: HTMLImageElement) => {
    const masks = new Map<number, ImageData>();
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return masks;

    const full = document.createElement('canvas');
    full.width = img.width;
    full.height = img.height;
    const fctx = full.getContext('2d');
    if (!fctx) return masks;
    fctx.drawImage(img, 0, 0);
    const data = fctx.getImageData(0, 0, img.width, img.height).data;

    for (let idx = 0; idx < 256; idx++) {
      const gx = (idx % 16) * size;
      const gy = Math.floor(idx / 16) * size;
      const out = ctx.createImageData(size, size);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const si = ((gy + y) * img.width + (gx + x)) * 4;
          const di = (y * size + x) * 4;
          const lum = data[si];
          // Harte Schwelle: helle Pixel = Glyph, dunkle = transparent
          const on = lum > 110 ? 255 : 0;
          out.data[di] = 255;
          out.data[di + 1] = 255;
          out.data[di + 2] = 255;
          out.data[di + 3] = on;
        }
      }
      masks.set(idx, out);
    }
    return masks;
  };

  // Bilder laden
  useEffect(() => {
    let cancelled = false;

    const load = (url: string, key: 'map' | 'art') =>
      new Promise<void>(resolve => {
        const img = new Image();
        img.onload = () => {
          if (cancelled) { resolve(); return; }
          imagesRef.current[key] = img;
          if (key === 'art') {
            glyphMaskRef.current = buildGlyphMasks(img);
          }
          resolve();
        };
        img.onerror = () => {
          if (!cancelled) imagesRef.current[key] = null;
          resolve();
        };
        img.src = url;
      });

    Promise.all([load(mapUrl, 'map'), load(artUrl, 'art')]).then(() => {
      if (!cancelled) drawRef.current();
    });

    return () => {
      cancelled = true;
    };
  }, [mapUrl, artUrl]);

  // Zeichnen
  const drawRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = MAP_WIDTH * cellSize;
    const height = MAP_HEIGHT * cellSize;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      const mapImg = imagesRef.current.map;
      const artImg = imagesRef.current.art;

      // --- Terrain ---
      if (mapImg) {
        /**
         * Zeichnet eine Map-Kachel optional eingefaerbt.
         *
         * Cogmind faerbt nur **Objekte** ein (Waende/Boden bleiben grau). Die
         * Luminanz der Kachel MODULIERT dabei die Zielfarbe:
         *
         *     result = tint * (luminanz / 255)
         *
         * So bleibt die Kachelstruktur erhalten (z.B. der X-Kreuz der Wand),
         * waehrend die hellen Anteile in der Zielfarbe erscheinen und die
         * dunklen Anteile schwarz bleiben. Eine harte Schwelle wuerde die
         * Struktur dagegen in einen gefuellten Block zerstauen.
         *
         * Das Ergebnis wird gecacht (pro Kachelposition + Farbe eine Variante).
         */
        const drawTile = (
          tile: { col: number; row: number },
          dx: number,
          dy: number,
          tint: string | undefined
        ) => {
          const sx = tile.col * cellSize;
          const sy = tile.row * cellSize;

          if (!tint) {
            ctx.drawImage(mapImg, sx, sy, cellSize, cellSize, dx, dy, cellSize, cellSize);
            return;
          }

          const key = `${tileset}|${tile.col},${tile.row}|${tint}|${cellSize}`;
          let colored = tintedTileCache.current.get(key);
          if (!colored) {
            colored = document.createElement('canvas');
            colored.width = cellSize;
            colored.height = cellSize;
            const cctx = colored.getContext('2d');
            if (cctx) {
              cctx.drawImage(mapImg, sx, sy, cellSize, cellSize, 0, 0, cellSize, cellSize);
              const data = cctx.getImageData(0, 0, cellSize, cellSize);
              const px = data.data;
              const rgb = hexToRgb(tint);
              for (let i = 0; i < px.length; i += 4) {
                const lum = px[i];
                if (lum <= 16) {
                  px[i + 3] = 0;
                  continue;
                }
                const f = lum / 255;
                px[i] = Math.round(rgb.r * f);
                px[i + 1] = Math.round(rgb.g * f);
                px[i + 2] = Math.round(rgb.b * f);
                px[i + 3] = 255;
              }
              cctx.putImageData(data, 0, 0);
            }
            tintedTileCache.current.set(key, colored);
          }
          ctx.drawImage(colored, dx, dy, cellSize, cellSize);
        };

        for (let y = 0; y < map.length; y++) {
          const row = map[y];
          if (!row) continue;
          for (let x = 0; x < row.length; x++) {
            const vis = visibilityOf(visibleCells, revealedCells, x, y);
            if (vis === 0) continue;

            const ref = TERRAIN_TILES[row[x]];
            if (!ref) continue;

            // Cogmind streut die Bodenkacheln variabel, damit der Boden nicht
            // wie ein Raster aus identischen Kacheln wirkt. Die Variante wird
            // deterministisch aus der Position gewaehlt (kein Zufall -> beim
            // Scrollen keine flackernden Kacheln).
            let tile = ref;
            if (row[x] === CellType.FLOOR) {
              tile = FLOOR_VARIANTS[(x * 7 + y * 13) % FLOOR_VARIANTS.length];
            }

            ctx.globalAlpha = vis === 2 ? 1 : 0.32;
            drawTile(tile, x * cellSize, y * cellSize, TILE_TINTS[row[x]]);
          }
        }

        /**
         * Breite Kacheln (Aufgang/Abgang).
         *
         * Die Aufgang-Grafik ist im Cogmind-Sheet ein Sprite ueber **zwei**
         * Zellen breit: (6,17) = Rampe, (7,17) = Schacht. Sie wird deshalb in
         * einem zweiten Pass ueber das Terrain gezeichnet und ueberdeckt dabei
         * die Nachbarzelle - genau wie im Originalspiel.
         */
        for (let y = 0; y < map.length; y++) {
          const row = map[y];
          if (!row) continue;
          for (let x = 0; x < row.length; x++) {
            const cell = row[x];
            if (cell !== CellType.ENTRANCE && cell !== CellType.EXIT) continue;

            const vis = visibilityOf(visibleCells, revealedCells, x, y);
            if (vis === 0) continue;

            const tint = TILE_TINTS[cell];
            const key = `${tileset}|ramp|${tint}|${cellSize}`;
            let sprite = tintedTileCache.current.get(key);
            if (!sprite) {
              const w = cellSize * 2;
              sprite = document.createElement('canvas');
              sprite.width = w;
              sprite.height = cellSize;
              const sctx = sprite.getContext('2d');
              if (sctx) {
                sctx.drawImage(mapImg, 6 * cellSize, 17 * cellSize, cellSize, cellSize, 0, 0, cellSize, cellSize);
                sctx.drawImage(mapImg, 7 * cellSize, 17 * cellSize, cellSize, cellSize, cellSize, 0, cellSize, cellSize);
                if (tint) {
                  const data = sctx.getImageData(0, 0, w, cellSize);
                  const px = data.data;
                  const rgb = hexToRgb(tint);
                  for (let i = 0; i < px.length; i += 4) {
                    const lum = px[i];
                    if (lum <= 16) {
                      px[i + 3] = 0;
                      continue;
                    }
                    const f = lum / 255;
                    px[i] = Math.round(rgb.r * f);
                    px[i + 1] = Math.round(rgb.g * f);
                    px[i + 2] = Math.round(rgb.b * f);
                    px[i + 3] = 255;
                  }
                  sctx.putImageData(data, 0, 0);
                }
              }
              tintedTileCache.current.set(key, sprite);
            }

            ctx.globalAlpha = vis === 2 ? 1 : 0.32;
            ctx.drawImage(sprite, x * cellSize, y * cellSize, cellSize * 2, cellSize);
          }
        }
      } else {
        // Fallback: ASCII-Zeichen, falls das Sheet nicht geladen werden konnte
        ctx.fillStyle = '#a3a3a3';
        ctx.font = `${Math.round(cellSize * 0.7)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let y = 0; y < map.length; y++) {
          const row = map[y];
          if (!row) continue;
          for (let x = 0; x < row.length; x++) {
            const vis = visibilityOf(visibleCells, revealedCells, x, y);
            if (vis === 0) continue;
            ctx.globalAlpha = vis === 2 ? 1 : 0.3;
            ctx.fillText('#', (x + 0.5) * cellSize, (y + 0.5) * cellSize);
          }
        }
      }

      ctx.globalAlpha = 1;

      // --- Entities (cp437-Bitmap-Glyphen) ---
      const drawGlow = (x: number, y: number, radius: number, color: string, alpha: number) => {
        if (alpha <= 0.005) return;
        const cx = (x + 0.5) * cellSize;
        const cy = (y + 0.5) * cellSize;
        const r = radius * cellSize;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, hexToRgba(color, alpha));
        grad.addColorStop(0.45, hexToRgba(color, alpha * 0.35));
        grad.addColorStop(1, hexToRgba(color, 0));
        ctx.save();
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      const drawGlyph = (
        char: string | number,
        x: number,
        y: number,
        color: string,
        glow = false
      ) => {
        if (!artImg) return;
        const idx = typeof char === 'number' ? char : cp437Index(char);
        if (idx === undefined) return;
        const cols = 16;
        const gx = (idx % cols) * 16;
        const gy = Math.floor(idx / cols) * 16;

        if (glow) {
          ctx.save();
          ctx.shadowColor = color;
          ctx.shadowBlur = cellSize * 0.8;
          ctx.drawImage(artImg, gx, gy, 16, 16, x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.restore();
        }

        // Das cp437-Sheet ist rein schwarz/weiss (kein Alpha). Fuer die
        // Entity-Farbe wird deshalb die Luminanz als Maske benutzt: nur die
        // hellen Pixel des Glyphs werden in der Zielfarbe uebernommen.
        // Die Maske wird aus den Rohdaten berechnet (deterministisch, ohne
        // Canvas-Composite-Modi, die je nach Browser abweichen).
        const mask = glyphMaskRef.current.get(idx);
        if (!mask) return;

        const tmp = tmpCanvasRef.current;
        const tctx = tmp.getContext('2d')!;
        tctx.globalCompositeOperation = 'source-over';
        tctx.clearRect(0, 0, cellSize, cellSize);

        // Maske als Bild zeichnen, dann mit 'source-in' die Farbe drauflegen
        const maskCanvas = maskCanvasRef.current;
        const mctx = maskCanvas.getContext('2d')!;
        mctx.clearRect(0, 0, cellSize, cellSize);
        mctx.putImageData(mask, 0, 0);
        tctx.drawImage(maskCanvas, 0, 0);
        tctx.globalCompositeOperation = 'source-in';
        tctx.fillStyle = color;
        tctx.fillRect(0, 0, cellSize, cellSize);
        tctx.globalCompositeOperation = 'source-over';

        ctx.drawImage(tmp, 0, 0, cellSize, cellSize, x * cellSize, y * cellSize, cellSize, cellSize);
      };

      // Geraete
      deployedDevices.forEach(d => {
        const vis = visibilityOf(visibleCells, revealedCells, d.position.x, d.position.y);
        if (vis === 0) return;
        ctx.globalAlpha = vis === 2 ? 1 : 0.35;
        drawGlyph(d.type === 'TURRET' ? SPRITE_INDEX.drone : SPRITE_INDEX.barrier,
          d.position.x, d.position.y,
          d.type === 'TURRET' ? '#fbbf24' : '#60a5fa', true);
      });

      // Liegende Gegenstaende
      groundItems.forEach(item => {
        const vis = visibilityOf(visibleCells, revealedCells, item.position.x, item.position.y);
        if (vis === 0) return;
        ctx.globalAlpha = vis === 2 ? 1 : 0.35;
        drawGlyph(SPRITE_INDEX.item, item.position.x, item.position.y, '#c084fc', true);
      });

      // Entladungen
      discharges.forEach(d => {
        const vis = visibilityOf(visibleCells, revealedCells, d.position.x, d.position.y);
        if (vis === 0) return;
        ctx.globalAlpha = vis === 2 ? 1 : 0.35;
        drawGlyph(0x89, d.position.x, d.position.y, '#fde047', true);
      });

      // Gegner
      enemies.forEach(e => {
        const vis = visibilityOf(visibleCells, revealedCells, e.position.x, e.position.y);
        if (vis === 0) return;
        ctx.globalAlpha = vis === 2 ? 1 : 0.3;
        const color = e.justHit
          ? '#ffffff'
          : e.isBoss
            ? '#e879f9'
            : e.isHostile
              ? '#f87171'
              : '#a3a3a3';
        // Bosse bekommen den Totenkopf, normale Gegner ihr eigenes Zeichen
        const sprite = e.isBoss ? SPRITE_INDEX.boss : e.char;
        drawGlyph(sprite, e.position.x, e.position.y, color, e.isHostile || e.isBoss);
      });

      // Spieler
      if (playerPos.x >= 0) {
        // Weicher Lichtschein zuerst, damit das Glyph danach scharf darauf liegt
        drawGlow(playerPos.x, playerPos.y, 1.7, playerHurt ? '#ffffff' : '#fde047', 0.28);
        drawGlyph(SPRITE_INDEX.player, playerPos.x, playerPos.y, playerHurt ? '#ffffff' : '#fde047', false);
      }

      ctx.globalAlpha = 1;
    };

    drawRef.current = draw;
    draw();
  }, [
    map,
    playerPos,
    visibleCells,
    revealedCells,
    enemies,
    groundItems,
    discharges,
    deployedDevices,
    playerHurt,
    cellSize,
  ]);

  const tmpCanvasRef = useRef<HTMLCanvasElement | null>(null);
  if (tmpCanvasRef.current === null && typeof document !== 'undefined') {
    tmpCanvasRef.current = document.createElement('canvas');
  }

  // Hilfs-Canvas fuer die Glyph-Masken
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  if (maskCanvasRef.current === null && typeof document !== 'undefined') {
    maskCanvasRef.current = document.createElement('canvas');
  }

  // Erneut zeichnen, wenn Bilder nachgeladen wurden
  useEffect(() => {
    const id = setInterval(() => {
      if (imagesRef.current.map || imagesRef.current.art) drawRef.current();
    }, 500);
    return () => clearInterval(id);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) onTileClick(x, y);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) onTileHover(x, y);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <canvas
        ref={canvasRef}
        className="block cursor-crosshair"
        style={{ imageRendering: 'pixelated' }}
        onClick={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={() => onTileHover(-1, -1)}
      />
    </div>
  );
};

export default TileCanvas;
