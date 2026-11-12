

export enum CellType {
  WALL,
  FLOOR,
  DOOR_CLOSED,
  DOOR_OPEN,
  TERMINAL_OFF,
  TERMINAL_ON,
  ENTRANCE,
  EXIT,
  LIGHT_SOURCE,
  CHEST_CLOSED,
  CHEST_OPEN,
  BARREL,      // New
  BARREL_OPEN, // New
  ARTIFACT,
  RADIATION,
  VACUUM,
  ELECTRICITY,
  HEALING_TERMINAL,
  HEALING_TERMINAL_USED,
  SHUTTLE, 
}

export interface Position {
  x: number;
  y: number;
}

export interface Item {
    id: number;
    name: string;
    cost: number;
    description?: string;
    isUnique?: boolean; // New flag for unique items
}

export interface Weapon extends Item {
    attack: number;
    range: number;      
    ammoCost: number;   
    meleeSidearmDamage?: number; 
}

export interface Armor extends Item {
    defense: number;
}

export type ConsumableEffect = 'HEAL' | 'STUN_AOE' | 'BUFF_ATTACK' | 'REVEAL_MAP' | 'RESTORE_AMMO' | 'SPAWN_DRONE' | 'SPAWN_TURRET' | 'SPAWN_SHIELD' | 'EXPLOSIVE_GRENADE' | 'SPAWN_BARREL' | 'SCAN_AREA';

export interface Consumable extends Item {
    effect: ConsumableEffect;
    value: number; // HP amount, Stun duration, Buff amount, Radius, or Ammo amount
    duration?: number; // How long a buff lasts
    description: string;
}

export type AnyItem = Weapon | Armor | Consumable;

export interface GroundItem {
    id: string;
    item: AnyItem;
    position: Position;
}

export type CharacterClass = 'MARINE' | 'TECHNICIAN' | 'SCOUT' | 'SCAVENGER' | 'CYBORG' | 'DEMOLITIONIST' | 'SUBJECT_D';

export interface Player {
  name: string;
  class: CharacterClass; 
  position: Position;
  lastMoveDir: { x: number, y: number }; // Track facing direction
  health: number;
  maxHealth: number;
  // Stats
  level: number;
  xp: number;
  maxXp: number;
  strength: number; // Base Attack
  defense: number;  // Base Defense
  intelligence: number; // Hacking skill
  
  ammo: number;     // New Resource
  maxAmmo: number;
  
  radioactivity: number;
  maxRadioactivity: number;
  air: number;
  maxAir: number;
  credits: number;
  weapon: Weapon | null;
  armor: Armor | null;
  inventory: AnyItem[];
  quickSlots: [Consumable | null, Consumable | null]; // Slot 1 and Slot 2
  // Buff state
  attackBuff: number;
  buffTurns: number;
}

export interface LogEntry {
  id: number;
  title: string;
  content: string;
}

export enum EnemyType {
  NEUTRAL_ROBOT,
  HOSTILE_ROBOT,
  LARGE_DRONE,
  SMALL_DRONE,
  ANDROID,
  MERCHANT,
  BOSS_MELEE,
  BOSS_RANGED,
  ELITE_GUARD
}

export interface Enemy {
  id: string;
  name: string;
  position: Position;
  type: EnemyType;
  char: string;
  color: string;
  health: number;
  maxHealth: number;
  xpValue: number;
  isHostile: boolean;
  isBoss: boolean;
  attack: number;
  frozenTurns: number;
  aiState: 'patrolling' | 'chasing';
  patrolTarget: Position | null;
  justHit?: boolean;
}

export interface Discharge {
    id: string;
    position: Position;
    direction: { dx: number; dy: number };
}

export interface DeployedDevice {
    id: string;
    type: 'TURRET' | 'SHIELD';
    position: Position;
    char: string;
    color: string;
    lifeTime: number; // Turns remaining
    maxLifeTime: number;
}

