
import { Injectable, NgZone } from '@angular/core';
import { Cell, PlacedFurniture, Rotation, Vector2, Furniture } from './game.model';
import { GameLogicService } from './game-logic.service';
import { Assets } from 'pixi.js';

import * as PIXI from 'pixi.js';

@Injectable({
  providedIn: 'root',
})
export class PixiService {
  app: any;
  private gridContainer: any;
  private furnitureContainer: any;
  private previewContainer: any;
  private origin: Vector2 = { x: 0, y: 0 };
  private tileWidth = 64;
  private tileHeight = 32;

  constructor(private ngZone: NgZone, private gameLogicService: GameLogicService) {}

  init(canvas: HTMLCanvasElement): Promise<void> {
    return new Promise((resolve) => {
      this.ngZone.runOutsideAngular(() => {
          this.app = new PIXI.Application();
          this.app.init({
              canvas: canvas,
              backgroundColor: 0x111827, // gray-900
              antialias: true,
              resolution: window.devicePixelRatio || 1,
              autoDensity: true,
          }).then(() => {
              this.gridContainer = new PIXI.Container();
              this.furnitureContainer = new PIXI.Container();
              this.previewContainer = new PIXI.Container();
              this.app.stage.addChild(this.gridContainer, this.furnitureContainer, this.previewContainer);
              resolve();
          });
      });
    });
  }

  updateViewForGridSize(): void {
    if (!this.app || !this.app.canvas.parentElement) return;

    const gridW = this.gameLogicService.gridWidth();
    const gridH = this.gameLogicService.gridHeight();
    const parent = this.app.canvas.parentElement;
    
    // 1. Resize renderer to match current canvas element size
    this.app.renderer.resize(parent.clientWidth, parent.clientHeight);

    // 2. Calculate optimal tile size
    const isoUnitsWide = gridW + gridH;
    if (isoUnitsWide === 0) return; // Prevent division by zero

    const isoUnitsHigh = isoUnitsWide / 2;

    const paddingX = 60; // horizontal padding
    const paddingY = 100; // vertical padding

    const availableWidth = parent.clientWidth - paddingX;
    const availableHeight = parent.clientHeight - paddingY;

    if (availableWidth <= 0 || availableHeight <= 0) {
      this.tileWidth = 4; // Use a minimum size if canvas is not ready
    } else {
      const tileWidthForWidth = availableWidth / isoUnitsWide;
      const tileWidthForHeight = availableHeight / isoUnitsHigh;
      this.tileWidth = Math.min(64, tileWidthForWidth, tileWidthForHeight);
    }
    
    // Ensure tileWidth is not smaller than a minimum visible size
    this.tileWidth = Math.max(4, this.tileWidth);
    this.tileHeight = this.tileWidth / 2;


    // 3. Calculate new origin to center the grid
    const gridCenterX = (gridW - 1) / 2;
    const gridCenterY = (gridH - 1) / 2;
    
    const screenCenterX = this.app.screen.width / 2;
    const screenCenterY = this.app.screen.height / 2;

    const gridCenterScreenOffsetX = (gridCenterX - gridCenterY) * (this.tileWidth / 2);
    const gridCenterScreenOffsetY = (gridCenterX + gridCenterY) * (this.tileHeight / 2);

    this.origin = {
        x: screenCenterX - gridCenterScreenOffsetX,
        y: screenCenterY - gridCenterScreenOffsetY
    };
  }

  resize(): void {
    this.updateViewForGridSize();
  }

  destroy(): void {
    if (this.app) {
        this.app.destroy(true, { children: true, texture: true, baseTexture: true });
    }
  }

  screenToGrid(screenPos: Vector2): Vector2 {
    const tempX = (screenPos.x - this.origin.x) / (this.tileWidth / 2);
    const tempY = (screenPos.y - this.origin.y) / (this.tileHeight / 2);
    const gridX = Math.round((tempY + tempX) / 2);
    const gridY = Math.round((tempY - tempX) / 2);
    return { x: gridX, y: gridY };
  }

  gridToScreen(gridPos: Vector2): Vector2 {
    const screenX = this.origin.x + (gridPos.x - gridPos.y) * (this.tileWidth / 2);
    const screenY = this.origin.y + (gridPos.x + gridPos.y) * (this.tileHeight / 2);
    return { x: screenX, y: screenY };
  }

