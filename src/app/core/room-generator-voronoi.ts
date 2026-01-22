import { GridCellState, Room, Vector2 } from "./game.model";
import { Grid } from "./grid";
import { randomInt } from "./math.helper";

function distance2(p0: Vector2, p1: Vector2) {
    let dx = p0.x - p1.x;
    let dy = p0.y - p1.y;
    return dx * dx + dy * dy;
}

function isNeighbours(p0: Vector2, p1: Vector2) {
    let dx = Math.abs(p0.x - p1.x);
    let dy = Math.abs(p0.y - p1.y);

    return (dx <= 1 && dy <= 1)
}

function isConnection(p0: Vector2, p1: Vector2) {
    let dx = Math.abs(p0.x - p1.x);
    let dy = Math.abs(p0.y - p1.y);

    return (dx == 1 && dy == 0) || (dx == 0 && dy == 1);
}

export const generateApartment = (width: number, height: number, roomsNum: number): Room => {
    const room: Room = { cells: [], entrance: null };
    const grid = new Grid(width, height);
    
    // for (let i = 0; i < roomsNum; i++) {
    //     let offsetX = 0;
    //     let offsetY = 0;

    //     if (i > 0) {
    //         const maxX = Math.max(...rooms.flatMap(cells => cells).map(cell => cell.x));
    //         const maxY = Math.max(...rooms.flatMap(cells => cells).map(cell => cell.y));

    //         offsetX = maxY >= maxX ? 1 : 0;
    //         offsetY = maxY < maxX ? 1 : 0;
    //     }

    //     const offsetSize = randomInt(2, 3);

    //     const roomCells = generateRoom(grid, offsetX * offsetSize, offsetY * offsetSize);
    //     rooms.push(roomCells);
    // }

    const roomCells = generateRoom(grid, width, height);
    const refPoints: number[] = [];
    const rooms: Vector2[][] = [];
    for (let i = 0; i < roomsNum; i++) {

        let idx = 0;
        do {
            idx = randomInt(5, roomCells.length - 5);
        } while (refPoints.includes(idx));
        refPoints.push(idx);
        rooms.push([]);
    }

    roomCells.forEach(cell => {

        let bestRefIndex = 0;
        refPoints.forEach((ref, refIndex) => {
            const bestRefPos = roomCells[refPoints[bestRefIndex]];
            const curRefPos = roomCells[ref];

            if (distance2(bestRefPos, cell) > distance2(curRefPos, cell)) {
                bestRefIndex = refIndex;
            }
        });

        rooms[bestRefIndex].push(cell);

    });

    const connections: Vector2[] = [];

    for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {

            const roomj = rooms[j];
            const wall = rooms[i].filter(celli => roomj.some(cellj => isNeighbours(celli, cellj)));
            const walkable = rooms[i].filter(celli => roomj.some(cellj => isConnection(celli, cellj)));
            if (walkable.length > 0) {
                const connecton = randomInt(0, walkable.length - 1);
                connections.push(walkable[connecton]);
            }

            if (wall.length > 0) {
                rooms[i] = rooms[i].filter(cell => !wall.some(w => w.x == cell.x && w.y == cell.y) || connections.some(c => c.x == cell.x && c.y == cell.y));
            }

        }
    }

    // for (let y = 0; y < grid.height; y++) {
    //     for (let x = 0; x < grid.width; x++) {
    //         if (isRoom(x, y, grid)) {
    //             room.cells.push(new Vector2(x, y));

    //             if (room.entrance == null) {
    //                 let neighbors = 0;
    //                 neighbors += isRoom(x - 1, y - 0, grid) ? 0 : 1;
    //                 neighbors += isRoom(x - 0, y - 1, grid) ? 0 : 1;
    //                 neighbors += isRoom(x + 1, y + 0, grid) ? 0 : 1;
    //                 neighbors += isRoom(x + 0, y + 1, grid) ? 0 : 1;

    //                 if (neighbors < 3) {
    //                     room.entrance = new Vector2(x, y);
    //                 }
    //             }
    //         }
    //     }
    // }

    return {
        cells: rooms.flatMap(it => it),
        entrance: rooms[0][0],
    };
}

