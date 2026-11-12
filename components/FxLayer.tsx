import React, { useEffect, useMemo, useRef } from 'react';
import { CellType, DeployedDevice, Enemy, Position, VisualEffect } from '../types';
import { MAP_HEIGHT, MAP_WIDTH } from '../utils/gameConfig';
import { CELL_LIGHT, FX_COLORS, collectEffectGlyphs, EffectGlyph } from '../utils/effects';

/**
 * Moderne Effekt-Schicht auf Canvas-Basis.
 *
 * Bewusst als Canvas statt vieler DOM-Elementen: `mix-blend-mode: screen`
 * auf hunderten Elementen erzwingt teure Compositing-Passes und bricht die
 * Framerate. Hier werden alle Effekte in zwei Canvas-Ebenen gezeichnet:
 *
 *   1) FX-Canvas  - weiche Lichtquellen, gluehende Partikel, Leuchtspuren
 *                   (additiv gezeichnet, Ebene per `screen` ueber dem Grid)
 *   2) Glyph-Canvas - die Effektzeichen selbst (Schuss, Explosion, Nova)
 *                   mit weichem Text-Schatten als Leuchten
 *
 * Beide Ebenen haben einen eigenen requestAnimationFrame-Loop, damit das
 * React-Rendering des 80x35-ASCII-Grids nicht pro Frame neu erfolgt.
 */

interface Light {
  key: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
}

interface FxLayerProps {
  preRef: React.RefObject<HTMLPreElement | null>;
  map: CellType[][];
  visibleCells: Set<string>;
  effects: VisualEffect[];
  playerPos: Position;
  enemies: Enemy[];
  deployedDevices: DeployedDevice[];
}

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

/** Versatz der Canvas-Baseline zur Zeilenmitte des ASCII-Grids. */
const BASELINE_OFFSET = 0.78;

