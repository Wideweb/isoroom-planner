import { Furniture, Rotation, Vector2, Placement, GridCellState, Camera, GameLevelData, Room, Ref, SortedList, GameLevelState, SelectedFurnitureState } from "./game.model";
import { Grid } from "./grid";
import { getAccessibilityCells, getFootprint, getFootprintCenter, isPlacementPossible, isPlacementValid } from "./furniture-placement.helper";
import * as PIXI from 'pixi.js';
import { gridPlacementCompare, isoGridToView, viewToIsoGridFloating } from "./math.helper";
import FurnitureView from "./views/furniture.view";
import RoomView from "./views/room.view";
import FurniturePreviewView from "./views/furniture-preview.view";
import { StageActionCameraShake } from "./actions/camera-shake.action";
import { ViewActionFade } from "./actions/view-fade.action";
import PathView from "./views/path.view";
import { ViewActionPathTracing } from "./actions/path-tracing.action";
import { BehaviorSubject } from "rxjs";

export default class GameLevel {
    public gameState: GameLevelState = GameLevelState.None;

    public app = new PIXI.Application();
    public layer0 = new PIXI.Container();

    get renderer(): PIXI.Renderer {
      return this.app.renderer;
    }

    public camera = new Camera();
    
    public grid!: Grid;
    public tileWidth = new Ref(32);
    public tileHeight = new Ref(16);

    public room: Room | null = null;

    public furnitures: Furniture[] = [];
    public furniturePlaced = new SortedList<number, Placement>(gridPlacementCompare(this.camera, this.furnitures));
    public furnituresRemain: number[] = [];

    public furnitureSelected: number = -1;
    public furnitureSelectedRotation: Rotation = 0;
    public furnitureSelectedViewPosition = new Vector2();
    public furnitureSelectedGridPosition = new Vector2();
    public furnitureDrag = false;
    public furnitureSelectedState: number = SelectedFurnitureState.None;

    public roomView: RoomView | null = null;
    public furnitureView: FurnitureView[] = [];
    public furnitureSelectedView: FurniturePreviewView | null = null;

    public pathView: PathView | null = null;
    public pathTracingAction: ViewActionPathTracing | null = null;

    private lastPointerPosition = new Vector2();
    private pointerAnchor = new Vector2();

    private cameraShakeAction = new StageActionCameraShake({strength: new Vector2(5, 5), time: 250});
    private roomFadeAction = new ViewActionFade({ from: 0, to: 1, time: 1000 });

    private canSubmitSubject = new BehaviorSubject<boolean>(false);
    public canSubmit$ = this.canSubmitSubject.asObservable();

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
      this.roomView = new RoomView(this.room, this.tileWidth, this.tileHeight, this.camera);

      this.furnitures = data.furnitures;
      this.furnitures.forEach((model, index) => {
        const view = new FurnitureView(model, this.tileWidth, this.tileHeight, this.camera);
        this.furnitureView.push(view);
        view.select$.subscribe((event) => {
          this.lastPointerPosition.x = event.event.global.x;
          this.lastPointerPosition.y = event.event.global.y;
          this.pickUpFurniture(index);
        });
      });
      this.furnitureSelectedView = new FurniturePreviewView(this.tileWidth, this.tileHeight, this.camera);
      this.furniturePlaced = new SortedList<number, Placement>(gridPlacementCompare(this.camera, this.furnitures));

      this.pathTracingAction = new ViewActionPathTracing({ time: 30, grid: this.grid, from: this.room?.entrance! });
      this.pathTracingAction.stop();
      this.pathView = new PathView(this.tileWidth, this.tileHeight, this.camera);
      this.pathView.addAction(this.pathTracingAction);

      this.app.stage.eventMode = 'static';
      this.app.stage.hitArea = this.app.screen;

      this.app.ticker.add((ticker) => this.update(ticker.deltaMS));
      this.app.start();

