
import { CellType, Position, Enemy, EnemyType } from '../types';

// A simple rectangle class representing a room's floor space.
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// --- BESTIARY & SPAWN LOGIC ---

interface EnemyDefinition {
    name: string;
    type: EnemyType;
    char: string;
    color: string;
    hp: number;
    atk: number;
    xp: number; // New XP field
    tier: number; // 1 = Easy, 2 = Medium, 3 = Hard
}

interface BossDefinition extends EnemyDefinition {
    uniqueName: string;
    minDepth: number;
    maxDepth: number;
}

// Static stats - NO SCALING. A Rat-Bot is always weak. A War-Mech is always deadly.
const BESTIARY: EnemyDefinition[] = [
    // TIER 1 (Levels 1-5ish)
    { name: "Wartungs-Drohne", type: EnemyType.SMALL_DRONE, char: 'd', color: 'text-gray-400', hp: 8, atk: 2, xp: 10, tier: 1 },
    { name: "Rat-Bot", type: EnemyType.SMALL_DRONE, char: 'r', color: 'text-gray-500', hp: 5, atk: 3, xp: 15, tier: 1 },
    { name: "Defekter Arbeiter", type: EnemyType.NEUTRAL_ROBOT, char: 'R', color: 'text-yellow-700', hp: 15, atk: 4, xp: 25, tier: 1 },
    
    // TIER 2 (Levels 5-10ish)
    { name: "Sicherheits-Drohne", type: EnemyType.LARGE_DRONE, char: 'D', color: 'text-blue-500', hp: 35, atk: 8, xp: 50, tier: 2 },
    { name: "Wach-Roboter", type: EnemyType.HOSTILE_ROBOT, char: 'R', color: 'text-red-500', hp: 50, atk: 10, xp: 75, tier: 2 },
    { name: "Kampfhund-Einheit", type: EnemyType.SMALL_DRONE, char: 'h', color: 'text-red-400', hp: 25, atk: 12, xp: 60, tier: 2 }, // Glass cannon
    
    // TIER 3 (Levels 10+)
    { name: "Kampf-Mech", type: EnemyType.ANDROID, char: 'M', color: 'text-red-600 font-bold', hp: 100, atk: 20, xp: 200, tier: 3 },
    { name: "Elite-Soldat", type: EnemyType.ELITE_GUARD, char: 'E', color: 'text-cyan-400 font-bold', hp: 80, atk: 25, xp: 180, tier: 3 },
    { name: "Schwere Artillerie", type: EnemyType.LARGE_DRONE, char: 'A', color: 'text-orange-500 font-bold', hp: 150, atk: 30, xp: 250, tier: 3 },
];

const BOSSES: BossDefinition[] = [
    // Early Game Bosses
    { uniqueName: "Der Metzger", name: "Schlächter-Droide", type: EnemyType.BOSS_MELEE, char: 'Ω', color: 'text-fuchsia-500 font-bold', hp: 120, atk: 18, xp: 500, tier: 2, minDepth: 5, maxDepth: 9 },
    { uniqueName: "Protokoll 0", name: "KI-Kern Wächter", type: EnemyType.BOSS_RANGED, char: 'Φ', color: 'text-fuchsia-500 font-bold', hp: 80, atk: 25, xp: 500, tier: 2, minDepth: 6, maxDepth: 10 },
    
    // Mid/Late Game Bosses
    { uniqueName: "Grinder", name: "Industrie-Brecher", type: EnemyType.BOSS_MELEE, char: '€', color: 'text-purple-500 font-bold', hp: 300, atk: 35, xp: 1000, tier: 3, minDepth: 10, maxDepth: 99 },
    { uniqueName: "Quork", name: "Alien-Symbiont", type: EnemyType.BOSS_MELEE, char: 'Ψ', color: 'text-purple-400 font-bold', hp: 200, atk: 50, xp: 1200, tier: 3, minDepth: 12, maxDepth: 99 },
    { uniqueName: "X-99", name: "Prototyp", type: EnemyType.BOSS_RANGED, char: 'Œ', color: 'text-red-600 font-bold', hp: 500, atk: 45, xp: 1500, tier: 3, minDepth: 15, maxDepth: 99 },
];


/**
 * Carves a rectangular room into the map by setting its tiles to FLOOR.
 */
const createRoom = (map: CellType[][], room: Rect) => {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
          map[y][x] = CellType.FLOOR;
      }
    }
  }
};

/**
 * Carves a horizontal tunnel between two points.
 */
