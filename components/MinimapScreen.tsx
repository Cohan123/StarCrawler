import React, { useState, useMemo, useEffect } from 'react';
import { GameState, CellType, CachedLevelState, LogEntry, Player, AnyItem, Weapon, Consumable } from '../types';

interface MinimapScreenProps {
  gameState: GameState;
  levelCache: Map<number, CachedLevelState>;
  onEquipItem: (inventoryIndex: number) => void;
  onAssignQuickSlot: (item: Consumable, slot: 0 | 1) => void;
  onClose: () => void;
}

const minimapCellToAscii: Record<CellType, { char: string; color: string; }> = {
  [CellType.WALL]: { char: '#', color: 'text-gray-500' },
  [CellType.FLOOR]: { char: '·', color: 'text-gray-700' },
  [CellType.DOOR_CLOSED]: { char: '+', color: 'text-yellow-500' },
  [CellType.DOOR_OPEN]: { char: "'", color: 'text-yellow-600' },
  [CellType.TERMINAL_OFF]: { char: '¶', color: 'text-cyan-400' },
  [CellType.TERMINAL_ON]: { char: '¶', color: 'text-green-500' },
  [CellType.ENTRANCE]: { char: 'X', color: 'text-green-400' },
  [CellType.EXIT]: { char: 'X', color: 'text-red-500' },
  [CellType.LIGHT_SOURCE]: { char: '‡', color: 'text-yellow-300' },
  [CellType.CHEST_CLOSED]: { char: '¤', color: 'text-orange-400' },
  [CellType.CHEST_OPEN]: { char: '¤', color: 'text-gray-600' },
  [CellType.BARREL]: { char: 'o', color: 'text-yellow-400' },
  [CellType.BARREL_OPEN]: { char: '_', color: 'text-gray-600' },
  [CellType.ARTIFACT]: { char: '©', color: 'text-yellow-400' },
  [CellType.RADIATION]: { char: 'R', color: 'text-green-500' },
  [CellType.VACUUM]: { char: 'V', color: 'text-gray-400' },
  [CellType.ELECTRICITY]: { char: 'E', color: 'text-yellow-500' },
  [CellType.HEALING_TERMINAL]: { char: '†', color: 'text-red-500' },
  [CellType.HEALING_TERMINAL_USED]: { char: '†', color: 'text-gray-600' },
  [CellType.SHUTTLE]: { char: 'S', color: 'text-green-300 font-bold' },
};

const LogbookViewer: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
    const [selectedLogId, setSelectedLogId] = useState<number | null>(logs.length > 0 ? logs[0].id : null);
    const selectedLog = logs.find(log => log.id === selectedLogId);

    if (logs.length === 0) {
        return <p className="text-gray-500 mt-4 italic">Keine Logbücher geborgen.</p>;
    }

    return (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
          <ul className="space-y-1 overflow-y-auto pr-2 border-r border-gray-700">
            {logs.map(log => (
              <li key={log.id}>
                <button
                  onClick={() => setSelectedLogId(log.id)}
                  className={`w-full text-left p-2 text-sm transition-colors duration-200 ${
                    selectedLogId === log.id ? 'bg-green-800 text-white' : 'hover:bg-gray-800'
                  }`}
                >
                  &gt; {log.title}
                </button>
              </li>
            ))}
          </ul>
          <div className="overflow-y-auto pl-2">
            {selectedLog ? (
              <div>
                <h4 className="text-green-300 font-bold text-lg">{selectedLog.title}</h4>
                <p className="text-gray-400 whitespace-pre-wrap mt-2">{selectedLog.content}</p>
              </div>
            ) : (
              <p className="text-gray-600 italic">Wählen Sie einen Logbucheintrag zum Lesen aus.</p>
            )}
          </div>
        </div>
    );
};

type InventoryCategory = 'ALL' | 'WEAPON' | 'ARMOR' | 'CONSUMABLE';

