import React, { useState } from 'react';
import { CharacterClass } from '../types';

interface StartScreenProps {
  onStart: (playerName: string, selectedClass: CharacterClass) => void;
  onWiki: () => void;
  onHighscore: () => void;
  onManual: () => void;
}

interface ClassDefinition {
    id: CharacterClass;
    title: string;
    desc: string;
    bonus: string;
}

const characterImages: Record<CharacterClass, string> = {
    MARINE: new URL('../Bilder/Chraktere/Marine.png', import.meta.url).href,
    TECHNICIAN: new URL('../Bilder/Chraktere/Techniker.png', import.meta.url).href,
    SCOUT: new URL('../Bilder/Chraktere/Scout.png', import.meta.url).href,
    SCAVENGER: new URL('../Bilder/Chraktere/Schrotter.png', import.meta.url).href,
    CYBORG: new URL('../Bilder/Chraktere/Cyborg.png', import.meta.url).href,
    DEMOLITIONIST: new URL('../Bilder/Chraktere/Sprengmeister.png', import.meta.url).href,
    SUBJECT_D: new URL('../Bilder/Chraktere/SubjectD.png', import.meta.url).href,
};

const CLASSES: ClassDefinition[] = [
    {
        id: 'MARINE',
        title: 'Marine',
        desc: 'Erprobter Kämpfer. Tödlich im Nahkampf.',
        bonus: '+10 HP | Waffe | +Dmg',
    },
    {
        id: 'TECHNICIAN',
        title: 'Techniker',
        desc: 'System-Experte. Manipuliert Elektronik.',
        bonus: 'EMP | Hacking++',
    },
    {
        id: 'SCOUT',
        title: 'Scout',
        desc: 'Aufklärer. Sieht Gefahren früh.',
        bonus: 'Sicht++ | Map Lvl 1',
    },
    {
        id: 'SCAVENGER',
        title: 'Plünderer',
        desc: 'Händler und Schatzsucher.',
        bonus: '+500 Credits | Scanner',
    },
    {
        id: 'CYBORG',
        title: 'Cyborg',
        desc: 'Halb Maschine. Immun gegen Umwelt.',
        bonus: 'Immun: Gift/Vakuum | Stark',
    },
    {
        id: 'DEMOLITIONIST',
        title: 'Sprengmeister',
        desc: 'Liebt Explosionen und Chaos.',
        bonus: '3x Granate | 2x Fass',
    },
    {
        id: 'SUBJECT_D',
        title: 'Subject D',
        desc: 'Testobjekt. Brecher der Realität.',
        bonus: 'GOD MODE',
    },
];

const MenuButton: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean; primary?: boolean }> = ({ onClick, children, disabled, primary }) => (
    <button
        type="button"
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
        <div className="absolute top-2 left-2 w-2 h-2 bg-gray-500/50 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-gray-500/50 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-gray-500/50 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]" />
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-gray-500/50 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]" />
        <span className="relative z-10 drop-shadow-md group-hover:text-white transition-colors">{children}</span>
    </button>
);

const ClassCard: React.FC<{
    cls: ClassDefinition;
    isSelected: boolean;
    onClick: () => void;
}> = ({ cls, isSelected, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={isSelected}
        className={`
            group cursor-pointer
            flex flex-col items-center
            border-2 rounded-md w-full
            min-h-[292px] sm:min-h-[320px]
            p-3
            bg-gradient-to-b from-gray-950/80 via-black/90 to-black/95
            shadow-[inset_0_0_24px_rgba(0,0,0,0.7)]
            transition-all duration-200
            backdrop-blur-sm
            ${isSelected ? 'border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.45),inset_0_0_24px_rgba(0,0,0,0.7)]' : 'border-gray-600/70 text-gray-300 hover:border-gray-300/80 hover:bg-gray-900/80'}
        `}
    >
        <div className="relative w-full h-36 sm:h-40 mb-2 overflow-hidden">
            <img
                src={characterImages[cls.id]}
                alt={cls.title}
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_12px_18px_rgba(0,0,0,0.85)] transition-transform duration-200 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent" />
        </div>

        <h3 className={`w-full text-center text-xl font-bold tracking-widest uppercase mb-2 ${isSelected ? 'text-white' : 'text-gray-200'}`}>
            {cls.title}
        </h3>
        <p className="w-full text-gray-400 text-xs sm:text-sm text-center leading-relaxed mb-3 min-h-[42px]">
            {cls.desc}
        </p>
        <div className={`mt-auto text-[11px] sm:text-xs font-bold uppercase tracking-wide border-t border-gray-700/70 pt-3 w-full text-center ${isSelected ? 'text-yellow-300' : 'text-gray-500'}`}>
            {cls.bonus}
        </div>
    </button>
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleStartClick();
        }
    };

    const bgUrl = 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/2bcbc897-5739-4863-b322-e657d85f02fc/original=true,quality=90/1000080560.jpeg';

    return (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 p-4 font-mono overflow-hidden">
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

            <div className="relative z-10 w-full max-w-6xl flex flex-col items-center justify-center space-y-4">
                <div className="text-center transform">
                    <h1
                        className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-300 via-green-600 to-green-900 drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-tighter"
                        style={{ fontFamily: 'Impact, sans-serif', textShadow: '0 0 20px rgba(74, 222, 128, 0.5)' }}
                    >
                        STAR CRAWLER
                    </h1>
                    <div className="h-1 w-full bg-green-900 shadow-[0_0_10px_rgba(74,222,128,0.5)] my-2" />
                    <h2 className="text-2xl md:text-3xl text-green-500 font-bold tracking-[0.3em] uppercase drop-shadow-lg">
                        The Lost Station
                    </h2>
                </div>

                <div
                    className="
                        w-full
                        bg-black/70 backdrop-blur-md
                        border-2 border-gray-500/60 rounded-xl
                        shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(0,0,0,0.2)]
                        p-6 md:p-8
                        flex flex-col items-center
                        relative
                        max-h-[76vh]
                        overflow-y-auto
                        custom-scrollbar
                    "
                >
                    {step === 'name' && (
                        <div className="w-full flex flex-col items-center space-y-6 animate-fadeIn">
                            <label htmlFor="playerName" className="text-xl text-green-400 font-bold uppercase tracking-widest text-shadow">Identifikation</label>
                            <div className="relative w-full max-w-md">
                                <input
                                    id="playerName"
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    onKeyDown={handleKeyDown}
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
                                    type="button"
                                    onClick={() => setStep('class')}
                                    className="text-gray-500 hover:text-white uppercase tracking-widest text-sm hover:underline shadow-black drop-shadow-md"
                                >
                                    Zurück
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'class' && (
                         <div className="w-full flex flex-col items-center space-y-5 animate-fadeIn">
                            <h3 className="text-xl text-green-400 font-bold uppercase tracking-widest text-shadow">Wähle Spezialisierung</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                                {CLASSES.map(cls => (
                                    <ClassCard
                                        key={cls.id}
                                        cls={cls}
                                        isSelected={selectedClass === cls.id}
                                        onClick={() => setSelectedClass(cls.id)}
                                    />
                                ))}
                            </div>

                            <div className="flex flex-col w-full items-center gap-4 mt-4">
                                <MenuButton onClick={() => setStep('name')} primary>Weiter</MenuButton>
                                <button
                                    type="button"
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
                <p className="text-gray-500 text-xs font-mono drop-shadow-md">SYSTEM V0.2.3 // CONNECTED</p>
             </div>
        </div>
    );
};

export default StartScreen;
