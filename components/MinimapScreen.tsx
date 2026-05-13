import React, { useState, useMemo, useEffect } from 'react';
import { GameState, CellType, CachedLevelState, LogEntry, Player, AnyItem, Weapon, Consumable, CharacterClass } from '../types';
import { getItemAsset } from '../utils/itemAssets';

interface MinimapScreenProps {
  gameState: GameState;
  levelCache: Map<number, CachedLevelState>;
  onEquipItem: (inventoryIndex: number) => void;
  onAssignQuickSlot: (item: Consumable, slot: 0 | 1) => void;
  onClose: () => void;
}

const classPortraits: Record<CharacterClass, string> = {
  MARINE: new URL('../Bilder/Chraktere/Marine.png', import.meta.url).href,
  TECHNICIAN: new URL('../Bilder/Chraktere/Techniker.png', import.meta.url).href,
  SCOUT: new URL('../Bilder/Chraktere/Scout.png', import.meta.url).href,
  SCAVENGER: new URL('../Bilder/Chraktere/Schrotter.png', import.meta.url).href,
  CYBORG: new URL('../Bilder/Chraktere/Cyborg.png', import.meta.url).href,
  DEMOLITIONIST: new URL('../Bilder/Chraktere/Sprengmeister.png', import.meta.url).href,
  SUBJECT_D: new URL('../Bilder/Chraktere/SubjectD_alt.png', import.meta.url).href,
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

const minimapCellToAscii: Record<CellType, { char: string; color: string; }> = {
  [CellType.WALL]: { char: '#', color: 'text-gray-500' },
  [CellType.FLOOR]: { char: '.', color: 'text-gray-700' },
  [CellType.DOOR_CLOSED]: { char: '+', color: 'text-yellow-500' },
  [CellType.DOOR_OPEN]: { char: "'", color: 'text-yellow-600' },
  [CellType.TERMINAL_OFF]: { char: 'P', color: 'text-cyan-400' },
  [CellType.TERMINAL_ON]: { char: 'P', color: 'text-green-500' },
  [CellType.ENTRANCE]: { char: 'X', color: 'text-green-400' },
  [CellType.EXIT]: { char: 'X', color: 'text-red-500' },
  [CellType.LIGHT_SOURCE]: { char: '*', color: 'text-yellow-300' },
  [CellType.CHEST_CLOSED]: { char: '$', color: 'text-orange-400' },
  [CellType.CHEST_OPEN]: { char: '$', color: 'text-gray-600' },
  [CellType.BARREL]: { char: 'o', color: 'text-yellow-400' },
  [CellType.BARREL_OPEN]: { char: '_', color: 'text-gray-600' },
  [CellType.ARTIFACT]: { char: '@', color: 'text-yellow-400' },
  [CellType.RADIATION]: { char: 'R', color: 'text-green-500' },
  [CellType.VACUUM]: { char: 'V', color: 'text-gray-400' },
  [CellType.ELECTRICITY]: { char: 'E', color: 'text-yellow-500' },
  [CellType.HEALING_TERMINAL]: { char: '+', color: 'text-red-500' },
  [CellType.HEALING_TERMINAL_USED]: { char: '+', color: 'text-gray-600' },
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
                  type="button"
                  onClick={() => setSelectedLogId(log.id)}
                  className={`w-full text-left p-2 text-sm transition-colors duration-200 ${
                    selectedLogId === log.id ? 'bg-orange-900/70 text-orange-100' : 'hover:bg-gray-800'
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
                <h4 className="text-orange-300 font-bold text-lg">{selectedLog.title}</h4>
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
type PdaView = 'map' | 'logs' | 'inventory' | 'attributes';

const getItemStats = (item: AnyItem) => {
    if ('attack' in item) return `ATK ${item.attack}`;
    if ('defense' in item) return `DEF ${item.defense}`;
    if ('effect' in item) return item.effect.replaceAll('_', ' ');
    return '';
};

const getItemAccent = (item: AnyItem) => {
    if ('attack' in item) return 'text-orange-300 border-orange-800/80';
    if ('defense' in item) return 'text-cyan-300 border-cyan-800/80';
    return 'text-yellow-300 border-yellow-800/80';
};

const StatBar: React.FC<{ label: string; value: number; max?: number }> = ({ label, value, max = 20 }) => {
    const filled = Math.max(0, Math.min(10, Math.round((value / max) * 10)));
    return (
        <div className="grid grid-cols-[110px_1fr_32px] items-center gap-2 text-xs sm:text-sm">
            <span className="text-gray-400 uppercase">{label}</span>
            <div className="grid grid-cols-10 gap-1 h-2">
                {Array.from({ length: 10 }).map((_, index) => (
                    <span key={index} className={index < filled ? 'bg-orange-700' : 'bg-gray-800'} />
                ))}
            </div>
            <span className="text-gray-300 text-right">{value}</span>
        </div>
    );
};

const EquipmentSlot: React.FC<{ label: string; value?: string | null; assetUrl?: string; accent?: string }> = ({ label, value, assetUrl, accent = 'text-gray-500' }) => (
    <div className="min-h-[92px] border border-orange-900/60 bg-black/35 p-2 flex flex-col justify-between shadow-[inset_0_0_16px_rgba(0,0,0,0.65)]">
        <span className="text-[10px] sm:text-xs text-orange-500 uppercase tracking-wide">{label}</span>
        <div className="flex items-end gap-2">
            {assetUrl && (
                <img
                    src={assetUrl}
                    alt=""
                    draggable={false}
                    className="h-12 w-12 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.85)]"
                />
            )}
            <span className={`text-xs sm:text-sm font-bold leading-tight ${value ? accent : 'text-gray-600'}`}>{value ?? '+'}</span>
        </div>
    </div>
);

const InventoryViewer: React.FC<{
    player: Player;
    onEquip: (index: number) => void;
    onAssignQuickSlot: (item: Consumable, slot: 0 | 1) => void;
}> = ({ player, onEquip, onAssignQuickSlot }) => {
    const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
    const [category, setCategory] = useState<InventoryCategory>('ALL');

    const groupedInventory = useMemo(() => {
        const groups: { item: AnyItem; count: number; indices: number[] }[] = [];
        player.inventory.forEach((item, index) => {
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
    const selectedItem = selectedGroup?.item ?? null;
    const carryWeight = Math.min(75, player.inventory.length * 2.5 + (player.weapon ? 4 : 0) + (player.armor ? 8 : 0));
    const inventorySlots = Array.from({ length: Math.max(30, groupedInventory.length) });

    const categoryButtons: { id: InventoryCategory; label: string; icon: string }[] = [
        { id: 'ALL', label: 'ALLES', icon: '▦' },
        { id: 'WEAPON', label: 'WAFFEN', icon: '⌁' },
        { id: 'ARMOR', label: 'RÜSTUNG', icon: '◈' },
        { id: 'CONSUMABLE', label: 'MED/TOOLS', icon: '+' },
    ];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-3 flex-grow min-h-0 overflow-hidden text-gray-300">
            <section className="border-2 border-gray-700/80 bg-black/80 shadow-[inset_0_0_36px_rgba(0,0,0,0.75)] min-h-0 overflow-auto">
                <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl text-orange-500 font-bold tracking-wide">{classLabels[player.class]}</h2>
                            <p className="mt-2 text-orange-400">STUFE {player.level}</p>
                            <p className="mt-3 text-sm text-gray-300">XP: <span className="text-orange-300">{player.xp}</span> / {player.maxXp}</p>
                            <p className="text-sm text-orange-700">AP-</p>
                        </div>
                        <div className="text-right space-y-3 min-w-[120px]">
                            <div>
                                <p className="text-[10px] text-orange-500 uppercase">Gesundheit</p>
                                <p className="text-xl text-orange-300">{player.health}/{player.maxHealth}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-orange-500 uppercase">Munition</p>
                                <p className="text-xl text-orange-300">{player.ammo}/{player.maxAmmo}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative mt-4 min-h-[430px] grid grid-cols-[112px_1fr_112px] sm:grid-cols-[132px_1fr_132px] gap-3 items-center">
                        <div className="space-y-4">
                            <EquipmentSlot label="Hand" value={player.weapon?.name ?? null} assetUrl={getItemAsset(player.weapon)} accent="text-orange-300" />
                            <EquipmentSlot label="Zubehör" value={player.quickSlots[0]?.name ?? null} accent="text-yellow-300" />
                            <EquipmentSlot label="Implantate" value={player.class === 'CYBORG' ? 'Cyber-Arm V4' : null} accent="text-cyan-300" />
                        </div>

                        <div className="relative h-[420px] overflow-hidden">
                            <img
                                src={classPortraits[player.class]}
                                alt={classLabels[player.class]}
                                draggable={false}
                                className="absolute inset-x-0 bottom-0 mx-auto max-h-full max-w-full object-contain drop-shadow-[0_20px_22px_rgba(0,0,0,0.85)]"
                            />
                            <div className="absolute inset-x-4 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent" />
                        </div>

                        <div className="space-y-4">
                            <EquipmentSlot label="Körper" value={player.armor?.name ?? null} assetUrl={getItemAsset(player.armor)} accent="text-cyan-300" />
                            <EquipmentSlot label="Zubehör" value={player.quickSlots[1]?.name ?? null} accent="text-yellow-300" />
                            <EquipmentSlot label="Rücken" value={player.class === 'DEMOLITIONIST' ? 'Sprengsatz-Pack' : null} accent="text-orange-300" />
                        </div>
                    </div>

                </div>
            </section>

            <section className="border-2 border-gray-700/80 bg-black/80 shadow-[inset_0_0_36px_rgba(0,0,0,0.75)] min-h-0 flex flex-col overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-800">
                    <h2 className="text-2xl text-orange-500 font-bold tracking-wide">INVENTAR</h2>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                        {categoryButtons.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => { setCategory(cat.id); setSelectedItemName(null); }}
                                title={cat.label}
                                className={`h-12 border text-lg transition-colors ${category === cat.id ? 'border-orange-500 bg-orange-950/45 text-orange-300' : 'border-gray-700 bg-gray-950 text-gray-500 hover:text-gray-200 hover:border-gray-500'}`}
                            >
                                {cat.icon}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-grow min-h-0 overflow-auto p-4 sm:p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                        {inventorySlots.map((_, slotIndex) => {
                            const group = groupedInventory[slotIndex];
                            const itemAsset = group ? getItemAsset(group.item) : undefined;
                            const isSelected = group && selectedItemName === group.item.name;
                            return (
                                <button
                                    key={slotIndex}
                                    type="button"
                                    disabled={!group}
                                    onClick={() => group && setSelectedItemName(group.item.name)}
                                    className={`aspect-square border bg-gradient-to-b from-gray-950 to-black p-2 text-left transition-colors shadow-[inset_0_0_16px_rgba(0,0,0,0.8)] ${group ? 'hover:border-orange-500/80' : 'cursor-default'} ${isSelected ? 'border-orange-400 bg-orange-950/30' : 'border-gray-700/80'}`}
                                >
                                    {group ? (
                                        <div className="h-full flex flex-col justify-between gap-1">
                                            <div className="relative flex-grow min-h-0 flex items-center justify-center">
                                                {itemAsset ? (
                                                    <img
                                                        src={itemAsset}
                                                        alt={group.item.name}
                                                        draggable={false}
                                                        className="max-h-full max-w-full object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.85)]"
                                                    />
                                                ) : (
                                                    <span className={`text-3xl font-black ${getItemAccent(group.item).split(' ')[0]}`}>
                                                        {'effect' in group.item ? '+' : '?'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-[10px] sm:text-xs font-bold leading-tight line-clamp-2 ${getItemAccent(group.item).split(' ')[0]}`}>
                                                {group.item.name}
                                            </div>
                                            <div className="flex items-end justify-between gap-2">
                                                <span className="text-[10px] text-gray-500 uppercase">{getItemStats(group.item)}</span>
                                                {group.count > 1 && <span className="text-xs text-orange-300">x{group.count}</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="block w-full h-full opacity-30" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t border-gray-800 p-4 sm:p-5 bg-black/65">
                    {selectedItem && selectedGroup ? (
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                            <div className="grid grid-cols-[80px_1fr] gap-4 items-center">
                                <div className="h-20 w-20 border border-gray-700 bg-black/50 flex items-center justify-center p-2 shadow-[inset_0_0_14px_rgba(0,0,0,0.8)]">
                                    {getItemAsset(selectedItem) ? (
                                        <img
                                            src={getItemAsset(selectedItem)}
                                            alt={selectedItem.name}
                                            draggable={false}
                                            className="max-h-full max-w-full object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.85)]"
                                        />
                                    ) : (
                                        <span className={`text-4xl font-black ${getItemAccent(selectedItem).split(' ')[0]}`}>{'effect' in selectedItem ? '+' : '?'}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg ${getItemAccent(selectedItem).split(' ')[0]}`}>{selectedItem.name}</h3>
                                    {'description' in selectedItem && (
                                        <p className="text-gray-400 text-sm mt-1">{selectedItem.description}</p>
                                    )}
                                    <p className="text-gray-500 text-xs uppercase mt-2">{getItemStats(selectedItem)} | Vorrat: {selectedGroup.count}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap lg:justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedGroup.indices.length > 0) {
                                            onEquip(selectedGroup.indices[0]);
                                            if (selectedGroup.count === 1) setSelectedItemName(null);
                                        }
                                    }}
                                    className="px-4 py-2 border border-orange-600 bg-orange-950/50 text-orange-100 hover:bg-orange-800/70 text-sm uppercase tracking-wide"
                                >
                                    {'effect' in selectedItem ? 'Benutzen' : 'Ausrüsten'}
                                </button>

                                {'effect' in selectedItem && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => onAssignQuickSlot(selectedItem as Consumable, 0)}
                                            className={`px-3 py-2 border text-sm uppercase ${player.quickSlots[0]?.name === selectedItem.name ? 'border-yellow-500 bg-yellow-800/70 text-white' : 'border-gray-600 bg-gray-900 text-gray-300 hover:bg-gray-800'}`}
                                        >
                                            Slot 1
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onAssignQuickSlot(selectedItem as Consumable, 1)}
                                            className={`px-3 py-2 border text-sm uppercase ${player.quickSlots[1]?.name === selectedItem.name ? 'border-yellow-500 bg-yellow-800/70 text-white' : 'border-gray-600 bg-gray-900 text-gray-300 hover:bg-gray-800'}`}
                                        >
                                            Slot 2
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-3 items-center text-sm">
                            <span className="text-gray-400">CREDITS <span className="text-orange-300">{player.credits}</span></span>
                            <div className="h-2 bg-gray-900 border border-gray-800">
                                <div className="h-full bg-gray-700" style={{ width: `${Math.min(100, (carryWeight / 75) * 100)}%` }} />
                            </div>
                            <span className="text-gray-400">{carryWeight.toFixed(1)} / 75.0 KG</span>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

const CharacterStatsViewer: React.FC<{ player: Player; playerName: string; depth: number }> = ({ player, playerName, depth }) => {
    const weaponAttack = player.weapon?.attack ?? 0;
    const armorDefense = player.armor?.defense ?? 0;
    const totalAttack = player.strength + weaponAttack + player.attackBuff;
    const totalDefense = player.defense + armorDefense;
    const agility = 10 + Math.min(8, Math.floor(player.ammo / 10));
    const willpower = 8 + player.level;

    const resistances = [
        ['Physisch', '25%'],
        ['Energie', player.class === 'CYBORG' ? '35%' : '25%'],
        ['Feuer', '20%'],
        ['Gift', player.class === 'CYBORG' ? '100%' : '20%'],
        ['Vakuum', player.class === 'CYBORG' ? '100%' : '15%'],
    ];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] gap-3 flex-grow min-h-0 overflow-auto text-gray-300">
            <section className="border-2 border-gray-700/80 bg-black/80 p-4 sm:p-5 shadow-[inset_0_0_36px_rgba(0,0,0,0.75)]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl text-orange-500 font-bold tracking-wide">{playerName}</h2>
                        <p className="mt-1 text-orange-300 uppercase tracking-widest">{classLabels[player.class]}</p>
                    </div>
                    <div className="text-right text-sm">
                        <p className="text-gray-500 uppercase">Sektor</p>
                        <p className="text-xl text-orange-300">{depth}</p>
                    </div>
                </div>

                <div className="relative mt-5 h-[420px] overflow-hidden border border-gray-800 bg-black/35">
                    <img
                        src={classPortraits[player.class]}
                        alt={classLabels[player.class]}
                        draggable={false}
                        className="absolute inset-x-0 bottom-0 mx-auto max-h-full max-w-full object-contain drop-shadow-[0_20px_22px_rgba(0,0,0,0.85)]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/95 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 grid grid-cols-3 gap-2 text-xs">
                        <div className="border border-gray-800 bg-black/75 p-2">
                            <p className="text-gray-500 uppercase">Level</p>
                            <p className="text-orange-300 font-bold">{player.level}</p>
                        </div>
                        <div className="border border-gray-800 bg-black/75 p-2">
                            <p className="text-gray-500 uppercase">XP</p>
                            <p className="text-purple-300 font-bold">{player.xp}/{player.maxXp}</p>
                        </div>
                        <div className="border border-gray-800 bg-black/75 p-2">
                            <p className="text-gray-500 uppercase">Credits</p>
                            <p className="text-yellow-300 font-bold">{player.credits}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-2 border-gray-700/80 bg-black/80 p-4 sm:p-5 shadow-[inset_0_0_36px_rgba(0,0,0,0.75)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="space-y-3">
                        <h3 className="text-orange-500 uppercase tracking-wide">Attribute</h3>
                        <StatBar label="Stärke" value={player.strength} max={25} />
                        <StatBar label="Geschick" value={agility} max={20} />
                        <StatBar label="Widerstand" value={player.defense} max={25} />
                        <StatBar label="Intelligenz" value={player.intelligence} max={20} />
                        <StatBar label="Wille" value={willpower} max={25} />
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-orange-500 uppercase tracking-wide">Kampfwerte</h3>
                        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-gray-800 py-2 text-sm">
                            <span className="text-gray-400">Gesamt-Angriff</span>
                            <span className="text-orange-300">{totalAttack}</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-gray-800 py-2 text-sm">
                            <span className="text-gray-400">Gesamt-Abwehr</span>
                            <span className="text-cyan-300">{totalDefense}</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-gray-800 py-2 text-sm">
                            <span className="text-gray-400">Waffenbonus</span>
                            <span>{weaponAttack}</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-gray-800 py-2 text-sm">
                            <span className="text-gray-400">Rüstungsbonus</span>
                            <span>{armorDefense}</span>
                        </div>
                        {player.attackBuff > 0 && (
                            <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-yellow-800/60 py-2 text-sm">
                                <span className="text-yellow-400">Aktiver Angriffsschub</span>
                                <span className="text-yellow-200">+{player.attackBuff}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-orange-500 uppercase tracking-wide">Resistenzen</h3>
                        {resistances.map(([label, value]) => (
                            <div key={label} className="grid grid-cols-[1fr_auto] text-sm border-b border-gray-800 py-1.5">
                                <span className="text-gray-400">{label}</span>
                                <span>{value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-orange-500 uppercase tracking-wide">Vitaldaten</h3>
                        <div className="grid grid-cols-[1fr_auto] text-sm border-b border-gray-800 py-1.5"><span className="text-gray-400">Gesundheit</span><span>{player.health}/{player.maxHealth}</span></div>
                        <div className="grid grid-cols-[1fr_auto] text-sm border-b border-gray-800 py-1.5"><span className="text-gray-400">Munition</span><span>{player.ammo}/{player.maxAmmo}</span></div>
                        <div className="grid grid-cols-[1fr_auto] text-sm border-b border-gray-800 py-1.5"><span className="text-gray-400">O2 Vorrat</span><span>{player.air}/{player.maxAir}</span></div>
                        <div className="grid grid-cols-[1fr_auto] text-sm border-b border-gray-800 py-1.5"><span className="text-gray-400">Verstrahlung</span><span>{player.radioactivity}/{player.maxRadioactivity}</span></div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const MinimapScreen: React.FC<MinimapScreenProps> = ({ gameState, levelCache, onEquipItem, onAssignQuickSlot, onClose }) => {
  const [selectedDepth, setSelectedDepth] = useState(gameState.depth);
  const [activeView, setActiveView] = useState<PdaView>('map');

  useEffect(() => {
    setSelectedDepth(gameState.depth);
  }, [gameState.depth]);

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

  const navButtonClass = (view: PdaView) => (
    `flex-1 sm:flex-none px-4 sm:px-8 py-3 text-sm sm:text-lg tracking-widest uppercase border transition-colors ${
        activeView === view
            ? 'bg-orange-950/60 border-orange-600 text-orange-300 shadow-[inset_0_0_18px_rgba(154,78,29,0.25)]'
            : 'bg-black/70 border-gray-800 text-gray-500 hover:text-gray-200 hover:border-gray-600'
    }`
  );

  const pdaTitle: Record<PdaView, string> = {
    inventory: 'INVENTAR',
    attributes: 'ATTRIBUTE',
    map: 'KARTE',
    logs: 'DATENBANK',
  };

  return (
    <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-2 sm:p-4">
      <div className="border-4 border-gray-800 bg-[#090b0c] p-2 w-full h-full flex flex-col max-w-[1420px] shadow-[0_0_40px_rgba(0,0,0,0.85)]">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b-2 border-gray-800 pb-2 mb-2 gap-2">
            <h1 className="px-4 py-2 text-2xl sm:text-3xl text-orange-500 font-bold tracking-wide">{pdaTitle[activeView]}</h1>
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                 <button type="button" onClick={() => setActiveView('inventory')} className={navButtonClass('inventory')}>Inventar</button>
                 <button type="button" onClick={() => setActiveView('attributes')} className={navButtonClass('attributes')}>Attribute</button>
                 <button type="button" onClick={() => setActiveView('map')} className={navButtonClass('map')}>Karte</button>
                 <button type="button" onClick={() => setActiveView('logs')} className={navButtonClass('logs')}>Datenbank</button>
            </div>
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 bg-red-950/70 text-red-100 border border-red-800 hover:bg-red-800 font-bold tracking-widest">
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
                            type="button"
                            onClick={() => setSelectedDepth(depth)}
                            className={`px-3 py-1 mr-2 text-sm transition-colors duration-200 border border-gray-700 ${
                                selectedDepth === depth ? 'bg-orange-950/70 text-orange-200' : 'bg-gray-900 hover:bg-gray-800'
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

        {activeView === 'attributes' && (
             <CharacterStatsViewer player={gameState.player} playerName={gameState.playerName} depth={gameState.depth} />
        )}

      </div>
    </div>
  );
};

export default MinimapScreen;
