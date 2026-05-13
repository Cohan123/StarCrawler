import React, { useEffect, useRef } from 'react';
import { Player, CellType, CharacterClass } from '../types';
import { getItemAsset } from '../utils/itemAssets';

interface SidePanelProps {
  player: Player;
  depth: number;
  playerName: string;
  map: CellType[][];
  revealedCells: Set<string>;
  playerPos: { x: number; y: number };
}

const classPortraits: Record<CharacterClass, string> = {
    MARINE: new URL('../Bilder/Chraktere/Portraits/P_Marine.png', import.meta.url).href,
    TECHNICIAN: new URL('../Bilder/Chraktere/Portraits/P_Techniker.png', import.meta.url).href,
    SCOUT: new URL('../Bilder/Chraktere/Portraits/P_Scout.png', import.meta.url).href,
    SCAVENGER: new URL('../Bilder/Chraktere/Portraits/P_Schrotter.png', import.meta.url).href,
    CYBORG: new URL('../Bilder/Chraktere/Portraits/P_Cyborg.png', import.meta.url).href,
    DEMOLITIONIST: new URL('../Bilder/Chraktere/Portraits/P_Sprengmeister.png', import.meta.url).href,
    SUBJECT_D: new URL('../Bilder/Chraktere/Portraits/P_SubjectD.png', import.meta.url).href,
};

const classLabels: Record<CharacterClass, string> = {
    MARINE: 'MARINE',
    TECHNICIAN: 'TECHNIKER',
    SCOUT: 'SCOUT',
    SCAVENGER: 'PLÜNDERER',
    CYBORG: 'CYBORG',
    DEMOLITIONIST: 'SPRENGMEISTER',
    SUBJECT_D: 'SUBJECT D',
};

const StatusBar: React.FC<{ label: string; value: number; maxValue: number; color: string }> = ({ label, value, maxValue, color }) => {
    const percentage = maxValue > 0 ? Math.max(0, Math.min(100, (value / maxValue) * 100)) : 0;
    return (
        <div>
            <div className="flex justify-between text-[10px] uppercase tracking-wide">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-400">{value} / {maxValue}</span>
            </div>
            <div className="w-full bg-gray-950 border border-gray-800 h-3 mt-1 relative overflow-hidden">
                <div className={`${color} h-full transition-all duration-300`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
};

const EquipmentTile: React.FC<{ label: string; name?: string | null; image?: string; tone: string }> = ({ label, name, image, tone }) => (
    <div className="border border-gray-800 bg-black/45 p-2 min-h-[72px] flex gap-2 items-center">
        <div className="w-12 h-12 border border-gray-800 bg-gray-950 flex items-center justify-center shrink-0">
            {image ? (
                <img src={image} alt="" draggable={false} className="max-w-full max-h-full object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.8)]" />
            ) : (
                <span className="text-gray-700 text-xl">+</span>
            )}
        </div>
        <div className="min-w-0">
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
            <div className={`text-xs font-bold leading-tight truncate ${name ? tone : 'text-gray-600'}`}>{name ?? 'Leer'}</div>
        </div>
    </div>
);

const MiniMapWidget: React.FC<{ map: CellType[][]; revealedCells: Set<string>; playerPos: { x: number; y: number } }> = ({ map, revealedCells, playerPos }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || map.length === 0) return;
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
                    ctx.fillStyle = '#f97316';
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                } else if (isRevealed) {
                    if (cell === CellType.WALL) {
                        ctx.fillStyle = '#374151';
                    } else if (cell === CellType.EXIT || cell === CellType.ENTRANCE) {
                        ctx.fillStyle = '#ef4444';
                    } else {
                        ctx.fillStyle = '#1f2937';
                    }
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            });
        });
    }, [map, revealedCells, playerPos]);

    return (
        <div className="w-full aspect-video bg-black border border-gray-700 flex items-center justify-center overflow-hidden relative">
            <canvas ref={canvasRef} className="opacity-80" />
            <div className="absolute top-1 left-1 text-[10px] text-orange-800 font-mono">RADAR ACTIVE</div>
        </div>
    );
};

