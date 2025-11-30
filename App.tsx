

import React, { useState } from 'react';
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

function App() {
  const [gameView, setGameView] = useState<GameView>('start');
  
  const handleGameOver = () => {
    setTimeout(() => {
        setGameView('start');
    }, 4000); 
  };

  const gameLogic = useGameLogic(handleGameOver);

  const startGame = (playerName: string, selectedClass: CharacterClass) => {
    gameLogic.initializeGame(playerName, selectedClass);
    setGameView('game');
  };

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