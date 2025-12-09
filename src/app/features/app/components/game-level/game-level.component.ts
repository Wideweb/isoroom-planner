import { Component, ElementRef, OnDestroy, ViewChild, AfterViewInit, signal, computed, effect, HostListener } from '@angular/core';

import { Furniture, Rotation, Vector2 } from './game.model';
import { PixiService } from './pixi.service';
import { GameLogicService } from './game-logic.service';

const FURNITURES: Furniture[] = [
  { 
    id: 1,
    name: 'Fridge',
    requiresAccess: true,
    sprite: [
      {
        atlas: 'assets/atlas_1.json',
        name: 'fridge',
        width: 32,
        height: 50,
        originX: 0,
        originY: 18,
      },
      {
        atlas: 'assets/atlas_1.json',
        name: 'fridge',
        width: 32,
        height: 50,
        originX: 0,
        originY: 18,
      },
      {
        atlas: 'assets/atlas_1.json',
        name: 'fridge',
        width: 32,
        height: 50,
        originX: 0,
        originY: 18,
      },
      {
        atlas: 'assets/atlas_1.json',
        name: 'fridge',
        width: -32,
        height: 50,
        originX: 0,
        originY: 18,
      }
    ],
    footprint: [
      [
        [1, 5]
      ],
      [
        [5],
        [1]
      ],
      [
        [5, 1]
      ],
      [
        [1],
        [5]
      ],
    ]
  },
  {
    id: 2,
    name: 'Shelf',
    requiresAccess: true,
    sprite: [
      {
        atlas: 'assets/atlas_1.json',
        name: 'shelf',
        width: 75,
        height: 100,
        originX: -15,
        originY: 35,
      },
      {
        atlas: 'assets/atlas_1.json',
        name: 'shelf',
        width: -75,
        height: 100,
        originX: -15,
        originY: 20,
      },
      {
        atlas: 'assets/atlas_1.json',
        name: 'shelf',
        width: 75,
        height: 100,
        originX: 15,
        originY: 20,
      },
      {
        atlas: 'assets/atlas_1.json',
        name: 'shelf',
        width: -75,
        height: 100,
        originX: 15,
        originY: 35,
      }
    ],
    footprint: [
      [
        [2, 1],
        [5, 5]
      ],
      [
        [1, 5],
        [2, 5]
      ],
      [
        [5, 5],
        [1, 2]
      ],
      [
        [5, 2],
        [5, 1]
      ],
    ]
  },
];