      this.gameState = GameLevelState.Appearing;
      this.gameState = GameLevelState.FurniturePlacing;
      await this.roomView.addAction(this.roomFadeAction).awaiter;
    }

    public handlePointerMove(x: number, y: number) {
      this.lastPointerPosition.x = x;
      this.lastPointerPosition.y = y;

      if (this.furnitureDrag) {
        this.furnitureSelectedViewPosition.x = x;
        this.furnitureSelectedViewPosition.y = y;

        this.furnitureSelectedGridPosition = viewToIsoGridFloating(this.furnitureSelectedViewPosition, this.camera, this.tileWidth.value, this.tileHeight.value);
      }
    }

    public handlePointerUp(x: number, y: number) {
      this.furnitureDrag = false;
    }

    public handlePointerDown(x: number, y: number) {
      this.lastPointerPosition.x = x;
      this.lastPointerPosition.y = y;

      if (this.furnitureSelectedState & SelectedFurnitureState.New) {
        this.tryPlaceSelectedFurniture();
      } else if (this.furnitureSelectedState & SelectedFurnitureState.PickedUp) {
        if (this.furnitureSelectedState & SelectedFurnitureState.FirstClickHandled) {
          this.tryPlaceSelectedFurniture();
        } else {
          this.furnitureSelectedState |= SelectedFurnitureState.FirstClickHandled;
        }
      }
    }

    public update(deltaMS: number) {
      this.cameraShakeAction.update(deltaMS, { camera: this.camera });

      this.layer0.removeChildren();

      this.roomView?.update(deltaMS);
      this.roomView?.draw(this.layer0);

      this.pathView?.update(deltaMS);
      this.pathView?.draw(this.layer0);

      this.furniturePlaced.getAll().forEach((entry) => {
        let tint = 0xffffff;
        if (this.gameState == GameLevelState.Validating) {
          const reached = this.pathTracingAction?.reached.includes(entry.key);
          if (reached) {
            tint = 0x28a745;
          }
        }
        if (this.gameState == GameLevelState.ShowResult) {
          const reached = this.pathTracingAction?.reached.includes(entry.key);
          tint = reached ? 0x28a745 : 0xdc3545;
        }

        this.furnitureView[entry.key].update2(deltaMS, entry.value, 1.0, tint);
        this.furnitureView[entry.key].draw(this.layer0);
      });

      if (this.furnitureSelected >= 0) {
        const centerGridPos = getFootprintCenter(this.furnitures[this.furnitureSelected], new Vector2(), this.furnitureSelectedRotation);
        const gridPos = new Vector2();
        gridPos.x = Math.round(this.furnitureSelectedGridPosition.x - centerGridPos.x - this.pointerAnchor.x);
        gridPos.y = Math.round(this.furnitureSelectedGridPosition.y - centerGridPos.y - this.pointerAnchor.y);

        const placement = new Placement(gridPos, this.furnitureSelectedRotation);
        const isValid = isPlacementPossible(this.grid, this.furnitures[this.furnitureSelected], placement.position, placement.rotation);

        const id = this.furnitureSelected;
        this.furnitureSelectedView!.update2(deltaMS, this.furnitures[id], this.furnitureView[id], placement, isValid);
        this.furnitureSelectedView!.draw(this.layer0);
      } else {
        this.furnitureSelectedView!.furnitureView = null;
      }

      this.furnituresRemain = this.furnitures.map((it, index) => index).filter(index => !this.furniturePlaced.hasKey(index) && index != this.furnitureSelected);
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

    public tryPlaceSelectedFurniture() {
      if (this.furnitureSelected < 0) {
        return;
      }

      const centerGridPos = getFootprintCenter(this.furnitures[this.furnitureSelected], new Vector2(), this.furnitureSelectedRotation);
      const gridPos = new Vector2();
      gridPos.x = Math.round(this.furnitureSelectedGridPosition.x - centerGridPos.x - this.pointerAnchor.x);
      gridPos.y = Math.round(this.furnitureSelectedGridPosition.y - centerGridPos.y - this.pointerAnchor.y);

      const placement = new Placement(gridPos, this.furnitureSelectedRotation);
      const isValid = isPlacementPossible(this.grid, this.furnitures[this.furnitureSelected], placement.position, placement.rotation);

      if (isValid) {          
        this.placeFurniture(this.furnitureSelected, placement.position, placement.rotation);
        this.furnitureSelected = -1;
      }
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

        this.canSubmitSubject.next(this.canSubmit());
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

        this.canSubmitSubject.next(this.canSubmit());
    }

    public updateViewPort() {
        if (!this.app || !this.app.canvas || !this.app.canvas.parentElement) return;

        const parent = this.app.canvas.parentElement;
        const canvasWidth = parent.clientWidth;
        const canvasHeight = parent.clientHeight;

        // 1. Resize renderer to match current canvas element size
        this.app.renderer.resize(canvasWidth, canvasHeight);

        // 2. Grid corners
        const corners = [
          { x: 0, y: 0 },
          { x: this.grid.width, y: 0 },
          { x: 0, y: this.grid.height },
          { x: this.grid.width, y: this.grid.height }
        ]; 
        
        // 3. Project corners into screen space
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.scale = 1.0;
        const projected = corners.map(c => isoGridToView(c, this.camera, 32, 16));

        const minX = Math.min(...projected.map(p => p.x));
        const maxX = Math.max(...projected.map(p => p.x));
        const minY = Math.min(...projected.map(p => p.y));
        const maxY = Math.max(...projected.map(p => p.y));

        const gridWidthPx = maxX - minX;
        const gridHeightPx = maxY - minY;

        // 3. Calculate tileWidth so that grid fits the screen
        const scaleX = canvasWidth / gridWidthPx;
        const scaleY = canvasHeight / gridHeightPx;
        const scale = Math.min(scaleX, scaleY, 3.0);

        console.log(scaleX, scaleY);

        // 4. Move grid into the center
        const gridCenterX = (minX + maxX) / 2;
        const gridCenterY = (minY + maxY) / 2;
        const screenCenterX = canvasWidth / 2;
        const screenCenterY = canvasHeight / 2;

        this.camera.scale = scale;
        this.camera.position.x = gridCenterX * scale - screenCenterX;
        this.camera.position.y = gridCenterY * scale - screenCenterY;
        this.camera.version++;
    }

    public pickUpFurniture(index: number) {
        if (this.gameState != GameLevelState.FurniturePlacing) {
            return;
        }

        if (this.furnitureSelected >= 0 && this.furnitureSelected != index) {
            this.tryPlaceSelectedFurniture();
        }

        this.furnitureSelectedState = SelectedFurnitureState.PickedUp;
        this.furnitureDrag = true;

        const mouseGridPos = viewToIsoGridFloating(this.lastPointerPosition, this.camera, this.tileWidth.value, this.tileHeight.value);

        if (index == this.furnitureSelected) {
          const centerGridPos = getFootprintCenter(this.furnitures[index], new Vector2(), this.furnitureSelectedRotation);
          const gridPos = new Vector2();//viewToIsoGridFloating(this.furnitureSelectedViewPosition, this.camera, this.tileWidth.value, this.tileHeight.value);
          gridPos.x = Math.round(this.furnitureSelectedGridPosition.x - centerGridPos.x - this.pointerAnchor.x);
          gridPos.y = Math.round(this.furnitureSelectedGridPosition.y - centerGridPos.y - this.pointerAnchor.y);

          this.pointerAnchor.x = -gridPos.x - centerGridPos.x + mouseGridPos.x;
          this.pointerAnchor.y = -gridPos.y - centerGridPos.y + mouseGridPos.y;
        }

        this.furnitureSelectedViewPosition.x = this.lastPointerPosition.x;
        this.furnitureSelectedViewPosition.y = this.lastPointerPosition.y;
        this.furnitureSelectedGridPosition = viewToIsoGridFloating(this.furnitureSelectedViewPosition, this.camera, this.tileWidth.value, this.tileHeight.value);

        const palcement = this.furniturePlaced.getValue(index);
        if (!palcement) {
            return;
        }

        this.furnitureSelectedRotation = palcement.rotation;

        const centerGridPos = getFootprintCenter(this.furnitures[index], new Vector2(), palcement.rotation);
        this.pointerAnchor.x = -palcement.position.x - centerGridPos.x + mouseGridPos.x;
        this.pointerAnchor.y = -palcement.position.y - centerGridPos.y + mouseGridPos.y;
        
        this.removeFurniture(index);
        this.furnitureSelected = index;
    }

    public select(index: number) {
      if (this.gameState != GameLevelState.FurniturePlacing) {
          return;
      }

      if (this.furnitureSelected != index && index >= 0) {
        this.tryPlaceSelectedFurniture();
      }

      if (this.furniturePlaced.hasKey(index)) {
          this.pickUpFurniture(index);
      } else {
          this.furnitureSelected = index;
          this.furnitureSelectedRotation = 0;
          this.furnitureSelectedViewPosition.x = this.lastPointerPosition.x;
          this.furnitureSelectedViewPosition.y = this.lastPointerPosition.y;
          this.furnitureSelectedState = SelectedFurnitureState.New;
      }

      if (index >= 0) {
        this.furnitureDrag = true;
        this.pointerAnchor.x = 0;
        this.pointerAnchor.y = 0;
      }
    }

    public canSubmit() {
      return this.furniturePlaced.getAll().length == this.furnitures.length;
    }

    public async submit(): Promise<number> {
        if (!this.canSubmit()) {
          return -1;
        }

        this.gameState = GameLevelState.Validating;
        this.pathTracingAction?.reset();
        this.pathTracingAction?.start();
        await this.pathTracingAction?.awaiter;
        this.gameState = GameLevelState.ShowResult;

        return this.furnitures.filter((f, index) => !this.pathTracingAction!.reached.includes(index)).length;
    }

    public async restart() {
      this.furniturePlaced.getAll().map(it => it.key).forEach(id => this.removeFurniture(id));
      this.furnitureSelected = -1;
      this.furnitureSelectedRotation = 0;

      this.pathTracingAction?.reset();
      this.pathTracingAction?.stop();
      this.pathView!.cells.splice(0, this.pathView?.cells.length);
      this.pathView!.isDirty = true;

      this.gameState = GameLevelState.Appearing;
      this.roomFadeAction.reset();
      this.roomFadeAction.start();
      this.gameState = GameLevelState.FurniturePlacing;
      await this.roomFadeAction.awaiter;
    }

    public async continuePlacing() {
      this.pathTracingAction?.reset();
      this.pathTracingAction?.stop();
      this.pathView!.cells.splice(0, this.pathView?.cells.length);
      this.pathView!.isDirty = true;
      this.gameState = GameLevelState.FurniturePlacing;
    }

    public rotateSelected() {
        if (this.furnitureSelected >= 0) {
            this.furnitureSelectedRotation = (this.furnitureSelectedRotation + 90) % 360 as Rotation;
        }
    }

    public furnitureSprite() {
      if (this.furnitureSelected < 0) return null;
      return this.furnitureView[this.furnitureSelected].currentSprite();
    }

    public rotateCameraRight() {
      this.camera.rotation = (this.camera.rotation + 90) % 360 as Rotation;
      this.updateViewPort();

      const placedItems = [...this.furniturePlaced.getAll()];
      this.furniturePlaced.clear();
      placedItems.forEach((item) => this.furniturePlaced.add(item.key, item.value));
    }

    public rotateCameraLeft() {
      this.camera.rotation = (360 + this.camera.rotation - 90) % 360 as Rotation;
      this.updateViewPort();

      const placedItems = [...this.furniturePlaced.getAll()];
      this.furniturePlaced.clear();
      placedItems.forEach((item) => this.furniturePlaced.add(item.key, item.value));
    }

    public destroy() {
        this.app.stop();
        this.app.destroy(true);
    }
}