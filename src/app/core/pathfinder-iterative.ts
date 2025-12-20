import { GridCellState, Vector2 } from "./game.model";
import { Grid, GridCell } from "./grid";

export interface PathfinderIterationState {
    current: GridCell | null;
    distances: Map<string, number>;
    visited: Set<string>;
    frontier: GridCell[];
}

function key(c: GridCell) {
    return `${c.x},${c.y}`;
}

export function* findPathIterative(grid: Grid, start: Vector2): Generator<PathfinderIterationState> {
    const startCell = grid.cells[start.y][start.x];
    if (!isWalkable(startCell)) {
        return;
    }

    const dist = new Map<string, number>();
    const visited = new Set<string>();
    const frontier: [number, GridCell][] = [];

    dist.set(key(startCell), 0);
    frontier.push([0, startCell]);

    while (frontier.length > 0) {
        frontier.sort((a, b) => a[0] - b[0]);
        const [d, cell] = frontier.shift()!;
        const ck = key(cell);

        if (visited.has(ck)) continue;
        visited.add(ck);

        yield {
            current: cell,
            distances: new Map(dist),
            visited: new Set(visited),
            frontier: frontier.map(([_, c]) => c)
        };

        for (const n of getNeighbors(grid, cell)) {
            if (!isWalkable(n)) continue;
            const nk = key(n);
            const nd = d + 1;
            if (nd < (dist.get(nk) ?? Infinity)) {
                dist.set(nk, nd);
                frontier.push([nd, n]);
            }
        }
    }
}


function isWalkable(cell: GridCell): boolean {
    const flags = cell.flags;
    return (flags & GridCellState.Room) !== 0 && (flags & GridCellState.Furniture) === 0;
}

function getNeighbors(grid: Grid, cell: GridCell): GridCell[] {
    const dirs = [
        { dx:  1, dy:  0 },
        { dx: -1, dy:  0 },
        { dx:  0, dy:  1 },
        { dx:  0, dy: -1 }
    ];

    const neighbors: GridCell[] = [];
    for (const { dx, dy } of dirs) {
        const nx = cell.x + dx;
        const ny = cell.y + dy;
        if (grid.cells[ny] && grid.cells[ny][nx]) {
            neighbors.push(grid.cells[ny][nx]);
        }
    }
    return neighbors;
}

