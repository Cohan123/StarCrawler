
import React, { useState } from 'react';
import { CharacterClass } from '../types';

interface StartScreenProps {
  onStart: (playerName: string, selectedClass: CharacterClass) => void;
  onWiki: () => void;
  onHighscore: () => void;
  onManual: () => void; // New prop
}

const MenuButton: React.FC<{ onClick: () => void, children: React.ReactNode, disabled?: boolean, primary?: boolean }> = ({ onClick, children, disabled, primary }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`
            relative overflow-hidden
            w-full md:w-64 py-4 m-2
            ${primary ? 'border-green-700/80 from-gray-900/80 to-black/80' : 'border-gray-600/50 from-gray-900/60 to-black/60'}
            bg-gradient-to-b 
            border-4 rounded-lg
            text-green-400 font-bold tracking-widest text-lg uppercase font-mono
            shadow-[0_10px_20px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.05)]
            hover:text-green-200 hover:border-green-500/80 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)] hover:-translate-y-1
            active:translate-y-0.5 active:shadow-none
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
            transition-all duration-200
            group
            backdrop-blur-sm
        `}
    >
        {/* Screw heads - Visual Detail */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-gray-500/50 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-gray-500/50 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-gray-500/50 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]" />
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-gray-500/50 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]" />
        
        <span className="relative z-10 drop-shadow-md group-hover:text-white transition-colors">{children}</span>
    </button>
);

const ClassCard: React.FC<{ 
    title: string; 
    icon: string; 
    desc: string; 
    bonus: string;
    isSelected: boolean; 
    onClick: () => void 
}> = ({ title, icon, desc, bonus, isSelected, onClick }) => (
    <div 
        onClick={onClick}
        className={`
            cursor-pointer
            flex flex-col items-center
            border-2 p-4 rounded-lg w-full md:w-1/3
            transition-all duration-200
            backdrop-blur-sm
            ${isSelected ? 'bg-green-900/40 border-green-400/80 scale-105 shadow-[0_0_15px_rgba(74,222,128,0.2)]' : 'bg-gray-900/40 border-gray-600/50 hover:bg-gray-800/60 hover:border-gray-400/60'}
        `}
    >
        <pre className={`text-sm mb-4 leading-none font-bold ${isSelected ? 'text-green-300' : 'text-gray-400'}`}>
            {icon}
        </pre>
        <h3 className={`text-xl font-bold tracking-widest uppercase mb-2 ${isSelected ? 'text-white' : 'text-gray-300'}`}>{title}</h3>
        <p className="text-gray-400 text-xs text-center mb-3 h-12">{desc}</p>
        <div className={`text-xs font-bold uppercase tracking-wide border-t border-gray-600/50 pt-2 w-full text-center ${isSelected ? 'text-yellow-300' : 'text-gray-500'}`}>
            {bonus}
        </div>
    </div>
);