const createHTunnel = (map: CellType[][], x1: number, x2: number, y: number) => {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
        map[y][x] = CellType.FLOOR;
    }
  }
};

/**
 * Carves a vertical tunnel between two points.
 */
const createVTunnel = (map: CellType[][], y1: number, y2: number, x: number) => {
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
    if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
        map[y][x] = CellType.FLOOR;
    }
  }
};


export const generateMap = (
  width: number,
  height: number,
  maxRooms: number,
  minRoomSize: number,
  maxRoomSize: number,
  terminalCount: number,
  depth: number
): { map: CellType[][]; playerStart: Position; terminals: Position[]; healingTerminals: Position[]; enemies: Enemy[] } => {
  const map: CellType[][] = Array.from({ length: height }, () =>
    Array(width).fill(CellType.WALL)
  );

  const rooms: Rect[] = [];
  let playerStart: Position = { x: -1, y: -1 };
  const occupiedSpots = new Set<string>();

  const maxAttempts = maxRooms * 3;
  for (let i = 0; i < maxAttempts && rooms.length < maxRooms; i++) {
    const w = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
    const h = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
    const x = Math.floor(Math.random() * (width - w - 2)) + 1;
    const y = Math.floor(Math.random() * (height - h - 2)) + 1;

    const newRoom: Rect = { x, y, w, h };

    let failed = false;
    for (const otherRoom of rooms) {
      if (
        newRoom.x < otherRoom.x + otherRoom.w + 1 &&
        newRoom.x + newRoom.w + 1 > otherRoom.x &&
        newRoom.y < otherRoom.y + otherRoom.h + 1 &&
        newRoom.y + newRoom.h + 1 > otherRoom.y
      ) {
        failed = true;
        break;
      }
    }

    if (!failed) {
      createRoom(map, newRoom);
      const newCenter = { x: Math.floor(newRoom.x + newRoom.w / 2), y: Math.floor(newRoom.y + newRoom.h / 2) };

      if (rooms.length === 0) {
        playerStart = newCenter;
      } else {
        const prevCenter = {
            x: Math.floor(rooms[rooms.length - 1].x + rooms[rooms.length - 1].w / 2),
            y: Math.floor(rooms[rooms.length - 1].y + rooms[rooms.length - 1].h / 2)
        };

        if (Math.random() > 0.5) {
          createHTunnel(map, prevCenter.x, newCenter.x, prevCenter.y);
          createVTunnel(map, prevCenter.y, newCenter.y, newCenter.x);
        } else {
          createVTunnel(map, prevCenter.y, newCenter.y, prevCenter.x);
          createHTunnel(map, prevCenter.x, newCenter.x, newCenter.y);
        }
      }
      rooms.push(newRoom);
    }
  }

  if (rooms.length > 0) {
      if (depth > 1) {
          const entrancePos = { x: Math.floor(rooms[0].x + rooms[0].w / 2), y: Math.floor(rooms[0].y + rooms[0].h / 2) };
          map[entrancePos.y][entrancePos.x] = CellType.ENTRANCE;
      }
      const exitPos = { x: Math.floor(rooms[rooms.length - 1].x + rooms[rooms.length - 1].w / 2), y: Math.floor(rooms[rooms.length - 1].y + rooms[rooms.length - 1].h / 2) };
      
      // LEVEL 15 IS THE END
      if (depth === 15) {
          map[exitPos.y][exitPos.x] = CellType.SHUTTLE;
      } else {
          map[exitPos.y][exitPos.x] = CellType.EXIT;
      }
      occupiedSpots.add(`${exitPos.x},${exitPos.y}`);
  }

  const findSpotInRoom = (room: Rect) => {
    let attempts = 0;
    while(attempts < 20) {
        const x = Math.floor(Math.random() * (room.w - 2)) + room.x + 1;
        const y = Math.floor(Math.random() * (room.h - 2)) + room.y + 1;
        const posKey = `${x},${y}`;
        if (map[y][x] === CellType.FLOOR && !occupiedSpots.has(posKey)) {
            return {x, y};
        }
        attempts++;
    }
    return null;
  }
  
  occupiedSpots.add(`${playerStart.x},${playerStart.y}`);


  const terminals: Position[] = [];
  let placedTerminals = 0;
  
  while(placedTerminals < terminalCount && rooms.length > 0 && placedTerminals < rooms.length) {
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    const pos = findSpotInRoom(room);
    if(pos) {
        map[pos.y][pos.x] = CellType.TERMINAL_OFF;
        terminals.push(pos);
        occupiedSpots.add(`${pos.x},${pos.y}`);
        placedTerminals++;
    }
  }
  if(placedTerminals === 0 && rooms.length > 0) {
      const pos = findSpotInRoom(rooms[0]);
      if (pos) {
          map[pos.y][pos.x] = CellType.TERMINAL_OFF;
          terminals.push(pos);
          occupiedSpots.add(`${pos.x},${pos.y}`);
      }
  }


  if (playerStart.x === -1) {
    let attempts = 0;
    while(playerStart.x === -1 && attempts < width * height) {
      const y = Math.floor(Math.random() * height);
      const x = Math.floor(Math.random() * width);
      if(map[y][x] === CellType.FLOOR) {
        playerStart = { x, y };
      }
      attempts++;
    }
    if(playerStart.x === -1) {
        playerStart = {x: Math.floor(width/2), y: Math.floor(height/2)};
        map[playerStart.y][playerStart.x] = CellType.FLOOR;
    }
    const exitY = Math.floor(Math.random() * height);
    const exitX = Math.floor(Math.random() * width);
    if(map[exitY][exitX] === CellType.FLOOR) {
        if (depth === 15) {
             map[exitY][exitX] = CellType.SHUTTLE;
        } else {
             map[exitY][exitX] = CellType.EXIT;
        }
    }
  }

  const lightSourceCount = 2 + Math.floor(depth / 2);
  const artifactCount = 1 + Math.floor(depth / 3);
  const chestCount = 2 + Math.floor(depth / 3) + (Math.random() > 0.5 ? 1 : 0);
  const barrelCount = 3 + Math.floor(depth * 0.8); // More common than chests

  const placeObjects = (count: number, type: CellType) => {
      let placed = 0;
      let placeAttempts = 0;
      while(placed < count && rooms.length > 0 && placeAttempts < count * 20) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const pos = findSpotInRoom(room);
        if(pos) {
            map[pos.y][pos.x] = type;
            occupiedSpots.add(`${pos.x},${pos.y}`);
            placed++;
        }
        placeAttempts++;
      }
  }

  placeObjects(lightSourceCount, CellType.LIGHT_SOURCE);
  placeObjects(artifactCount, CellType.ARTIFACT);
  placeObjects(chestCount, CellType.CHEST_CLOSED);
  placeObjects(barrelCount, CellType.BARREL);
  
    const healingTerminals: Position[] = [];
    const healingTerminalCount = 2;
    let placedHealingTerminals = 0;
    let healingTerminalAttempts = 0;

    while(placedHealingTerminals < healingTerminalCount && rooms.length > 0 && healingTerminalAttempts < healingTerminalCount * 20) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const pos = findSpotInRoom(room);
        if(pos) {
            map[pos.y][pos.x] = CellType.HEALING_TERMINAL;
            healingTerminals.push(pos);
            occupiedSpots.add(`${pos.x},${pos.y}`);
            placedHealingTerminals++;
        }
        healingTerminalAttempts++;
    }

  const hazardRoomCount = 1 + Math.floor(depth / 3);
  const shuffledRooms = [...rooms].sort(() => 0.5 - Math.random());
  const hazardTypes = [CellType.RADIATION, CellType.VACUUM, CellType.ELECTRICITY];

  for (let i = 0; i < Math.min(hazardRoomCount, shuffledRooms.length); i++) {
      const room = shuffledRooms[i];
      const hazardType = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];
      
      for (let y = room.y; y < room.y + room.h; y++) {
          for (let x = room.x; x < room.x + room.w; x++) {
              if (map[y]?.[x] === CellType.FLOOR) {
                  map[y][x] = hazardType;
              }
          }
      }
  }

  // --- SPAWN ENEMIES ---
  const enemies: Enemy[] = [];

  // 1. Merchant Spawn (Every 3rd level)
  if (depth > 1 && depth % 3 === 0) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const pos = findSpotInRoom(room);
      if (pos) {
          enemies.push({
              id: `${Date.now()}-merchant`,
              name: "Händler VK-55",
              position: pos,
              type: EnemyType.MERCHANT,
              char: '¥',
              color: 'text-yellow-300',
              health: 9999,
              maxHealth: 9999,
              isHostile: false,
              isBoss: false,
              attack: 0,
              xpValue: 0,
              frozenTurns: 0,
              aiState: 'patrolling',
              patrolTarget: null,
          });
          occupiedSpots.add(`${pos.x},${pos.y}`);
      }
  }

  // 2. Boss Logic
  let bossCount = 0;
  let maxBosses = 0;
  if (depth >= 10) maxBosses = 3;
  else if (depth >= 5) maxBosses = 1;

  // Should we spawn a boss?
  let shouldSpawnBoss = false;
  if (depth >= 10) shouldSpawnBoss = true; // Guaranteed at least one deep down
  else if (depth >= 5 && Math.random() < 0.15) shouldSpawnBoss = true; // Rare in mid-game

  if (shouldSpawnBoss && maxBosses > 0) {
      const possibleBosses = BOSSES.filter(b => depth >= b.minDepth && depth <= b.maxDepth);
      if (possibleBosses.length > 0) {
          const numBossesToSpawn = Math.min(maxBosses, Math.floor(Math.random() * maxBosses) + 1);
          
          for(let i=0; i<numBossesToSpawn; i++) {
              const bossDef = possibleBosses[Math.floor(Math.random() * possibleBosses.length)];
              const room = rooms[Math.floor(Math.random() * rooms.length)];
              const pos = findSpotInRoom(room);
              
              if (pos) {
                  enemies.push({
                      id: `${Date.now()}-boss-${i}`,
                      name: bossDef.uniqueName, // Unique name
                      position: pos,
                      type: bossDef.type,
                      char: bossDef.char,
                      color: bossDef.color,
                      health: bossDef.hp,
                      maxHealth: bossDef.hp,
                      xpValue: bossDef.xp,
                      isHostile: true,
                      isBoss: true,
                      attack: bossDef.atk,
                      frozenTurns: 0,
                      aiState: 'patrolling',
                      patrolTarget: null,
                  });
                  occupiedSpots.add(`${pos.x},${pos.y}`);
                  bossCount++;
              }
          }
      }
  }

  // 3. Regular Enemy Logic (Monster Pools)
  const baseEnemyCount = 4 + Math.floor(depth * 0.5); // Slow linear increase in count
  let enemyAttempts = 0;
  
  // Define available tiers based on depth
  const tier1 = BESTIARY.filter(e => e.tier === 1);
  const tier2 = BESTIARY.filter(e => e.tier === 2);
  const tier3 = BESTIARY.filter(e => e.tier === 3);

  while (enemies.length < baseEnemyCount + bossCount && rooms.length > 0 && enemyAttempts < baseEnemyCount * 20) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const pos = findSpotInRoom(room);

      if (pos) {
          let selectedDef: EnemyDefinition;
          const roll = Math.random();

          // Spawn Logic Logic
          if (depth <= 4) {
              // Levels 1-4: Mostly Tier 1. Small chance for Tier 2 (OOD).
              if (roll < 0.90) selectedDef = tier1[Math.floor(Math.random() * tier1.length)];
              else if (roll < 0.99) selectedDef = tier2[Math.floor(Math.random() * tier2.length)]; // OOD!
              else selectedDef = tier3[Math.floor(Math.random() * tier3.length)]; // SUPER OOD (Run!)
          } else if (depth <= 10) {
              // Levels 5-10: Mix of Tier 1 and 2. Tier 3 enters as OOD.
              if (roll < 0.40) selectedDef = tier1[Math.floor(Math.random() * tier1.length)];
              else if (roll < 0.90) selectedDef = tier2[Math.floor(Math.random() * tier2.length)];
              else selectedDef = tier3[Math.floor(Math.random() * tier3.length)]; // OOD
          } else {
              // Levels 10+: Dangerous mix.
              if (roll < 0.20) selectedDef = tier1[Math.floor(Math.random() * tier1.length)]; // Fodder
              else if (roll < 0.50) selectedDef = tier2[Math.floor(Math.random() * tier2.length)];
              else selectedDef = tier3[Math.floor(Math.random() * tier3.length)]; // Standard danger
          }

          // Ensure we have a def (fallback to Tier 1 if pool empty for some reason)
          if (!selectedDef) selectedDef = tier1[0];

          enemies.push({
              id: `${Date.now()}-${Math.random()}`,
              name: selectedDef.name,
              position: pos,
              type: selectedDef.type,
              char: selectedDef.char,
              color: selectedDef.color,
              health: selectedDef.hp,
              maxHealth: selectedDef.hp,
              xpValue: selectedDef.xp,
              isHostile: true,
              isBoss: false,
              attack: selectedDef.atk,
              frozenTurns: 0,
              aiState: 'patrolling',
              patrolTarget: null,
          });
          occupiedSpots.add(`${pos.x},${pos.y}`);
      }
      enemyAttempts++;
  }

  return { map, playerStart, terminals, healingTerminals, enemies };
};
