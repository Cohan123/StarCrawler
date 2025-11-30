import { CellType, Position } from '../types';

const isOpaque = (cell: CellType): boolean => {
    return cell === CellType.WALL || cell === CellType.DOOR_CLOSED;
};

// Bresenham's line algorithm to get all points on a line between two positions
const getLine = (start: Position, end: Position): Position[] => {
    const points: Position[] = [];
    let x0 = start.x, y0 = start.y;
    const x1 = end.x, y1 = end.y;
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, e2;

    for (;;) {
        points.push({ x: x0, y: y0 });
        if (x0 === x1 && y0 === y1) break;
        e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return points;
};


export const calculateFov = (
  map: CellType[][],
  start: Position,
  radius: number
): Set<string> => {
  const visibleCells = new Set<string>();
  const width = map[0].length;
  const height = map.length;
  
  visibleCells.add(`${start.x},${start.y}`);

  for (let x = start.x - radius; x <= start.x + radius; x++) {
    for (let y = start.y - radius; y <= start.y + radius; y++) {
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const distance = Math.sqrt((x - start.x) ** 2 + (y - start.y) ** 2);
      if (distance > radius) continue;

      const line = getLine(start, { x, y });
      let isVisible = true;
      // Check all but the last point for obstruction
      for (let i = 0; i < line.length - 1; i++) {
          const pos = line[i];
          if (isOpaque(map[pos.y][pos.x])) {
              isVisible = false;
              break;
          }
      }

      if (isVisible) {
          visibleCells.add(`${x},${y}`);
      }
    }
  }

  return visibleCells;
};
