import { CachedLevelState, GameState } from '../types';

const SAVE_GAME_KEY = 'starCrawlerSavedRun';

type SerializedGameState = Omit<GameState, 'visibleCells' | 'revealedCells'> & {
  visibleCells: string[];
  revealedCells: string[];
};

type SerializedCachedLevelState = Omit<CachedLevelState, 'revealedCells'> & {
  revealedCells: string[];
};

interface SerializedSaveGame {
  gameState: SerializedGameState;
  levelCache: [number, SerializedCachedLevelState][];
  savedAt: number;
}

const isPlayableSave = (gameState: SerializedGameState) => !gameState.isGameOver && gameState.player.health > 0;

export const deleteSavedGame = () => {
  localStorage.removeItem(SAVE_GAME_KEY);
};

export const hasSavedGame = () => {
  const rawSave = localStorage.getItem(SAVE_GAME_KEY);
  if (!rawSave) return false;

  try {
    const parsed = JSON.parse(rawSave) as SerializedSaveGame;
    if (!isPlayableSave(parsed.gameState)) {
      deleteSavedGame();
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to inspect save game:', error);
    deleteSavedGame();
    return false;
  }
};

const prepareGameStateForSave = (gameState: GameState): GameState => ({
  ...gameState,
  isGameOver: false,
  isVictory: false,
  isMinimapOpen: false,
  isShopOpen: false,
  isLevelUpScreenOpen: false,
  playerHurt: false,
  hoverInfo: null,
  visualEffects: [],
});

const serializeGameState = (gameState: GameState): SerializedGameState => ({
  ...prepareGameStateForSave(gameState),
  visibleCells: Array.from(gameState.visibleCells),
  revealedCells: Array.from(gameState.revealedCells),
});

const deserializeGameState = (gameState: SerializedGameState): GameState => ({
  ...gameState,
  visibleCells: new Set(gameState.visibleCells),
  revealedCells: new Set(gameState.revealedCells),
});

const serializeCachedLevel = (level: CachedLevelState): SerializedCachedLevelState => ({
  ...level,
  revealedCells: Array.from(level.revealedCells),
});

const deserializeCachedLevel = (level: SerializedCachedLevelState): CachedLevelState => ({
  ...level,
  revealedCells: new Set(level.revealedCells),
});

export const saveGame = (gameState: GameState, levelCache: Map<number, CachedLevelState>) => {
  const serializedSave: SerializedSaveGame = {
    gameState: serializeGameState(gameState),
    levelCache: Array.from(levelCache.entries()).map(([depth, level]) => [depth, serializeCachedLevel(level)]),
    savedAt: Date.now(),
  };

  localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(serializedSave));
};

export const loadSavedGame = () => {
  const rawSave = localStorage.getItem(SAVE_GAME_KEY);
  if (!rawSave) return null;

  try {
    const parsed = JSON.parse(rawSave) as SerializedSaveGame;
    if (!isPlayableSave(parsed.gameState)) {
      deleteSavedGame();
      return null;
    }

    return {
      gameState: deserializeGameState(parsed.gameState),
      levelCache: new Map(parsed.levelCache.map(([depth, level]) => [depth, deserializeCachedLevel(level)])),
      savedAt: parsed.savedAt,
    };
  } catch (error) {
    console.error('Failed to load save game:', error);
    return null;
  }
};
