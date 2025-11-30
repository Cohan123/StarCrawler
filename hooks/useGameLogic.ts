

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, CellType, Position, LogEntry, Enemy, EnemyType, CachedLevelState, Discharge, HazardZoneType, GroundItem, AnyItem, Weapon, Armor, MessageType, GameMessage, Consumable, CharacterClass, VisualEffect, DeployedDevice } from '../types';
import { generateMap } from '../utils/mapGenerator';
import { generateLogEntry } from '../services/geminiService';
import { calculateFov } from '../utils/fov';
import { playSound } from '../utils/audio';
import { saveHighscore } from '../utils/highscore';
import { getLootItem, WEAPONS, CONSUMABLES, ARMORS } from '../data/items';
import { findPath } from '../utils/pathfinding';
import { getTileDescription } from '../utils/descriptions';
import { getFlavorText } from '../utils/flavorText';

const MAP_WIDTH = 80;
const MAP_HEIGHT = 35;
const TERMINAL_COUNT = 5;
const BASE_FOV_RADIUS = 8;

const initialState: GameState = {
  map: [],
  player: {
    name: '',
    class: 'MARINE', 
    position: { x: -1, y: -1 },
    lastMoveDir: { x: 0, y: 1 }, // Default facing down
    health: 40,
    maxHealth: 40,
    // Stats
    level: 1,
    xp: 0,
    maxXp: 100,
    strength: 0,
    defense: 0,
    intelligence: 0,
    
    ammo: 20,
    maxAmmo: 50,
    
    radioactivity: 0,
    maxRadioactivity: 10,
    air: 25,
    maxAir: 25,
    credits: 0,
    weapon: null,
    armor: null,
    inventory: [],
    quickSlots: [null, null],
    attackBuff: 0,
    buffTurns: 0,
  },
  logs: [],
  messageHistory: [],
  terminals: [],
  healingTerminals: [],
  depth: 1,
  visibleCells: new Set<string>(),
  revealedCells: new Set<string>(),
  enemies: [],
  isGameOver: false,
  isVictory: false,
  isMinimapOpen: false,
  isLevelUpScreenOpen: false,
  playerName: '',
  discharges: [],
  deployedDevices: [],
  visualEffects: [],
  hazardZone: 'none',
  isShopOpen: false,
  groundItems: [],
  playerHurt: false,
  hoverInfo: null,
  uniqueItemFound: false, // Initial state
};

const rollDice = () => {
    return Math.floor(Math.random() * 6) + 1;
};

// Helper function to calculate visibility (Pure function)
const computeVisibility = (currentMap: CellType[][], currentPlayer: {position: Position, class: CharacterClass}, currentRevealed: Set<string>) => {
    const playerCell = (currentMap[currentPlayer.position.y] && currentMap[currentPlayer.position.y][currentPlayer.position.x]) ? currentMap[currentPlayer.position.y][currentPlayer.position.x] : CellType.FLOOR;
    
    const classBonus = currentPlayer.class === 'SCOUT' ? 2 : 0;
    const currentFovRadius = (playerCell === CellType.RADIATION ? 2 : BASE_FOV_RADIUS + classBonus);

    const visibleFromPlayer = calculateFov(currentMap, currentPlayer.position, currentFovRadius);
    const allVisible = new Set(visibleFromPlayer);

    for (let y = 0; y < currentMap.length; y++) {
      for (let x = 0; x < currentMap[y].length; x++) {
        const cell = currentMap[y][x];
        let radius = 0;
        if (cell === CellType.LIGHT_SOURCE) {
          radius = 2;
        } else if (cell === CellType.TERMINAL_OFF || cell === CellType.TERMINAL_ON) {
          radius = 1;
        }
        
        if (radius > 0 && visibleFromPlayer.has(`${x},${y}`)) {
          const visibleFromLight = calculateFov(currentMap, { x, y }, radius);
          visibleFromLight.forEach(cellKey => allVisible.add(cellKey));
        }
      }
    }
    
    const newRevealed = new Set(currentRevealed);
    allVisible.forEach(cell => newRevealed.add(cell));
    
    return { visibleCells: allVisible, revealedCells: newRevealed };
};

