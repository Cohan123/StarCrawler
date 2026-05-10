import { CellType, CharacterClass, Position } from '../types';
import { calculateFov } from './fov';
import { BASE_FOV_RADIUS } from './gameConfig';

export const computeVisibility = (
  currentMap: CellType[][],
  currentPlayer: { position: Position; class: CharacterClass },
  currentRevealed: Set<string>
) => {
  const playerCell = currentMap[currentPlayer.position.y]?.[currentPlayer.position.x] ?? CellType.FLOOR;
  const classBonus = currentPlayer.class === 'SCOUT' ? 2 : 0;
  const currentFovRadius = playerCell === CellType.RADIATION ? 2 : BASE_FOV_RADIUS + classBonus;

  const visibleFromPlayer = calculateFov(currentMap, currentPlayer.position, currentFovRadius);
  const allVisible = new Set(visibleFromPlayer);

  for (let y = 0; y < currentMap.length; y++) {
    for (let x = 0; x < currentMap[y].length; x++) {
      const cell = currentMap[y][x];
      let radius = 0;
      if (cell === CellType.LIGHT_SOURCE) {
        radius = 2;
      } else if (cell === CellType.TERMINAL_OFF || cell === CellType.TERMINAL_ON) {
        radius = 1;
      }

      if (radius > 0 && visibleFromPlayer.has(`${x},${y}`)) {
        const visibleFromLight = calculateFov(currentMap, { x, y }, radius);
        visibleFromLight.forEach(cellKey => allVisible.add(cellKey));
      }
    }
  }

  const revealedCells = new Set(currentRevealed);
  allVisible.forEach(cell => revealedCells.add(cell));

  return { visibleCells: allVisible, revealedCells };
};
