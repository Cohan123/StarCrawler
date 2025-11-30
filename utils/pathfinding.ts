
import { CellType, Position } from '../types';

interface Node {
    x: number;
    y: number;
    g: number; // Cost from start
    h: number; // Heuristic (estimated cost to end)
    f: number; // Total cost (g + h)
    parent: Node | null;
}

const getNeighbors = (node: Node, map: CellType[][]): Position[] => {
    const directions = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        // Diagonals (optional, can enable if desired)
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: -1, y: 1 },
        { x: 1, y: 1 },
    ];

    const neighbors: Position[] = [];
    const height = map.length;
    const width = map[0].length;

    for (const dir of directions) {
        const nx = node.x + dir.x;
        const ny = node.y + dir.y;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const cell = map[ny][nx];
            // Check for walkable tiles
            if (cell !== CellType.WALL && cell !== CellType.DOOR_CLOSED) { // Treat closed doors as obstacles for auto-pathing to prevent accidental opening
                neighbors.push({ x: nx, y: ny });
            }
        }
    }
    return neighbors;
};

const heuristic = (a: Position, b: Position): number => {
    // Manhattan distance is usually better for grid movement without diagonals
    // Euclidean for diagonals
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); // Chebyshev distance (good for 8-way movement)
};

export const findPath = (start: Position, end: Position, map: CellType[][]): Position[] | null => {
    const openList: Node[] = [];
    const closedSet = new Set<string>();

    const startNode: Node = {
        x: start.x,
        y: start.y,
        g: 0,
        h: heuristic(start, end),
        f: 0,
        parent: null,
    };
    startNode.f = startNode.g + startNode.h;

    openList.push(startNode);

    while (openList.length > 0) {
        // Find node with lowest f in openList
        openList.sort((a, b) => a.f - b.f);
        const currentNode = openList.shift()!;

        if (currentNode.x === end.x && currentNode.y === end.y) {
            // Path found, reconstruct
            const path: Position[] = [];
            let curr: Node | null = currentNode;
            while (curr) {
                path.push({ x: curr.x, y: curr.y });
                curr = curr.parent;
            }
            return path.reverse().slice(1); // Remove start node
        }

        closedSet.add(`${currentNode.x},${currentNode.y}`);

        const neighbors = getNeighbors(currentNode, map);
        for (const neighborPos of neighbors) {
            if (closedSet.has(`${neighborPos.x},${neighborPos.y}`)) continue;

            const gScore = currentNode.g + 1; // Assuming cost is 1 per tile

            let neighborNode = openList.find(n => n.x === neighborPos.x && n.y === neighborPos.y);

            if (!neighborNode) {
                neighborNode = {
                    x: neighborPos.x,
                    y: neighborPos.y,
                    g: gScore,
                    h: heuristic(neighborPos, end),
                    f: 0,
                    parent: currentNode,
                };
                neighborNode.f = neighborNode.g + neighborNode.h;
                openList.push(neighborNode);
            } else if (gScore < neighborNode.g) {
                neighborNode.g = gScore;
                neighborNode.f = neighborNode.g + neighborNode.h;
                neighborNode.parent = currentNode;
            }
        }
    }

    return null; // No path found
};