@Component({
  selector: 'game-level',
  templateUrl: './game-level.component.html',
  styleUrls: ['./game-level.component.scss']
})
export class GameLevelComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pixiCanvas', { static: true }) pixiCanvas!: ElementRef<HTMLCanvasElement>;
  private resizeObserver!: ResizeObserver;
  private animationFrameId: number | null = null;
  private originalItemPosition: Vector2 | null = null;
  private originalItemRotation: Rotation | null = null;  

  itemsToPlace = signal<Furniture[]>(FURNITURES);
  selectedItem = signal<Furniture | null>(null);
  selectedItemRotation = signal<Rotation>(0);
  mouseGridPosition = signal<Vector2>({ x: -1, y: -1 });
  gameState = signal<'placing' | 'finished'>('placing');
  isEditMode = signal(false);
  isMovingItem = signal(false);
  inaccessibleItemIds = signal<Set<number>>(new Set());

  stagedGridWidth = signal(0);
  stagedGridHeight = signal(0);

  isCurrentPlacementValid = computed(() => {
    const item = this.selectedItem();
    if (!item) return false;
    return this.gameLogicService.isPlacementValid(item, this.mouseGridPosition(), this.selectedItemRotation());
  });


  placedItemIds = computed(() => new Set(this.gameLogicService.placedFurniture().map(item => item.id)));
  isItemPlaced = (id: number) => this.placedItemIds().has(id);

  constructor(
      private pixiService: PixiService,
      public gameLogicService: GameLogicService
    ) {
      this.stagedGridWidth.set(this.gameLogicService.gridWidth());
      this.stagedGridHeight.set(this.gameLogicService.gridHeight());

      effect(async () => {
        const grid = this.gameLogicService.grid();
        const placedFurniture = this.gameLogicService.placedFurniture();
        const inaccessibleIds = this.inaccessibleItemIds();
        const selectedItem = this.selectedItem();
        const position = this.mouseGridPosition();
        const rotation = this.selectedItemRotation();
        const isValid = this.isCurrentPlacementValid();

        if (!this.pixiService.app) return;
        
        this.pixiService.drawGrid(grid);
        await this.pixiService.drawFurniture(placedFurniture, grid, inaccessibleIds);
        this.pixiService.clearPreview();
        if (selectedItem) {
          await this.pixiService.drawPreview(selectedItem, position, rotation, isValid);
        }
      });
    }

  async ngAfterViewInit() {  
    await this.pixiService.init(this.pixiCanvas.nativeElement);

    const parentElement = this.pixiCanvas.nativeElement.parentElement!;

    this.resizeObserver = new ResizeObserver(() => {
        this.pixiService.resize();
        if (this.pixiService.app) {
            this.pixiService.drawGrid(this.gameLogicService.grid());
            this.pixiService.drawFurniture(this.gameLogicService.placedFurniture(), this.gameLogicService.grid(), this.inaccessibleItemIds());
        }
    });
    this.resizeObserver.observe(parentElement);
    
    this.setupMouseListeners();
    
    this.selectItem(FURNITURES[1])
  }

  setupMouseListeners(): void {
    const canvas = this.pixiCanvas.nativeElement;
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      const mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const gridPos = this.pixiService.screenToGrid(mousePos);
      if (gridPos.x !== this.mouseGridPosition().x || gridPos.y !== this.mouseGridPosition().y) {
        this.mouseGridPosition.set(gridPos);
      }
    });

    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const gridPos = this.pixiService.screenToGrid(mousePos);
      
      if (this.isEditMode()) {
        this.gameLogicService.toggleCell(gridPos);
        return;
      }
      
      if (this.selectedItem()) {
        this.placeSelectedItem();
      } else {
        const cell = this.gameLogicService.grid()[gridPos.y]?.[gridPos.x];
        if (cell?.occupantId) {
          this.pickUpItem(cell.occupantId);
        }
      }
    });

    canvas.addEventListener('mouseleave', () => {
        this.mouseGridPosition.set({ x: -1, y: -1 });
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      this.rotateSelectedItem();
    }
  }

  selectItem(item: Furniture): void {
    if (this.isItemPlaced(item.id) || this.isEditMode()) return;
      this.selectedItem.set(item);
      this.selectedItemRotation.set(0);
      this.isMovingItem.set(false);
    }
  
  pickUpItem(itemId: number): void {
    const item = this.gameLogicService.placedFurniture().find(f => f.id === itemId);
    if (!item) return;

    this.originalItemPosition = { ...item.position };
    this.originalItemRotation = item.rotation;

    this.gameLogicService.removeFurniture(itemId);
    this.selectedItem.set(item);
    this.selectedItemRotation.set(item.rotation);
    this.isMovingItem.set(true);
    this.inaccessibleItemIds.set(new Set());
  }

  cancelSelection(): void {
    const item = this.selectedItem();
    if (!item) return;

    if (this.isMovingItem()) {
      // Cancel move: put item back to its original spot
      this.gameLogicService.placeFurniture({
        ...item,
        position: this.originalItemPosition!,
        rotation: this.originalItemRotation! as Rotation,
      });
    }

    // Reset selection state
    this.selectedItem.set(null);
    this.isMovingItem.set(false);
    this.originalItemPosition = null;
    this.originalItemRotation = null;
    this.inaccessibleItemIds.set(new Set());
  }
  
  deleteSelectedItem(): void {
    if (!this.isMovingItem() || !this.selectedItem()) return;

    // Item is already removed from the service in pickUpItem.
    // We just need to finalize by clearing the selection.
    this.selectedItem.set(null);
    this.isMovingItem.set(false);
    this.originalItemPosition = null;
    this.originalItemRotation = null;
    this.inaccessibleItemIds.set(new Set());
  }
  
  rotateSelectedItem(): void {
    if (!this.selectedItem() || this.isEditMode()) return;
    this.selectedItemRotation.update(rot => (rot + 90) % 360 as Rotation);
  }

  placeSelectedItem(): void {
    const item = this.selectedItem();
    // || !this.isCurrentPlacementValid()
    if (!item) return;

    this.gameLogicService.placeFurniture({
        ...item,
        position: this.mouseGridPosition(),
        rotation: this.selectedItemRotation()
    });
    this.selectedItem.set(null);
    this.isMovingItem.set(false);
    this.inaccessibleItemIds.set(new Set());
    this.checkWinCondition();
  }

  checkWinCondition(): void {
    const allPlaced = this.itemsToPlace().length === this.gameLogicService.placedFurniture().length;
    if (allPlaced) {
        if (this.gameLogicService.checkWinCondition()) {
            this.gameState.set('finished');
        }
    }
  }
  
  runAccessibilityCheck(): void {
    this.inaccessibleItemIds.set(this.gameLogicService.checkAllAccessibility());
  }

  resetGame(): void {
    this.isEditMode.set(false);
    this.gameLogicService.initializeGrid();
    this.selectedItem.set(null);
    this.isMovingItem.set(false);
    this.gameState.set('placing');
    this.stagedGridWidth.set(this.gameLogicService.gridWidth());
    this.stagedGridHeight.set(this.gameLogicService.gridHeight());
    this.inaccessibleItemIds.set(new Set());
    this.pixiService.updateViewForGridSize();
  }

  updateGridWidth(event: Event): void {
    this.stagedGridWidth.set((event.target as HTMLInputElement).valueAsNumber);
  }

  updateGridHeight(event: Event): void {
    this.stagedGridHeight.set((event.target as HTMLInputElement).valueAsNumber);
  }

  applyGridSizeChange(): void {
    this.isEditMode.set(false);
    this.gameLogicService.changeGridSize(this.stagedGridWidth(), this.stagedGridHeight());
    this.pixiService.updateViewForGridSize();
  }

  toggleEditMode(): void {
    this.isEditMode.update(v => !v);
    this.cancelSelection();
  }

  ngOnDestroy() {
  }
}
