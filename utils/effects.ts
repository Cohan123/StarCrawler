import { CellType, EffectSpec, ParticleSpec, Position, VisualEffect } from '../types';

/**
 * Zentrale Effekt-Factory fuer moderne Partikel- und Licht-Effekte.
 * Alle Effekte sind ASCII-basiert (das Spiel rendert in einem <pre>-Grid),
 * der Glow kommt ueber text-shadow, die Lichtquellen ueber radiale Gradienten.
 */

let counter = 0;
export const fxId = () => `fx${Date.now().toString(36)}${(counter++).toString(36)}`;

export const FX_COLORS = {
  plasma: '#38bdf8',
  ice: '#67e8f9',
  fire: '#f97316',
  ember: '#fbbf24',
  gold: '#facc15',
  toxic: '#84cc16',
  blood: '#ef4444',
  white: '#f8fafc',
  violet: '#c084fc',
} as const;

const SPARK_CHARS = ['*', '.', '+', 'o', "'"];
const EMBER_CHARS = ['.', ':', "'"];

const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const r2 = (n: number) => Math.round(n * 100) / 100;

export interface ParticleOptions {
  count?: number;
  color?: string;
  speed?: number;      // Zellen pro Sekunde
  life?: number;       // ms
  gravity?: boolean;   // fallende Glut (beschleunigt nach unten)
  size?: number;
  chars?: readonly string[];
  delay?: number;      // ms
  upward?: boolean;    // Startrichtung nach oben
}

/**
 * Erzeugt eine Partikelwolke. Die Partikel bewegen sich radial vom Effektzentrum
 * weg; bei `gravity` fallen sie nach unten und beschleunigen (ease-in).
 */
export function createParticles(opts: ParticleOptions = {}): ParticleSpec[] {
  const {
    count = 8,
    color = FX_COLORS.ember,
    speed = 6,
    life = 520,
    gravity = false,
    size = 1,
    chars = SPARK_CHARS,
    delay = 0,
    upward = false,
  } = opts;

  const particles: ParticleSpec[] = [];
  for (let i = 0; i < count; i++) {
    let angle: number;
    if (upward) {
      // nach oben streuen, danach faellt die Glut zurueck
      angle = -Math.PI / 2 + rnd(-1.1, 1.1);
    } else {
      angle = rnd(0, Math.PI * 2);
    }
    const velocity = speed * rnd(0.35, 1);
    const seconds = life / 1000;
    const dx = Math.cos(angle) * velocity * seconds;
    const dy = Math.sin(angle) * velocity * seconds * 0.6;

    particles.push({
      id: fxId(),
      dx: r2(dx),
      dy: r2(dy),
      char: pick(chars),
      color,
      size: r2(size * rnd(0.7, 1.15)),
      duration: Math.round(life * rnd(0.7, 1.15)),
      delay: Math.round(delay + i * rnd(0, 40)),
      gravity,
    });
  }
  return particles;
}

/** Dauer so verlängern, dass alle Partikel und Lichter vollständig auslaufen. */
function fitDuration(spec: EffectSpec): EffectSpec {
  const particleTime = (spec.particles ?? []).reduce((m, p) => Math.max(m, p.duration + p.delay), 0);
  const lightTime = spec.light ? spec.light.duration : 0;
  return { ...spec, duration: Math.max(spec.duration, particleTime, lightTime) };
}

/** Explosion: expandierender Ring + Funken + Glutlicht + weiches Licht. */
export function createExplosion(
  position: Position,
  opts: { radius?: number; color?: string; intensity?: number; life?: number } = {}
): EffectSpec {
  const radius = opts.radius ?? 2.5;
  const color = opts.color ?? FX_COLORS.fire;
  const life = opts.life ?? 520;
  const emberColor = opts.color === FX_COLORS.ice ? FX_COLORS.ice : FX_COLORS.ember;

  return fitDuration({
    type: 'explosion',
    char: '*',
    color: 'text-orange-400 font-bold',
    position,
    radius,
    duration: life,
    ringDuration: life,
    glow: color,
    glowStrength: 1,
    light: { radius: radius * 1.9, color, intensity: opts.intensity ?? 0.85, duration: life, expand: true },
    particles: [
      ...createParticles({ count: 10, color: emberColor, speed: 7, life: 460, chars: ['*', '.', '+'] }),
      ...createParticles({ count: 6, color, speed: 3.6, life: 700, gravity: true, chars: EMBER_CHARS, delay: 70 }),
    ],
  });
}