const SidePanel: React.FC<SidePanelProps> = ({ player, depth, playerName, map, revealedCells, playerPos }) => {
  return (
    <div className="w-full lg:w-72 bg-[#090b0c] border-l border-gray-800 flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="p-3 border-b border-gray-800 bg-black/40">
        <div className="grid grid-cols-[96px_1fr] gap-3 items-stretch">
            <div className="relative border border-orange-900/70 bg-black overflow-hidden min-h-[120px]">
                <img
                    src={classPortraits[player.class]}
                    alt={classLabels[player.class]}
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            </div>
            <div className="min-w-0 flex flex-col justify-between">
                <div>
                    <div className="text-[10px] text-orange-600 uppercase tracking-[0.25em]">Pilot</div>
                    <div className="text-lg text-white font-bold font-mono truncate">{playerName}</div>
                    <div className="text-xs text-orange-300 font-bold tracking-widest uppercase">{classLabels[player.class]}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="border border-gray-800 bg-black/60 p-2">
                        <div className="text-gray-500">LVL</div>
                        <div className="text-yellow-300 font-bold">{player.level}</div>
                    </div>
                    <div className="border border-gray-800 bg-black/60 p-2">
                        <div className="text-gray-500">SEKTOR</div>
                        <div className="text-yellow-300 font-bold">{depth}</div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="p-3 border-b border-gray-800">
         <MiniMapWidget map={map} revealedCells={revealedCells} playerPos={playerPos} />
      </div>

      <div className="p-3 flex-grow">
        <div className="mb-5 space-y-2">
            <h4 className="text-orange-500 text-xs uppercase tracking-widest">Status</h4>
            <StatusBar label="Erfahrung" value={player.xp} maxValue={player.maxXp} color="bg-purple-500" />
            <StatusBar label="Hülle" value={player.health} maxValue={player.maxHealth} color="bg-green-500" />
            <StatusBar label="Munition" value={player.ammo} maxValue={player.maxAmmo} color="bg-yellow-600" />
            <StatusBar label="O2 Vorrat" value={player.air} maxValue={player.maxAir} color="bg-cyan-500" />
            <StatusBar label="Verstrahlung" value={player.radioactivity} maxValue={player.maxRadioactivity} color="bg-lime-700" />
        </div>

        <div className="mb-5">
            <h4 className="text-orange-500 text-xs mb-2 uppercase tracking-widest">Ausrüstung</h4>
            <div className="space-y-2">
                <EquipmentTile label="Waffe" name={player.weapon?.name ?? null} image={getItemAsset(player.weapon)} tone="text-orange-300" />
                <EquipmentTile label="Rüstung" name={player.armor?.name ?? null} image={getItemAsset(player.armor)} tone="text-cyan-300" />
            </div>
        </div>

        <div className="mb-5">
            <h4 className="text-orange-500 text-xs mb-2 uppercase tracking-widest">Schnellzugriff</h4>
            <div className="flex gap-2">
                {[0, 1].map((slot) => (
                    <div key={slot} className="flex-1 bg-black/45 border border-gray-800 p-2 relative min-h-[48px]">
                        <span className="absolute top-0 left-1 text-[10px] text-gray-500">{slot + 1}</span>
                        <div className="text-xs text-center mt-3 text-yellow-300 truncate h-4">
                            {player.quickSlots[slot as 0 | 1]?.name ?? '-'}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {player.buffTurns > 0 && (
            <div className="mt-4 p-2 bg-yellow-900/30 border border-yellow-700/50">
                <h4 className="text-yellow-500 text-[10px] uppercase font-bold mb-1">Aktiver Effekt</h4>
                <div className="flex justify-between text-xs text-yellow-200">
                    <span>Stim-Schub</span>
                    <span>{player.buffTurns} Runden</span>
                </div>
            </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800 text-center bg-black/40">
          <p className="text-[10px] text-gray-600">PDA SYSTEM [M] BEREIT</p>
      </div>
    </div>
  );
};

export default SidePanel;
