
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CellType, Position, Enemy, Discharge, GroundItem, VisualEffect, DeployedDevice } from '../types';
import FxLayer from './FxLayer';
import TileCanvas from './TileCanvas';
import { MAP_HEIGHT, MAP_WIDTH } from '../utils/gameConfig';
import { TILESETS, TilesetName } from '../utils/tileset';

interface GameScreenProps {
  map: CellType[][];
  playerPos: Position;
  visibleCells: Set<string>;
  revealedCells: Set<string>;
  enemies: Enemy[];
  discharges: Discharge[];
  groundItems: GroundItem[];
  playerHurt: boolean;
  hoverInfo: string | null;
  onTileClick: (x: number, y: number) => void;
  onTileHover: (x: number, y: number) => void;
  visualEffects?: VisualEffect[];
  deployedDevices?: DeployedDevice[]; // New Prop
}

/**
 * ASCII-Symbole und Anzeigefarben der Karte.
 *
 * Die Zuordnung folgt der Cogmind-uebersicht
 * (`Bilder/Beispiel/Programmierprojekte/StarCrawler/Tilesets.md`):
 * jede Zelle hat ein ASCII-Zeichen, eine Bedeutung und eine Farbe. Die
 * gleichen Bedeutungen werden im Tiles-Modus ueber die Cogmind-Kacheln
 * dargestellt (siehe `utils/tileset.ts`).
 */
const cellToAscii: Record<CellType, { char: string; color: string; revealedColor: string }> = {
  [CellType.WALL]: { char: '#', color: 'text-gray-400', revealedColor: 'text-gray-900' },
  [CellType.FLOOR]: { char: '.', color: 'text-yellow-600', revealedColor: 'text-gray-800' },
  [CellType.DOOR_CLOSED]: { char: '+', color: 'text-yellow-500', revealedColor: 'text-yellow-900' },
  [CellType.DOOR_OPEN]: { char: "'", color: 'text-yellow-600', revealedColor: 'text-yellow-900' },
  [CellType.TERMINAL_OFF]: { char: '¶', color: 'text-blue-500 animate-pulse', revealedColor: 'text-blue-800' },
  [CellType.TERMINAL_ON]: { char: '¶', color: 'text-green-500', revealedColor: 'text-green-800' },
  [CellType.ENTRANCE]: { char: 'X', color: 'text-orange-500 font-bold', revealedColor: 'text-orange-900' },
  [CellType.EXIT]: { char: 'X', color: 'text-orange-500 font-bold', revealedColor: 'text-orange-900' },
  [CellType.LIGHT_SOURCE]: { char: '‡', color: 'text-yellow-300', revealedColor: 'text-yellow-800' },
  [CellType.CHEST_CLOSED]: { char: '¤', color: 'text-orange-500', revealedColor: 'text-orange-800' },
  [CellType.CHEST_OPEN]: { char: '¤', color: 'text-yellow-700', revealedColor: 'text-gray-800' },
  [CellType.BARREL]: { char: 'o', color: 'text-orange-500', revealedColor: 'text-orange-800' },
  [CellType.BARREL_OPEN]: { char: 'o', color: 'text-yellow-700', revealedColor: 'text-gray-900' },
  [CellType.ARTIFACT]: { char: '©', color: 'text-yellow-400 font-bold animate-pulse', revealedColor: 'text-yellow-800' },
  [CellType.RADIATION]: { char: '.', color: 'text-green-600', revealedColor: 'text-green-900' },
  [CellType.VACUUM]: { char: '≈', color: 'text-gray-400', revealedColor: 'text-gray-800' },
  [CellType.ELECTRICITY]: { char: '.', color: 'text-yellow-500', revealedColor: 'text-yellow-900' },
  [CellType.HEALING_TERMINAL]: { char: '†', color: 'text-red-500 animate-pulse', revealedColor: 'text-red-800' },
  [CellType.HEALING_TERMINAL_USED]: { char: '†', color: 'text-gray-600', revealedColor: 'text-gray-800' },
  [CellType.SHUTTLE]: { char: '{-<>-}', color: 'text-green-500 font-bold tracking-tighter', revealedColor: 'text-green-800' },
};

