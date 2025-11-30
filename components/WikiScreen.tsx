
import React from 'react';
import { EnemyType } from '../types';

interface WikiScreenProps {
  onBack: () => void;
}

const WikiEntry: React.FC<{ symbol: string; name: string; description: string; color?: string }> = ({ symbol, name, description, color = 'text-gray-300' }) => (
    <div className="flex items-start gap-4 p-2 hover:bg-gray-800/50 rounded transition-colors">
        <div className="w-8 flex justify-center">
            <pre className={`text-xl ${color} font-bold`}>{symbol}</pre>
        </div>
        <div>
            <h4 className={`font-bold ${color.includes('text-gray') ? 'text-gray-300' : color}`}>{name}</h4>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
    </div>
);


const WikiScreen: React.FC<WikiScreenProps> = ({ onBack }) => {
  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 p-4">
      <div className="w-full h-full max-w-6xl border-4 border-gray-700 bg-gray-900 p-6 flex flex-col">
        <div className="flex justify-between items-center border-b-2 border-gray-700 pb-2 mb-4">
          <h2 className="text-3xl text-green-400 tracking-widest">WIKI & DATENBANK</h2>
          <button onClick={onBack} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600">Zurück zum Hauptmenü</button>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-4 space-y-8 custom-scrollbar">
          
          {/* Section 1: Basics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="text-xl text-green-500 border-b border-gray-700 uppercase tracking-wider">Steuerung & Gameplay</h3>
                <div className="space-y-2 text-sm text-gray-300">
                    <p><span className="font-bold text-yellow-400">[Pfeiltasten] / [WASD]</span> - Bewegung / Nahkampf</p>
                    <p><span className="font-bold text-yellow-400">[F]</span> - Schießen (Nächster Feind)</p>
                    <p><span className="font-bold text-yellow-400">[Klick auf Feind]</span> - Schießt, wenn Waffe Reichweite hat.</p>
                    <p><span className="font-bold text-yellow-400">[E]</span> - Interagieren (Terminals, Kisten, Händler)</p>
                    <p><span className="font-bold text-yellow-400">[M]</span> - PDA (Sektorkarte, Logbücher, Inventar)</p>
                </div>
                <div className="bg-blue-900/20 p-3 border border-blue-800 rounded mt-4">
                    <p className="text-blue-400 font-bold mb-1">Fernkampf & Munition</p>
                    <p className="text-xs text-gray-400">
                        Waffen wie Laser-Pistolen benötigen Munition. Munitions-Packs können gefunden werden. Achte auf deinen Zähler unten rechts! Klicke auf einen entfernten Feind, um zu feuern.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl text-green-500 border-b border-gray-700 uppercase tracking-wider">Objekte & Umgebung</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <WikiEntry symbol="@" name="Spieler" description="Pilot." color="text-yellow-300"/>
                    <WikiEntry symbol="*" name="Loot" description="Waffen/Rüstung/Munition." color="text-purple-400"/>
                    <WikiEntry symbol="X" name="Ausgang" description="Nächster Sektor." color="text-green-400"/>
                    <WikiEntry symbol="¶" name="Terminal" description="Logbücher." color="text-cyan-400"/>
                    <WikiEntry symbol="†" name="Med-Station" description="Heilung." color="text-red-500"/>
                    <WikiEntry symbol="¤" name="Kiste" description="Items/Credits." color="text-orange-400"/>
                    <WikiEntry symbol="o" name="Fass" description="Items. Explodiert evtl." color="text-yellow-400"/>
                    <WikiEntry symbol="." name="Strahlung" description="Schaden über Zeit." color="text-green-600"/>
                    <WikiEntry symbol="≈" name="Vakuum" description="Erstickungsgefahr." color="text-gray-400"/>
                </div>
            </div>
          </div>

          {/* Section 2: Enemy Glossary */}
          <div>
            <h3 className="text-xl text-red-500 border-b border-gray-700 uppercase tracking-wider mb-4">Gegner-Datenbank</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tier 1 */}
                <div className="bg-gray-800/20 p-4 rounded border border-gray-800">
                    <h4 className="text-gray-400 font-bold mb-3 border-b border-gray-700 pb-1">Tier 1 (Sektor 1-4)</h4>
                    <div className="space-y-1">
                        <WikiEntry symbol="d" name="Wartungs-Drohne" description="Schwache Flugeinheit. Gefährlich im Schwarm." color="text-gray-400"/>
                        <WikiEntry symbol="r" name="Rat-Bot" description="Schneller Schrottsammler. Nervig." color="text-gray-500"/>
                        <WikiEntry symbol="R" name="Defekter Arbeiter" description="Langsam, aber robust. Schlagkräftig." color="text-yellow-700"/>
                    </div>
                </div>

                {/* Tier 2 */}
                <div className="bg-blue-900/10 p-4 rounded border border-blue-900/30">
                    <h4 className="text-blue-400 font-bold mb-3 border-b border-blue-900/30 pb-1">Tier 2 (Sektor 5-10)</h4>
                    <div className="space-y-1">
                        <WikiEntry symbol="D" name="Sicherheits-Drohne" description="Starke Laserbewaffnung. Fernkampf." color="text-blue-500"/>
                        <WikiEntry symbol="R" name="Wach-Roboter" description="Rot lackierte Kampfeinheit. Gepanzert." color="text-red-500"/>
                        <WikiEntry symbol="h" name="Kampfhund-Einheit" description="Extrem schnell, sehr hoher Schaden." color="text-red-400"/>
                    </div>
                </div>

                {/* Tier 3 */}
                <div className="bg-red-900/10 p-4 rounded border border-red-900/30">
                    <h4 className="text-red-400 font-bold mb-3 border-b border-red-900/30 pb-1">Tier 3 (Sektor 10+)</h4>
                    <div className="space-y-1">
                        <WikiEntry symbol="M" name="Kampf-Mech" description="Wandelnder Panzer. Flucht empfohlen." color="text-red-600 font-bold"/>
                        <WikiEntry symbol="E" name="Elite-Soldat" description="Militär-KI. Taktisch versiert." color="text-cyan-400 font-bold"/>
                        <WikiEntry symbol="A" name="Schwere Artillerie" description="Zerstört Deckung und Rüstung." color="text-orange-500 font-bold"/>
                    </div>
                </div>
            </div>

            {/* Bosses */}
            <div className="mt-6 bg-purple-900/10 p-4 rounded border border-purple-900/30">
                <h4 className="text-fuchsia-400 font-bold mb-3 border-b border-purple-900/30 pb-1">Prioritäts-Ziele (Bosse)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <WikiEntry symbol="Ω" name="Der Metzger" description="Schlächter-Droide (Tier 2). Nahkampf." color="text-fuchsia-500 font-bold"/>
                    <WikiEntry symbol="Φ" name="Protokoll 0" description="KI-Kern Wächter (Tier 2). Fernkampf." color="text-fuchsia-500 font-bold"/>
                    <WikiEntry symbol="€" name="Grinder" description="Industrie-Brecher. Massive HP." color="text-purple-500 font-bold"/>
                    <WikiEntry symbol="Ψ" name="Quork" description="Alien-Symbiont. Hoher Schaden." color="text-purple-400 font-bold"/>
                    <WikiEntry symbol="Œ" name="X-99" description="Prototyp. Die ultimative Waffe." color="text-red-600 font-bold"/>
                    <WikiEntry symbol="¥" name="Händler VK-55" description="Neutral. Greift nicht an." color="text-yellow-300"/>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WikiScreen;
