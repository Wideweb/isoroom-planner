import { Furniture, Rotation, Vector2, Placement, GridCellState, Camera, GameLevelData, Room, Ref, ZERO_VECTOR } from "./game.model";
import { Grid } from "./grid";
import { getAccessibilityCells, getFootprint, isPlacementValid } from "./furniture-placement.helper";
import * as PIXI from 'pixi.js';
import RoomRenderer from "./renderers/room-renderer";
import FurnituresRenderer from "./renderers/furnitures-renderer";
import FurniturePreviewRenderer from "./renderers/furniture-preview-renderer";
import { isoGridToView, isoGridToWorld, viewToIsoGrid } from "./math.helper";

export default class GameLevel {
    public app = new PIXI.Application();
    public camera = new Camera();
    
    public grid!: Grid;
    public tileWidth = new Ref(64);
    public tileHeight = new Ref(32);

    public room: Room | null = null;

    public furnitures: Furniture[] = [];
    public furniturePlaced: number[] = [];
    public furniturePlacement: Placement[] = [];

    public furnitureSelected: number = -1;
    public furnitureSelectedRotation: Rotation = 0;

    private roomRenderer: RoomRenderer = new RoomRenderer(this.camera, this.tileWidth, this.tileHeight);
    private furnituresRenderer: FurnituresRenderer = new FurnituresRenderer(this.camera, this.tileWidth, this.tileHeight);
    private previewRenderer: FurniturePreviewRenderer = new FurniturePreviewRenderer(this.camera, this.tileWidth, this.tileHeight);

    private lastPointerPosition = ZERO_VECTOR();
    private pointerAnchor = ZERO_VECTOR();

    public async init(canvas: HTMLCanvasElement) {
      await this.app.init({
          canvas: canvas,
          backgroundColor: 0x111827,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          autoStart: false
      });
    }

    public async start(data: GameLevelData) {
      await PIXI.Assets.load(data.assets);

      this.room = data.room;
      this.furnitures = data.furnitures;

      this.grid = new Grid(
        Math.max(...this.room.cells.map(c => c.x)) + 1,
        Math.max(...this.room.cells.map(c => c.y)) + 1
      );

      this.placeRoom(this.room);

      this.app.stage.eventMode = 'static';
      this.app.stage.hitArea = this.app.screen;

      this.app.stage.on('pointermove', (event) => {
        this.lastPointerPosition.x = event.global.x;
        this.lastPointerPosition.y = event.global.y;
      });

      this.app.stage.on('pointerup', (event) => {
        if (this.furnitureSelected >= 0) {
          const x = this.lastPointerPosition.x - this.pointerAnchor.x;
          const y = this.lastPointerPosition.y - this.pointerAnchor.y;

          const gridPos = viewToIsoGrid({x, y}, this.camera, this.tileWidth.value, this.tileHeight.value);
          const placement: Placement = { position: gridPos, rotation: this.furnitureSelectedRotation };
          const isValid = this.isPlacementValid(this.furnitureSelected, placement);

          if (isValid) {          
            this.placeFurniture(this.furnitureSelected, placement.position, placement.rotation);
            this.furnitureSelected = -1;
          }
        }
      });

      this.updateViewPort();
      this.app.ticker.add(() => this.update());
      this.app.start();
    }

    public update() {
      this.app.stage.removeChildren();

      this.roomRenderer.render(this.app.stage, this.room);
      this.furnituresRenderer.render(this.app.stage, this.furnitures, this.furniturePlaced, this.furniturePlacement, (id) => {
        if (this.furnitureSelected < 0) this.pickUpFurniture(id);
      });
      
      if (this.furnitureSelected >= 0) {
        const x = this.lastPointerPosition.x - this.pointerAnchor.x;
        const y = this.lastPointerPosition.y - this.pointerAnchor.y;

        const gridPos = viewToIsoGrid({x, y}, this.camera, this.tileWidth.value, this.tileHeight.value);
        const placement: Placement = { position: gridPos, rotation: this.furnitureSelectedRotation };
        const isValid = this.isPlacementValid(this.furnitureSelected, placement);
        this.previewRenderer.render(this.app.stage, this.furnitures[this.furnitureSelected], placement, isValid);
      }
    }

    public placeRoom(room: Room) {
      this.grid.addFlag(GridCellState.Room, room.cells);
      if (room.entrance) {
        this.grid.addFlag(GridCellState.RoomEntrance, [room.entrance]);
      }
    }