function generateRoom(grid: Grid, width: number, height: number): Vector2[] {
    const room: Vector2[] = [];

    const layers = randomInt(1, 3)
    for (let i = 0; i < layers; i++) {
        const w = randomInt(width, Math.round(width + 4));
        const h = randomInt(height, Math.round(height + 4));
        const offsetX = (i == 0 ? 0 : randomInt(0, Math.round(width / 2)));
        const offsetY = (i == 0 ? 0 : randomInt(0, Math.round(height / 2)));

        for (let y = offsetY; y < h + offsetY; y++) {
            for (let x = offsetX; x < w + offsetX; x++) {
                if (grid.inBounds2(x, y) && !(grid.cells[y][x].flags & GridCellState.Room)) {
                    grid.cells[y][x].flags |= GridCellState.Room;

                    room.push(new Vector2(x, y));
                }
            }
        }
    }

    return room;
    
}

function isRoom(x: number, y: number, grid: Grid) {
    return grid.inBounds2(x, y) && grid.cells[y][x].flags & GridCellState.Room;
}

// function generateApartment(width: number, height: number, roomCount: number): Grid {
//   const grid: Grid = Array.from({ length: height }, () =>
//     Array(width).fill(".")
//   );

//   const rooms: Rect[] = [];
//   const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

//   // создаём комнаты
//   for (let i = 0; i < roomCount; i++) {
//     const rw = 4 + Math.floor(Math.random() * 6);
//     const rh = 4 + Math.floor(Math.random() * 6);
//     const rx = Math.floor(Math.random() * (width - rw - 1));
//     const ry = Math.floor(Math.random() * (height - rh - 1));
//     const room: Rect = { x: rx, y: ry, w: rw, h: rh };

//     rooms.push(room);
//     drawIrregularRoom(grid, room, letters[i % letters.length]);
//   }

//   // соединяем комнаты коридорами
//   for (let i = 1; i < rooms.length; i++) {
//     const a = center(rooms[i - 1]);
//     const b = center(rooms[i]);
//     connectNarrow(grid, a, b);
//   }

//   // добавляем стены вокруг комнат
//   addWalls(grid);

//   return grid;
// }

// function drawIrregularRoom(grid: Grid, r: Rect, symbol: string) {
//   for (let y = r.y; y < r.y + r.h; y++) {
//     for (let x = r.x; x < r.x + r.w; x++) {
//       grid[y][x] = symbol;
//     }
//   }
//   // небольшие выступы
//   const bumps = 1 + Math.floor(Math.random() * 3);
//   for (let i = 0; i < bumps; i++) {
//     const bx = r.x + Math.floor(Math.random() * r.w);
//     const by = r.y + Math.floor(Math.random() * r.h);
//     const dirs = [
//       { x: 1, y: 0 },
//       { x: -1, y: 0 },
//       { x: 0, y: 1 },
//       { x: 0, y: -1 },
//     ];
//     const d = dirs[Math.floor(Math.random() * dirs.length)];
//     const nx = bx + d.x, ny = by + d.y;
//     if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
//       grid[ny][nx] = symbol;
//     }
//   }
// }

// function center(r: Rect): Cell {
//   return { x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2) };
// }

// function connectNarrow(grid: Grid, a: Cell, b: Cell) {
//   let x = a.x, y = a.y;
//   while (x !== b.x) {
//     if (grid[y][x] === ".") grid[y][x] = "+";
//     x += x < b.x ? 1 : -1;
//   }
//   while (y !== b.y) {
//     if (grid[y][x] === ".") grid[y][x] = "+";
//     y += y < b.y ? 1 : -1;
//   }
// }

// function addWalls(grid: Grid) {
//   const h = grid.length, w = grid[0].length;
//   for (let y = 0; y < h; y++) {
//     for (let x = 0; x < w; x++) {
//       if (grid[y][x] === ".") {
//         const dirs = [
//           { x: 1, y: 0 },
//           { x: -1, y: 0 },
//           { x: 0, y: 1 },
//           { x: 0, y: -1 },
//         ];
//         if (dirs.some(d => {
//           const nx = x + d.x, ny = y + d.y;
//           return ny >= 0 && ny < h && nx >= 0 && nx < w && grid[ny][nx] !== ".";
//         })) {
//           grid[y][x] = "#"; // стена
//         }
//       }
//     }
//   }
// }