export const useGameLogic = (onGameOver: () => void) => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [levelCache, setLevelCache] = useState<Map<number, CachedLevelState>>(new Map());
  
  const isWalkingRef = useRef(false);
  const stopWalkingRef = useRef(false);

  // Helper to add visual effects
  const addEffect = (effect: Omit<VisualEffect, 'id' | 'startTime'>) => {
      setGameState(prev => ({
          ...prev,
          visualEffects: [
              ...prev.visualEffects,
              { ...effect, id: Math.random().toString(36), startTime: Date.now() }
          ]
      }));
  };

  // Helper for floating text
  const addFloatingText = (position: Position, text: string, color: string) => {
      addEffect({
          type: 'floating_text',
          position,
          text,
          color,
          duration: 800
      });
  };

  // Cleanup old effects periodically
  useEffect(() => {
      const interval = setInterval(() => {
          setGameState(prev => {
              const now = Date.now();
              const activeEffects = prev.visualEffects.filter(e => now - e.startTime < e.duration);
              if (activeEffects.length === prev.visualEffects.length) return prev;
              return { ...prev, visualEffects: activeEffects };
          });
      }, 500);
      return () => clearInterval(interval);
  }, []);

  // Helper to add messages
  const addMessage = (text: string, type: MessageType = 'info') => {
      setGameState(prev => ({
          ...prev,
          messageHistory: [
              ...prev.messageHistory, 
              { id: Date.now() + Math.random(), text, type, timestamp: Date.now() }
          ].slice(-50) // Keep last 50 messages
      }));
  };

  const updateVisibility = useCallback((map: CellType[][], player: {position: Position, class: CharacterClass}, existingRevealed: Set<string>) => {
    const { visibleCells, revealedCells } = computeVisibility(map, player, existingRevealed);
    setGameState(prevState => ({
      ...prevState,
      visibleCells,
      revealedCells,
    }));
  }, []);
  
  const processTurn = useCallback(() => {
    setGameState(prevState => {
        const { player, map, isGameOver, visibleCells } = prevState;
        if (isGameOver || player.health <= 0) return prevState;

        const nextState: GameState = {
            ...prevState,
            player: { ...prevState.player },
            enemies: JSON.parse(JSON.stringify(prevState.enemies)),
            discharges: JSON.parse(JSON.stringify(prevState.discharges)),
            deployedDevices: JSON.parse(JSON.stringify(prevState.deployedDevices)),
            messageHistory: [...prevState.messageHistory], // Create copy
            visualEffects: [...prevState.visualEffects] // Copy effects to append new ones safely
        };
        
        // Helper to add effect inside reducer
        const addEffectInternal = (effect: Omit<VisualEffect, 'id' | 'startTime'>) => {
            nextState.visualEffects.push({ ...effect, id: Math.random().toString(36), startTime: Date.now() });
        };

        // Handle Buffs
        if (nextState.player.buffTurns > 0) {
            nextState.player.buffTurns--;
            if (nextState.player.buffTurns === 0) {
                nextState.player.attackBuff = 0;
                nextState.messageHistory.push({ id: Date.now(), text: "Die Wirkung des Stims lässt nach.", type: 'info', timestamp: Date.now() });
            }
        }
        
        const pushMsg = (text: string, type: MessageType) => {
             nextState.messageHistory.push({ id: Date.now() + Math.random(), text, type, timestamp: Date.now() });
        };
        
        let causeOfDeath: string | undefined = undefined;

        // --- 0. Deployed Devices Logic (Turrets/Shields) ---
        const activeDevices: DeployedDevice[] = [];
        for (const device of nextState.deployedDevices) {
            device.lifeTime--;
            
            if (device.type === 'TURRET') {
                // Turret Logic: Find nearest enemy in range 5
                let nearestEnemy: Enemy | null = null;
                let minDst = 6;
                for (const en of nextState.enemies) {
                    if (en.health <= 0) continue;
                    const d = Math.sqrt((en.position.x - device.position.x)**2 + (en.position.y - device.position.y)**2);
                    if (d < minDst) {
                        minDst = d;
                        nearestEnemy = en;
                    }
                }
                
                if (nearestEnemy) {
                    nearestEnemy.health -= 5;
                    nearestEnemy.justHit = true;
                    // Visual
                    addEffectInternal({
                        type: 'projectile',
                        char: '*',
                        color: 'text-yellow-500',
                        startPos: device.position,
                        endPos: nearestEnemy.position,
                        duration: 100
                    });
                     addEffectInternal({ type: 'floating_text', position: nearestEnemy.position, text: `-5`, color: 'text-yellow-500', duration: 800 });
                }
            }

            if (device.lifeTime > 0) {
                activeDevices.push(device);
            } else {
                pushMsg(`${device.type === 'TURRET' ? 'Selbstschussanlage' : 'Schildgenerator'} ausgefallen.`, 'info');
            }
        }
        nextState.deployedDevices = activeDevices;

        // --- 1. Hazard Effects on Player ---
        const playerCell = map[player.position.y][player.position.x];
        let newHazardZone: HazardZoneType = 'none';

        if (playerCell === CellType.RADIATION) {
            newHazardZone = 'radiation';
            if (nextState.player.radioactivity < nextState.player.maxRadioactivity) {
                nextState.player.radioactivity++;
            }
            if (nextState.player.radioactivity >= nextState.player.maxRadioactivity) {
                const dmg = 2;
                nextState.player.health = Math.max(0, nextState.player.health - dmg);
                if(dmg > 0) addEffectInternal({ type: 'floating_text', position: player.position, text: `-${dmg}`, color: 'text-green-500', duration: 800 });
                if (nextState.player.health === 0 && !causeOfDeath) causeOfDeath = "Strahlenvergiftung";
                pushMsg("WARNUNG: Kritische Strahlung! Hülle korrodiert.", 'warning');
            }
        } else {
            if (nextState.player.radioactivity > 0) {
                nextState.player.radioactivity--;
            }
        }

        if (playerCell === CellType.VACUUM) {
            newHazardZone = 'vacuum';
            if (nextState.player.air > 0) {
                nextState.player.air--;
            }
            if (nextState.player.air <= 0) {
                const dmg = 2;
                nextState.player.health = Math.max(0, nextState.player.health - dmg);
                if(dmg > 0) addEffectInternal({ type: 'floating_text', position: player.position, text: `-${dmg}`, color: 'text-gray-400', duration: 800 });
                if (nextState.player.health === 0 && !causeOfDeath) causeOfDeath = "Erstickung";
                pushMsg("WARNUNG: O2 Reserve kritisch! Erstickungsgefahr.", 'warning');
            }
        } else {
            if (nextState.player.air < nextState.player.maxAir) {
                nextState.player.air = nextState.player.maxAir;
            }
        }
        nextState.hazardZone = newHazardZone;

        // --- 2. Electrical Discharges ---
        const currentDischarges: Discharge[] = [];
        for (const discharge of nextState.discharges) {
            const nextPos = { x: discharge.position.x + discharge.direction.dx, y: discharge.position.y + discharge.direction.dy };
            
            if (nextPos.x === player.position.x && nextPos.y === player.position.y) {
                const dmg = 2;
                nextState.player.health = Math.max(0, nextState.player.health - dmg);
                if(dmg > 0) addEffectInternal({ type: 'floating_text', position: player.position, text: `-${dmg}`, color: 'text-yellow-400', duration: 800 });
                if (nextState.player.health === 0 && !causeOfDeath) causeOfDeath = "Elektrischer Schlag";
                pushMsg("ZAP! Elektrische Entladung getroffen.", 'warning');
                continue;
            }
            
            const cellAtNextPos = map[nextPos.y]?.[nextPos.x];
            if (cellAtNextPos === undefined || cellAtNextPos === CellType.WALL || cellAtNextPos === CellType.DOOR_CLOSED) {
                continue;
            }
            
            currentDischarges.push({ ...discharge, position: nextPos });
        }
        nextState.discharges = currentDischarges;
        
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (map[y][x] === CellType.ELECTRICITY && Math.random() < 0.02) {
                    const directions = [-1, 0, 1];
                    let dx = 0, dy = 0;
                    while (dx === 0 && dy === 0) {
                        dx = directions[Math.floor(Math.random() * 3)];
                        dy = directions[Math.floor(Math.random() * 3)];
                    }
                    nextState.discharges.push({
                        id: `${Date.now()}-${Math.random()}`,
                        position: { x, y },
                        direction: { dx, dy }
                    });
                }
            }
        }

        // --- 3. Enemy AI & Combat ---
        const newEnemies: Enemy[] = nextState.enemies.filter(e => e.health > 0);
        const occupiedTiles = new Set(newEnemies.map(e => `${e.position.x},${e.position.y}`));
        // Occupy tiles with player and devices (shields/turrets act as obstacles)
        occupiedTiles.add(`${player.position.x},${player.position.y}`);
        nextState.deployedDevices.forEach(d => occupiedTiles.add(`${d.position.x},${d.position.y}`));
        
        let playerTookDamage = false;

        for (const enemy of newEnemies) {
            if (enemy.type === EnemyType.MERCHANT) continue;

            if (enemy.frozenTurns > 0) {
                enemy.frozenTurns -= 1;
                continue;
            }

            const canSeePlayer = visibleCells.has(`${enemy.position.x},${enemy.position.y}`);

            // Update State
            if (enemy.isHostile) {
                if (canSeePlayer && enemy.aiState === 'patrolling') {
                    enemy.aiState = 'chasing';
                    enemy.patrolTarget = null;
                    pushMsg(`${enemy.name} hat dich entdeckt!`, 'warning');
                } else if (!canSeePlayer && enemy.aiState === 'chasing') {
                    enemy.aiState = 'patrolling';
                }
            }

            // Attack Logic
            const distX = Math.abs(player.position.x - enemy.position.x);
            const distY = Math.abs(player.position.y - enemy.position.y);
            const isAdjacent = distX <= 1 && distY <= 1;

            if (enemy.isHostile && isAdjacent) {
                const enemyRoll = rollDice();
                let damageBonus = 0;
                if (enemyRoll >= 3 && enemyRoll <= 4) damageBonus = 2;
                if (enemyRoll >= 5) damageBonus = 4;
                
                const playerTotalDefense = (nextState.player.armor?.defense ?? 0) + nextState.player.defense;
                let damage = Math.max(0, (enemy.attack + damageBonus) - playerTotalDefense);
                
                if (damage > 0) {
                    nextState.player.health = Math.max(0, nextState.player.health - damage);
                    addEffectInternal({ type: 'floating_text', position: player.position, text: `-${damage}`, color: 'text-red-500', duration: 800 });
                    if (nextState.player.health === 0 && !causeOfDeath) causeOfDeath = enemy.name;
                    playerTookDamage = true;
                    pushMsg(`${enemy.name} trifft dich für ${damage} Schaden!`, 'combat-enemy');
                    stopWalkingRef.current = true;
                } else {
                    addEffectInternal({ type: 'floating_text', position: player.position, text: "Block", color: 'text-gray-500', duration: 800 });
                    pushMsg(`${enemy.name} greift an und verfehlt.`, 'combat-enemy');
                }
                continue; 
            }
            
            // Movement Logic
            let targetPos: Position | null = null;
            let madeMove = false;

            if (enemy.isHostile && enemy.aiState === 'chasing') {
                targetPos = player.position;
                const dx = targetPos.x - enemy.position.x;
                const dy = targetPos.y - enemy.position.y;

                let moveX = Math.sign(dx);
                let moveY = Math.sign(dy);

                if (enemy.type === EnemyType.SMALL_DRONE && moveX !== 0 && moveY !== 0) {
                    const diagPos = { x: enemy.position.x + moveX, y: enemy.position.y + moveY };
                    if (map[diagPos.y]?.[diagPos.x] !== CellType.WALL && !occupiedTiles.has(`${diagPos.x},${diagPos.y}`)) {
                        occupiedTiles.delete(`${enemy.position.x},${enemy.position.y}`);
                        enemy.position = diagPos;
                        occupiedTiles.add(`${diagPos.x},${diagPos.y}`);
                        madeMove = true;
                    }
                }

                if (madeMove) continue;

                if (moveX !== 0 && moveY !== 0) {
                    if (Math.random() < 0.5) moveX = 0; else moveY = 0;
                }

                const nextPos = { x: enemy.position.x + moveX, y: enemy.position.y + moveY };
                if (map[nextPos.y]?.[nextPos.x] !== CellType.WALL && !occupiedTiles.has(`${nextPos.x},${nextPos.y}`)) {
                    occupiedTiles.delete(`${enemy.position.x},${enemy.position.y}`);
                    enemy.position = nextPos;
                    occupiedTiles.add(`${nextPos.x},${nextPos.y}`);
                }

            } else {
                if (!enemy.patrolTarget || (enemy.position.x === enemy.patrolTarget.x && enemy.position.y === enemy.patrolTarget.y)) {
                    let foundTarget = false;
                    for (let i = 0; i < 10; i++) {
                        const patrolRadius = 8;
                        const targetX = enemy.position.x + Math.floor(Math.random() * (patrolRadius * 2 + 1)) - patrolRadius;
                        const targetY = enemy.position.y + Math.floor(Math.random() * (patrolRadius * 2 + 1)) - patrolRadius;
                        if (targetX > 0 && targetX < MAP_WIDTH && targetY > 0 && targetY < MAP_HEIGHT && map[targetY][targetX] !== CellType.WALL) {
                            enemy.patrolTarget = { x: targetX, y: targetY };
                            foundTarget = true;
                            break;
                        }
                    }
                    if (!foundTarget) continue;
                }
                
                targetPos = enemy.patrolTarget;
                if (!targetPos) continue;

                const dx = targetPos.x - enemy.position.x;
                const dy = targetPos.y - enemy.position.y;
                if(dx === 0 && dy === 0) {
                    enemy.patrolTarget = null;
                    continue;
                }

                let moveX = Math.sign(dx);
                let moveY = Math.sign(dy);
                if (moveX !== 0 && moveY !== 0) {
                    if (Math.random() < 0.5) moveX = 0; else moveY = 0;
                }

                const nextPos = { x: enemy.position.x + moveX, y: enemy.position.y + moveY };
                if (map[nextPos.y]?.[nextPos.x] !== CellType.WALL && !occupiedTiles.has(`${nextPos.x},${nextPos.y}`)) {
                     occupiedTiles.delete(`${enemy.position.x},${enemy.position.y}`);
                     enemy.position = nextPos;
                     occupiedTiles.add(`${nextPos.x},${nextPos.y}`);
                }
            }
        }
        nextState.enemies = newEnemies;

        if (playerTookDamage) {
            nextState.playerHurt = true;
            playSound('hit');
            setTimeout(() => {
                setGameState(s => ({ ...s, playerHurt: false }));
            }, 200);
        }

        if (nextState.player.health <= 0 && !nextState.isGameOver) {
             saveHighscore({ 
                name: prevState.playerName, 
                score: prevState.player.credits, 
                depth: prevState.depth,
                date: new Date().toISOString(),
                killedBy: causeOfDeath || "Unbekannt"
            });
             setTimeout(onGameOver, 1000);
             return {
                 ...nextState,
                 messageHistory: [...nextState.messageHistory, { id: Date.now(), text: "KRITISCHES SYSTEMVERSAGEN. LEBENSZEICHEN VERLOREN.", type: 'warning', timestamp: Date.now() }],
                 isGameOver: true,
             };
        }
        
        if (nextState.messageHistory.length > 50) {
            nextState.messageHistory = nextState.messageHistory.slice(nextState.messageHistory.length - 50);
        }

        return nextState;
    });
  }, [onGameOver]);

  const goToLevel = useCallback((newDepth: number) => {
    isWalkingRef.current = false;
    stopWalkingRef.current = false;

    const { map, terminals, healingTerminals, revealedCells, depth, enemies, groundItems, player } = gameState;
    const currentLevelState: CachedLevelState = { map, terminals, healingTerminals, depth, revealedCells, enemies, groundItems };
    const newCache = new Map(levelCache);
    newCache.set(depth, currentLevelState);
    setLevelCache(newCache);

    const isGoingDeeper = newDepth > depth;

    if (newCache.has(newDepth)) {
        const cached = newCache.get(newDepth) as CachedLevelState | undefined;
        if (!cached) return;

        let newPlayerPos: Position | undefined;
        
        const findTile = (tile: CellType) => {
            for(let y = 0; y < cached.map.length; y++) {
                const x = cached.map[y].indexOf(tile);
                if (x !== -1) return { x, y };
            }
            return undefined;
        }

        newPlayerPos = isGoingDeeper ? findTile(CellType.ENTRANCE) : findTile(CellType.EXIT);
        if (!newPlayerPos && !isGoingDeeper && newDepth === 15) {
             newPlayerPos = findTile(CellType.SHUTTLE);
        }
        
        if (!newPlayerPos) newPlayerPos = gameState.player.position; 
        
        setGameState(prevState => ({
            ...prevState,
            ...cached,
            player: { ...prevState.player, position: newPlayerPos! },
            discharges: [],
            deployedDevices: [],
            visualEffects: [],
        }));
        addMessage(`Transfer zu Sektor ${newDepth} abgeschlossen.`, 'info');
        updateVisibility(cached.map, { position: newPlayerPos!, class: player.class }, cached.revealedCells);
        return;
    }

    const { map: newMap, playerStart, terminals: newTerminals, healingTerminals: newHealingTerminals, enemies: newEnemies } = generateMap(MAP_WIDTH, MAP_HEIGHT, 30, 6, 12, TERMINAL_COUNT, newDepth);
    
    setGameState(prevState => ({
        ...prevState,
        map: newMap,
        terminals: newTerminals,
        healingTerminals: newHealingTerminals,
        enemies: newEnemies,
        player: { ...prevState.player, position: playerStart },
        depth: newDepth,
        revealedCells: new Set<string>(),
        visibleCells: new Set<string>(),
        discharges: [],
        deployedDevices: [],
        visualEffects: [],
        groundItems: [],
    }));
    addMessage(`Betrete Sektor ${newDepth}...`, 'info');
    updateVisibility(newMap, { position: playerStart, class: player.class }, new Set<string>());
  }, [gameState, levelCache, updateVisibility]);


  const initializeGame = useCallback((playerName: string, selectedClass: CharacterClass) => {
    isWalkingRef.current = false;
    stopWalkingRef.current = false;
    const { map, playerStart, terminals, healingTerminals, enemies } = generateMap(MAP_WIDTH, MAP_HEIGHT, 30, 6, 12, TERMINAL_COUNT, 1);
    
    let maxHp = 40;
    let initialInventory: AnyItem[] = [
        { id: 999, name: "Notfall-Stim", cost: 0, effect: 'HEAL', value: 20, description: "Standard-Ausrüstung." } as Consumable 
    ];
    let startWeapon: Weapon | null = null;
    let startArmor: Armor | null = null;
    let revealed = new Set<string>();
    let baseStrength = 0;
    let baseDefense = 0;
    let baseIntelligence = 0;
    let ammo = 20;

    switch (selectedClass) {
        case 'MARINE':
            maxHp = 50; 
            baseStrength = 1;
            ammo = 30;
            startWeapon = WEAPONS.find(w => w.name === "Brecheisen") || null;
            startArmor = ARMORS.find(a => a.name === "Verstärkte Weste") || null;
            break;
        case 'TECHNICIAN':
            ammo = 15;
            baseIntelligence = 2; // Tech starts smarter
            const emp = CONSUMABLES.find(c => c.name === "EMP-Granate");
            if (emp) initialInventory.push(emp);
            startWeapon = WEAPONS.find(w => w.name === "Laser-Pistole") || null; // Technician starts with ranged
            break;
        case 'SCOUT':
            ammo = 40;
             for(let y = 0; y < MAP_HEIGHT; y++) {
                for(let x = 0; x < MAP_WIDTH; x++) {
                    if (map[y][x] !== CellType.WALL) {
                         revealed.add(`${x},${y}`);
                    }
                }
            }
            startWeapon = WEAPONS.find(w => w.name === "Laser-Pistole") || null;
            const drone = CONSUMABLES.find(c => c.name === "Aufklärungsdrohne");
            if (drone) initialInventory.push(drone);
            break;
    }

    const newPlayerState = {
        ...initialState.player,
        name: playerName,
        class: selectedClass,
        position: playerStart,
        health: maxHp,
        maxHealth: maxHp,
        inventory: initialInventory,
        weapon: startWeapon,
        armor: startArmor,
        level: 1,
        xp: 0,
        maxXp: 100,
        strength: baseStrength,
        defense: baseDefense,
        intelligence: baseIntelligence,
        ammo: ammo,
        maxAmmo: 50,
        quickSlots: [null, null] as [Consumable | null, Consumable | null],
    };

    setGameState({
      ...initialState,
      map,
      player: newPlayerState,
      playerName: playerName,
      terminals,
      healingTerminals,
      enemies,
      revealedCells: revealed,
      uniqueItemFound: false, // Reset unique item state
      messageHistory: [{ id: 1, text: `System initialisiert. Klasse: ${selectedClass}. Willkommen, Pilot.`, type: 'info', timestamp: Date.now() }],
    });
    setLevelCache(new Map());
    updateVisibility(map, { position: playerStart, class: selectedClass }, revealed);
  }, [updateVisibility]);

  const applyLevelUp = useCallback((type: 'HP' | 'STR' | 'DEF' | 'INT') => {
      setGameState(prevState => {
          const newPlayer = { ...prevState.player };
          let msg = "";
          
          switch(type) {
              case 'HP':
                  newPlayer.maxHealth += 5;
                  newPlayer.health = Math.min(newPlayer.health + 5, newPlayer.maxHealth); 
                  msg = "Hüllenstärke erhöht (+5 Max HP).";
                  break;
              case 'STR':
                  newPlayer.strength += 1;
                  msg = "Kampfkraft erhöht (+1 ATK).";
                  break;
              case 'DEF':
                  newPlayer.defense += 1;
                  msg = "Panzerung verstärkt (+1 DEF).";
                  break;
              case 'INT':
                  newPlayer.intelligence += 1;
                  msg = "CPU Taktung optimiert (+1 INT, besseres Hacking).";
                  break;
          }
          
          playSound('interact');
          
          return {
              ...prevState,
              player: newPlayer,
              isLevelUpScreenOpen: false,
              messageHistory: [...prevState.messageHistory, { id: Date.now(), text: msg, type: 'info', timestamp: Date.now() }]
          };
      });
  }, []);

  const shootAt = useCallback((targetEnemy: Enemy) => {
     setGameState(prevState => {
         const { player, enemies, groundItems, depth } = prevState;
         const weapon = player.weapon;
         
         if (!weapon || weapon.range <= 1 || player.ammo < weapon.ammoCost) {
             return prevState; // Should be handled before call, but safety check
         }

         const newEnemies = [...enemies];
         const enemyIndex = newEnemies.findIndex(e => e.id === targetEnemy.id);
         if (enemyIndex === -1) return prevState;
         
         const enemy = { ...newEnemies[enemyIndex] };
         
         // Shoot Logic
         const newPlayer = { ...player, ammo: player.ammo - weapon.ammoCost };
         
         // Damage Calc
         const damageBonus = Math.random() < 0.2 ? 2 : 0; // Critical chance
         const totalDamage = weapon.attack + damageBonus; // Ranged weapons rely mostly on weapon damage
         
         enemy.health -= totalDamage;
         enemy.justHit = true;
         enemy.aiState = 'chasing'; // Aggro
         
         playSound('shoot');
         
         let msg = `Du schießt auf ${enemy.name}: ${totalDamage} Schaden.`;
         const msgType: MessageType = 'combat-player';
         
         let levelUpTriggered = false;
         let newGroundItems = [...groundItems];
         let newUniqueItemFound = prevState.uniqueItemFound;
         
         if (enemy.health <= 0) {
              newEnemies.splice(enemyIndex, 1);
              const creditsGained = Math.floor(Math.random() * 15) + 5;
              newPlayer.credits += creditsGained;
              msg = `${enemy.name} eliminiert! ${creditsGained} Credits.`;
              
              const xpGain = enemy.xpValue || 10;
              newPlayer.xp += xpGain;
              
              if (newPlayer.xp >= newPlayer.maxXp) {
                  newPlayer.xp -= newPlayer.maxXp;
                  newPlayer.level += 1;
                  newPlayer.maxXp = Math.floor(newPlayer.maxXp * 1.5);
                  newPlayer.health = Math.min(newPlayer.health + 5, newPlayer.maxHealth);
                  levelUpTriggered = true;
                  playSound('levelup');
              }
              
              const dropChance = enemy.isBoss ? 1.0 : 0.25; 
              if (Math.random() < dropChance) {
                    const droppedItem = getLootItem(depth + (enemy.isBoss ? 3 : 0), newUniqueItemFound);
                    newGroundItems.push({
                        id: `${Date.now()}-loot`,
                        item: droppedItem,
                        position: enemy.position,
                    });
                    if (droppedItem.isUnique) newUniqueItemFound = true;
              }
         } else {
             newEnemies[enemyIndex] = enemy;
         }
         
         // Visuals - Ranged Projectile
         const newVisualEffects = [...prevState.visualEffects];
         newVisualEffects.push({
             id: Math.random().toString(36),
             type: 'projectile',
             char: '*',
             color: 'text-red-500 font-bold',
             startPos: player.position,
             endPos: enemy.position,
             startTime: Date.now(),
             duration: 200,
         });

         newVisualEffects.push({
             id: Math.random().toString(36),
             type: 'floating_text',
             text: `${totalDamage}`,
             color: 'text-yellow-400',
             position: enemy.position,
             startTime: Date.now(),
             duration: 800,
         });


         setTimeout(processTurn, 150); // Small delay for animation
         
         return {
             ...prevState,
             player: newPlayer,
             enemies: newEnemies,
             groundItems: newGroundItems,
             isLevelUpScreenOpen: levelUpTriggered,
             uniqueItemFound: newUniqueItemFound,
             visualEffects: newVisualEffects,
             messageHistory: [...prevState.messageHistory, { id: Date.now(), text: msg, type: msgType, timestamp: Date.now() }]
         };
     });
     
     // Clear hit flash
     setTimeout(() => {
          setGameState(s => {
              const clearedEnemies = s.enemies.map(e => e.id === targetEnemy.id ? { ...e, justHit: false } : e);
              return { ...s, enemies: clearedEnemies };
          });
      }, 150);
     
  }, [processTurn]);

  const fireNearestEnemy = useCallback(() => {
      const { player, enemies, visibleCells } = gameState;
      if (!player.weapon || player.weapon.range <= 1) {
          addMessage("Keine Fernkampfwaffe ausgerüstet.", 'warning');
          return;
      }
      if (player.ammo < player.weapon.ammoCost) {
          addMessage("Keine Munition! Nutze Nahkampf.", 'warning');
          playSound('reload');
          return;
      }
      
      let nearestDist = Infinity;
      let target: Enemy | null = null;
      
      enemies.forEach(e => {
          if (!visibleCells.has(`${e.position.x},${e.position.y}`)) return;
          const dist = Math.sqrt((e.position.x - player.position.x)**2 + (e.position.y - player.position.y)**2);
          if (dist <= player.weapon!.range && dist < nearestDist) {
              nearestDist = dist;
              target = e;
          }
      });
      
      if (target) {
          shootAt(target);
      } else {
          addMessage("Kein Ziel in Reichweite.", 'info');
      }
  }, [gameState, shootAt]);

  const movePlayer = useCallback((dx: number, dy: number): boolean => {
    if (isLoading || gameState.player.health <= 0 || gameState.isGameOver || gameState.isShopOpen || gameState.isMinimapOpen || gameState.isLevelUpScreenOpen) return false;
    
    // Check for Level Transition immediately to avoid side-effects in setGameState
    const { player, map, depth, enemies, deployedDevices } = gameState;
    const { x, y } = player.position;
    const newX = x + dx;
    const newY = y + dy;

    if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
        // Check for blockers
        const deviceAtTarget = deployedDevices.find(d => d.position.x === newX && d.position.y === newY);
        const enemyAtTarget = enemies.find(e => e.position.x === newX && e.position.y === newY);
        
        if (!deviceAtTarget && !enemyAtTarget) {
            const targetCell = map[newY][newX];
            
            if (targetCell === CellType.EXIT) {
                stopWalkingRef.current = true;
                goToLevel(depth + 1);
                return true;
            }
            if (targetCell === CellType.ENTRANCE && depth > 1) {
                stopWalkingRef.current = true;
                goToLevel(depth - 1);
                return true;
            }
        }
    }

    let moveSuccessful = false;

    setGameState(prevState => {
      const { player, map, depth, revealedCells, enemies, deployedDevices } = prevState;
      const { x, y } = player.position;
      const newX = x + dx;
      const newY = y + dy;
      let newPlayerPos = { x, y };
      const currentMessages: GameMessage[] = [...prevState.messageHistory];

      const pushLog = (text: string, type: MessageType) => {
           currentMessages.push({ id: Date.now() + Math.random(), text, type, timestamp: Date.now() });
      };

      // Update Move Direction
      if (dx !== 0 || dy !== 0) {
          player.lastMoveDir = { x: Math.sign(dx), y: Math.sign(dy) };
      }

      if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) {
        return { ...prevState, player: { ...player } }; // Just update direction
      }

      // Check deployed devices collision (Shields block movement)
      const deviceAtTarget = deployedDevices.find(d => d.position.x === newX && d.position.y === newY);
      if (deviceAtTarget) {
          stopWalkingRef.current = true;
          pushLog(`Weg blockiert durch ${deviceAtTarget.type === 'SHIELD' ? 'Schild' : 'Gerät'}.`, 'info');
          return { ...prevState, messageHistory: currentMessages, player: { ...player } };
      }

      // --- Combat: Player Attacks (Melee) ---
      const enemyAtTarget = enemies.find(e => e.position.x === newX && e.position.y === newY);
      if (enemyAtTarget) {
          if (enemyAtTarget.isHostile) {
              const newEnemies = [...enemies];
              const enemyIndex = newEnemies.findIndex(e => e.id === enemyAtTarget.id);
              const targetEnemy = { ...newEnemies[enemyIndex] };
              
              const playerRoll = rollDice();
              let damageBonus = 0;
              if (playerRoll >= 3 && playerRoll <= 4) damageBonus = 2;
              if (playerRoll >= 5) damageBonus = 4;
              
              const classDamageBonus = player.class === 'MARINE' ? 2 : 0;
              
              // Determine weapon damage (Melee or Ranged-Fallback)
              let weaponDamage = 0;
              let isWeakMelee = false;
              if (player.weapon) {
                  if (player.weapon.range > 1) {
                      // Using ranged weapon in melee
                      weaponDamage = player.weapon.meleeSidearmDamage || Math.max(1, Math.floor(player.weapon.attack / 4));
                      isWeakMelee = true;
                  } else {
                      // Using melee weapon
                      weaponDamage = player.weapon.attack;
                  }
              }

              const totalAttack = weaponDamage + player.strength + player.attackBuff + damageBonus + classDamageBonus;

              targetEnemy.health -= totalAttack;
              targetEnemy.justHit = true;
              
              playSound('hit');
              const attackDesc = isWeakMelee ? "Pistolenschlag" : "Schlag";
              pushLog(`Du triffst ${targetEnemy.name} (${attackDesc}) für ${totalAttack} Schaden.`, 'combat-player');
              
              const newVisualEffects = [...prevState.visualEffects];
              newVisualEffects.push({
                  id: Math.random().toString(36),
                  type: 'particle',
                  char: "'",
                  color: 'text-yellow-500 font-bold',
                  position: targetEnemy.position,
                  startTime: Date.now(),
                  duration: 400
              });
              newVisualEffects.push({
                  id: Math.random().toString(36),
                  type: 'floating_text',
                  text: `${totalAttack}`,
                  color: 'text-yellow-500',
                  position: targetEnemy.position,
                  startTime: Date.now(),
                  duration: 800
              });

              let levelUpTriggered = false;
              let newPlayerState = { ...player };
              let newUniqueItemFound = prevState.uniqueItemFound;

              if (targetEnemy.health <= 0) {
                  newEnemies.splice(enemyIndex, 1);
                  const creditsGained = Math.floor(Math.random() * 15) + 5;
                  newPlayerState.credits += creditsGained;
                  pushLog(`${targetEnemy.name} zerstört! ${creditsGained} Credits geborgen.`, 'victory');
                  
                  const xpGain = targetEnemy.xpValue || 10;
                  newPlayerState.xp += xpGain;
                  pushLog(`+${xpGain} XP`, 'info');

                  if (newPlayerState.xp >= newPlayerState.maxXp) {
                      newPlayerState.xp -= newPlayerState.maxXp;
                      newPlayerState.level += 1;
                      newPlayerState.maxXp = Math.floor(newPlayerState.maxXp * 1.5);
                      newPlayerState.health = Math.min(newPlayerState.health + 5, newPlayerState.maxHealth); 
                      levelUpTriggered = true;
                      playSound('levelup');
                      pushLog(`SYSTEM UPGRADE: LEVEL ${newPlayerState.level} ERREICHT!`, 'levelup');
                  }
                  
                  let newGroundItems = [...prevState.groundItems];
                  const dropChance = targetEnemy.isBoss ? 1.0 : 0.25; 

                  if (Math.random() < dropChance) {
                    const droppedItem = getLootItem(depth + (targetEnemy.isBoss ? 3 : 0), newUniqueItemFound);
                    newGroundItems.push({
                        id: `${Date.now()}-loot`,
                        item: droppedItem,
                        position: targetEnemy.position,
                    });
                    if (droppedItem.isUnique) newUniqueItemFound = true;
                    pushLog("Es hat etwas fallengelassen!", 'loot');
                  }
                  
                  setTimeout(processTurn, 100); 
                  moveSuccessful = true;
                  return { 
                      ...prevState, 
                      enemies: newEnemies, 
                      player: newPlayerState, 
                      groundItems: newGroundItems, 
                      uniqueItemFound: newUniqueItemFound,
                      messageHistory: currentMessages,
                      visualEffects: newVisualEffects,
                      isLevelUpScreenOpen: levelUpTriggered
                  };
              }

              newEnemies[enemyIndex] = targetEnemy;
              
              setTimeout(() => {
                  setGameState(s => {
                      const clearedEnemies = s.enemies.map(e => e.id === targetEnemy.id ? { ...e, justHit: false } : e);
                      return { ...s, enemies: clearedEnemies };
                  });
              }, 150);

              setTimeout(processTurn, 200);
              moveSuccessful = true;
              return { ...prevState, enemies: newEnemies, messageHistory: currentMessages, visualEffects: newVisualEffects };

          } else {
              const typeName = enemyAtTarget.type === EnemyType.MERCHANT ? "Händler" : "Roboter";
              stopWalkingRef.current = true;
              pushLog(`Weg blockiert durch ${typeName}.`, 'info');
              return { ...prevState, messageHistory: currentMessages, player: { ...player } };
          }
      }

      // --- Movement ---
      const targetCell = map[newY][newX];
      newPlayerPos = { x: newX, y: newY };

      if (targetCell === CellType.ARTIFACT) {
        playSound('artifact');
        const newMap = map.map(row => [...row]);
        newMap[newY][newX] = CellType.FLOOR;
        const newCredits = prevState.player.credits + 50;
        
        // Calculate FOV in-line
        const fovData = computeVisibility(newMap, { ...player, position: newPlayerPos }, revealedCells);
        
        pushLog("Artefakt geborgen! +50 Credits.", 'victory');
        
        setTimeout(processTurn, 0);
        moveSuccessful = true;
        return {
            ...prevState,
            map: newMap,
            player: { ...prevState.player, position: newPlayerPos, credits: newCredits },
            messageHistory: currentMessages,
            visibleCells: fovData.visibleCells,
            revealedCells: fovData.revealedCells,
        }
      }

      switch(targetCell) {
        case CellType.WALL:
          stopWalkingRef.current = true;
          pushLog("Wand im Weg.", 'info');
          return { ...prevState, messageHistory: currentMessages, player: { ...player } };
        case CellType.DOOR_CLOSED:
          // Open door logic
          const mapWithOpenDoor = map.map(row => [...row]);
          mapWithOpenDoor[newY][newX] = CellType.DOOR_OPEN;
          newPlayerPos = { x: newX, y: newY };
          pushLog("Tür geöffnet.", 'info');
          playSound('interact');
          
          // Calculate visibility with NEW map
          const fovDataDoor = computeVisibility(mapWithOpenDoor, { ...player, position: newPlayerPos }, revealedCells);
          
          setTimeout(processTurn, 0);
          moveSuccessful = true;
          
          return {
              ...prevState,
              map: mapWithOpenDoor,
              player: { ...player, position: newPlayerPos },
              visibleCells: fovDataDoor.visibleCells,
              revealedCells: fovDataDoor.revealedCells,
              messageHistory: currentMessages,
          };

        case CellType.CHEST_CLOSED:
            stopWalkingRef.current = true;
            pushLog("Verschlossener Container. [E] zum Öffnen.", 'info');
            return { ...prevState, messageHistory: currentMessages, player: { ...player } };
        case CellType.BARREL:
             stopWalkingRef.current = true;
             pushLog("Ein Fass. Könnte nützlich sein. [E] zum Untersuchen.", 'info');
             return { ...prevState, messageHistory: currentMessages, player: { ...player } };
        case CellType.CHEST_OPEN:
        case CellType.BARREL_OPEN:
             break;
        case CellType.HEALING_TERMINAL:
             stopWalkingRef.current = true;
             pushLog("Med-Station. [E] benutzen.", 'info');
             return { ...prevState, messageHistory: currentMessages, player: { ...player } };
        case CellType.HEALING_TERMINAL_USED:
             break;
        case CellType.EXIT:
          stopWalkingRef.current = true;
          return prevState;
        case CellType.SHUTTLE:
           stopWalkingRef.current = true;
           saveHighscore({ 
                name: prevState.playerName, 
                score: prevState.player.credits + 1000,
                depth: prevState.depth,
                date: new Date().toISOString(),
                killedBy: "Mission Erfolgreich"
            });
           playSound('interact');
           return {
               ...prevState,
               isGameOver: true,
               isVictory: true,
               messageHistory: [...currentMessages, { id: Date.now(), text: "Shuttle aktiviert. Mission erfolgreich.", type: 'victory', timestamp: Date.now() }],
               player: { ...prevState.player, position: newPlayerPos },
           }; 
        case CellType.ENTRANCE:
          if (depth > 1) {
            stopWalkingRef.current = true;
            return prevState;
          }
          pushLog("Keine Rückkehr möglich.", 'warning');
          return {...prevState, messageHistory: currentMessages, player: { ...player }};
      }

      // Item Pickup
      let newPlayer = {...prevState.player, position: newPlayerPos, lastMoveDir: player.lastMoveDir }; // Ensure new position is set
      let newGroundItems = [...prevState.groundItems];
      const itemOnGroundIndex = newGroundItems.findIndex(item => item.position.x === newX && item.position.y === newY);
      
      if (itemOnGroundIndex !== -1) {
          playSound('heal'); 
          const foundItem = newGroundItems[itemOnGroundIndex].item;
          newPlayer.inventory = [...newPlayer.inventory, foundItem];
          pushLog(`${foundItem.name} aufgehoben.`, 'loot');
          newGroundItems.splice(itemOnGroundIndex, 1);
      }
      
      for (const termPos of prevState.terminals) {
        if(Math.abs(termPos.x - newPlayerPos.x) <= 1 && Math.abs(termPos.y - newPlayerPos.y) <= 1) {
          pushLog("Terminal in Reichweite. [E] zum Hacken.", 'info');
          break;
        }
      }

      // Generate Flavor Text
      const flavor = getFlavorText(0.06, prevState.hazardZone);
      if (flavor) {
          pushLog(flavor, 'flavor');
      }

      // Atomic Update: Calculate visibility and update state in one go to prevent lagging FOV
      const fovData = computeVisibility(map, { ...player, position: newPlayerPos }, revealedCells);

      setTimeout(processTurn, 0);
      moveSuccessful = true;

      // Ensure history limit
      if (currentMessages.length > 50) currentMessages.splice(0, currentMessages.length - 50);

      return {
        ...prevState,
        player: newPlayer,
        groundItems: newGroundItems,
        messageHistory: currentMessages,
        visibleCells: fovData.visibleCells,
        revealedCells: fovData.revealedCells,
      };
    });
    
    return moveSuccessful;
  }, [isLoading, gameState, goToLevel, processTurn]);

  
  const [walkPath, setWalkPath] = useState<Position[]>([]);
  
  const startWalking = useCallback((targetX: number, targetY: number) => {
      if (isLoading || gameState.isGameOver || gameState.isShopOpen || gameState.isMinimapOpen || gameState.isLevelUpScreenOpen) return;
      
      const { enemies, visibleCells, player } = gameState;

      // Check for ranged attack opportunity first
      const enemy = enemies.find(e => e.position.x === targetX && e.position.y === targetY);
      const isVisible = visibleCells.has(`${targetX},${targetY}`);
      
      if (enemy && isVisible && enemy.isHostile && player.weapon && player.weapon.range > 1) {
          const dist = Math.sqrt((player.position.x - targetX)**2 + (player.position.y - targetY)**2);
          if (dist <= player.weapon.range && dist > 1.5) { // Ensure not melee range (approx 1.41 for diag)
              if (player.ammo >= player.weapon.ammoCost) {
                  shootAt(enemy);
                  return;
              } else {
                  addMessage("Waffe leer! Nachladen oder Nahkampf.", 'warning');
                  playSound('reload');
              }
          }
      }

      // Normal movement logic
      const path = findPath(gameState.player.position, {x: targetX, y: targetY}, gameState.map);
      if (path && path.length > 0) {
          setWalkPath(path);
      } else {
          addMessage("Kann Ort nicht erreichen.", 'warning');
      }
  }, [gameState, isLoading, shootAt]);

  useEffect(() => {
      if (walkPath.length === 0) return;

      const timer = setTimeout(() => {
          if (stopWalkingRef.current) {
              setWalkPath([]);
              stopWalkingRef.current = false;
              return;
          }

          const nextStep = walkPath[0];
          const dx = nextStep.x - gameState.player.position.x;
          const dy = nextStep.y - gameState.player.position.y;
          
          const moved = movePlayer(dx, dy);
          
          if (moved) {
              setWalkPath(prev => prev.slice(1));
          } else {
              setWalkPath([]);
          }
      }, 100);

      return () => clearTimeout(timer);
  }, [walkPath, movePlayer, gameState.player.position]);


  const hoverTile = useCallback((x: number, y: number) => {
      if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
          setGameState(s => s.hoverInfo ? { ...s, hoverInfo: null } : s);
          return;
      }
      
      const { map, visibleCells, revealedCells, enemies, groundItems, deployedDevices } = gameState;
      const isVisible = visibleCells.has(`${x},${y}`);
      const isRevealed = revealedCells.has(`${x},${y}`);
      
      if (!isRevealed && !isVisible) {
           setGameState(s => s.hoverInfo ? { ...s, hoverInfo: null } : s);
           return;
      }

      const cell = map[y][x];
      const enemy = enemies.find(e => e.position.x === x && e.position.y === y);
      const item = groundItems.find(i => i.position.x === x && i.position.y === y);
      const device = deployedDevices.find(d => d.position.x === x && d.position.y === y);

      if (isVisible && device) {
          const desc = device.type === 'TURRET' 
              ? `Selbstschussanlage [${device.lifeTime} Runden]` 
              : `Schildgenerator [${device.lifeTime} Runden]`;
          setGameState(s => s.hoverInfo !== desc ? { ...s, hoverInfo: desc } : s);
          return;
      }
      
      const description = getTileDescription(x, y, cell, isVisible, isRevealed, enemy, item);
      
      setGameState(s => s.hoverInfo !== description ? { ...s, hoverInfo: description } : s);

  }, [gameState]);


  const interact = useCallback(async () => {
    if (isLoading || gameState.player.health <= 0 || gameState.isGameOver || gameState.isShopOpen || gameState.isLevelUpScreenOpen) return;
    
    setWalkPath([]); 
    
    const { player, terminals, healingTerminals, map, enemies, depth } = gameState;
    let interactionTarget: { pos: Position, type: 'terminal' | 'chest' | 'barrel' | 'healer' | 'merchant' } | null = null;
    const directions = [[0,0], [-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]];

    for(const [dy, dx] of directions) {
      const checkX = player.position.x + dx;
      const checkY = player.position.y + dy;
      
      if (checkX < 0 || checkX >= MAP_WIDTH || checkY < 0 || checkY >= MAP_HEIGHT) continue;

      const cellType = map[checkY][checkX];
      const enemyAtPos = enemies.find(e => e.position.x === checkX && e.position.y === checkY);

      if (enemyAtPos?.type === EnemyType.MERCHANT) {
          interactionTarget = { pos: { x: checkX, y: checkY }, type: 'merchant' };
          break;
      }
      if(terminals.some(t => t.x === checkX && t.y === checkY) && (cellType === CellType.TERMINAL_OFF || cellType === CellType.TERMINAL_ON)) {
          interactionTarget = { pos: { x: checkX, y: checkY }, type: 'terminal' };
          break;
      }
      if(healingTerminals.some(t => t.x === checkX && t.y === checkY) && cellType === CellType.HEALING_TERMINAL) {
          interactionTarget = { pos: { x: checkX, y: checkY }, type: 'healer' };
          break;
      }
      if(cellType === CellType.CHEST_CLOSED) {
          interactionTarget = { pos: { x: checkX, y: checkY }, type: 'chest' };
          break;
      }
      if(cellType === CellType.BARREL) {
          interactionTarget = { pos: { x: checkX, y: checkY }, type: 'barrel' };
          break;
      }
    }

    if (!interactionTarget) {
      addMessage("Nichts zum Interagieren.", 'info');
      return;
    }
    
    if (interactionTarget.type === 'merchant') {
        playSound('interact');
        setGameState(prevState => ({ ...prevState, isShopOpen: true }));
        return;
    }

    if (interactionTarget.type === 'chest') {
        playSound('heal');
        setGameState(prevState => {
            const newMap = prevState.map.map(row => [...row]);
            newMap[interactionTarget!.pos.y][interactionTarget!.pos.x] = CellType.CHEST_OPEN;
            setTimeout(processTurn, 0);

            let msg = "";
            let newGroundItems = [...prevState.groundItems];
            let newPlayer = { ...prevState.player };
            let newUniqueItemFound = prevState.uniqueItemFound;

            if (Math.random() < 0.5) {
                const foundItem = getLootItem(depth, newUniqueItemFound);
                newGroundItems.push({ id: `${Date.now()}-chest`, item: foundItem, position: interactionTarget!.pos });
                if (foundItem.isUnique) newUniqueItemFound = true;
                msg = `Gefunden: ${foundItem.name}!`;
            } else {
                const creditsFound = Math.floor(Math.random() * 25) + 10;
                newPlayer.credits += creditsFound;
                msg = `Gefunden: ${creditsFound} Credits.`;
            }

            return {
                ...prevState,
                map: newMap,
                player: newPlayer,
                groundItems: newGroundItems,
                uniqueItemFound: newUniqueItemFound,
                messageHistory: [...prevState.messageHistory, { id: Date.now(), text: msg, type: 'loot', timestamp: Date.now() }]
            };
        });
        return;
    }

    if (interactionTarget.type === 'barrel') {
        const roll = Math.random();
        if (roll < 0.15) {
             // Explosion!
             playSound('shoot');
             setGameState(prevState => {
                 const newMap = prevState.map.map(row => [...row]);
                 newMap[interactionTarget!.pos.y][interactionTarget!.pos.x] = CellType.BARREL_OPEN;
                 
                 let newPlayer = { ...prevState.player };
                 const dmg = 5;
                 
                 // Check if player is adjacent (AoE logic roughly)
                 const dist = Math.sqrt(Math.pow(newPlayer.position.x - interactionTarget!.pos.x, 2) + Math.pow(newPlayer.position.y - interactionTarget!.pos.y, 2));
                 if (dist <= 1.5) {
                     newPlayer.health = Math.max(0, newPlayer.health - dmg);
                 }
                 
                 const newVisualEffects = [...prevState.visualEffects];
                 newVisualEffects.push({
                     id: Math.random().toString(),
                     type: 'explosion',
                     char: '*',
                     color: 'text-yellow-500',
                     position: interactionTarget!.pos,
                     radius: 1.5,
                     duration: 400,
                     startTime: Date.now()
                 });

                 setTimeout(processTurn, 100);

                 return {
                     ...prevState,
                     map: newMap,
                     player: newPlayer,
                     visualEffects: newVisualEffects,
                     playerHurt: true,
                     messageHistory: [...prevState.messageHistory, { id: Date.now(), text: "Fass explodiert!", type: 'warning', timestamp: Date.now() }]
                 };
             });
             // Reset hurt flag after animation
             setTimeout(() => setGameState(s => ({ ...s, playerHurt: false })), 200);

        } else {
            // Loot
            playSound('heal');
            setGameState(prevState => {
                const newMap = prevState.map.map(row => [...row]);
                newMap[interactionTarget!.pos.y][interactionTarget!.pos.x] = CellType.BARREL_OPEN;
                setTimeout(processTurn, 0);

                let msg = "";
                let newGroundItems = [...prevState.groundItems];
                let newUniqueItemFound = prevState.uniqueItemFound;

                const foundItem = getLootItem(depth, newUniqueItemFound);
                newGroundItems.push({ id: `${Date.now()}-barrel`, item: foundItem, position: interactionTarget!.pos });
                if (foundItem.isUnique) newUniqueItemFound = true;
                msg = `Fass durchsucht: ${foundItem.name}.`;

                return {
                    ...prevState,
                    map: newMap,
                    groundItems: newGroundItems,
                    uniqueItemFound: newUniqueItemFound,
                    messageHistory: [...prevState.messageHistory, { id: Date.now(), text: msg, type: 'loot', timestamp: Date.now() }]
                };
            });
        }
        return;
    }

    if (interactionTarget.type === 'healer') {
        playSound('heal');
        setGameState(prevState => {
            const newMap = prevState.map.map(row => [...row]);
            newMap[interactionTarget!.pos.y][interactionTarget!.pos.x] = CellType.HEALING_TERMINAL_USED;
            const newHealingTerminals = prevState.healingTerminals.filter(
                t => t.x !== interactionTarget!.pos.x || t.y !== interactionTarget!.pos.y
            );
            setTimeout(processTurn, 0);
            return {
                ...prevState,
                map: newMap,
                healingTerminals: newHealingTerminals,
                player: { ...prevState.player, health: prevState.player.maxHealth },
                messageHistory: [...prevState.messageHistory, { id: Date.now(), text: "Hülle vollständig repariert.", type: 'info', timestamp: Date.now() }]
            };
        });
        return;
    }

    if (interactionTarget.type === 'terminal') {
      const terminalPos = interactionTarget.pos;
      if (map[terminalPos.y][terminalPos.x] === CellType.TERMINAL_ON) {
        addMessage("Daten bereits extrahiert.", 'info');
        return;
      }

      setIsLoading(true);
      addMessage("Starte Download...", 'info');
      playSound('interact');
      const logData = await generateLogEntry();
      if (logData) {
        const newLog: LogEntry = {
          id: gameState.logs.length + 1,
          ...logData,
        };
        
        // Hacking Probability Logic with INT bonus
        let extraReveal = new Set<string>();
        let hackingChance = 0.10; // Marine default
        if (gameState.player.class === 'TECHNICIAN') hackingChance = 0.45;
        if (gameState.player.class === 'SCOUT') hackingChance = 0.15;
        
        // Add Intelligence Bonus (5% per point)
        hackingChance += (gameState.player.intelligence * 0.05);

        const roll = Math.random();
        let hackSuccess = false;

        if (roll < hackingChance) {
            hackSuccess = true;
            const revealRadius = 15; 
            for(let y = terminalPos.y - revealRadius; y <= terminalPos.y + revealRadius; y++) {
                 for(let x = terminalPos.x - revealRadius; x <= terminalPos.x + revealRadius; x++) {
                     if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                         if(Math.sqrt((x-terminalPos.x)**2 + (y-terminalPos.y)**2) <= revealRadius) {
                             extraReveal.add(`${x},${y}`);
                         }
                     }
                 }
            }
        }

        setGameState(prevState => {
          const newMap = prevState.map.map(row => [...row]);
          newMap[terminalPos.y][terminalPos.x] = CellType.TERMINAL_ON;
          setTimeout(processTurn, 0);
          
          const newRevealed = new Set(prevState.revealedCells);
          extraReveal.forEach(k => newRevealed.add(k));

          const newVisualEffects = [...prevState.visualEffects];
          if (hackSuccess) {
              // Add a nice visual effect for successful hack
              newVisualEffects.push({
                 id: Math.random().toString(),
                 type: 'nova',
                 char: '101',
                 color: 'text-green-500 font-bold',
                 position: terminalPos,
                 radius: 8,
                 duration: 1000,
                 startTime: Date.now()
              });
          }

          const msgs: GameMessage[] = [...prevState.messageHistory];
          msgs.push({ id: Date.now(), text: `Neues Log: "${newLog.title}" (PDA ansehen)`, type: 'info', timestamp: Date.now() });
          if (hackSuccess) {
              msgs.push({ id: Date.now() + 1, text: "HACK ERFOLGREICH: Umgebungskarte entschlüsselt.", type: 'victory', timestamp: Date.now() });
          } else {
              msgs.push({ id: Date.now() + 1, text: "HACK FEHLGESCHLAGEN: Kartendaten korrupt.", type: 'warning', timestamp: Date.now() });
          }

          return {
            ...prevState,
            map: newMap,
            revealedCells: newRevealed,
            logs: [...prevState.logs, newLog],
            messageHistory: msgs,
            visualEffects: newVisualEffects
          };
        });
      } else {
        addMessage("Download fehlgeschlagen.", 'warning');
        setTimeout(processTurn, 0);
      }
      setIsLoading(false);
    }
  }, [gameState, isLoading, processTurn]);

  const closeShop = useCallback(() => {
    setGameState(s => ({ ...s, isShopOpen: false }));
    addMessage("Handel beendet.", 'info');
  }, []);

  const buyItem = useCallback((item: AnyItem) => {
      setGameState(prevState => {
          if (prevState.player.credits < item.cost) {
              return { 
                  ...prevState, 
                  messageHistory: [...prevState.messageHistory, { id: Date.now(), text: "Nicht genug Credits.", type: 'warning', timestamp: Date.now() }] 
            };
          }

          const newPlayer = { ...prevState.player };
          newPlayer.credits -= item.cost;
          newPlayer.inventory = [...newPlayer.inventory, item];
          
          playSound('heal');
          return { 
              ...prevState, 
              player: newPlayer, 
              messageHistory: [...prevState.messageHistory, { id: Date.now(), text: `Gekauft: ${item.name}`, type: 'loot', timestamp: Date.now() }]
            };
      });
  }, []);

  const sellItem = useCallback((inventoryIndex: number) => {
      setGameState(prevState => {
          const item = prevState.player.inventory[inventoryIndex];
          if (!item) return prevState;

          const sellPrice = Math.floor(item.cost / 4);
          const newPlayer = { ...prevState.player };
          newPlayer.credits += sellPrice;
          
          const newInventory = [...newPlayer.inventory];
          newInventory.splice(inventoryIndex, 1);
          newPlayer.inventory = newInventory;

          // Check quickslots
          const newQuickSlots = [...newPlayer.quickSlots] as [Consumable | null, Consumable | null];
          if (newQuickSlots[0] === item) newQuickSlots[0] = null;
          if (newQuickSlots[1] === item) newQuickSlots[1] = null;
          newPlayer.quickSlots = newQuickSlots;

          playSound('interact');
          return {
              ...prevState,
              player: newPlayer,
              messageHistory: [...prevState.messageHistory, { id: Date.now(), text: `Verkauft: ${item.name} (+${sellPrice} C)`, type: 'info', timestamp: Date.now() }]
          };
      });
  }, []);

  const buyMapIntel = useCallback(() => {
      setGameState(prevState => {
          const cost = 500; // High cost
          if (prevState.player.credits < cost) {
              return { 
                  ...prevState, 
                  messageHistory: [...prevState.messageHistory, { id: Date.now(), text: "Nicht genug Credits für Kartendaten.", type: 'warning', timestamp: Date.now() }] 
            };
          }

          const newPlayer = { ...prevState.player };
          newPlayer.credits -= cost;

          const newRevealed = new Set(prevState.revealedCells);
          for(let y=0; y<MAP_HEIGHT; y++) {
              for(let x=0; x<MAP_WIDTH; x++) {
                  if (prevState.map[y][x] !== CellType.WALL) {
                      newRevealed.add(`${x},${y}`);
                  }
              }
          }

          playSound('interact');
          return {
              ...prevState,
              player: newPlayer,
              revealedCells: newRevealed,
              messageHistory: [...prevState.messageHistory, { id: Date.now(), text: "Sektor-Karte heruntergeladen.", type: 'victory', timestamp: Date.now() }]
          };
      });
  }, []);

  const applyConsumableEffect = useCallback((consumable: Consumable) => {
      setGameState(prevState => {
           let newPlayer = { ...prevState.player };
           let enemies = [...prevState.enemies];
           let revealedCells = prevState.revealedCells;
           let deployedDevices = [...prevState.deployedDevices];
           let msg = "";
           const newVisualEffects = [...prevState.visualEffects];

           const addEffectInternal = (effect: Omit<VisualEffect, 'id' | 'startTime'>) => {
               newVisualEffects.push({ ...effect, id: Math.random().toString(36), startTime: Date.now() });
           };

           switch(consumable.effect) {
             case 'HEAL':
                 const healAmount = consumable.value;
                 const oldHealth = newPlayer.health;
                 newPlayer.health = Math.min(newPlayer.maxHealth, newPlayer.health + healAmount);
                 msg = `Medikit benutzt. +${newPlayer.health - oldHealth} HP.`;
                 addEffectInternal({ type: 'floating_text', position: newPlayer.position, text: `+${newPlayer.health - oldHealth}`, color: 'text-green-500', duration: 800 });
                 playSound('heal');
                 break;
             case 'BUFF_ATTACK':
                 newPlayer.attackBuff = consumable.value;
                 newPlayer.buffTurns = consumable.duration || 10;
                 msg = `Stim injiziert. +${consumable.value} ATK für ${consumable.duration} Runden.`;
                 playSound('interact');
                 break;
             case 'STUN_AOE':
                 const radius = consumable.value;
                 let stunnedCount = 0;
                 enemies = enemies.map(e => {
                     const dist = Math.sqrt(Math.pow(e.position.x - newPlayer.position.x, 2) + Math.pow(e.position.y - newPlayer.position.y, 2));
                     if (dist <= radius) {
                         stunnedCount++;
                         return { ...e, frozenTurns: e.frozenTurns + (consumable.duration || 5) };
                     }
                     return e;
                 });
                 // EMP Nova Effect (Blue)
                 addEffectInternal({
                     type: 'nova',
                     char: '*',
                     color: 'text-blue-400 bg-blue-500/30',
                     position: newPlayer.position,
                     radius: radius,
                     duration: 500
                 });
                 msg = `EMP Zündung! ${stunnedCount} Einheiten deaktiviert.`;
                 playSound('defend');
                 break;
             case 'REVEAL_MAP':
                 const revealRadius = consumable.value;
                 const newRevealed = new Set(revealedCells);
                 for(let y = newPlayer.position.y - revealRadius; y <= newPlayer.position.y + revealRadius; y++) {
                     for(let x = newPlayer.position.x - revealRadius; x <= newPlayer.position.x + revealRadius; x++) {
                         if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                             const dist = Math.sqrt(Math.pow(x - newPlayer.position.x, 2) + Math.pow(y - newPlayer.position.y, 2));
                             if (dist <= revealRadius) {
                                 newRevealed.add(`${x},${y}`);
                             }
                         }
                     }
                 }
                 revealedCells = newRevealed;
                 // Flare Nova Effect (White)
                 addEffectInternal({
                    type: 'nova',
                    char: '☼',
                    color: 'text-yellow-100 bg-white/20',
                    position: newPlayer.position,
                    radius: revealRadius,
                    duration: 600
                 });
                 msg = `Fackel geworfen. Bereich erhellt.`;
                 playSound('interact');
                 break;
             case 'RESTORE_AMMO':
                 const amount = consumable.value;
                 const oldAmmo = newPlayer.ammo;
                 newPlayer.ammo = Math.min(newPlayer.maxAmmo, newPlayer.ammo + amount);
                 msg = `Waffe geladen. +${newPlayer.ammo - oldAmmo} Schuss.`;
                 playSound('reload');
                 break;
             
             case 'SPAWN_DRONE':
                 const dir = newPlayer.lastMoveDir;
                 let droneX = newPlayer.position.x;
                 let droneY = newPlayer.position.y;
                 const droneRevealed = new Set(revealedCells);
                 
                 // Raycast until wall
                 while (true) {
                     droneX += dir.x;
                     droneY += dir.y;
                     if (droneX < 0 || droneX >= MAP_WIDTH || droneY < 0 || droneY >= MAP_HEIGHT) break;
                     
                     // Reveal center + adjacent
                     for(let dy=-1; dy<=1; dy++) {
                         for(let dx=-1; dx<=1; dx++) {
                             droneRevealed.add(`${droneX+dx},${droneY+dy}`);
                         }
                     }
                     
                     if (prevState.map[droneY][droneX] === CellType.WALL || prevState.map[droneY][droneX] === CellType.DOOR_CLOSED) {
                         // Hit wall! Reveal 5x5 around hit
                         for(let dy=-2; dy<=2; dy++) {
                            for(let dx=-2; dx<=2; dx++) {
                                const px = droneX + dx;
                                const py = droneY + dy;
                                if(px >=0 && px < MAP_WIDTH && py >= 0 && py < MAP_HEIGHT) {
                                    droneRevealed.add(`${px},${py}`);
                                }
                            }
                         }
                         // Visual Ping
                         addEffectInternal({
                             type: 'nova',
                             char: 'o',
                             color: 'text-green-500 font-bold',
                             position: { x: droneX, y: droneY },
                             radius: 2.5,
                             duration: 600
                         });
                         break;
                     }
                 }
                 revealedCells = droneRevealed;
                 addEffectInternal({
                     type: 'projectile',
                     char: '¤',
                     color: 'text-red-500 font-bold',
                     startPos: newPlayer.position,
                     endPos: { x: droneX, y: droneY },
                     duration: 400
                 });
                 msg = "Aufklärungsdrohne gestartet.";
                 playSound('interact');
                 break;

             case 'SPAWN_TURRET':
                 // Spawn at current location or in front? Let's spawn in front so player doesn't get stuck if logic is weird
                 const tX = newPlayer.position.x + newPlayer.lastMoveDir.x;
                 const tY = newPlayer.position.y + newPlayer.lastMoveDir.y;
                 if (prevState.map[tY]?.[tX] !== CellType.WALL && prevState.map[tY]?.[tX] !== CellType.DOOR_CLOSED) {
                      deployedDevices.push({
                         id: Math.random().toString(),
                         type: 'TURRET',
                         position: { x: tX, y: tY },
                         char: '±',
                         color: 'text-yellow-400 font-bold',
                         lifeTime: consumable.duration || 5,
                         maxLifeTime: consumable.duration || 5
                     });
                     msg = "Selbstschussanlage aktiviert.";
                     playSound('interact');
                 } else {
                     msg = "Kein Platz für Anlage.";
                 }
                 break;

             case 'SPAWN_SHIELD':
                 const pDir = newPlayer.lastMoveDir;
                 // Perpendicular direction
                 const perp = { x: -pDir.y, y: pDir.x };
                 const shieldCenter = { x: newPlayer.position.x + pDir.x, y: newPlayer.position.y + pDir.y };
                 
                 const placeShield = (x: number, y: number) => {
                     if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
                     if (prevState.map[y][x] === CellType.WALL || prevState.map[y][x] === CellType.DOOR_CLOSED) return false;
                     
                     deployedDevices.push({
                         id: Math.random().toString(),
                         type: 'SHIELD',
                         position: { x, y },
                         char: '=',
                         color: 'text-blue-400 font-bold',
                         lifeTime: consumable.duration || 4,
                         maxLifeTime: consumable.duration || 4
                     });
                     return true;
                 };

                 // Place center
                 placeShield(shieldCenter.x, shieldCenter.y);
                 
                 // Expand both ways
                 for (let d = 1; d < 10; d++) {
                     const p1 = placeShield(shieldCenter.x + perp.x * d, shieldCenter.y + perp.y * d);
                     if (!p1) break;
                 }
                 for (let d = 1; d < 10; d++) {
                     const p2 = placeShield(shieldCenter.x - perp.x * d, shieldCenter.y - perp.y * d);
                     if (!p2) break;
                 }
                 
                 msg = "Schildgenerator Barriere errichtet.";
                 playSound('defend');
                 break;

             case 'EXPLOSIVE_GRENADE':
                 const gDir = newPlayer.lastMoveDir;
                 let gX = newPlayer.position.x;
                 let gY = newPlayer.position.y;
                 const maxDist = 6;
                 
                 // Simulate Throw
                 for(let i=1; i<=maxDist; i++) {
                     const nextX = gX + gDir.x;
                     const nextY = gY + gDir.y;
                     
                     if (nextX < 0 || nextX >= MAP_WIDTH || nextY < 0 || nextY >= MAP_HEIGHT) break;
                     
                     // Hit Wall?
                     if (prevState.map[nextY][nextX] === CellType.WALL || prevState.map[nextY][nextX] === CellType.DOOR_CLOSED) {
                         break;
                     }
                     // Hit Enemy?
                     if (enemies.some(e => e.position.x === nextX && e.position.y === nextY)) {
                         gX = nextX;
                         gY = nextY;
                         break;
                     }
                     
                     gX = nextX;
                     gY = nextY;
                 }
                 
                 const explosionPos = { x: gX, y: gY };
                 const explosionRadius = 2.5; // Radius 2.5 covers ~5x5 circular area
                 const dmg = 10;
                 
                 // Damage Calculation
                 // 1. Enemies
                 enemies = enemies.map(e => {
                     const dist = Math.sqrt(Math.pow(e.position.x - explosionPos.x, 2) + Math.pow(e.position.y - explosionPos.y, 2));
                     if (dist <= explosionRadius) {
                         return { ...e, health: e.health - dmg, justHit: true };
                     }
                     return e;
                 });
                 
                 // 2. Player (Friendly Fire)
                 const pDist = Math.sqrt(Math.pow(newPlayer.position.x - explosionPos.x, 2) + Math.pow(newPlayer.position.y - explosionPos.y, 2));
                 let hitSelf = false;
                 if (pDist <= explosionRadius) {
                     newPlayer.health = Math.max(0, newPlayer.health - dmg);
                     hitSelf = true;
                     addEffectInternal({ type: 'floating_text', position: newPlayer.position, text: `-${dmg}`, color: 'text-red-500', duration: 800 });
                 }
                 
                 // Visuals
                 addEffectInternal({
                     type: 'projectile',
                     char: 'o',
                     color: 'text-green-500',
                     startPos: newPlayer.position,
                     endPos: explosionPos,
                     duration: 300
                 });
                 
                 // Explosion Effect delayed to match projectile arrival
                 setTimeout(() => {
                     // We can't use addEffectInternal here because it's inside the reducer scope but executing later.
                     // Instead, trigger visual via effect state in next render or just push both now with delayed start? 
                     // The visual system logic processes based on startTime.
                     // Let's just add it with a later startTime.
                 }, 300);
                 
                 addEffectInternal({
                    type: 'explosion',
                    char: '*',
                    color: 'text-orange-500 bg-red-900/30',
                    position: explosionPos,
                    radius: explosionRadius,
                    duration: 500
                 });

                 msg = hitSelf ? "Granate detoniert! Du wurdest getroffen." : "Granate detoniert.";
                 playSound('shoot');
                 break;
           }
           
           setTimeout(processTurn, 0);

           return {
               ...prevState,
               player: newPlayer,
               enemies: enemies,
               revealedCells: revealedCells,
               deployedDevices: deployedDevices,
               visualEffects: newVisualEffects,
               messageHistory: [...prevState.messageHistory, { id: Date.now(), text: msg, type: 'use', timestamp: Date.now() }]
           };
      });
  }, [processTurn]);

  const useOrEquipItem = useCallback((inventoryIndex: number) => {
      const player = gameState.player;
      if (inventoryIndex < 0 || inventoryIndex >= player.inventory.length) {
          return;
      }

      const item = player.inventory[inventoryIndex];
      
      // If consumable, apply effect
      if ('effect' in item) {
          applyConsumableEffect(item as Consumable);
          // Remove from inventory
          setGameState(prev => {
              const newInventory = [...prev.player.inventory];
              newInventory.splice(inventoryIndex, 1);
              // Also clear from quick slot if it was there and no longer exists in inventory
              // But items are objects, so removing one instance is fine. The QuickSlot references the object.
              // If we remove the object from inventory, the quickslot reference is still valid in memory but shouldn't be usable if it was meant to be the *same* item.
              // Logic fix: We should remove *this specific item* from quickslots if it matches.
              const newQuickSlots = [...prev.player.quickSlots] as [Consumable | null, Consumable | null];
              if (newQuickSlots[0] === item) newQuickSlots[0] = null;
              if (newQuickSlots[1] === item) newQuickSlots[1] = null;
              
              return { ...prev, player: { ...prev.player, inventory: newInventory, quickSlots: newQuickSlots } };
          });
      } else {
          // Equip Logic
          setGameState(prevState => {
              const newInventory = [...prevState.player.inventory];
              newInventory.splice(inventoryIndex, 1);
              const newPlayer = { ...prevState.player };
              let msg = "";
              
              if ('attack' in item) { 
                  const currentWeapon = newPlayer.weapon;
                  if (currentWeapon) newInventory.push(currentWeapon);
                  newPlayer.weapon = item as Weapon;
                  msg = `Ausgerüstet: ${item.name}`;
              } else { 
                  const currentArmor = newPlayer.armor;
                  if (currentArmor) newInventory.push(currentArmor);
                  newPlayer.armor = item as Armor;
                  msg = `Ausgerüstet: ${item.name}`;
              }
              
              newPlayer.inventory = newInventory;
              playSound('defend');
              return { 
                  ...prevState, 
                  player: newPlayer, 
                  messageHistory: [...prevState.messageHistory, { id: Date.now(), text: msg, type: 'info', timestamp: Date.now() }] 
              };
          });
      }
  }, [gameState.player, applyConsumableEffect]);

  const assignQuickSlot = useCallback((item: Consumable, slotIndex: 0 | 1) => {
      setGameState(prev => {
          const newQuickSlots = [...prev.player.quickSlots] as [Consumable | null, Consumable | null];
          // If item is already in another slot, clear that slot
          if (newQuickSlots[1 - slotIndex] === item) {
              newQuickSlots[1 - slotIndex] = null;
          }
          // Toggle off if clicking same slot
          if (newQuickSlots[slotIndex] === item) {
              newQuickSlots[slotIndex] = null;
          } else {
              newQuickSlots[slotIndex] = item;
          }
          
          return {
              ...prev,
              player: { ...prev.player, quickSlots: newQuickSlots },
              messageHistory: [...prev.messageHistory, { id: Date.now(), text: `Schnellzugriff ${slotIndex + 1}: ${newQuickSlots[slotIndex]?.name || "Leer"}`, type: 'info', timestamp: Date.now() }]
          };
      });
  }, []);

  const useQuickSlot = useCallback((slotIndex: 0 | 1) => {
      const item = gameState.player.quickSlots[slotIndex];
      if (!item) {
          // addMessage(`Slot ${slotIndex + 1} leer.`, 'warning');
          return;
      }
      
      // Check if item is still in inventory
      const inventoryIndex = gameState.player.inventory.findIndex(i => i === item); // Exact object match
      if (inventoryIndex === -1) {
          addMessage("Gegenstand nicht mehr im Inventar.", 'warning');
          // Clean up slot
          setGameState(prev => {
              const newQuickSlots = [...prev.player.quickSlots] as [Consumable | null, Consumable | null];
              newQuickSlots[slotIndex] = null;
              return { ...prev, player: { ...prev.player, quickSlots: newQuickSlots } };
          });
          return;
      }

      applyConsumableEffect(item);
      
      // Remove from inventory
      setGameState(prev => {
          const newInventory = [...prev.player.inventory];
          newInventory.splice(inventoryIndex, 1);
          
          const newQuickSlots = [...prev.player.quickSlots] as [Consumable | null, Consumable | null];
          // Determine if we have another of the same type? 
          // Current logic: Inventory items are unique instances. 
          // So if we use it, it's gone from the quickslot too.
          newQuickSlots[slotIndex] = null;

          return { ...prev, player: { ...prev.player, inventory: newInventory, quickSlots: newQuickSlots } };
      });

  }, [gameState.player, applyConsumableEffect]);


  const toggleMinimap = useCallback(() => {
      if (!gameState.isMinimapOpen) {
          const { map, terminals, healingTerminals, revealedCells, depth, enemies, groundItems } = gameState;
          const enemiesClone = JSON.parse(JSON.stringify(enemies));
          const currentLevelState: CachedLevelState = { map, terminals, healingTerminals, depth, revealedCells, enemies: enemiesClone, groundItems };
          const newCache = new Map(levelCache);
          newCache.set(depth, currentLevelState);
          setLevelCache(newCache);
      }
      setGameState(s => ({ ...s, isMinimapOpen: !s.isMinimapOpen }));
  }, [gameState, levelCache]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'm') {
        toggleMinimap();
        return;
      }
      
      if (event.key === 'Escape' && gameState.isShopOpen) {
          closeShop();
          return;
      }
      
      // Quick Slots (allow these even if minimap is NOT open, but not in shop/level up)
      if (!gameState.isShopOpen && !gameState.isLevelUpScreenOpen && !gameState.isGameOver) {
          if (event.key === '1') {
              useQuickSlot(0);
              return;
          }
          if (event.key === '2') {
              useQuickSlot(1);
              return;
          }
      }

      if (gameState.isGameOver || gameState.isMinimapOpen || gameState.isShopOpen || gameState.isLevelUpScreenOpen) return;
      
      if (walkPath.length > 0) {
          setWalkPath([]);
          stopWalkingRef.current = true;
      }

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
        case 's':
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
          movePlayer(1, 0);
          break;
        case 'e':
          interact();
          break;
        case 'f':
          fireNearestEnemy();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movePlayer, interact, gameState, levelCache, closeShop, toggleMinimap, walkPath.length, fireNearestEnemy, useQuickSlot]);

  return { 
      gameState, 
      isLoading, 
      initializeGame, 
      levelCache, 
      closeShop, 
      buyItem, 
      sellItem, // Exported
      buyMapIntel, // Exported
      equipItem: useOrEquipItem, 
      assignQuickSlot, 
      movePlayer, 
      interact, 
      toggleMinimap,
      startWalking, 
      hoverTile,
      applyLevelUp,
      fireNearestEnemy
  };
};