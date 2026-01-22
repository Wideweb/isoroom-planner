type Point = { x: number; y: number };

interface Room {
    id: number;
    cells: Point[];
    center: Point;
}

interface Corridor {
    cells: Point[];
}

export class ApartmentGenerator {
    private grid: number[][];
    private width: number;
    private height: number;
    private rooms: Room[] = [];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.grid = Array.from({ length: height }, () => Array(width).fill(0));
    }

    public generate(roomCount: number) {
        // 1. Генерируем комнаты
        for (let i = 0; i < roomCount; i++) {
            this.placeRoom(i + 10); // ID начинаются с 10
        }

        // 2. Создаем стены (очищаем границы между комнатами)
        this.carveWalls();

        // 3. Соединяем (коридоры)
        const corridors = this.connectRooms();

        // 4. Точка входа (любая крайняя клетка первой комнаты или коридора)
        const entrance = this.rooms[0].cells[0];

        return {
            rooms: this.rooms,
            corridors,
            entrance,
            grid: this.grid
        };
    }

    private placeRoom(id: number) {
        const w = Math.floor(Math.random() * 6) + 4;
        const h = Math.floor(Math.random() * 6) + 4;
        
        let x: number, y: number;

        if (this.rooms.length === 0) {
            // Первая комната в центре
            x = Math.floor(this.width / 2 - w / 2);
            y = Math.floor(this.height / 2 - h / 2);
        } else {
            // Остальные — прижимаем к случайной существующей комнате
            const target = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            // Допускаем нахлест в 1-2 клетки для кучности
            x = target.center.x + (Math.random() > 0.5 ? w - 2 : -(w - 2));
            y = target.center.y + (Math.random() > 0.5 ? h - 2 : -(h - 2));
        }

        const cells: Point[] = [];
        for (let iy = y; iy < y + h; iy++) {
            for (let ix = x; ix < x + w; ix++) {
                if (this.isValid(ix, iy)) {
                    this.grid[iy][ix] = id;
                    cells.push({ x: ix, y: iy });
                }
            }
        }

        // Добавляем искажения (выступы)
        this.addDistortions(cells, id);

        this.rooms.push({
            id,
            cells,
            center: { x: Math.floor(x + w / 2), y: Math.floor(y + h / 2) }
        });
    }

    private addDistortions(cells: Point[], id: number) {
        const distortionCount = Math.floor(cells.length * 0.1); // 10% клеток дадут выступы
        for (let i = 0; i < distortionCount; i++) {
            const base = cells[Math.floor(Math.random() * cells.length)];
            const neighbors = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
            const dir = neighbors[Math.floor(Math.random() * neighbors.length)];
            const extra = { x: base.x + dir.x, y: base.y + dir.y };

            if (this.isValid(extra.x, extra.y) && this.grid[extra.y][extra.x] === 0) {
                this.grid[extra.y][extra.x] = id;
                cells.push(extra);
            }
        }
    }

    private carveWalls() {
        const toClear: Point[] = [];
        // Если у клетки комнаты есть сосед с другим ID или пустота — это потенциальная стена
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const currentId = this.grid[y][x];
                if (currentId >= 10) {
                    const neighbors = this.getNeighbors(x, y);
                    const isBorder = neighbors.some(n => this.grid[n.y][n.x] !== currentId);
                    if (isBorder) toClear.push({ x, y });
                }
            }
        }
        // Зануляем границы, превращая их в "пустые клетки-стены"
        toClear.forEach(p => {
            this.grid[p.y][p.x] = 0;
            // Удаляем эту клетку из массивов комнат, так как она стала стеной
            this.rooms.forEach(r => {
                r.cells = r.cells.filter(c => c.x !== p.x || c.y !== p.y);
            });
        });
    }

    private connectRooms(): Corridor[] {
        const corridors: Corridor[] = [];
        for (let i = 0; i < this.rooms.length - 1; i++) {
            const start = this.rooms[i].center;
            const end = this.rooms[i + 1].center;
            const path: Point[] = [];

            let curr = { ...start };
            while (curr.x !== end.x || curr.y !== end.y) {
                if (curr.x !== end.x) curr.x += end.x > curr.x ? 1 : -1;
                else if (curr.y !== end.y) curr.y += end.y > curr.y ? 1 : -1;

                // Коридор может проходить сквозь стены (0)
                if (this.grid[curr.y][curr.x] === 0) {
                    this.grid[curr.y][curr.x] = 2; // ID коридора
                    path.push({ ...curr });
                }
            }
            corridors.push({ cells: path });
        }
        return corridors;
    }

    private getNeighbors(x: number, y: number) {
        return [
            { x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }
        ].filter(p => this.isValid(p.x, p.y));
    }

    private isValid(x: number, y: number) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
}