const GameScreen: React.FC<GameScreenProps> = ({ 
    map, 
    playerPos, 
    visibleCells, 
    revealedCells, 
    enemies, 
    discharges, 
    groundItems, 
    playerHurt,
    hoverInfo,
    onTileClick,
    onTileHover,
    visualEffects = [],
    deployedDevices = []
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const tileCanvasRef = useRef<HTMLDivElement | null>(null);

  // Grafik- vs. ASCII-Darstellung (umschaltbar wie in Cogmind mit F3)
  const [graphicsMode, setGraphicsMode] = useState(true);
  // Standard ist das 20x20-Sheet (Cogmind-Vorlage laut Tilesets-Uebersicht).
  const [tileset, setTileset] = useState<TilesetName>('cogmind20x20.png');
  const [tilesetOpen, setTilesetOpen] = useState(false);

  // Zellgroesse in Pixeln (fuer Floating-Texts und Effekt-Ebene)
  const [cellSize, setCellSize] = useState({ w: 8, h: 14 });

  useEffect(() => {
    const el = graphicsMode ? tileCanvasRef.current : preRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.offsetWidth / MAP_WIDTH;
      const h = el.offsetHeight / MAP_HEIGHT;
      if (w > 0 && h > 0) {
        setCellSize(prev => (Math.abs(prev.w - w) > 0.01 || Math.abs(prev.h - h) > 0.01 ? { w, h } : prev));
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [graphicsMode, tileset]);
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  const [hasMoved, setHasMoved] = useState(false); 

  // Kein eigener Animations-Tick hier: Die Effekte werden im Canvas-Renderer
  // (FxLayer) mit einem eigenen requestAnimationFrame gezeichnet. Ein React-Re-Render
  // pro Frame wuerde das 80x35-ASCII-Grid (2800 Spans) komplett neu aufbauen.

  // Kamera folgt dem Spieler (nur im Grafik-Modus, dort ist die Karte gross).
  // Eigener rAF-Loop, damit das Nachfuehren weich laeuft und nicht erst
  // beim naechsten State-Update.
  useEffect(() => {
    if (!graphicsMode) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    let raf = 0;
    const follow = () => {
      raf = requestAnimationFrame(follow);
      const cellW = el.scrollWidth / MAP_WIDTH;
      const cellH = el.scrollHeight / MAP_HEIGHT;
      if (!cellW || !cellH) return;
      const targetX = playerPos.x * cellW - el.clientWidth / 2 + cellW / 2;
      const targetY = playerPos.y * cellH - el.clientHeight / 2 + cellH / 2;
      el.scrollLeft += (targetX - el.scrollLeft) * 0.15;
      el.scrollTop += (targetY - el.scrollTop) * 0.15;
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, [graphicsMode, playerPos.x, playerPos.y]);

  // F3 schaltet zwischen Grafik- und ASCII-Darstellung um
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setGraphicsMode(m => !m);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dischargePositions = useMemo(() => new Set(discharges.map(d => `${d.position.x},${d.position.y}`)), [discharges]);
  const itemPositions = useMemo(() => {
    const map = new Map<string, GroundItem>();
    groundItems.forEach(item => map.set(`${item.position.x},${item.position.y}`, item));
    return map;
  }, [groundItems]);
  
  const devicePositions = useMemo(() => {
      const map = new Map<string, DeployedDevice>();
      deployedDevices.forEach(d => map.set(`${d.position.x},${d.position.y}`, d));
      return map;
  }, [deployedDevices]);

  // Aktive Effektzeichen werden vom Canvas-Renderer (FxLayer) gezeichnet,
  // damit das 80x35-ASCII-Grid nicht pro Frame neu gerendert werden muss.

  const activeFloatingTexts = useMemo(() => {
      const now = Date.now();
      return visualEffects.filter(e => e.type === 'floating_text' && now - e.startTime < e.duration);
  }, [visualEffects]);
  
  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.5), 2.5));
  };

  // --- Mouse / Touch Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartPos({ x: e.pageX, y: e.pageY });
    setScrollPos({ left: scrollContainerRef.current.scrollLeft, top: scrollContainerRef.current.scrollTop });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.dataset.x && target.dataset.y) {
        onTileHover(parseInt(target.dataset.x), parseInt(target.dataset.y));
    }

    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - startPos.x;
    const y = e.pageY - startPos.y;
    
    if (Math.abs(x) > 5 || Math.abs(y) > 5) {
        setHasMoved(true);
    }
    
    scrollContainerRef.current.scrollLeft = scrollPos.left - x;
    scrollContainerRef.current.scrollTop = scrollPos.top - y;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    
    if (!hasMoved) {
        const target = e.target as HTMLElement;
        if (target.dataset.x && target.dataset.y) {
            onTileClick(parseInt(target.dataset.x), parseInt(target.dataset.y));
        }
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    onTileHover(-1, -1); 
  };

  const renderWithColors = useMemo(() => {
    if (!map || map.length === 0) {
      return null;
    }
    return map.map((row, y) => (
      <div key={y} className="flex leading-tight">
        {row.map((cell, x) => {
          const coord = `${x},${y}`;
          const isVisible = visibleCells.has(coord);
          const isRevealed = revealedCells.has(coord);

          const spanProps = {
              'data-x': x,
              'data-y': y,
              className: 'cursor-crosshair hover:bg-white/10 transition-colors duration-75 inline-block w-[1ch] h-[1em]',
          };
          const key = x;

          if (playerPos.x === x && playerPos.y === y) {
            const playerClass = playerHurt ? "text-white font-bold animate-pulse brightness-200" : "text-yellow-300";
            return <span key={key} {...spanProps} className={`${spanProps.className} ${playerClass}`}>@</span>;
          }

          if (isVisible && dischargePositions.has(coord)) {
            return <span key={key} {...spanProps} className={`${spanProps.className} text-yellow-300 animate-pulse`}>‰</span>;
          }
          
          const device = devicePositions.get(coord);
          if (device && isVisible) {
            return <span key={key} {...spanProps} className={`${spanProps.className} ${device.color}`}>{device.char}</span>
          }

          const enemy = enemies.find(e => e.position.x === x && e.position.y === y);
          if (enemy && isVisible) {
            let enemyClass = enemy.justHit ? "text-white font-bold animate-pulse brightness-200" : enemy.color;
            if (enemy.isBoss) {
                enemyClass += " bg-purple-900/50 rounded-sm";
            }
            return <span key={key} {...spanProps} className={`${spanProps.className} ${enemyClass}`}>{enemy.char}</span>
          }
          
          const item = itemPositions.get(coord);
          if(item && isVisible) {
            return <span key={key} {...spanProps} className={`${spanProps.className} text-purple-400 animate-pulse`}>*</span>;
          }

          if (isVisible) {
              const { char, color } = cellToAscii[cell];
              return <span key={key} {...spanProps} className={`${spanProps.className} ${color}`}>{char}</span>;
          }

          if (isRevealed) {
              if (item) {
                   return <span key={key} {...spanProps} className={`${spanProps.className} text-purple-900`}>*</span>;
              }
              const { char, revealedColor } = cellToAscii[cell];
              return <span key={key} {...spanProps} className={`${spanProps.className} ${revealedColor}`}>{char}</span>;
          }

          return <span {...spanProps}>&nbsp;</span>;
        })}
      </div>
    ));
  }, [map, visibleCells, revealedCells, playerPos, playerHurt, enemies, discharges, groundItems, dischargePositions, itemPositions, devicePositions]);


  return (
    <div className={`bg-black border-2 border-gray-800 flex-grow relative flex flex-col min-h-0 overflow-hidden select-none ${playerHurt ? 'shake-screen' : ''}`}>
      {/* CRT Overlay */}
      <div className="crt pointer-events-none absolute inset-0 z-50"></div>

      {/* Flash Effect Layer */}
      {playerHurt && <div className="absolute inset-0 bg-red-500 opacity-30 pointer-events-none z-20 animate-pulse" />}
      
      {/* Hover Info Overlay */}
      {hoverInfo && (
          <div className="absolute top-0 left-0 right-0 bg-gray-900/90 border-b border-gray-700 text-center py-1 z-40 text-sm text-green-300 pointer-events-none">
              {hoverInfo}
          </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-12 right-2 z-30 flex flex-col gap-2">
         <button onClick={() => handleZoom(0.25)} className="w-10 h-10 bg-gray-800 border border-gray-600 text-green-400 font-bold rounded hover:bg-gray-700 active:bg-green-900 shadow-lg">+</button>
         <button onClick={() => handleZoom(-0.25)} className="w-10 h-10 bg-gray-800 border border-gray-600 text-green-400 font-bold rounded hover:bg-gray-700 active:bg-green-900 shadow-lg">-</button>
      </div>

      {/* Grafik / ASCII umschalten + Tileset waehlen */}
      <div className="absolute top-2 left-2 z-30 flex items-center gap-2">
         <button
            onClick={() => setGraphicsMode(m => !m)}
            title="Grafik-/ASCII-Darstellung umschalten (F3)"
            className="px-2 py-1 bg-gray-900/90 border border-gray-700 text-green-400 text-xs uppercase tracking-widest rounded hover:bg-gray-800 shadow-lg"
         >
            {graphicsMode ? 'Tiles' : 'ASCII'}
         </button>
         {graphicsMode && (
            <div className="relative">
               <button
                  onClick={() => setTilesetOpen(o => !o)}
                  title="Tileset wechseln"
                  className="px-2 py-1 bg-gray-900/90 border border-gray-700 text-gray-400 text-xs uppercase tracking-widest rounded hover:bg-gray-800 shadow-lg"
               >
                  {TILESETS.find(t => t.name === tileset)?.label ?? tileset}
               </button>
               {tilesetOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded shadow-lg overflow-hidden">
                     {TILESETS.map(t => (
                        <button
                           key={t.name}
                           onClick={() => { setTileset(t.name); setTilesetOpen(false); }}
                           className={`block w-full px-3 py-1 text-left text-xs uppercase tracking-widest ${
                              t.name === tileset ? 'bg-green-900 text-green-300' : 'text-gray-400 hover:bg-gray-800'
                           }`}
                        >
                           {t.label}
                        </button>
                     ))}
                  </div>
               )}
            </div>
         )}
      </div>

      {/* Scrollable Map Container */}
      <div 
        ref={scrollContainerRef}
        className={`flex-grow overflow-auto p-4 relative touch-pan-x touch-pan-y ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
            const target = e.target as HTMLElement;
             if (target.dataset.x && target.dataset.y && !isDragging) {
                 onTileClick(parseInt(target.dataset.x), parseInt(target.dataset.y));
             }
        }}
      >
          <div 
            ref={contentRef}
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', width: 'fit-content' }} 
            className="transition-transform duration-200 relative"
          >
             {graphicsMode ? (
                <TileCanvas
                   map={map}
                   playerPos={playerPos}
                   visibleCells={visibleCells}
                   revealedCells={revealedCells}
                   enemies={enemies}
                   discharges={discharges}
                   groundItems={groundItems}
                   deployedDevices={deployedDevices}
                   playerHurt={playerHurt}
                   tileset={tileset}
                   onTileClick={onTileClick}
                   onTileHover={onTileHover}
                   containerRef={tileCanvasRef}
                />
             ) : (
                <pre ref={preRef} className="text-sm relative font-mono tracking-normal leading-tight">
                   {renderWithColors}
                </pre>
             )}

             {/* Weiche Beleuchtung, gluehende Partikel und Effektzeichen.
                 Wird komplett auf Canvas gezeichnet (kein React-Render pro Frame). */}
             <FxLayer
                getGrid={() => (graphicsMode ? tileCanvasRef.current : preRef.current)}
                map={map}
                visibleCells={visibleCells}
                effects={visualEffects}
                playerPos={playerPos}
                enemies={enemies}
                deployedDevices={deployedDevices}
             />

             {/* Floating Texts Layer */}
             {activeFloatingTexts.map(effect => (
                 <div
                    key={effect.id}
                    className={`absolute floating-text-anim font-bold text-shadow pointer-events-none ${effect.color}`}
                    style={{
                        left: `${(effect.position!.x + 0.5) * cellSize.w}px`,
                        top: `${(effect.position!.y + 0.5) * cellSize.h}px`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 100,
                        fontSize: '0.8rem'
                    }}
                 >
                     {effect.text}
                 </div>
             ))}

          </div>
      </div>
    </div>
  );
};

export default GameScreen;
