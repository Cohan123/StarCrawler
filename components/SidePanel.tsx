

import React, { useEffect, useRef } from 'react';
import { Player, CellType } from '../types';

interface SidePanelProps {
  player: Player;
  depth: number;
  playerName: string;
  map: CellType[][];
  revealedCells: Set<string>;
  playerPos: {x: number, y: number};
}

const StatusBar: React.FC<{ label: string, value: number, maxValue: number, color: string }> = ({ label, value, maxValue, color }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
        <div className="mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
            <div className="w-full bg-gray-800 border border-gray-700 h-3 mt-1 relative">
                <div className={`${color} h-full transition-all duration-300`} style={{ width: `${percentage}%` }}></div>
            </div>
             <span className="text-xs text-right block text-gray-500 mt-1">{value} / {maxValue}</span>
        </div>
    );
};

const StatDisplay: React.FC<{ label: string, value: string | number, highlight?: boolean, subtext?: string }> = ({ label, value, highlight, subtext }) => (
    <div className="flex justify-between text-xs border-b border-gray-800 py-1">
        <span className="text-gray-500">{label}</span>
        <div className="text-right">
            <span className={`font-mono ${highlight ? 'text-green-300 font-bold' : 'text-gray-300'}`}>{value}</span>
            {subtext && <div className="text-[10px] text-yellow-500">{subtext}</div>}
        </div>
    </div>
);

const MiniMapWidget: React.FC<{ map: CellType[][], revealedCells: Set<string>, playerPos: {x: number, y: number} }> = ({ map, revealedCells, playerPos }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cellSize = 3; 
        const width = map[0].length * cellSize;
        const height = map.length * cellSize;
        
        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        map.forEach((row, y) => {
            row.forEach((cell, x) => {
                const isRevealed = revealedCells.has(`${x},${y}`);
                
                if (x === playerPos.x && y === playerPos.y) {
                    ctx.fillStyle = '#fde047'; 
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                } else if (isRevealed) {
                    if (cell === CellType.WALL) {
                        ctx.fillStyle = '#374151'; 
                        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    } else if (cell === CellType.FLOOR) {
                        ctx.fillStyle = '#1f2937'; 
                        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    } else if (cell === CellType.EXIT || cell === CellType.ENTRANCE) {
                         ctx.fillStyle = '#ef4444'; 
                         ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    }
                }
            });
        });

    }, [map, revealedCells, playerPos]);

    return (
        <div className="w-full aspect-video bg-black border border-gray-700 mb-4 flex items-center justify-center overflow-hidden relative">
            <canvas ref={canvasRef} className="opacity-80" />
            <div className="absolute top-1 left-1 text-[10px] text-green-800 font-mono">RADAR ACTIVE</div>
        </div>
    );
}

