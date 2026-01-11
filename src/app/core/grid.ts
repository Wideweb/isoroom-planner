import { Vector2 } from "./game.model";

export class GridCell {
    public refs: number[] = [];
    public flags: number = 0;

    constructor(public x: number, public y: number, public zoneId: number) {}
};

export class Grid {
    public cells: GridCell[][] = [];
    
    constructor(public width: number, public height: number) {
        for (let y = 0; y < height; y++) {
            this.cells.push([]);
            for (let x = 0; x < width; x++) {
                this.cells[y].push(new GridCell(x, y, 0));
            }
        }
    }

    public place(obj: number, cells: Vector2[]) {
        cells.forEach(cell => {
            if (!this.inBounds(cell)) return;

            let gridCell = this.cells[cell.y][cell.x];
            gridCell.refs.push(obj);
        });
    }

    public remove(obj: number, cells: Vector2[]) {
        cells.forEach(cell => {
            if (!this.inBounds(cell)) return;

            let gridCell = this.cells[cell.y][cell.x];
            const index = gridCell.refs.indexOf(obj);
            if (index >= 0) {
                gridCell.refs.splice(index, 1);
            }
        });
    }

    public addFlag(flag: number, cells: Vector2[]) {
        cells.forEach(cell => {
            if (!this.inBounds(cell)) return;

            let gridCell = this.cells[cell.y][cell.x];
            gridCell.flags |= flag;
        });
    }

    public removeFlag(flag: number, cells: Vector2[]) {
        cells.forEach(cell => {
            if (!this.inBounds(cell)) return;
            
            let gridCell = this.cells[cell.y][cell.x];
            gridCell.flags &= ~flag;
        });
    }

    public inBounds(cell: Vector2) {
        return cell.x >= 0 && cell.x < this.width && cell.y >= 0 && cell.y < this.height;
    }

    public getCellsOnLine(from: Vector2, to: Vector2) {
        const cells: GridCell[] = []

        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);

        const sx = (from.x < to.x) ? 1 : -1;
        const sy = (from.y < to.y) ? 1 : -1;
        let err = dx - dy;

        let x = from.x;
        let y = from.y;

        while (true) {
            if (this.inBounds({ x, y })) {
                cells.push(this.cells[y][x]);
            }

            if (x == to.x && y == to.y) {
                break
            }
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy
                x += sx
            }
            if (e2 < dx) {
                err += dx
                y += sy
            }
        }

        return cells
    }
}