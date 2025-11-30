

import React, { useState, useMemo } from 'react';
import { Player, AnyItem, Weapon, Armor } from '../types';
import { WEAPONS, ARMORS } from '../data/items';

interface ShopScreenProps {
    player: Player;
    onPurchase: (item: AnyItem) => void;
    onSell?: (index: number) => void; // Optional for now until wired up
    onBuyIntel?: () => void;
    onClose: () => void;
}

const ShopScreen: React.FC<ShopScreenProps> = ({ player, onPurchase, onSell, onBuyIntel, onClose }) => {
    const [activeTab, setActiveTab] = useState<'weapons' | 'armor' | 'sell' | 'intel'>('weapons');

    // Filter out unique items from the shop
    const shopWeapons = useMemo(() => WEAPONS.filter(w => !w.isUnique), []);
    const shopArmors = useMemo(() => ARMORS.filter(a => !a.isUnique), []);

    const renderItem = (item: AnyItem) => {
        const isWeapon = 'attack' in item;
        const isArmor = 'defense' in item;
        
        const playerHas = isWeapon 
            ? player.weapon?.id === item.id 
            : (isArmor ? player.armor?.id === item.id : false);
        
        const canAfford = player.credits >= item.cost;

        return (
            <li key={item.id} className={`p-2 grid grid-cols-4 gap-2 items-center border-b border-gray-700 ${playerHas ? 'bg-green-900' : 'hover:bg-gray-800'}`}>
                <span className={playerHas ? 'text-green-300' : ''}>{item.name}</span>
                <span className="text-right">
                    {isWeapon ? (item as Weapon).attack : (isArmor ? (item as Armor).defense : '-')}
                </span>
                <span className="text-right text-yellow-400">{item.cost} C</span>
                <button 
                    onClick={() => onPurchase(item)}
                    disabled={!canAfford}
                    className="px-3 py-1 bg-gray-700 hover:bg-green-700 border border-gray-600 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
                >
                    KAUFEN
                </button>
            </li>
        );
    }

    const groupedInventory = useMemo(() => {
        const groups: { item: AnyItem, count: number, indices: number[] }[] = [];
        player.inventory.forEach((item, index) => {
            const existing = groups.find(g => g.item.name === item.name);
            if (existing) {
                existing.count++;
                existing.indices.push(index);
            } else {
                groups.push({ item, count: 1, indices: [index] });
            }
        });
        return groups;
    }, [player.inventory]);

    const getSellPrice = (cost: number) => Math.floor(cost / 4);

    return (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-4xl h-[90vh] border-4 border-yellow-700 bg-gray-900 p-6 flex flex-col">
                <div className="flex justify-between items-center border-b-2 border-yellow-700 pb-2 mb-4">
                    <h2 className="text-2xl text-yellow-300 tracking-widest">VK-55 MODELL 2 HANDELS-INTERFACE</h2>
                    <p className="text-lg">CREDITS: <span className="text-yellow-400 font-bold">{player.credits}</span></p>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                    <button onClick={() => setActiveTab('weapons')} className={`flex-1 px-4 py-2 text-lg tracking-widest ${activeTab === 'weapons' ? 'bg-yellow-800 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>WAFFEN</button>
                    <button onClick={() => setActiveTab('armor')} className={`flex-1 px-4 py-2 text-lg tracking-widest ${activeTab === 'armor' ? 'bg-yellow-800 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>RÜSTUNG</button>
                    <button onClick={() => setActiveTab('sell')} className={`flex-1 px-4 py-2 text-lg tracking-widest ${activeTab === 'sell' ? 'bg-green-800 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>VERKAUFEN</button>
                    <button onClick={() => setActiveTab('intel')} className={`flex-1 px-4 py-2 text-lg tracking-widest ${activeTab === 'intel' ? 'bg-blue-800 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>DATEN</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    {activeTab === 'weapons' && (
                        <ul>
                            <li className="p-2 grid grid-cols-4 gap-2 font-bold text-green-400 border-b-2 border-gray-600">
                                <span>Name</span>
                                <span className="text-right">Angriff</span>
                                <span className="text-right">Kosten</span>
                                <span>Aktion</span>
                            </li>
                            {shopWeapons.map(renderItem)}
                        </ul>
                    )}
                     {activeTab === 'armor' && (
                        <ul>
                            <li className="p-2 grid grid-cols-4 gap-2 font-bold text-green-400 border-b-2 border-gray-600">
                                <span>Name</span>
                                <span className="text-right">Verteidigung</span>
                                <span className="text-right">Kosten</span>
                                <span>Aktion</span>
                            </li>
                            {shopArmors.map(renderItem)}
                        </ul>
                    )}
                    {activeTab === 'sell' && (
                         <ul>
                             <li className="p-2 grid grid-cols-4 gap-2 font-bold text-red-400 border-b-2 border-gray-600">
                                 <span>Gegenstand</span>
                                 <span className="text-right">Menge</span>
                                 <span className="text-right">Wert</span>
                                 <span>Aktion</span>
                             </li>
                             {groupedInventory.length === 0 ? (
                                 <p className="p-4 text-center text-gray-500 italic">Inventar leer.</p>
                             ) : groupedInventory.map(({ item, count, indices }, grpIdx) => (
                                 <li key={grpIdx} className="p-2 grid grid-cols-4 gap-2 items-center border-b border-gray-700 hover:bg-gray-800">
                                     <span>{item.name}</span>
                                     <span className="text-right text-gray-400">x{count}</span>
                                     <span className="text-right text-yellow-400">+{getSellPrice(item.cost)} C</span>
                                     <button 
                                         onClick={() => onSell && onSell(indices[0])} // Sell the first instance
                                         className="px-3 py-1 bg-red-900 hover:bg-red-700 border border-red-700 text-white text-sm transition-colors"
                                     >
                                         VERKAUFEN
                                     </button>
                                 </li>
                             ))}
                         </ul>
                    )}
                    {activeTab === 'intel' && (
                        <div className="p-4 flex flex-col items-center justify-center h-full">
                            <h3 className="text-xl text-blue-400 font-bold mb-4">SEKTOR-DATENBANK</h3>
                            <div className="bg-gray-800 p-6 border-2 border-blue-600 max-w-md w-full text-center">
                                <h4 className="text-lg font-bold mb-2">Aktuelle Sektorkarte</h4>
                                <p className="text-gray-400 mb-4 text-sm">Entschlüsselt Sicherheitsprotokolle und deckt die gesamte Umgebungskarte auf.</p>
                                <p className="text-2xl text-yellow-400 font-bold mb-6">500 C</p>
                                <button 
                                    onClick={onBuyIntel}
                                    disabled={player.credits < 500}
                                    className="w-full py-3 bg-blue-700 hover:bg-blue-600 border border-blue-500 text-white font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    DATEN KAUFEN
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <button onClick={onClose} className="w-full max-w-sm px-8 py-3 bg-red-800 hover:bg-red-700 border-2 border-red-500 text-white font-bold text-lg transition-colors">
                        INTERFACE SCHLIESSEN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShopScreen;