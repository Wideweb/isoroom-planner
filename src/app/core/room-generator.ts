import { GridCellState, Room, Vector2 } from "./game.model";
import { Grid } from "./grid";
import { randomInt, shuffle } from "./math.helper";

interface Wall {
    byY: boolean;
    cells: Vector2[];
}

interface Connection {
    room0: number;
    room1: number;
    cell: Vector2;
}

function isEdge(x: number, y: number, grid: Grid) {
    const zoneId = grid.cells[y][x].zoneId;
    if (!grid.inBounds2(x + 1, y + 0) || grid.cells[y + 0][x + 1].zoneId != zoneId) return true;
    if (!grid.inBounds2(x - 1, y + 0) || grid.cells[y + 0][x - 1].zoneId != zoneId) return true;
    if (!grid.inBounds2(x + 0, y + 1) || grid.cells[y + 1][x + 0].zoneId != zoneId) return true;
    if (!grid.inBounds2(x + 0, y - 1) || grid.cells[y - 1][x + 0].zoneId != zoneId) return true;
    return false;
}

export const generateApartment = (width: number, height: number, roomsNum: number): Room => {
    const grid = new Grid(width * 2, height * 2);

    let rooms:Vector2[][] = [];
    let walls: Wall[] = [];

    rooms.push(generateRoom(grid, width, height));
    for (let i = 1; i < roomsNum; i++) {
        rooms = rooms.sort((a, b) => b.length - a.length);
        const splitted = splitRoom(rooms[0], walls);
        rooms[0] = splitted[0];
        if (splitted.length > 1) {
            rooms.push(splitted[1]);
        } 
    }

    rooms.forEach((room, id) => room.forEach(cell => {
        grid.cells[cell.y][cell.x].zoneId = id + 1;
    }))

    const roomNeighbours: Map<number, Vector2[]>[] = [];
    rooms.forEach(r => roomNeighbours.push(new Map<number, Vector2[]>()));

    walls.forEach(wall => {
        wall.cells.forEach(cell => {
            const x0 = wall.byY ? cell.x : cell.x + 1;
            const y0 = wall.byY ? cell.y + 1 : cell.y;

            const x1 = wall.byY ? cell.x : cell.x - 1;
            const y1 = wall.byY ? cell.y - 1 : cell.y;

            if (grid.inBounds2(x0, y0) && grid.inBounds2(x1, y1)) {
                const room0 = grid.cells[y0][x0].zoneId - 1;
                const room1 = grid.cells[y1][x1].zoneId - 1;

                if (room0 >= 0 && room1 >= 0 && room0 != room1) {
                    if (!roomNeighbours[room0].has(room1)) {
                        roomNeighbours[room0].set(room1, []);
                    }
                    roomNeighbours[room0].get(room1)!.push(cell);

                    if (!roomNeighbours[room1].has(room0)) {
                        roomNeighbours[room1].set(room0, []);
                    }
                    roomNeighbours[room1].get(room0)!.push(cell);
                }
            }
        })
    });

    const connections = connectRooms(roomNeighbours);
    const edges = rooms.flatMap(it => it).filter(c => isEdge(c.x, c.y, grid));

    return {
        cells: [...rooms.flatMap(it => it), ...connections.map(c => c.cell)],
        entrance: shuffle(edges)[0],
    };
}

function generateRoom(grid: Grid, width: number, height: number): Vector2[] {
    const room: Vector2[] = [];

    const minW = Math.max(3, Math.round(width / 2));
    const minH = Math.max(3, Math.round(height / 2));

    const spreadX = Math.max(2, Math.round(width / 4));
    const spreadY = Math.max(2, Math.round(height / 4));

    const layers = randomInt(3, 5)
    for (let i = 0; i < layers; i++) {
        const w = randomInt(minW, width);
        const h = randomInt(minH, height);

        const offsetX = spreadX + randomInt(-spreadX, 0);
        const offsetY = spreadY + randomInt(-spreadY, 0);

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

function splitRoom(cells: Vector2[], walls: Wall[]): Vector2[][] {
    const rooms: Vector2[][] = [];

    const xmin = Math.min(...cells.map(c => c.x));
    const xmax = Math.max(...cells.map(c => c.x));

    const ymin = Math.min(...cells.map(c => c.y));
    const ymax = Math.max(...cells.map(c => c.y));

    const dx = xmax - xmin + 1;
    const dy = ymax - ymin + 1;

    if (dy > dx) {
        if (dy < 4) {
            rooms.push(cells);
            return rooms;
        }
        
        const spreadY = dy - (2 + 2) - 1;
        const wallY = ymin + randomInt(2, 2 + spreadY);

        const room1 = cells.filter(c => c.y < wallY);
        const room2 = cells.filter(c => c.y > wallY);

        walls.push({
            byY: true,
            cells: cells.filter(c => c.y == wallY),
        });

        rooms.push(room1);
        rooms.push(room2);        
    } else {
        if (dx < 4) {
            rooms.push(cells);
            return rooms;
        }

        const spreadX = dx - (2 + 2) - 1;
        const wallX = xmin + randomInt(2, 2 + spreadX);

        const room1 = cells.filter(c => c.x < wallX);
        const room2 = cells.filter(c => c.x > wallX);

         walls.push({
            byY: false,
            cells: cells.filter(c => c.x == wallX),
        });

        rooms.push(room1);
        rooms.push(room2);      
    }

    return rooms;
}

function connectRooms(roomsNeighbors: Map<number, Vector2[]>[]): Connection[] {

    const visited: number[] = [];
    const connections: Connection[] = [];
    
    visitRoom(0, roomsNeighbors, visited, connections);

    return connections;
}

function visitRoom(roomId: number, roomsNeighbors: Map<number, Vector2[]>[], visited: number[], connections: Connection[]) {
    visited.push(roomId);
    
    const roomsIds = shuffle([...roomsNeighbors[roomId].keys()]);
    roomsIds.forEach(neighborId => {
        const wall = roomsNeighbors[roomId].get(neighborId);

        if (wall && wall.length > 0 && !visited.includes(neighborId)) {
            connections.push({
                room0: roomId,
                room1: neighborId,
                cell: wall[randomInt(0, wall.length - 1)]
            });
            visitRoom(neighborId, roomsNeighbors, visited, connections);
        }
    });
}