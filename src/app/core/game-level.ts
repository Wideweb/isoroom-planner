import { Furniture, Rotation, Vector2, Placement, GridCellState, Camera, GameLevelData, Room, Ref, SortedList, GameLevelState, SelectedFurnitureState } from "./game.model";
import { Grid } from "./grid";
import { getAccessibilityCells, getFootprint, isPlacementPossible, isPlacementValid } from "./furniture-placement.helper";
import * as PIXI from 'pixi.js';
import { gridPlacementCompare, isoGridToView, viewToIsoGrid } from "./math.helper";
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
    public tileWidth = new Ref(64);
    public tileHeight = new Ref(32);

    public room: Room | null = null;

    public furnitures: Furniture[] = [];
    public furniturePlaced = new SortedList<number, Placement>(gridPlacementCompare);
    public furnituresRemain: number[] = [];

    public furnitureSelected: number = -1;
    public furnitureSelectedRotation: Rotation = 0;
    public furnitureSelectedPosition = new Vector2();
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
      this.roomView = new RoomView(this.room, this.tileWidth, this.tileHeight);

      this.furnitures = data.furnitures;
      this.furnitures.forEach((model, index) => {
        const view = new FurnitureView(model, this.tileWidth, this.tileHeight);
        this.furnitureView.push(view);
        view.select$.subscribe((event) => {
          this.lastPointerPosition.x = event.event.global.x;
          this.lastPointerPosition.y = event.event.global.y;
          this.pickUpFurniture(index);
        });
      });
      this.furnitureSelectedView = new FurniturePreviewView(this.tileWidth, this.tileHeight);

      this.pathTracingAction = new ViewActionPathTracing({ time: 30, grid: this.grid, from: this.room?.entrance! });
      this.pathTracingAction.stop();
      this.pathView = new PathView(this.tileWidth, this.tileHeight);
      this.pathView.addAction(this.pathTracingAction);

      this.app.stage.eventMode = 'static';
      this.app.stage.hitArea = this.app.screen;

      // this.app.stage.on('pointermove', (event) => {
      //   console.log('pointermove');
      //   this.lastPointerPosition.x = event.global.x;
      //   this.lastPointerPosition.y = event.global.y;
      // });

      // this.app.stage.on('pointerup', (event) => {
      //   console.log('pointerup')
      //   if (this.furnitureSelected >= 0) {
      //     const x = this.lastPointerPosition.x - this.pointerAnchor.x;
      //     const y = this.lastPointerPosition.y - this.pointerAnchor.y;

      //     const gridPos = viewToIsoGrid({x, y}, this.camera, this.tileWidth.value, this.tileHeight.value);
      //     const placement = new Placement(gridPos, this.furnitureSelectedRotation);
      //     const isValid = isPlacementPossible(this.grid, this.furnitures[this.furnitureSelected], placement.position, placement.rotation);

      //     if (isValid) {          
      //       this.placeFurniture(this.furnitureSelected, placement.position, placement.rotation);
      //       this.furnitureSelected = -1;
      //     }
      //   }
      // });

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
        this.furnitureSelectedPosition.x = x;
        this.furnitureSelectedPosition.y = y;
      }
    }

    public handlePointerUp(x: number, y: number) {
      this.furnitureDrag = false;
      // if (this.furnitureSelected >= 0) {
      //   const x = this.lastPointerPosition.x - this.pointerAnchor.x;
      //   const y = this.lastPointerPosition.y - this.pointerAnchor.y;

      //   const gridPos = viewToIsoGrid({x, y}, this.camera, this.tileWidth.value, this.tileHeight.value);
      //   const placement = new Placement(gridPos, this.furnitureSelectedRotation);
      //   const isValid = isPlacementPossible(this.grid, this.furnitures[this.furnitureSelected], placement.position, placement.rotation);

      //   if (isValid) {          
      //     this.placeFurniture(this.furnitureSelected, placement.position, placement.rotation);
      //     this.furnitureSelected = -1;
      //   }
      // }
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
      this.layer0.position.x = -this.camera.position.x;
      this.layer0.position.y = -this.camera.position.y;

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
        const x = this.furnitureSelectedPosition.x - this.pointerAnchor.x;
        const y = this.furnitureSelectedPosition.y - this.pointerAnchor.y;

        const gridPos = viewToIsoGrid({x, y}, this.camera, this.tileWidth.value, this.tileHeight.value);
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

      const x = this.furnitureSelectedPosition.x - this.pointerAnchor.x;
      const y = this.furnitureSelectedPosition.y - this.pointerAnchor.y;

      const gridPos = viewToIsoGrid({x, y}, this.camera, this.tileWidth.value, this.tileHeight.value);
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

        // 2. Calculate optimal tile size
        const isoUnits = this.grid.width + this.grid.height;

        const paddingX = 0; // horizontal padding
        const paddingY = 0; // vertical padding

        const availableWidth = canvasWidth - paddingX;
        const availableHeight = canvasHeight - paddingY;

        const tileWidthFromWidth = (availableWidth * 2) / isoUnits;
        const tileWidthFromHeight = (availableHeight * 2) / isoUnits;

        this.tileWidth.value = Math.min(tileWidthFromWidth, tileWidthFromHeight * 2.0, 64);
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
        if (this.gameState != GameLevelState.FurniturePlacing) {
            return;
        }

        if (this.furnitureSelected >= 0 && this.furnitureSelected != index) {
            this.tryPlaceSelectedFurniture();
        }

        this.furnitureSelectedState = SelectedFurnitureState.PickedUp;
        this.furnitureDrag = true;

        if (index == this.furnitureSelected) {
          const x = this.furnitureSelectedPosition.x - this.pointerAnchor.x;
          const y = this.furnitureSelectedPosition.y - this.pointerAnchor.y;

          this.pointerAnchor.x = this.lastPointerPosition.x - x;
          this.pointerAnchor.y = this.lastPointerPosition.y - y;
        }

        this.furnitureSelectedPosition.x = this.lastPointerPosition.x;
        this.furnitureSelectedPosition.y = this.lastPointerPosition.y;

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
          this.furnitureSelectedPosition.x = this.lastPointerPosition.x;
          this.furnitureSelectedPosition.y = this.lastPointerPosition.y;
          this.furnitureSelectedState = SelectedFurnitureState.New;
      }
      this.furnitureDrag = true;
      this.pointerAnchor = new Vector2();
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

    public destroy() {
        this.app.stop();
        this.app.destroy(true);
    }
}