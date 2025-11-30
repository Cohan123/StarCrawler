
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

  const { 
      gameState, 
      isLoading, 
      initializeGame, 
      levelCache, 
      closeShop, 
      buyItem,
      sellItem,
      buyMapIntel,
      equipItem, 
      assignQuickSlot,
      movePlayer, 
      interact, 
      toggleMinimap,
      startWalking,
      hoverTile,
      applyLevelUp,
      fireNearestEnemy
  } = useGameLogic(handleGameOver);

  const startGame = (playerName: string, selectedClass: CharacterClass) => {
    initializeGame(playerName, selectedClass);
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


  const renderGameView = () => {
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
                            <span className="text-xs text-gray-500 hidden sm:inline">| SEKTOR {gameState.depth} | {gameState.playerName} | LVL {gameState.player.level}</span>
                         </div>
                         <div className="text-xs text-gray-600">SYS.VER.0.3</div>
                    </header>

                    {/* Main Content Area: Game + Sidebar */}
                    <div className="flex-grow flex min-h-0 relative">
                        {/* Hazard Overlay */}
                        <div className={`absolute inset-0 pointer-events-none z-10 transition-all duration-500 ${getHazardOverlayClass(gameState.hazardZone)}`} />
                        
                        {/* Game Board */}
                        <div className="flex-grow relative flex flex-col min-w-0">
                             <GameScreen 
                                map={gameState.map} 
                                playerPos={gameState.player.position}
                                visibleCells={gameState.visibleCells}
                                revealedCells={gameState.revealedCells}
                                enemies={gameState.enemies}
                                discharges={gameState.discharges}
                                groundItems={gameState.groundItems}
                                playerHurt={gameState.playerHurt}
                                hoverInfo={gameState.hoverInfo}
                                onTileClick={startWalking}
                                onTileHover={hoverTile}
                                visualEffects={gameState.visualEffects}
                                deployedDevices={gameState.deployedDevices}
                                />
                        </div>

                        {/* Right Sidebar */}
                        <div className="flex-shrink-0 w-64 border-l border-gray-800 hidden lg:block h-full">
                            <SidePanel 
                                player={gameState.player} 
                                depth={gameState.depth}
                                playerName={gameState.playerName}
                                map={gameState.map}
                                revealedCells={gameState.revealedCells}
                                playerPos={gameState.player.position}
                            />
                        </div>
                    </div>

                    {/* Bottom Log Panel */}
                    <div className="flex-shrink-0 h-48 border-t border-gray-800 z-20">
                        <MessageLog messages={gameState.messageHistory} />
                    </div>

                    {/* Modals & Overlays */}
                    {!gameState.isGameOver && !gameState.isShopOpen && !gameState.isMinimapOpen && !gameState.isLevelUpScreenOpen && (
                        <MobileControls 
                            onMove={movePlayer} 
                            onInteract={interact} 
                            onToggleMap={toggleMinimap}
                            onFire={fireNearestEnemy}
                        />
                    )}
                    
                    {gameState.isLevelUpScreenOpen && (
                        <LevelUpScreen onSelect={applyLevelUp} />
                    )}

                    {gameState.isShopOpen && (
                        <ShopScreen
                            player={gameState.player}
                            onPurchase={buyItem}
                            onSell={sellItem}
                            onBuyIntel={buyMapIntel}
                            onClose={closeShop}
                        />
                    )}

                    {gameState.isMinimapOpen && (
                        <MinimapScreen 
                        gameState={gameState}
                        levelCache={levelCache}
                        onEquipItem={equipItem}
                        onAssignQuickSlot={assignQuickSlot}
                        onClose={toggleMinimap}
                        />
                    )}

                    {gameState.isGameOver && (
                        <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 animate-fadeIn">
                             {gameState.isVictory ? (
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
             return <StartScreen onStart={startGame} onWiki={() => {}} onHighscore={() => {}} onManual={() => {}} />;
    }
  };


  return (
      <>
      {renderGameView()}
      </>
  );
}

export default App;
