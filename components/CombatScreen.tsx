
import React, { useRef, useEffect } from 'react';
import { Player, Enemy, EnemyType, CombatAnimationType } from '../types';

interface CombatScreenProps {
  player: Player;
  enemy: Enemy;
  onAttack: () => void;
  onDefend: () => void;
  onFlee: () => void;
  isLoading: boolean;
  animation: CombatAnimationType | null;
  combatLog: string[];
}

const enemyNames: Record<EnemyType, string> = {
  [EnemyType.NEUTRAL_ROBOT]: 'Neutraler Roboter',
  [EnemyType.HOSTILE_ROBOT]: 'Böser Roboter',
  [EnemyType.LARGE_DRONE]: 'Große Drohne',
  [EnemyType.SMALL_DRONE]: 'Kleine Drohne',
  [EnemyType.ANDROID]: 'Android',
  [EnemyType.MERCHANT]: 'Händler',
  [EnemyType.BOSS_MELEE]: 'Boss (Nahkampf)',
  [EnemyType.BOSS_RANGED]: 'Boss (Fernkampf)',
  [EnemyType.ELITE_GUARD]: 'Elite Wache',
};

const enemyArt: Record<EnemyType, string> = {
  [EnemyType.HOSTILE_ROBOT]: `
  [o o]
 /|/|\\
  | |
 /   \\
`,
  [EnemyType.LARGE_DRONE]: `
  .---.
 | o o |
'--.--'
 / \\ / \\
`,
  [EnemyType.SMALL_DRONE]: `
  .-.
 |o o|
  '-'
`,
  [EnemyType.ANDROID]: `
  (._.)
  /|-|\\
   / \\
`,
  [EnemyType.NEUTRAL_ROBOT]: `
  [o o]
 /|/|\\
  | |
 /   \\
`,
 [EnemyType.MERCHANT]: `
  [o o]
 /|/|\\
  | |
 /   \\
`,
 [EnemyType.BOSS_MELEE]: `
  /---\\
 ( O O )
 /|===|\\
  /   \\
`,
 [EnemyType.BOSS_RANGED]: `
  < O >
 /--|--\\
   / \\
`,
 [EnemyType.ELITE_GUARD]: `
  [= =]
 /|###|\\
  |###|
 /_   _\\
`,
};

const StatusBar: React.FC<{ label: string, value: number, maxValue: number, color: string, labelColor: string }> = ({ label, value, maxValue, color, labelColor }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
        <div className="w-full">
            <div className="flex justify-between text-sm mb-1">
                <span className={labelColor}>{label}</span>
                <span>{value} / {maxValue}</span>
            </div>
            <div className="w-full bg-gray-700 border border-gray-600 h-5">
                <div className={`${color} h-full transition-all duration-300`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};


const CombatScreen: React.FC<CombatScreenProps> = ({ player, enemy, onAttack, onDefend, onFlee, isLoading, animation, combatLog }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [combatLog]);

  const getScreenOverlayClass = () => {
    switch(animation) {
      case 'player-hit':
        return 'bg-red-900 bg-opacity-30';
      default:
        return '';
    }
  };
  
  const getPanelClass = () => {
    switch(animation) {
        case 'flee-success': return 'border-green-500';
        case 'flee-fail': return 'border-yellow-500';
        default: return 'border-red-700';
    }
  }
  
  const getEnemyClass = () => {
    switch(animation) {
        case 'enemy-hit': return 'animate-ping opacity-75';
        default: return '';
    }
  }

  const getPlayerClass = () => {
    switch(animation) {
        case 'player-defend': return 'shadow-[0_0_20px_theme(colors.blue.400)]';
        default: return '';
    }
  }


  return (
    <div className={`absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-40 p-4 transition-colors duration-200 ${getScreenOverlayClass()}`}>
      <div className={`w-full max-w-4xl border-4 bg-gray-900 p-8 flex flex-col md:flex-row gap-8 ${getPanelClass()}`}>
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-center relative">
            <div className={`absolute inset-0 transition-opacity duration-200 ${getEnemyClass()}`}></div>
            <h2 className={`text-3xl font-bold mb-4 ${enemy.color}`}>{enemyNames[enemy.type]}</h2>
            <pre className={`text-4xl leading-none transition-transform duration-200 ${enemy.color} ${animation === 'enemy-hit' ? 'scale-110' : ''}`}>
                {enemyArt[enemy.type]}
            </pre>
            <div className="w-full max-w-sm mt-6">
                <StatusBar label="GEGNER HP" value={enemy.health} maxValue={enemy.maxHealth} color="bg-red-500" labelColor="text-red-400" />
            </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-between">
            <div className={`w-full max-w-sm self-center p-2 rounded-lg transition-shadow duration-200 ${getPlayerClass()}`}>
                <StatusBar label="SPIELER HP" value={player.health} maxValue={player.maxHealth} color="bg-green-500" labelColor="text-green-400" />
            </div>
            <div className="grid grid-cols-1 gap-4 mt-8">
                <button onClick={onAttack} disabled={isLoading} className="p-4 bg-red-800 hover:bg-red-700 border-2 border-red-500 text-white font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    ANGRIFF
                </button>
                 <button onClick={onDefend} disabled={isLoading} className="p-4 bg-blue-800 hover:bg-blue-700 border-2 border-blue-500 text-white font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    VERTEIDIGEN
                </button>
                 <button onClick={onFlee} disabled={isLoading} className="p-4 bg-yellow-800 hover:bg-yellow-700 border-2 border-yellow-500 text-white font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    FLIEHEN
                </button>
            </div>
        </div>
      </div>
      <div ref={logContainerRef} className={`w-full max-w-4xl h-32 bg-black border-4 border-t-0 p-4 overflow-y-auto text-base ${getPanelClass()}`}>
            {combatLog.map((msg, index) => (
                <p key={index} className="text-sm text-gray-300 font-mono">&gt; {msg}</p>
            ))}
      </div>
    </div>
  );
};

export default CombatScreen;