// New Visual Effects System
export type VisualEffectType = 'projectile' | 'explosion' | 'particle' | 'nova' | 'floating_text';

// Ein einzelnes Partikel (Funke, Glut, Rauch) innerhalb eines Effekts
export interface ParticleSpec {
  id: string;
  dx: number;        // horizontaler Weg in Zellen
  dy: number;        // vertikaler Weg in Zellen
  char: string;
  color: string;     // Hex-Farbe
  size: number;      // 0.6 - 1.4 (relativ zur Zellenhoehe)
  duration: number;  // Lebensdauer in ms
  delay: number;     // Verzoegerung in ms
  gravity: boolean;  // fallende Glut (Beschleunigung + Sacken)
}

// Weiche Lichtquelle (Explosion, Projektil, Umgebungslicht)
export interface LightSpec {
  radius: number;    // Radius in Zellen
  color: string;     // Hex-Farbe
  intensity: number; // 0..1
  duration: number;  // ms (0 = dauerhaft)
  expand?: boolean;  // Radius waechst mit der Zeit
}

export interface VisualEffect {
    id: string;
    type: VisualEffectType;
    char?: string; // Optional for text effects
    text?: string; // New: Text content for floating text
    color: string;
    startTime: number;
    duration: number;
    // For Projectiles
    startPos?: Position;
    endPos?: Position;
    // For Explosions/Particles/Nova/Text
    position?: Position;
    radius?: number;
    // --- Moderne Effekte ---
    glow?: string;        // Hex-Farbe des Leuchtens
    glowStrength?: number; // 0..1, steuert die Text-Schatten-Staerke
    glyphColor?: string;  // Hex-Farbe des Effektzeichens (Canvas-Rendering)
    trail?: boolean;      // Projektil zieht eine Spur
    particles?: ParticleSpec[];
    light?: LightSpec;
    ringDuration?: number; // Dauer des Rings/der Nova (Standard: duration)
}

// Effekt-Spezifikation ohne die vom State vergebenen Felder
export type EffectSpec = Omit<VisualEffect, 'id' | 'startTime'>;

export type HazardZoneType = 'none' | 'radiation' | 'vacuum';

export type MessageType = 'info' | 'combat-player' | 'combat-enemy' | 'flavor' | 'warning' | 'victory' | 'use' | 'levelup' | 'loot';

export interface GameMessage {
    id: number;
    text: string;
    type: MessageType;
    timestamp: number;
}

export interface GameState {
  map: CellType[][];
  player: Player;
  logs: LogEntry[];
  messageHistory: GameMessage[];
  terminals: Position[];
  healingTerminals: Position[];
  depth: number;
  visibleCells: Set<string>;
  revealedCells: Set<string>;
  enemies: Enemy[];
  isGameOver: boolean;
  isVictory: boolean;
  isMinimapOpen: boolean;
  isLevelUpScreenOpen: boolean;
  playerName: string;
  discharges: Discharge[];
  deployedDevices: DeployedDevice[]; // Turrets and Shields
  visualEffects: VisualEffect[]; 
  hazardZone: HazardZoneType;
  isShopOpen: boolean;
  groundItems: GroundItem[];
  playerHurt: boolean;
  hoverInfo: string | null; 
  uniqueItemFound: boolean; // Track unique weapon
  causeOfDeath?: string; // New
}

export type CachedLevelState = Omit<GameState, 'player' | 'logs' | 'messageHistory' | 'visibleCells' | 'isGameOver' | 'isVictory' | 'isMinimapOpen' | 'isLevelUpScreenOpen' | 'playerName' | 'discharges' | 'hazardZone' | 'isShopOpen' | 'playerHurt' | 'hoverInfo' | 'visualEffects' | 'deployedDevices' | 'uniqueItemFound'>;

export interface HighscoreEntry {
    name: string;
    score: number;
    depth: number;
    date: string;
    killedBy?: string;
}

export type CombatAnimationType = 'player-hit' | 'enemy-hit' | 'player-defend' | 'flee-success' | 'flee-fail';
