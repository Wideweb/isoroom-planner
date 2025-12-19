import { Furniture, Rotation, Vector2, Placement, GridCellState, Camera, GameLevelData, Room, Ref, SortedList } from "./game.model";
import { Grid } from "./grid";
import { getAccessibilityCells, getFootprint, isPlacementValid } from "./furniture-placement.helper";
import * as PIXI from 'pixi.js';
import { gridPlacementCompare, isoGridToView, viewToIsoGrid } from "./math.helper";
import FurnitureView from "./views/furniture-view";
import RoomView from "./views/room-view";
import FurniturePreviewView from "./views/furniture-preview-view";
import { StageActionCameraShake } from "./actions/camera-shake.action";

export default class GameLevel {
    public app = new PIXI.Application();
    public layer0 = new PIXI.Container();

    public camera = new Camera();
    
    public grid!: Grid;
    public tileWidth = new Ref(64);
    public tileHeight = new Ref(32);

    public room: Room | null = null;

    public furnitures: Furniture[] = [];
    public furniturePlaced = new SortedList<number, Placement>(gridPlacementCompare);

    public furnitureSelected: number = -1;
    public furnitureSelectedRotation: Rotation = 0;

    public roomView: RoomView | null = null;
    public furnitureView: FurnitureView[] = [];
    public furnitureSelectedView: FurniturePreviewView | null = null;

    private lastPointerPosition = new Vector2()
    private pointerAnchor = new Vector2();

    private cameraShakeAction = new StageActionCameraShake({strength: new Vector2(5, 5), time: 250});

    public async init(canvas: HTMLCanvasElement) {
      await this.app.init({
          canvas: canvas,
          backgroundColor: 0x111827,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          autoStart: false
      });

      this.app.stage.addChild(this.layer0);
    }

    public async start(data: GameLevelData) {
      await PIXI.Assets.load(data.assets);

      this.grid = new Grid(
        Math.max(...data.room.cells.map(c => c.x)) + 1,
        Math.max(...data.room.cells.map(c => c.y)) + 1
      );

      this.updateViewPort();

      this.room = data.room;
      this.placeRoom(this.room);
      this.roomView = new RoomView(this.room, this.tileWidth, this.tileHeight);

      this.furnitures = data.furnitures;
      this.furnitures.forEach((model, index) => this.furnitureView.push(new FurnitureView(model, this.tileWidth, this.tileHeight, () => this.pickUpFurniture(index))));
      this.furnitureSelectedView = new FurniturePreviewView(this.tileWidth, this.tileHeight);

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
          const placement = new Placement(gridPos, this.furnitureSelectedRotation);
          const isValid = this.isPlacementValid(this.furnitureSelected, placement);

          if (isValid) {          
            this.placeFurniture(this.furnitureSelected, placement.position, placement.rotation);
            this.furnitureSelected = -1;
          }
        }
      });

      this.app.ticker.add((ticker) => this.update(ticker.deltaMS));
      this.app.start();
    }

    public update(deltaMS: number) {
      this.cameraShakeAction.update(deltaMS, { camera: this.camera });

      this.layer0.removeChildren();
      this.layer0.position.x = -this.camera.position.x;
      this.layer0.position.y = -this.camera.position.y;

      this.roomView?.update();
      this.roomView?.draw(this.layer0);

      this.furniturePlaced.getAll().forEach((entry) => {
        this.furnitureView[entry.key].update(entry.value);
        this.furnitureView[entry.key].draw(this.layer0);
      });

      if (this.furnitureSelected >= 0) {
        const x = this.lastPointerPosition.x - this.pointerAnchor.x;
        const y = this.lastPointerPosition.y - this.pointerAnchor.y;

        const gridPos = viewToIsoGrid({x, y}, this.camera, this.tileWidth.value, this.tileHeight.value);
        const placement = new Placement(gridPos, this.furnitureSelectedRotation);
        const isValid = this.isPlacementValid(this.furnitureSelected, placement);

        const id = this.furnitureSelected;
        this.furnitureSelectedView!.update(this.furnitures[id], this.furnitureView[id], placement, isValid);
        this.furnitureSelectedView!.draw(this.layer0);
      } else {
        this.furnitureSelectedView!.furnitureView = null;
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
        const furniture = this.furnitures[index];

        const footprint = getFootprint(furniture, position, rotation);
        const accessibilityCells = getAccessibilityCells(furniture, position, rotation);

        this.grid.place(index, footprint);
        this.grid.addFlag(GridCellState.Furniture, footprint);

        this.grid.place(index, accessibilityCells);
        this.grid.addFlag(GridCellState.FurnitureAccessibilityCell, accessibilityCells);

        this.furniturePlaced.add(index, new Placement(position, rotation));
        this.cameraShakeAction.reset();
    }

    public removeFurniture(index: number) {
        const furniture = this.furnitures[index];
        const placement = this.furniturePlaced.getValue(index);

        if (!placement) return;

        const footprint = getFootprint(furniture, placement.position, placement.rotation);
        const accessibilityCells = getAccessibilityCells(furniture, placement.position, placement.rotation);

        this.grid.remove(index, footprint);
        this.grid.removeFlag(GridCellState.Furniture, footprint);

        this.grid.remove(index, accessibilityCells);
        this.grid.removeFlag(GridCellState.FurnitureAccessibilityCell, accessibilityCells);

        this.furniturePlaced.remove(index);
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

        const paddingX = 0; // horizontal padding
        const paddingY = 0; // vertical padding

        const availableWidth = canvasWidth - paddingX;
        const availableHeight = canvasHeight - paddingY;

        const tileWidthFromWidth = (availableWidth * 2) / isoUnits;
        const tileWidthFromHeight = (availableHeight * 2) / isoUnits;

        this.tileWidth.value = Math.min(tileWidthFromWidth, tileWidthFromHeight * 2.0, 128);
        this.tileWidth.value = Math.max(4, this.tileWidth.value);

        this.tileHeight.value = this.tileWidth.value / 2;

        // 3. Calculate new origin to center the grid
        const gridCenterX = (this.grid.width - 1) / 2;
        const gridCenterY = (this.grid.height - 1) / 2;
        
        const screenCenterX = canvasWidth / 2;
        const screenCenterY = canvasHeight / 2;

        const gridCenterScreenOffsetX = (gridCenterX - gridCenterY) * (this.tileWidth.value / 2);
        const gridCenterScreenOffsetY = (gridCenterX + gridCenterY - 2) * (this.tileHeight.value / 2);

        this.camera.position.x = -(screenCenterX - gridCenterScreenOffsetX);
        this.camera.position.y = -(screenCenterY - gridCenterScreenOffsetY);
    }

    public pickUpFurniture(index: number) {
        if (this.furnitureSelected >= 0) {
          return;
        }

        const palcement = this.furniturePlaced.getValue(index);
        if (!palcement) {
          return;
        }

        const viewPos = isoGridToView(palcement.position, this.camera, this.tileWidth.value, this.tileHeight.value);
        this.pointerAnchor.x = this.lastPointerPosition.x - viewPos.x;
        this.pointerAnchor.y = this.lastPointerPosition.y - viewPos.y;

        this.furnitureSelectedRotation = palcement.rotation;
        this.removeFurniture(index);
        this.furnitureSelected = index;
    }

    public select(index: number) {
      if (this.furniturePlaced.hasKey(index)) {
        this.pickUpFurniture(index);
      } else {
        this.furnitureSelected = index;
        this.furnitureSelectedRotation = 0;
      }
      this.pointerAnchor = new Vector2();
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