/** Nova: gefuellte Scheibe mit Partikelring und farbigem Licht. */
export function createNova(
  position: Position,
  radius: number,
  opts: { color?: string; char?: string; life?: number; intensity?: number; textColor?: string } = {}
): EffectSpec {
  const color = opts.color ?? FX_COLORS.plasma;
  const life = opts.life ?? 700;
  return fitDuration({
    type: 'nova',
    char: opts.char ?? '*',
    color: opts.textColor ?? 'text-cyan-300 font-bold',
    position,
    radius,
    duration: life,
    ringDuration: life,
    glow: color,
    glowStrength: 0.8,
    light: { radius: radius * 1.25, color, intensity: opts.intensity ?? 0.7, duration: life, expand: true },
    particles: createParticles({
      count: 12,
      color,
      speed: Math.max(3, radius * 1.8),
      life,
      chars: ['*', '+', 'o'],
    }),
  });
}

/** Glowing Projectile: Glut am Kopf, Spur und Lichtfahne. */
export function createProjectile(
  startPos: Position,
  endPos: Position,
  opts: { color?: string; glow?: string; char?: string; duration?: number; trail?: boolean; className?: string } = {}
): EffectSpec {
  const color = opts.color ?? FX_COLORS.blood;
  const duration = opts.duration ?? 220;
  return {
    type: 'projectile',
    char: opts.char ?? '*',
    color: opts.className ?? 'text-red-400 font-bold',
    startPos,
    endPos,
    duration,
    glow: opts.glow ?? color,
    glowStrength: 1,
    trail: opts.trail ?? true,
    light: { radius: 1.5, color, intensity: 0.6, duration },
  };
}

/** Treffer-Impact: Funken, kurzes Aufblitzen. */
export function createImpact(
  position: Position,
  opts: { color?: string; count?: number; life?: number } = {}
): EffectSpec {
  const color = opts.color ?? FX_COLORS.ember;
  const life = opts.life ?? 420;
  return fitDuration({
    type: 'particle',
    char: '*',
    color: 'text-yellow-300 font-bold',
    position,
    duration: life,
    glow: color,
    glowStrength: 0.9,
    light: { radius: 1.3, color, intensity: 0.55, duration: 260 },
    particles: createParticles({ count: opts.count ?? 7, color, speed: 5, life: 380, chars: ['*', '.', "'"] }),
  });
}

/** Mündungsfeuer: kurzer, heller Blitz am Abschusspunkt. */
export function createMuzzleFlash(position: Position, color: string = FX_COLORS.ember): EffectSpec {
  return fitDuration({
    type: 'particle',
    char: '*',
    color: 'text-yellow-200 font-bold',
    position,
    duration: 160,
    glow: color,
    glowStrength: 1,
    light: { radius: 1.1, color, intensity: 0.7, duration: 160 },
    particles: createParticles({ count: 4, color, speed: 6, life: 190, chars: ['*', '.'] }),
  });
}

/** Dauerhaftes, weiches Licht an einer Position (z. B. Schildgenerator). */
export function createAura(
  position: Position,
  opts: { color?: string; radius?: number; intensity?: number; life?: number } = {}
): EffectSpec {
  const color = opts.color ?? FX_COLORS.violet;
  const life = opts.life ?? 900;
  return {
    type: 'particle',
    char: ' ',
    color: 'text-transparent',
    position,
    duration: life,
    light: { radius: opts.radius ?? 2.2, color, intensity: opts.intensity ?? 0.45, duration: life },
  };
}

/** Zellspezifisches Umgebungslicht (Lichtquellen, Terminals, Artefakte ...). */
export const CELL_LIGHT: Partial<Record<CellType, { radius: number; color: string; alpha: number }>> = {
  [CellType.LIGHT_SOURCE]:       { radius: 3.0, color: FX_COLORS.ember, alpha: 0.22 },
  [CellType.TERMINAL_ON]:        { radius: 1.9, color: '#4ade80', alpha: 0.20 },
  [CellType.HEALING_TERMINAL]:   { radius: 1.8, color: '#f87171', alpha: 0.18 },
  [CellType.ARTIFACT]:           { radius: 2.6, color: FX_COLORS.gold, alpha: 0.26 },
  [CellType.ELECTRICITY]:        { radius: 1.4, color: FX_COLORS.ember, alpha: 0.14 },
  [CellType.ENTRANCE]:           { radius: 1.8, color: '#4ade80', alpha: 0.16 },
  [CellType.EXIT]:               { radius: 1.8, color: '#f87171', alpha: 0.16 },
  [CellType.SHUTTLE]:            { radius: 2.4, color: '#4ade80', alpha: 0.24 },
};