  drawGrid(grid: Cell[][]): void {
    this.gridContainer.removeChildren();
    const gridWidth = this.gameLogicService.gridWidth();
    const gridHeight = this.gameLogicService.gridHeight();
    const entrance = this.gameLogicService.entrance();

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const cell = grid[y][x];
        const tile = new PIXI.Graphics();
        const screenPos = this.gridToScreen({ x, y });

        tile.poly([
          { x: 0, y: -this.tileHeight / 2 },          // верх
          { x: this.tileWidth / 2, y: 0 },            // правый
          { x: 0, y: this.tileHeight / 2 },           // низ
          { x: -this.tileWidth / 2, y: 0 },           // левый
        ]);

        if (cell.exists) {
            const isEntrance = x === entrance.x && y === entrance.y;
            tile.stroke({width:1, color: isEntrance ? 0x34d399 : 0x4b5563 }); // emerald-400 or gray-600
            tile.fill({color: isEntrance ? 0x1f2937 : 0x374151, alpha: 1}); // gray-800 or gray-700
        } else {
            const isAdjacentToExisting = this.isAdjacentToExisting(grid, {x, y});
            if (isAdjacentToExisting) {
                tile.stroke({width: 1, color: 0x4b5563, alpha: 0.3}); // Faint outline
            }
        }
        
        tile.position.set(screenPos.x, screenPos.y);
        this.gridContainer.addChild(tile);
      }
    }
  }

  private isAdjacentToExisting(grid: Cell[][], pos: Vector2): boolean {
    const dirs = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];
    for(const dir of dirs) {
        const next = { x: pos.x + dir.x, y: pos.y + dir.y };
        if (grid[next.y]?.[next.x]?.exists) {
            return true;
        }
    }
    return false;
  }

  async drawFurniture(furniture: PlacedFurniture[], grid: Cell[][], inaccessibleIds: Set<number>): Promise<void> {
    this.furnitureContainer.removeChildren();
    
    const gridWidth = this.gameLogicService.gridWidth();
    const sortedFurniture = [...furniture].sort((a, b) => {
        const aPos = a.position.y * gridWidth + a.position.x;
        const bPos = b.position.y * gridWidth + b.position.x;
        return aPos - bPos;
    });

    const sheet = await Assets.load('assets/atlas_1.json');

    sortedFurniture.forEach(item => {
        const screenPos = this.gridToScreen(item.position);

        const spriteSrc = item.sprite[item.rotation / 90];
        const sprite = new PIXI.Sprite(sheet.textures[spriteSrc.name]);
        sprite.setSize(spriteSrc.width, spriteSrc.height);
        sprite.anchor.set(0.5, 0.5);

        if (inaccessibleIds.has(item.id)) {
            sprite.tint = 0xf87171; // red-400
        }

        sprite.position.set(screenPos.x - spriteSrc.originX, screenPos.y - spriteSrc.originY); 
        this.furnitureContainer.addChild(sprite);
    });
  }

  async drawPreview(item: Furniture, position: Vector2, rotation: Rotation, isValid: boolean): Promise<void> {
    this.previewContainer.removeChildren();
    
    const tempPlacedItem: PlacedFurniture = { ...item, position, rotation };
    const accessibilityCells = this.gameLogicService.getAccessibilityCells(tempPlacedItem);
    const footprintCells = this.gameLogicService.getFootprint(tempPlacedItem);

    const sheet = await Assets.load('assets/atlas_1.json');

    const polyPath = [
      { x: 0, y: -this.tileHeight / 2 },          // верх
      { x: this.tileWidth / 2, y: 0 },            // правый
      { x: 0, y: this.tileHeight / 2 },           // низ
      { x: -this.tileWidth / 2, y: 0 },           // левый
    ];

    accessibilityCells.forEach(cellPos => {
      const screenPos = this.gridToScreen(cellPos);
      const marker = new PIXI.Graphics();
      marker.poly(polyPath);
      marker.fill({ color: 0x38bdf8, alpha: 0.5 }); // sky-400
      marker.position.set(screenPos.x, screenPos.y);
      this.previewContainer.addChild(marker);
    });

    footprintCells.forEach(cellPos => {
      const screenPos = this.gridToScreen(cellPos);
      const marker = new PIXI.Graphics();
      marker.poly(polyPath).fill({ color: isValid ? 0x34d399 : 0xf87171, alpha: 0.6 }); // emerald-400 or red-400
      marker.poly(polyPath).stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
      marker.position.set(screenPos.x, screenPos.y);
      this.previewContainer.addChild(marker);
    });

    const spriteSrc = item.sprite[rotation / 90];
    const sprite = new PIXI.Sprite(sheet.textures[spriteSrc.name]);
    sprite.setSize(spriteSrc.width, spriteSrc.height);
    sprite.anchor.set(0.5, 0.5);

    if (!isValid) {
      sprite.tint = 0xf87171; // red-400
    }
    
    const screenPos = this.gridToScreen(position);

    sprite.position.set(screenPos.x - spriteSrc.originX, screenPos.y - spriteSrc.originY);
    sprite.alpha = 0.5;
    this.previewContainer.addChild(sprite);
  }

  clearPreview(): void {
    this.previewContainer.removeChildren();
  }
}