const FxLayer: React.FC<FxLayerProps> = ({
  preRef,
  map,
  visibleCells,
  effects,
  playerPos,
  enemies,
  deployedDevices,
}) => {
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  const glyphCanvasRef = useRef<HTMLCanvasElement>(null);

  // Aktuelle Effekte fuer die Animationsschleife, ohne React-Re-Render auszuloesen
  const effectsRef = useRef(effects);
  effectsRef.current = effects;

  // Sichtbare Zellen fuer die Animationsschleife
  const visibleCellsRef = useRef(visibleCells);
  visibleCellsRef.current = visibleCells;

  // --- Statisches Umgebungslicht (Map-Zellen, Geraete, Gegner, Spieler) ---
  const ambientLights = useMemo(() => {
    const lights: Light[] = [];

    // Zellen mit Leuchteffekt einsammeln und pro Cluster zusammenfassen.
    // Ein Gefahrenraum kann dutzende Zellen umfassen - ohne Clustering
    // entstuenden entsprechend viele einzelne Lichtquellen.
    const BUCKET = 4; // Zellen pro Cluster-Kante
    interface Bucket { xs: number[]; ys: number[]; color: string; alpha: number; }
    const buckets = new Map<string, Bucket>();

    for (let y = 0; y < map.length; y++) {
      const row = map[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const spec = CELL_LIGHT[row[x]];
        if (!spec) continue;
        if (!visibleCells.has(`${x},${y}`)) continue;
        const key = `${Math.floor(x / BUCKET)},${Math.floor(y / BUCKET)},${spec.color}`;
        let b = buckets.get(key);
        if (!b) {
          b = { xs: [], ys: [], color: spec.color, alpha: spec.alpha };
          buckets.set(key, b);
        }
        b.xs.push(x);
        b.ys.push(y);
      }
    }

    buckets.forEach((b, key) => {
      const cx = b.xs.reduce((a, v) => a + v, 0) / b.xs.length;
      const cy = b.ys.reduce((a, v) => a + v, 0) / b.ys.length;
      const spread = Math.max(
        Math.max(...b.xs) - Math.min(...b.xs),
        Math.max(...b.ys) - Math.min(...b.ys),
      );
      const radius = Math.min(5, 2.0 + spread * 0.3);
      const alpha = Math.min(b.alpha * 1.3, b.alpha + (b.xs.length > 1 ? 0.05 : 0));
      lights.push({ key: `cluster-${key}`, x: cx, y: cy, radius, color: b.color, alpha });
    });

    // Helmlampe / Ruecklicht des Spielers
    if (playerPos.x >= 0) {
      lights.push({
        key: 'player',
        x: playerPos.x,
        y: playerPos.y,
        radius: 4.2,
        color: '#93c5fd',
        alpha: 0.18,
      });
    }

    deployedDevices.forEach((d, i) => {
      // Nur beleuchten, was auch sichtbar ist (kein Info-Leak)
      if (!visibleCells.has(`${d.position.x},${d.position.y}`)) return;
      lights.push({
        key: `device-${d.id}-${i}`,
        x: d.position.x,
        y: d.position.y,
        radius: 2.0,
        color: d.type === 'TURRET' ? FX_COLORS.ember : '#60a5fa',
        alpha: 0.28,
      });
    });

    enemies.forEach(e => {
      if (!e.isHostile) return;
      // Nur beleuchten, was auch sichtbar ist (kein Info-Leak)
      if (!visibleCells.has(`${e.position.x},${e.position.y}`)) return;
      lights.push({
        key: `enemy-${e.id}`,
        x: e.position.x,
        y: e.position.y,
        radius: e.isBoss ? 2.4 : 1.3,
        color: e.isBoss ? '#c084fc' : '#f87171',
        alpha: e.isBoss ? 0.30 : 0.20,
      });
    });

    return lights;
  }, [map, visibleCells, playerPos, deployedDevices, enemies]);

  const ambientRef = useRef(ambientLights);
  ambientRef.current = ambientLights;

  // --- Zeichenloop (eigenes rAF, kein React-Re-Render pro Frame) ---
  useEffect(() => {
    const fxCanvas = fxCanvasRef.current;
    const glyphCanvas = glyphCanvasRef.current;
    const pre = preRef.current;
    if (!fxCanvas || !glyphCanvas || !pre) return;

    const fxCtx = fxCanvas.getContext('2d');
    const glyphCtx = glyphCanvas.getContext('2d');
    if (!fxCtx || !glyphCtx) return;

    let raf = 0;
    let lastW = 0;
    let lastH = 0;

    // Canvas an die tatsaechliche Groesse des ASCII-Grids anpassen.
    // Der <pre> kann beim ersten Render noch 0 Breite haben (z. B. wenn der
    // Elterncontainer erst eingeblendet wird), daher ResizeObserver statt
    // einer reinen Einmal-Messung.
    const syncSize = () => {
      const preW = pre.offsetWidth;
      const preH = pre.offsetHeight;
      if (!preW || !preH) return false;
      if (lastW === preW && lastH === preH) return true;
      lastW = preW;
      lastH = preH;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const c of [fxCanvas, glyphCanvas]) {
        c.width = Math.round(preW * dpr);
        c.height = Math.round(preH * dpr);
        c.style.width = `${preW}px`;
        c.style.height = `${preH}px`;
        c.style.left = `${pre.offsetLeft}px`;
        c.style.top = `${pre.offsetTop}px`;
      }
      const cs = getComputedStyle(pre);
      glyphCtx.font = `${cs.fontSize} ${cs.fontFamily}`;
      return true;
    };

    const ro = new ResizeObserver(() => syncSize());
    ro.observe(pre);
    syncSize();

    const draw = () => {
      raf = requestAnimationFrame(draw);

      if (!syncSize()) return;

      const preW = lastW;
      const preH = lastH;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const cellW = preW / MAP_WIDTH;
      const cellH = preH / MAP_HEIGHT;
      const now = Date.now();
      const effects = effectsRef.current;

      // ---------- Ebene 1: Licht, Partikel, Spuren ----------
      fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fxCtx.clearRect(0, 0, preW, preH);
      fxCtx.globalCompositeOperation = 'lighter';

      const drawGlow = (x: number, y: number, radius: number, color: string, alpha: number) => {
        if (alpha <= 0.005 || radius <= 0) return;
        const cx = (x + 0.5) * cellW;
        const cy = (y + 0.5) * cellH;
        const rx = Math.max(radius * cellW, 1);
        const [r, g, b] = hexToRgb(color);
        // Elliptischer Verlauf (Zellen sind nicht quadratisch): skaliertes
        // Raduum, damit das Licht in Zellkoordinaten rund bleibt.
        const grad = fxCtx.createRadialGradient(cx, cy, 0, cx, cy, rx);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.36, `rgba(${r},${g},${b},${alpha * 0.34})`);
        grad.addColorStop(0.7, `rgba(${r},${g},${b},${alpha * 0.08})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        fxCtx.save();
        fxCtx.translate(cx, cy);
        fxCtx.scale(1, cellH / cellW);
        fxCtx.translate(-cx, -cy);
        fxCtx.fillStyle = grad;
        fxCtx.beginPath();
        fxCtx.arc(cx, cy, rx, 0, Math.PI * 2);
        fxCtx.fill();
        fxCtx.restore();
      };

      const drawSpark = (x: number, y: number, color: string, alpha: number, sizePx: number) => {
        if (alpha <= 0.005) return;
        const cx = (x + 0.5) * cellW;
        const cy = (y + 0.5) * cellH;
        const [r, g, b] = hexToRgb(color);
        const rad = Math.max(0.9, sizePx);
        const grad = fxCtx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.45, `rgba(${r},${g},${b},${alpha * 0.45})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        fxCtx.fillStyle = grad;
        fxCtx.beginPath();
        fxCtx.arc(cx, cy, rad, 0, Math.PI * 2);
        fxCtx.fill();
      };

      for (const l of ambientRef.current) {
        drawGlow(l.x, l.y, l.radius, l.color, l.alpha);
      }

      for (const e of effects) {
        const elapsed = now - e.startTime;
        if (elapsed < 0 || elapsed > e.duration) continue;
        const p = Math.min(1, elapsed / e.duration);

        // Effekt nur zeichnen, wenn sein Ursprung sichtbar ist - sonst
        // wuerden Partikel ueber nicht gesehenes Terrain leuchten (Info-Leak).
        const originX = e.position ? e.position.x : e.startPos?.x;
        const originY = e.position ? e.position.y : e.startPos?.y;
        if (originX === undefined || originY === undefined) continue;
        if (!visibleCellsRef.current.has(`${originX},${originY}`)) continue;

        if (e.light) {
          let lx: number | undefined;
          let ly: number | undefined;
          if (e.position) {
            lx = e.position.x;
            ly = e.position.y;
          } else if (e.startPos && e.endPos) {
            lx = e.startPos.x + (e.endPos.x - e.startPos.x) * p;
            ly = e.startPos.y + (e.endPos.y - e.startPos.y) * p;
          }
          if (lx !== undefined && ly !== undefined) {
            const radius = e.light.expand ? e.light.radius * (0.35 + 0.65 * p) : e.light.radius;
            drawGlow(lx, ly, radius, e.light.color, e.light.intensity * (1 - p * 0.85));
          }
        }

        if (e.particles && e.position) {
          for (const pt of e.particles) {
            const pe = elapsed - pt.delay;
            if (pe < 0 || pe > pt.duration) continue;
            const prog = pe / pt.duration;
            let px = e.position.x + pt.dx * prog;
            let py = e.position.y + pt.dy * prog;
            if (pt.gravity) py += 0.85 * prog * prog; // Glut sackt nach unten
            drawSpark(px, py, pt.color, (1 - prog) * 0.9, 3 * pt.size);
          }
        }

        if (e.type === 'projectile' && e.trail && e.startPos && e.endPos) {
          const steps = 7;
          for (let i = 1; i <= steps; i++) {
            const pp = p - i * 0.05;
            if (pp < 0) break;
            const tx = e.startPos.x + (e.endPos.x - e.startPos.x) * pp;
            const ty = e.startPos.y + (e.endPos.y - e.startPos.y) * pp;
            drawSpark(tx, ty, e.glow ?? FX_COLORS.blood, (1 - i / steps) * 0.7 * (1 - p * 0.4), 2.2);
          }
        }
      }

      fxCtx.globalCompositeOperation = 'source-over';

      // ---------- Ebene 2: Effektzeichen mit Leuchten ----------
      glyphCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      glyphCtx.clearRect(0, 0, preW, preH);
      glyphCtx.textAlign = 'left';
      glyphCtx.textBaseline = 'alphabetic';

      const glyphs: EffectGlyph[] = collectEffectGlyphs(effects, now, visibleCellsRef.current);
      for (const g of glyphs) {
        const x = g.x * cellW;
        const y = (g.y + BASELINE_OFFSET) * cellH;
        if (g.glow) {
          const [r, gr, b] = hexToRgb(g.glow);
          const s = g.glowStrength ?? 1;
          glyphCtx.shadowColor = `rgba(${r},${gr},${b},0.95)`;
          glyphCtx.shadowBlur = 4 * s;
          glyphCtx.fillStyle = g.color;
          glyphCtx.fillText(g.char, x, y);
          glyphCtx.shadowBlur = 10 * s;
          glyphCtx.fillText(g.char, x, y);
        } else {
          glyphCtx.fillStyle = g.color;
          glyphCtx.fillText(g.char, x, y);
        }
      }
      glyphCtx.shadowBlur = 0;
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [preRef]);

  return (
    <>
      <canvas
        ref={fxCanvasRef}
        className="absolute pointer-events-none"
        style={{ mixBlendMode: 'screen', zIndex: 1 }}
        aria-hidden="true"
      />
      <canvas
        ref={glyphCanvasRef}
        className="absolute pointer-events-none"
        style={{ zIndex: 2 }}
        aria-hidden="true"
      />
    </>
  );
};

export default FxLayer;