const InventoryViewer: React.FC<{ 
    player: Player; 
    onEquip: (index: number) => void;
    onAssignQuickSlot: (item: Consumable, slot: 0 | 1) => void;
}> = ({ player, onEquip, onAssignQuickSlot }) => {
    const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
    const [category, setCategory] = useState<InventoryCategory>('ALL');

    const groupedInventory = useMemo(() => {
        const groups: { item: AnyItem, count: number, indices: number[] }[] = [];
        player.inventory.forEach((item, index) => {
             // Filter Logic
             let match = true;
             if (category === 'WEAPON') match = 'attack' in item;
             else if (category === 'ARMOR') match = 'defense' in item;
             else if (category === 'CONSUMABLE') match = 'effect' in item;

             if (match) {
                 const existing = groups.find(g => g.item.name === item.name);
                 if (existing) {
                     existing.count++;
                     existing.indices.push(index);
                 } else {
                     groups.push({ item, count: 1, indices: [index] });
                 }
             }
        });
        return groups;
    }, [player.inventory, category]);

    const selectedGroup = groupedInventory.find(g => g.item.name === selectedItemName);
    const selectedItem = selectedGroup ? selectedGroup.item : null;

    const getItemStats = (item: AnyItem) => {
        if ('attack' in item) return `ATK: ${item.attack}`;
        if ('defense' in item) return `DEF: ${item.defense}`;
        if ('effect' in item) return `[${item.effect}]`;
        return '';
    }

    const getItemColor = (item: AnyItem) => {
        if ('attack' in item) return 'text-green-400';
        if ('defense' in item) return 'text-blue-400';
        return 'text-yellow-400';
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0 mt-4 overflow-hidden">
            <div className="border border-gray-700 p-4 flex flex-col items-center overflow-auto">
                <h3 className="text-xl text-green-400 border-b border-gray-700 pb-2 w-full text-center">PILOTEN-AUSRÜSTUNG</h3>
                
                <div className="w-full space-y-4 mt-4">
                    <div className="bg-gray-800 p-2 border border-gray-600">
                        <span className="text-gray-400">WAFFE: </span>
                        <span className="text-white font-bold block sm:inline">{player.weapon?.name ?? 'Keine'}</span>
                        <span className="text-green-400 float-right">ATK: {player.weapon?.attack ?? 0}</span>
                    </div>
                     <div className="bg-gray-800 p-2 border border-gray-600">
                        <span className="text-gray-400">RÜSTUNG: </span>
                        <span className="text-white font-bold block sm:inline">{player.armor?.name ?? 'Keine'}</span>
                        <span className="text-blue-400 float-right">DEF: {player.armor?.defense ?? 0}</span>
                    </div>
                </div>
                
                {selectedItem && selectedGroup && (
                     <div className="mt-8 bg-gray-800 p-3 border border-gray-600 w-full animate-fadeIn">
                        <h4 className={`font-bold border-b border-gray-600 pb-1 mb-2 ${getItemColor(selectedItem)}`}>{selectedItem.name}</h4>
                        { 'description' in selectedItem && (
                            <p className="text-gray-300 text-sm italic mb-2">"{(selectedItem as any).description}"</p>
                        )}
                        <p className="text-gray-400 text-xs uppercase mb-4">
                            {getItemStats(selectedItem)} | Vorrat: {selectedGroup.count}
                        </p>

                        <div className="flex gap-2 flex-wrap">
                            <button 
                                onClick={() => {
                                    // Use the first index from the group
                                    if (selectedGroup.indices.length > 0) {
                                        onEquip(selectedGroup.indices[0]);
                                        // If it was the last one, clear selection
                                        if (selectedGroup.count === 1) setSelectedItemName(null);
                                    }
                                }}
                                className="px-3 py-1 bg-green-900 border border-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                                {'effect' in selectedItem ? 'BENUTZEN' : 'AUSRÜSTEN'}
                            </button>

                            {'effect' in selectedItem && (
                                <>
                                    <button 
                                        onClick={() => onAssignQuickSlot(selectedItem as Consumable, 0)}
                                        className={`px-3 py-1 border rounded text-sm ${player.quickSlots[0]?.name === selectedItem.name ? 'bg-yellow-700 border-yellow-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        SLOT 1
                                    </button>
                                    <button 
                                        onClick={() => onAssignQuickSlot(selectedItem as Consumable, 1)}
                                        className={`px-3 py-1 border rounded text-sm ${player.quickSlots[1]?.name === selectedItem.name ? 'bg-yellow-700 border-yellow-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        SLOT 2
                                    </button>
                                </>
                            )}
                        </div>
                     </div>
                )}
            </div>

            <div className="border border-gray-700 p-4 flex flex-col overflow-hidden">
                 <h3 className="text-xl text-green-400 border-b border-gray-700 pb-2 w-full text-center">INVENTAR</h3>
                 
                 {/* Categories */}
                 <div className="flex gap-2 mt-2 mb-2 overflow-x-auto pb-1">
                     {['ALL', 'WEAPON', 'ARMOR', 'CONSUMABLE'].map((cat) => (
                         <button
                            key={cat}
                            onClick={() => { setCategory(cat as InventoryCategory); setSelectedItemName(null); }}
                            className={`px-2 py-1 text-xs border ${category === cat ? 'bg-green-900 border-green-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                         >
                             {cat === 'ALL' ? 'ALLES' : cat === 'WEAPON' ? 'WAFFEN' : cat === 'ARMOR' ? 'RÜSTUNG' : 'VERBRAUCH'}
                         </button>
                     ))}
                 </div>

                 <ul className="flex-grow overflow-y-auto pr-2">
                    {groupedInventory.length === 0 ? (
                        <p className="text-gray-600 italic text-center mt-8">Keine Gegenstände in dieser Kategorie.</p>
                    ) : groupedInventory.map(({ item, count }, index) => (
                        <li 
                            key={`${item.name}-${index}`} 
                            onClick={() => setSelectedItemName(item.name)}
                            className={`p-2 flex justify-between cursor-pointer transition-colors duration-150 border-b border-gray-800 ${selectedItemName === item.name ? 'bg-green-800 text-white' : 'hover:bg-gray-800'}`}
                        >
                           <div className="flex items-center gap-2 overflow-hidden">
                               {'effect' in item && (player.quickSlots[0]?.name === item.name || player.quickSlots[1]?.name === item.name) && (
                                   <span className="text-[10px] bg-yellow-600 text-black px-1 rounded font-bold">
                                       {player.quickSlots[0]?.name === item.name ? '1' : '2'}
                                   </span>
                               )}
                               <span className={`truncate ${getItemColor(item)}`}>
                                   {item.name} {count > 1 && <span className="text-gray-300 font-bold ml-1">(x{count})</span>}
                               </span>
                           </div>
                           <span className="text-gray-500 text-xs whitespace-nowrap ml-2">{getItemStats(item)}</span>
                        </li>
                    ))}
                 </ul>
            </div>
        </div>
    );
};


const MinimapScreen: React.FC<MinimapScreenProps> = ({ gameState, levelCache, onEquipItem, onAssignQuickSlot, onClose }) => {
  const [selectedDepth, setSelectedDepth] = useState(gameState.depth);
  const [activeView, setActiveView] = useState<'map' | 'logs' | 'inventory'>('map');

  const displayedLevelData = useMemo(() => {
    if (selectedDepth === gameState.depth) {
      return {
        map: gameState.map,
        revealedCells: gameState.revealedCells,
      };
    }
    const cachedData = levelCache.get(selectedDepth);
    if (cachedData && cachedData.map && cachedData.revealedCells) {
        return cachedData;
    }
    return undefined;

  }, [selectedDepth, gameState, levelCache]);
  
  const sortedDepths = useMemo(() => Array.from(new Set([gameState.depth, ...levelCache.keys()])).sort((a, b) => a - b), [levelCache, gameState.depth]);


  const renderMap = () => {
    if (!displayedLevelData || !displayedLevelData.map) return null;
    
    const { map, revealedCells } = displayedLevelData;

    return map.map((row, y) => (
      <div key={y} className="flex leading-none">
        {row.map((cell, x) => {
          const coord = `${x},${y}`;
          
          if (selectedDepth === gameState.depth && gameState.player.position.x === x && gameState.player.position.y === y) {
            return <span key={x} className="text-yellow-300">@</span>;
          }

          if (revealedCells.has(coord)) {
            const { char, color } = minimapCellToAscii[cell];
            return <span key={x} className={color}>{char}</span>;
          }
          
          return <span key={x}>&nbsp;</span>;
        })}
      </div>
    ));
  };
  
  return (
    <div className="absolute inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center z-50 p-2 sm:p-4">
      <div className="border-4 border-gray-700 bg-gray-900 p-2 sm:p-4 w-full h-full flex flex-col max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-gray-700 pb-2 mb-2 gap-2">
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                 <button onClick={() => setActiveView('map')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-lg tracking-widest ${activeView === 'map' ? 'bg-green-800 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>KARTE</button>
                 <button onClick={() => setActiveView('logs')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-lg tracking-widest ${activeView === 'logs' ? 'bg-green-800 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>LOGS</button>
                 <button onClick={() => setActiveView('inventory')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-lg tracking-widest ${activeView === 'inventory' ? 'bg-green-800 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>INV</button>
            </div>
            <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 bg-red-900 text-white border border-red-700 hover:bg-red-700 font-bold tracking-widest">
                SCHLIESSEN [M]
            </button>
        </div>
        
        {activeView === 'map' && (
            <>
                <div className="mb-2 overflow-x-auto whitespace-nowrap pb-2">
                    <span className="mr-4 text-gray-400">Sektor:</span>
                    {sortedDepths.map(depth => (
                        <button
                            key={depth}
                            onClick={() => setSelectedDepth(depth)}
                            className={`px-3 py-1 mr-2 text-sm transition-colors duration-200 border border-gray-700 ${
                                selectedDepth === depth ? 'bg-green-800 text-white' : 'bg-gray-800 hover:bg-gray-700'
                            }`}
                        >
                            {depth}
                        </button>
                    ))}
                </div>
                <div className="flex-grow overflow-auto bg-black p-2 border border-gray-800 touch-pan-x touch-pan-y">
                  <pre className="text-[10px] sm:text-xs leading-none">
                    {renderMap()}
                  </pre>
                </div>
            </>
        )}

        {activeView === 'logs' && (
            <div className="flex-grow overflow-hidden flex flex-col">
                <LogbookViewer logs={gameState.logs} />
            </div>
        )}

        {activeView === 'inventory' && (
             <InventoryViewer player={gameState.player} onEquip={onEquipItem} onAssignQuickSlot={onAssignQuickSlot} />
        )}

      </div>
    </div>
  );
};

export default MinimapScreen;