/** Ein platziertes Effektzeichen (Schuss, Explosionsring, Nova). */
export interface EffectGlyph {
  key: string;
  x: number;
  y: number;
  char: string;
  color: string;
  glow?: string;
  glowStrength?: number;
}

/** Tailwind-Farbklassen der Effektzeichen -> Hex fuer das Canvas-Rendering. */
const GLYPH_COLORS: Record<string, string> = {
  'text-red-500': '#ef4444',
  'text-red-400': '#f87171',
  'text-orange-400': '#fb923c',
  'text-orange-500': '#f97316',
  'text-yellow-100': '#fef9c3',
  'text-yellow-200': '#fef08a',
  'text-yellow-300': '#fde047',
  'text-yellow-400': '#facc15',
  'text-yellow-500': '#eab308',
  'text-green-400': '#4ade80',
  'text-green-500': '#22c55e',
  'text-blue-300': '#60a5fa',
  'text-blue-400': '#38bdf8',
  'text-cyan-300': '#67e8f9',
  'text-cyan-400': '#22d3ee',
  'text-lime-400': '#a3e635',
};

export const glyphColorOf = (className: string): string => {
  for (const cls of className.split(/\s+/)) {
    const c = GLYPH_COLORS[cls];
    if (c) return c;
  }
  return '#e5e7eb';
};

/**
 * Berechnet alle aktiven Effektzeichen inkl. Position.
 * Wird vom Canvas-Renderer genutzt (nicht vom React-Rendering).
 */
export function collectEffectGlyphs(
  effects: VisualEffect[],
  now: number,
  visibleCells: Set<string>
): EffectGlyph[] {
  const out: EffectGlyph[] = [];

  const push = (effect: VisualEffect, x: number, y: number) => {
    // Effekte nur in sichtbaren Zellen zeichnen (kein Info-Leak)
    if (!visibleCells.has(`${x},${y}`)) return;
    out.push({
      key: `${effect.id}-${x}-${y}`,
      x,
      y,
      char: effect.char ?? '*',
      color: glyphColorOf(effect.color),
      glow: effect.glow,
      glowStrength: effect.glowStrength,
    });
  };

  for (const effect of effects) {
    if (effect.type === 'floating_text') continue;

    const progress = (now - effect.startTime) / effect.duration;
    if (progress > 1 || progress < 0) continue;

    if (effect.type === 'projectile' && effect.startPos && effect.endPos) {
      const dx = effect.endPos.x - effect.startPos.x;
      const dy = effect.endPos.y - effect.startPos.y;
      push(effect, Math.round(effect.startPos.x + dx * progress), Math.round(effect.startPos.y + dy * progress));
    } else if (effect.type === 'explosion' && effect.position && effect.radius) {
      // Expandierender Ring
      const currentRadius = effect.radius * progress;
      const r = Math.ceil(currentRadius);
      for (let y = effect.position.y - r; y <= effect.position.y + r; y++) {
        for (let x = effect.position.x - r; x <= effect.position.x + r; x++) {
          const dist = Math.sqrt(Math.pow(x - effect.position.x, 2) + Math.pow(y - effect.position.y, 2));
          if (Math.abs(dist - currentRadius) < 1.0) {
            push(effect, x, y);
          }
        }
      }
    } else if (effect.type === 'nova' && effect.position && effect.radius) {
      // Gefuellte expandierende Scheibe
      const currentRadius = effect.radius * progress;
      const r = Math.ceil(currentRadius);
      for (let y = effect.position.y - r; y <= effect.position.y + r; y++) {
        for (let x = effect.position.x - r; x <= effect.position.x + r; x++) {
          const dist = Math.sqrt(Math.pow(x - effect.position.x, 2) + Math.pow(y - effect.position.y, 2));
          if (dist <= currentRadius) {
            push(effect, x, y);
          }
        }
      }
    } else if (effect.type === 'particle' && effect.position) {
      const dropOffset = Math.floor(progress * 2);
      push(effect, effect.position.x, effect.position.y + dropOffset);
    }
  }

  return out;
}
