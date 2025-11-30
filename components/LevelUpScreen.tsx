

import React from 'react';

interface LevelUpScreenProps {
    onSelect: (type: 'HP' | 'STR' | 'DEF' | 'INT') => void;
}

const UpgradeCard: React.FC<{ 
    title: string; 
    code: 'HP' | 'STR' | 'DEF' | 'INT';
    desc: string; 
    icon: string;
    onClick: () => void;
}> = ({ title, code, desc, icon, onClick }) => (
    <button 
        onClick={onClick}
        className="
            flex flex-col items-center justify-center
            bg-gray-800 border-4 border-gray-600 rounded-xl p-4
            hover:bg-gray-700 hover:border-yellow-400 hover:scale-105 transition-all
            group w-full min-h-[220px]
        "
    >
        <pre className="text-3xl text-yellow-500 mb-4 font-mono group-hover:text-yellow-300 group-hover:drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
            {icon}
        </pre>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-center text-gray-400 text-sm">{desc}</p>
        <div className="mt-4 px-4 py-1 bg-gray-900 rounded text-xs text-gray-500 font-mono">
            CODE: {code}_UPGRADE
        </div>
    </button>
);

const LevelUpScreen: React.FC<LevelUpScreenProps> = ({ onSelect }) => {
    return (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-5xl flex flex-col items-center overflow-y-auto max-h-screen py-8">
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-2 tracking-tighter drop-shadow-lg">
                    SYSTEM UPGRADE
                </h2>
                <p className="text-yellow-500 font-mono mb-8 tracking-widest text-lg animate-pulse">
                    // WÄHLE OPTIMIERUNGSPROTOKOLL //
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4 max-w-4xl">
                    <UpgradeCard 
                        title="HÜLLEN-INTEGRITÄT" 
                        code="HP"
                        desc="Erhöht maximale Strukturpunkte (+5 HP) und repariert Schaden." 
                        icon={`
  [+]
 (HP)
  [+]
`}
                        onClick={() => onSelect('HP')}
                    />
                    <UpgradeCard 
                        title="KAMPF-PROTOKOLL" 
                        code="STR"
                        desc="Verstärkt physische Schlagkraft (+1 Stärke)." 
                        icon={`
  / \\
 (STR)
  \\ /
`}
                        onClick={() => onSelect('STR')}
                    />
                    <UpgradeCard 
                        title="ABWEHR-MATRIX" 
                        code="DEF"
                        desc="Verbessert Schadensminderung (+1 Verteidigung)." 
                        icon={`
  [ ]
 (DEF)
  [ ]
`}
                        onClick={() => onSelect('DEF')}
                    />
                    <UpgradeCard 
                        title="INTELLIGENZ" 
                        code="INT"
                        desc="Erhöht Hacking-Erfolgswahrscheinlichkeit (+1 INT)." 
                        icon={`
 { @ }
 (INT)
 { @ }
`}
                        onClick={() => onSelect('INT')}
                    />
                </div>
            </div>
        </div>
    );
};

export default LevelUpScreen;