const StartScreen: React.FC<StartScreenProps> = ({ onStart, onWiki, onHighscore, onManual }) => {
    const [step, setStep] = useState<'menu' | 'class' | 'name'>('menu');
    const [playerName, setPlayerName] = useState('');
    const [selectedClass, setSelectedClass] = useState<CharacterClass>('MARINE');

    const handleStartClick = () => {
        if (playerName.trim()) {
            onStart(playerName.trim(), selectedClass);
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleStartClick();
        }
    };

    // User provided background image - Sci-Fi Space Theme
    const bgUrl = "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/2bcbc897-5739-4863-b322-e657d85f02fc/original=true,quality=90/1000080560.jpeg";

    return (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 p-4 font-mono overflow-hidden">
             {/* Background Image with Overlay */}
             <div 
                className="absolute inset-0 z-0 opacity-80"
                style={{ 
                    backgroundImage: `url(${bgUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
             />
             <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
             <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/30 to-black" />


            <div className="relative z-10 w-full max-w-5xl flex flex-col items-center justify-center space-y-8">
                
                {/* Title */}
                <div className="text-center transform">
                    <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-300 via-green-600 to-green-900 drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-tighter"
                        style={{ fontFamily: 'Impact, sans-serif', textShadow: '0 0 20px rgba(74, 222, 128, 0.5)' }}>
                        STAR CRAWLER
                    </h1>
                    <div className="h-1 w-full bg-green-900 shadow-[0_0_10px_rgba(74,222,128,0.5)] my-2" />
                    <h2 className="text-2xl md:text-4xl text-green-500 font-bold tracking-[0.3em] uppercase drop-shadow-lg">
                        The Lost Station
                    </h2>
                </div>

                {/* Main Menu Panel */}
                <div className="
                    w-full
                    bg-black/40 backdrop-blur-md
                    border-4 border-gray-600/30 rounded-xl
                    shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(0,0,0,0.2)]
                    p-8 md:p-12
                    flex flex-col items-center
                    relative
                ">
                    {/* Panel Bolts */}
                    <div className="absolute top-3 left-3 w-4 h-4 bg-gray-500/50 rounded-full border border-black/50 shadow-inner" />
                    <div className="absolute top-3 right-3 w-4 h-4 bg-gray-500/50 rounded-full border border-black/50 shadow-inner" />
                    <div className="absolute bottom-3 left-3 w-4 h-4 bg-gray-500/50 rounded-full border border-black/50 shadow-inner" />
                    <div className="absolute bottom-3 right-3 w-4 h-4 bg-gray-500/50 rounded-full border border-black/50 shadow-inner" />


                    {step === 'name' && (
                        <div className="w-full flex flex-col items-center space-y-6 animate-fadeIn">
                            <label htmlFor="playerName" className="text-xl text-green-400 font-bold uppercase tracking-widest text-shadow">Identifikation</label>
                            <div className="relative w-full max-w-md">
                                <input
                                    id="playerName"
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    maxLength={16}
                                    placeholder="NAME EINGEBEN..."
                                    className="
                                        w-full p-4 
                                        bg-black/60 border-2 border-green-800/60
                                        text-green-400 text-center text-2xl font-bold uppercase tracking-widest
                                        focus:outline-none focus:border-green-400 focus:bg-black/80 focus:shadow-[0_0_20px_rgba(74,222,128,0.3)]
                                        placeholder-green-900/50
                                        rounded
                                        backdrop-blur-sm
                                    "
                                    autoFocus
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <span className="text-green-800 animate-pulse">_</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col w-full items-center gap-4 mt-4">
                                <MenuButton onClick={handleStartClick} disabled={!playerName.trim()} primary>Bestätigen</MenuButton>
                                <button 
                                    onClick={() => setStep('class')} 
                                    className="text-gray-500 hover:text-white uppercase tracking-widest text-sm hover:underline shadow-black drop-shadow-md"
                                >
                                    Zurück
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'class' && (
                         <div className="w-full flex flex-col items-center space-y-6 animate-fadeIn">
                            <h3 className="text-xl text-green-400 font-bold uppercase tracking-widest text-shadow mb-4">Wähle Spezialisierung</h3>
                            
                            <div className="flex flex-col md:flex-row gap-4 w-full">
                                <ClassCard 
                                    title="Marine" 
                                    icon={`
  [O]
 /|\\
 / \\
`} 
                                    desc="Erprobter Kämpfer. Tödlich im Nahkampf."
                                    bonus="+10 HP | Startet mit Waffe | +Kampfschaden"
                                    isSelected={selectedClass === 'MARINE'}
                                    onClick={() => setSelectedClass('MARINE')}
                                />
                                <ClassCard 
                                    title="Techniker" 
                                    icon={`
 [=]
 /|\\
 / \\
`} 
                                    desc="System-Experte. Manipuliert Stationselektronik."
                                    bonus="Startet mit EMP | Hacking deckt Karte auf"
                                    isSelected={selectedClass === 'TECHNICIAN'}
                                    onClick={() => setSelectedClass('TECHNICIAN')}
                                />
                                <ClassCard 
                                    title="Scout" 
                                    icon={`
 (o)
 /|\\
 / \\
`} 
                                    desc="Aufklärer. Sieht Gefahren, bevor sie ihn sehen."
                                    bonus="+Sichtweite | Startet mit Map (Ebene 1)"
                                    isSelected={selectedClass === 'SCOUT'}
                                    onClick={() => setSelectedClass('SCOUT')}
                                />
                            </div>

                            <div className="flex flex-col w-full items-center gap-4 mt-8">
                                <MenuButton onClick={() => setStep('name')} primary>Weiter</MenuButton>
                                <button 
                                    onClick={() => setStep('menu')} 
                                    className="text-gray-500 hover:text-white uppercase tracking-widest text-sm hover:underline shadow-black drop-shadow-md"
                                >
                                    Abbruch
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'menu' && (
                        <div className="flex flex-col gap-4 justify-center w-full items-center animate-fadeIn">
                            <div className="w-full flex justify-center mb-2">
                                <MenuButton onClick={() => setStep('class')} primary>Neues Spiel</MenuButton>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
                                <MenuButton onClick={onWiki}>Wiki</MenuButton>
                                <MenuButton onClick={onHighscore}>Highscore</MenuButton>
                            </div>
                            <div className="w-full flex justify-center">
                                <MenuButton onClick={onManual}>Spielanleitung</MenuButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
             <div className="absolute bottom-4 text-center w-full pointer-events-none">
                <p className="text-gray-500 text-xs font-mono drop-shadow-md">SYSTEM V0.2.2 // CONNECTED</p>
             </div>
        </div>
    );
};

export default StartScreen;