const SidePanel: React.FC<SidePanelProps> = ({ player, depth, playerName, map, revealedCells, playerPos }) => {
  const weaponAttack = player.weapon?.attack ?? 0;
  const armorDefense = player.armor?.defense ?? 0;
  const totalAttack = weaponAttack + player.strength + player.attackBuff;
  const totalDefense = armorDefense + player.defense;

  return (
    <div className="w-full lg:w-64 bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-y-auto custom-scrollbar">
      
      {/* Top Section: Radar */}
      <div className="p-4 border-b border-gray-800">
         <h3 className="text-green-500 text-sm font-bold tracking-widest mb-3">SEKTOR {depth}</h3>
         <MiniMapWidget map={map} revealedCells={revealedCells} playerPos={playerPos} />
      </div>

      {/* Middle Section: Stats */}
      <div className="p-4 flex-grow">
        <div className="mb-6">
            <h4 className="text-gray-500 text-xs mb-2 uppercase">Pilot Status</h4>
            <div className="flex justify-between items-end mb-1">
                 <div className="text-lg text-white font-bold font-mono">{playerName}</div>
                 <div className="text-sm text-yellow-300 font-mono">LVL {player.level}</div>
            </div>
            
            <div className="text-xs text-yellow-500 mb-4 tracking-wider uppercase font-bold">{player.class}</div>
            
            <StatusBar label="ERFAHRUNG" value={player.xp} maxValue={player.maxXp} color="bg-purple-500" />
            <StatusBar label="HÜLLE" value={player.health} maxValue={player.maxHealth} color="bg-green-500" />
            <StatusBar label="MUNITION" value={player.ammo} maxValue={player.maxAmmo} color="bg-yellow-600" />
            <StatusBar label="O2 VORRAT" value={player.air} maxValue={player.maxAir} color="bg-cyan-500" />
            <StatusBar label="VERSTRAHLUNG" value={player.radioactivity} maxValue={player.maxRadioactivity} color="bg-lime-700" />
        </div>

        <div className="mb-6">
            <h4 className="text-gray-500 text-xs mb-2 uppercase">Kampf-Daten</h4>
            
            <StatDisplay 
                label="GESAMT-ANGRIFF" 
                value={totalAttack} 
                highlight 
                subtext={`Basis ${player.strength} + Waffe ${weaponAttack}${player.attackBuff > 0 ? ` + Buff ${player.attackBuff}` : ''}`}
            />
            
            <StatDisplay 
                label="GESAMT-ABWEHR" 
                value={totalDefense} 
                highlight 
                subtext={`Basis ${player.defense} + Rüstung ${armorDefense}`}
            />

            <StatDisplay 
                label="INTELLIGENZ" 
                value={player.intelligence} 
                subtext="Hacking Bonus"
            />
        </div>

        <div className="mb-6">
            <h4 className="text-gray-500 text-xs mb-2 uppercase">Ausrüstung</h4>
            <StatDisplay 
                label="WAFFE" 
                value={player.weapon?.name ?? '-'} 
                subtext={player.weapon ? `Rng: ${player.weapon.range} | Kosten: ${player.weapon.ammoCost}` : undefined}
            />
            <StatDisplay label="RÜSTUNG" value={player.armor?.name ?? '-'} />
        </div>

        {/* Quick Access Section */}
        <div className="mb-6">
            <h4 className="text-gray-500 text-xs mb-2 uppercase">Schnellzugriff</h4>
            <div className="flex gap-2">
                <div className="flex-1 bg-gray-800 border border-gray-700 p-2 rounded relative">
                    <span className="absolute top-0 left-1 text-[10px] text-gray-500">1</span>
                    <div className="text-xs text-center mt-2 text-yellow-300 truncate h-4">
                        {player.quickSlots[0] ? player.quickSlots[0]?.name : '-'}
                    </div>
                </div>
                 <div className="flex-1 bg-gray-800 border border-gray-700 p-2 rounded relative">
                    <span className="absolute top-0 left-1 text-[10px] text-gray-500">2</span>
                    <div className="text-xs text-center mt-2 text-yellow-300 truncate h-4">
                        {player.quickSlots[1] ? player.quickSlots[1]?.name : '-'}
                    </div>
                </div>
            </div>
        </div>

        <div>
             <h4 className="text-gray-500 text-xs mb-2 uppercase">Inventar</h4>
             <StatDisplay label="CREDITS" value={`${player.credits} C`} highlight />
             <StatDisplay label="ITEMS" value={player.inventory.length} />
        </div>

        {player.buffTurns > 0 && (
            <div className="mt-4 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded">
                <h4 className="text-yellow-500 text-[10px] uppercase font-bold mb-1">Aktiver Effekt</h4>
                <div className="flex justify-between text-xs text-yellow-200">
                    <span>Stim-Schub</span>
                    <span>{player.buffTurns} Runden</span>
                </div>
            </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-800 text-center">
          <p className="text-[10px] text-gray-600">PDA SYSTEM [M] BEREIT</p>
      </div>

    </div>
  );
};

export default SidePanel;