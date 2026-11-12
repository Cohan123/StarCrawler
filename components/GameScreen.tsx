
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CellType, Position, Enemy, Discharge, GroundItem, VisualEffect, DeployedDevice } from '../types';
import FxLayer from './FxLayer';
import { MAP_HEIGHT, MAP_WIDTH } from '../utils/gameConfig';

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

const cellToAscii: Record<CellType, { char: string; color: string; revealedColor: string }> = {
  [CellType.WALL]: { char: '#', color: 'text-gray-500', revealedColor: 'text-gray-900' },
  [CellType.FLOOR]: { char: '.', color: 'text-yellow-600', revealedColor: 'text-gray-800' },
  [CellType.DOOR_CLOSED]: { char: '+', color: 'text-yellow-500', revealedColor: 'text-yellow-900' },
  [CellType.DOOR_OPEN]: { char: "'", color: 'text-yellow-600', revealedColor: 'text-yellow-900' },
  [CellType.TERMINAL_OFF]: { char: '¶', color: 'text-cyan-400 animate-pulse', revealedColor: 'text-cyan-800' },
  [CellType.TERMINAL_ON]: { char: '¶', color: 'text-green-500', revealedColor: 'text-green-800' },
  [CellType.ENTRANCE]: { char: 'X', color: 'text-green-400 font-bold', revealedColor: 'text-green-900' },
  [CellType.EXIT]: { char: 'X', color: 'text-red-500 font-bold', revealedColor: 'text-red-900' },
  [CellType.LIGHT_SOURCE]: { char: '‡', color: 'text-yellow-300', revealedColor: 'text-yellow-800' },
  [CellType.CHEST_CLOSED]: { char: '¤', color: 'text-orange-400', revealedColor: 'text-orange-800' },
  [CellType.CHEST_OPEN]: { char: '¤', color: 'text-gray-600', revealedColor: 'text-gray-800' },
  [CellType.BARREL]: { char: 'o', color: 'text-yellow-400', revealedColor: 'text-yellow-800' },
  [CellType.BARREL_OPEN]: { char: '_', color: 'text-gray-600', revealedColor: 'text-gray-900' },
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
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  const [hasMoved, setHasMoved] = useState(false); 

  // Kein eigener Animations-Tick hier: Die Effekte werden im Canvas-Renderer
  // (FxLayer) mit einem eigenen requestAnimationFrame gezeichnet. Ein React-Re-Render
  // pro Frame wuerde das 80x35-ASCII-Grid (2800 Spans) komplett neu aufbauen.

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
             <pre ref={preRef} className="text-sm relative font-mono tracking-normal leading-tight">
                {renderWithColors}
             </pre>

             {/* Weiche Beleuchtung, gluehende Partikel und Effektzeichen.
                 Wird komplett auf Canvas gezeichnet (kein React-Render pro Frame). */}
             <FxLayer
                preRef={preRef}
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
                        left: `calc(${effect.position!.x} * 1ch)`,
                        top: `calc(${effect.position!.y} * 1em)`,
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
