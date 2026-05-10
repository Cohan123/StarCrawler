
import React, { useState, useEffect, useRef } from 'react';
import GameScreen from './components/GameScreen';
import SidePanel from './components/SidePanel';
import MessageLog from './components/MessageLog'; 
import { useGameLogic } from './hooks/useGameLogic';
import MinimapScreen from './components/MinimapScreen';
import StartScreen from './components/StartScreen';
import WikiScreen from './components/WikiScreen';
import HighscoreScreen from './components/HighscoreScreen';
import ShopScreen from './components/ShopScreen';
import MobileControls from './components/MobileControls';
import LevelUpScreen from './components/LevelUpScreen';
import ManualScreen from './components/ManualScreen'; // New
import { HazardZoneType, CharacterClass } from './types';

type GameView = 'start' | 'game' | 'wiki' | 'highscore' | 'manual';

const MENU_MUSIC = new URL('./Musik/Main.mp3', import.meta.url).href;

const GAME_MUSIC = [
    new URL('./Musik/Track01.mp3', import.meta.url).href,
    new URL('./Musik/Track02.mp3', import.meta.url).href,
    new URL('./Musik/Track03.mp3', import.meta.url).href
];

function App() {
  const [gameView, setGameView] = useState<GameView>('start');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMutedRef = useRef(false);

  const getRandomGameTrackIndex = (previousIndex?: number) => {
    if (GAME_MUSIC.length <= 1) return 0;

    let nextIndex = Math.floor(Math.random() * GAME_MUSIC.length);
    while (nextIndex === previousIndex) {
        nextIndex = Math.floor(Math.random() * GAME_MUSIC.length);
    }
    return nextIndex;
  };
  
  const handleGameOver = () => {
    setTimeout(() => {
        setGameView('start');
    }, 4000); 
  };

  const gameLogic = useGameLogic(handleGameOver);

  const startGame = (playerName: string, selectedClass: CharacterClass) => {
    gameLogic.initializeGame(playerName, selectedClass);
    setCurrentTrackIndex(getRandomGameTrackIndex());
    setGameView('game');
  };

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Background Music Logic
  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.volume = 0.25; // Lower volume for atmosphere
    }
    const audio = audioRef.current;

    const playMusic = async (url: string, loop: boolean) => {
        if (isMutedRef.current) return;

        try {
            // Only update src if it's different to prevent restarting same track
            if (audio.src !== url) {
                audio.src = url;
                audio.loop = loop;
                audio.load(); // Ensure the new source is loaded
                await audio.play();
            } else if (audio.paused) {
                await audio.play();
            }
        } catch (err) {
            console.log("Audio play failed (Autoplay policy or error):", err);
            // Add a one-time listener to resume audio on interaction
            const resume = () => {
                window.removeEventListener('click', resume);
                window.removeEventListener('keydown', resume);
                window.removeEventListener('touchstart', resume);
                if (isMutedRef.current) return;
                audio.play().catch(e => console.error("Resume failed:", e));
            };
            window.addEventListener('click', resume);
            window.addEventListener('keydown', resume);
            window.addEventListener('touchstart', resume);
        }
    };

    if (isMuted) {
        audio.pause();
        audio.onended = null;
        return;
    }

    if (gameView === 'game') {
        // Game Playlist Mode
        audio.onended = () => {
            setCurrentTrackIndex((prev) => getRandomGameTrackIndex(prev));
        };
        playMusic(GAME_MUSIC[currentTrackIndex], false);
    } else {
        // Menu Mode (Start, Wiki, Highscore, Manual)
        audio.onended = null;
        playMusic(MENU_MUSIC, true);
    }

  }, [gameView, currentTrackIndex, isMuted]);


  const getHazardOverlayClass = (hazardZone: HazardZoneType) => {
    switch (hazardZone) {
        case 'radiation':
            return 'bg-green-700 bg-opacity-20';
        case 'vacuum':
            return 'bg-gray-600 bg-opacity-20';
        default:
            return 'bg-opacity-0';
    }
  };

  return (
      <>
       <button
        type="button"
        onClick={() => setIsMuted((muted) => !muted)}
        aria-label={isMuted ? 'Ton einschalten' : 'Stumm schalten'}
        title={isMuted ? 'Ton einschalten' : 'Stumm schalten'}
        className={`
            fixed bottom-4 right-4 z-[100]
            w-12 h-12 rounded-full border-2
            flex items-center justify-center
            bg-black/80 backdrop-blur-sm
            shadow-[0_0_18px_rgba(0,0,0,0.55)]
            transition-all duration-200
            hover:scale-105 active:scale-95
            ${isMuted ? 'border-red-500 text-red-300 hover:bg-red-950/80' : 'border-green-500 text-green-300 hover:bg-green-950/80'}
        `}
       >
        <span className="text-xl leading-none" aria-hidden="true">{isMuted ? '🔇' : '🔊'}</span>
       </button>

       {(() => {
        switch (gameView) {
        case 'start':
            return <StartScreen 
                        onStart={startGame} 
                        onWiki={() => setGameView('wiki')} 
                        onHighscore={() => setGameView('highscore')} 
                        onManual={() => setGameView('manual')}
                    />;
        case 'wiki':
            return <WikiScreen onBack={() => setGameView('start')} />;
        case 'manual':
            return <ManualScreen onBack={() => setGameView('start')} />;
        case 'highscore':
            return <HighscoreScreen onBack={() => setGameView('start')} />;
        case 'game':
            return (
                 <div className="flex flex-col h-screen overflow-hidden bg-black text-gray-300 font-mono">
                    {/* Top Bar - Minimal Header */}
                    <header className="flex-shrink-0 border-b border-gray-800 p-2 flex justify-between items-center bg-gray-900 z-20">
                         <div className="flex items-center gap-4">
                            <h1 className="text-lg text-green-500 tracking-widest font-bold">STAR CRAWLER</h1>
                            <span className="text-xs text-gray-500 hidden sm:inline">| SEKTOR {gameLogic.gameState.depth} | {gameLogic.gameState.playerName} | LVL {gameLogic.gameState.player.level}</span>
                         </div>
                         <div className="text-xs text-gray-600">SYS.VER.0.3</div>
                    </header>

                    {/* Main Content Area: Game + Sidebar */}
                    <div className="flex-grow flex min-h-0 relative">
                        {/* Hazard Overlay */}
                        <div className={`absolute inset-0 pointer-events-none z-10 transition-all duration-500 ${getHazardOverlayClass(gameLogic.gameState.hazardZone)}`} />
                        
                        {/* Game Board */}
                        <div className="flex-grow relative flex flex-col min-w-0">
                             <GameScreen 
                                map={gameLogic.gameState.map} 
                                playerPos={gameLogic.gameState.player.position}
                                visibleCells={gameLogic.gameState.visibleCells}
                                revealedCells={gameLogic.gameState.revealedCells}
                                enemies={gameLogic.gameState.enemies}
                                discharges={gameLogic.gameState.discharges}
                                groundItems={gameLogic.gameState.groundItems}
                                playerHurt={gameLogic.gameState.playerHurt}
                                hoverInfo={gameLogic.gameState.hoverInfo}
                                onTileClick={gameLogic.startWalking}
                                onTileHover={gameLogic.hoverTile}
                                visualEffects={gameLogic.gameState.visualEffects}
                                deployedDevices={gameLogic.gameState.deployedDevices}
                                />
                        </div>

                        {/* Right Sidebar */}
                        <div className="flex-shrink-0 w-64 border-l border-gray-800 hidden lg:block h-full">
                            <SidePanel 
                                player={gameLogic.gameState.player} 
                                depth={gameLogic.gameState.depth}
                                playerName={gameLogic.gameState.playerName}
                                map={gameLogic.gameState.map}
                                revealedCells={gameLogic.gameState.revealedCells}
                                playerPos={gameLogic.gameState.player.position}
                            />
                        </div>
                    </div>

                    {/* Bottom Log Panel */}
                    <div className="flex-shrink-0 h-48 border-t border-gray-800 z-20">
                        <MessageLog messages={gameLogic.gameState.messageHistory} />
                    </div>

                    {/* Modals & Overlays */}
                    {!gameLogic.gameState.isGameOver && !gameLogic.gameState.isShopOpen && !gameLogic.gameState.isMinimapOpen && !gameLogic.gameState.isLevelUpScreenOpen && (
                        <MobileControls 
                            onMove={gameLogic.movePlayer} 
                            onInteract={gameLogic.interact} 
                            onToggleMap={gameLogic.toggleMinimap}
                            onFire={gameLogic.fireNearestEnemy}
                            onQuickSlot={(slot) => {
                                gameLogic.useQuickSlot(slot);
                            }}
                            quickSlots={gameLogic.gameState.player.quickSlots}
                        />
                    )}
                    
                    {gameLogic.gameState.isLevelUpScreenOpen && (
                        <LevelUpScreen onSelect={gameLogic.applyLevelUp} />
                    )}

                    {gameLogic.gameState.isShopOpen && (
                        <ShopScreen
                            player={gameLogic.gameState.player}
                            onPurchase={gameLogic.buyItem}
                            onSell={gameLogic.sellItem}
                            onBuyIntel={gameLogic.buyMapIntel}
                            onClose={gameLogic.closeShop}
                        />
                    )}

                    {gameLogic.gameState.isMinimapOpen && (
                        <MinimapScreen 
                        gameState={gameLogic.gameState}
                        levelCache={gameLogic.levelCache}
                        onEquipItem={gameLogic.equipItem}
                        onAssignQuickSlot={gameLogic.assignQuickSlot}
                        onClose={gameLogic.toggleMinimap}
                        />
                    )}

                    {gameLogic.gameState.isGameOver && (
                        <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 animate-fadeIn">
                             {gameLogic.gameState.isVictory ? (
                                <>
                                    <p className="text-6xl text-green-500 mb-4 font-bold tracking-widest animate-pulse">MISSION ERFOLGREICH</p>
                                    <p className="text-xl text-green-300 mb-8">Shuttle-Startsequenz initiiert...</p>
                                    <pre className="text-green-500 text-xs sm:text-sm">
{`
      ^
     / \\
    |   |
   |  |  |
   |  |  |
  /|  |  |\\
 | |  |  | |
 | |  |  | |
 | |  |  | |
/| |  |  | |\\
| |__|__| |
|  |  |  |  |
|  |  |  |  |
   v  v  v
`}
                                    </pre>
                                </>
                            ) : (
                                <>
                                    <p className="text-5xl text-red-500 mb-8 animate-pulse">Du bist gestorben</p>
                                    <p className="text-xl text-gray-400">Kehre zum Hauptmenü zurück...</p>
                                </>
                            )}
                        </div>
                    )}
                 </div>
            );
        default:
             return <StartScreen onStart={startGame} onWiki={() => setGameView('wiki')} onHighscore={() => setGameView('highscore')} onManual={() => setGameView('manual')} />;
    }
    })()}
      </>
  );
}

export default App;