    public isPlacementValid(index: number, placement: Placement) {
      return isPlacementValid(this.grid, this.furnitures[index], placement.position, placement.rotation);
    }

    public placeFurniture(index: number, position: Vector2, rotation: Rotation): void {
        //assert(!this.furniturePlaced.includes(index));

        const furniture = this.furnitures[index];

        const footprint = getFootprint(furniture, position, rotation);
        const accessibilityCells = getAccessibilityCells(furniture, position, rotation);

        this.grid.place(index, footprint);
        this.grid.addFlag(GridCellState.Furniture, footprint);

        this.grid.place(index, accessibilityCells);
        this.grid.addFlag(GridCellState.FurnitureAccessibilityCell, accessibilityCells);

        this.furniturePlaced.push(index);
        this.furniturePlacement.push({ position, rotation });
    }

    public removeFurniture(index: number) {
        const toRemove = this.furniturePlaced.findIndex(item => item == index);
        //assert(toRemove >= 0);

        const furniture = this.furnitures[index];
        const placement = this.furniturePlacement[toRemove];

        const footprint = getFootprint(furniture, placement.position, placement.rotation);
        const accessibilityCells = getAccessibilityCells(furniture, placement.position, placement.rotation);

        this.grid.remove(index, footprint);
        this.grid.removeFlag(GridCellState.Furniture, footprint);

        this.grid.remove(index, accessibilityCells);
        this.grid.removeFlag(GridCellState.FurnitureAccessibilityCell, accessibilityCells);

        this.furniturePlaced.splice(toRemove, 1);
        this.furniturePlacement.splice(toRemove, 1);
    }

    public updateViewPort() {
        if (!this.app || !this.app.canvas || !this.app.canvas.parentElement) return;

        const parent = this.app.canvas.parentElement;
        const canvasWidth = parent.clientWidth;
        const canvasHeight = parent.clientHeight;

        // 1. Resize renderer to match current canvas element size
        this.app.renderer.resize(canvasWidth, canvasHeight);

        // 2. Calculate optimal tile size
        const isoUnits = this.grid.width + this.grid.height;

        const paddingX = 100; // horizontal padding
        const paddingY = 100; // vertical padding

        const availableWidth = canvasWidth - paddingX;
        const availableHeight = canvasHeight - paddingY;

        const tileWidthFromWidth = (availableWidth * 2) / isoUnits;
        const tileWidthFromHeight = (availableHeight * 2) / isoUnits;

        this.tileWidth.value = Math.min(tileWidthFromWidth, tileWidthFromHeight * 2.0);
        this.tileWidth.value = Math.max(4, this.tileWidth.value);

        this.tileHeight.value = this.tileWidth.value / 2;

        // 3. Calculate new origin to center the grid
        const gridCenterX = (this.grid.width - 1) / 2;
        const gridCenterY = (this.grid.height - 1) / 2;
        
        const screenCenterX = canvasWidth / 2;
        const screenCenterY = canvasHeight / 2;

        const gridCenterScreenOffsetX = (gridCenterX - gridCenterY) * (this.tileWidth.value / 2);
        const gridCenterScreenOffsetY = (gridCenterX + gridCenterY) * (this.tileHeight.value / 2);

        this.camera.position.x = -(screenCenterX - gridCenterScreenOffsetX);
        this.camera.position.y = -(screenCenterY - gridCenterScreenOffsetY);
    }

    public pickUpFurniture(index: number) {
        const toRemove = this.furniturePlaced.findIndex(item => item == index);
        if (toRemove < 0) {
          return;
        }

        const viewPos = isoGridToView(this.furniturePlacement[toRemove].position, this.camera, this.tileWidth.value, this.tileHeight.value);
        this.pointerAnchor.x = this.lastPointerPosition.x - viewPos.x;
        this.pointerAnchor.y = this.lastPointerPosition.y - viewPos.y;

        this.furnitureSelectedRotation = this.furniturePlacement[toRemove].rotation;
        this.removeFurniture(index);
        this.furnitureSelected = index;
    }

    public select(index: number) {
      if (this.furniturePlaced.includes(index)) {
        this.pickUpFurniture(index);
      } else {
        this.furnitureSelected = index;
        this.furnitureSelectedRotation = 0;
      }
      this.pointerAnchor = ZERO_VECTOR();
    }

    public rotateSelected() {
      if (this.furnitureSelected >= 0) {
        this.furnitureSelectedRotation = (this.furnitureSelectedRotation + 90) % 180 as Rotation;
      }
    }

    public destroy() {
      this.app.stop();
      this.app.destroy(true);
    }
}