import { Component, ElementRef, OnDestroy, ViewChild, AfterViewInit, HostListener, Input, Output, EventEmitter, NgZone } from '@angular/core';

import { GameLevelData, SelectedFurnitureState } from '../../../../../core/game.model';
import GameLevel from '../../../../../core/game-level';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FailDialogComponent, FailDialogModel, FailtDialogSelection } from '../fail-dialog/fail-dialog.component';
import { GameLevelSubmitResultDto } from '../../../models/game-progress.model';
import { SuccessDialogComponent, SuccessDialogModel, SuccessDialogSelection } from '../success-dialog/success-dialog.component';
import { ReplenishDeckDialogComponent, ReplenishDeckDialogModel } from '../replenish-deck-dialog/replenish-deck-dialog.component';
import { waitForTime } from '../../../services/wait-for';
import { createGameEvent, createGameEventFurnitureDragData, GameEvent, GameEventType } from '../../../models/game-event.model';
import { FailGameDialogComponent } from '../fail-game-dialog/fail-game-dialog.component';

@Component({
  selector: 'game-level',
  templateUrl: './game-level.component.html',
  styleUrls: ['./game-level.component.scss']
})
export class GameLevelComponent implements AfterViewInit, OnDestroy {
  @Input()
  public id!: number;

  @Input()
  public order!: number;

  @Input()
  public data!: GameLevelData;

  @Input()
  public hide: boolean = true;

  @Output()
  public onSubmitResult = new EventEmitter<GameLevelSubmitResultDto>();

  @Output()
  public onSwitchToNext = new EventEmitter<void>();

  @Output()
  public onMenuTransition = new EventEmitter<void>();

  @Output()
  public onLevelsTransition = new EventEmitter<void>();

  @Output() 
  public ready = new EventEmitter<GameLevelComponent>();

  @Output() 
  public gameEvent = new EventEmitter<GameEvent>();

  @ViewChild('pixiCanvas', { static: true }) pixiCanvas!: ElementRef<HTMLCanvasElement>;
  private resizeObserver!: ResizeObserver;

  public replenishDialogRef: MatDialogRef<ReplenishDeckDialogComponent, any> | null = null;

  public game = new GameLevel();

  public rulesExpaned = false;

  private pointerSelectionFurnitureIndex = -1;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private isPointerDown = false;
  private dragToolbar = false;
  private toolbarScrollLeft = 0;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private dialog: MatDialog, public el: ElementRef, private zone: NgZone) { }

  @HostListener('window:resize', ['$event'])
  async onResize(event: UIEvent) { 
    this.game.updateViewPort();
    this.gameEvent.emit(createGameEvent(GameEventType.ViewPortUpdate, null));
  }

  @HostListener('window:pointermove', ['$event'])
  async onPointerMove(event: PointerEvent) { 
    if (!this.pixiCanvas || !this.pixiCanvas.nativeElement) return;

    if (this.isPointerDown) {

      if (this.game.furnitureSelected >= 0 && this.pointerSelectionFurnitureIndex < 0 && this.game.furnitureDrag) {
        // Move item back into the list
        if (this.isInsideToolbar(event.clientY)) {
          this.pointerSelectionFurnitureIndex = this.game.furnitureSelected;
          this.game.select(-1);
        }
        
      } else {
        const dx = event.clientX - this.pointerDownX;
        const dy = event.clientY - this.pointerDownY;
        if (Math.abs(dy) / Math.abs(dx) > 0.2 && this.pointerSelectionFurnitureIndex >= 0) { 
          if (!this.isInsideToolbar(event.clientY)) {
            // Drag detected 
            this.game.select(this.pointerSelectionFurnitureIndex);
            this.pointerSelectionFurnitureIndex = -1;
          } 
        } else if (this.dragToolbar) {
          // Scroll detected
          this.pointerSelectionFurnitureIndex = -1;

          const scroller = this.el.nativeElement.querySelector('.toolbar__scroller');
          const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
          let newScrollLeft = this.toolbarScrollLeft - dx;
          newScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScrollLeft));
          scroller.scrollLeft = newScrollLeft;
        }
      }
      
    }

    const rect = (this.pixiCanvas.nativeElement as any).getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    this.game.handlePointerMove(x, y);
    this.gameEvent.emit(createGameEvent(GameEventType.FurnitureDrag, createGameEventFurnitureDragData(x, y, this.pointerSelectionFurnitureIndex)));
  }

  @HostListener('window:pointerup', ['$event'])
  onPointerUp(event: PointerEvent) { 
    this.isPointerDown = false;
    this.dragToolbar = false;
    this.pointerSelectionFurnitureIndex = -1;

    if (!this.pixiCanvas || !this.pixiCanvas.nativeElement) return;

    const rect = (this.pixiCanvas.nativeElement as any).getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    this.game.handlePointerUp(x, y);
  }

  @HostListener('window:pointerdown', ['$event'])
  onPointerDown(event: PointerEvent) { 
    if (!this.pixiCanvas || !this.pixiCanvas.nativeElement) return;

    this.isPointerDown = true;
    this.pointerDownX = event.clientX;
    this.pointerDownY = event.clientY;

    if ((event.target as HTMLElement).closest('.toolbar')) {
      this.toolbarScrollLeft = this.el.nativeElement.querySelector('.toolbar__scroller').scrollLeft;
      this.dragToolbar = true;
    } 
    else if ((event.target as HTMLElement).closest('.game-board')) {
      const rect = (this.pixiCanvas.nativeElement as any).getBoundingClientRect();
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;

      this.game.handlePointerDown(x, y);
    }
  }

  // @HostListener('window:keydown', ['$event'])
  // async handleKeyboardEvent(event: KeyboardEvent) {
  //   if (event.key.toLowerCase() === 'r') {
  //     this.game.rotateSelected();
  //   }

  //   if (event.key.toLowerCase() === 'escape') {
  //     this.game.select(-1);
  //   }
  // }

  async ngAfterViewInit() {  
    await this.game.init(this.pixiCanvas.nativeElement);
    await this.game.start(this.data);

    this.ready.emit(this);
    
    this.game.pickUpFurniture$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => {
        this.gameEvent.emit(createGameEvent(GameEventType.FurniturePickUp, null));
      });

    this.game.fail$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => this.failGame());

    //this.resizeObserver = new ResizeObserver(() => this.game.updateViewPort());
    //this.resizeObserver.observe(this.pixiCanvas.nativeElement.parentElement!);
  }

  async selectFurniture(index: number, event: PointerEvent) {
    this.onPointerDown(event);
    this.pointerSelectionFurnitureIndex = index;
  }

  async submit() {
    const blocked = await this.game.submit();
    await waitForTime(500);
    if (blocked > 0) {
      this.onSubmitResult.emit({ id: this.id, accepted: false, rejected: true, score: 10 });
      await this.failPath(blocked);
    } else {
      this.onSubmitResult.emit({ id: this.id, accepted: true, rejected: false, score: 0 });
      await this.successPath(10);
    }
  }

  async tryAgain() {
    await this.game.restart();
  }

  async successPath(score: number) {
    const dialog$ = this.dialog
      .open<SuccessDialogComponent, SuccessDialogModel, SuccessDialogSelection>(SuccessDialogComponent, { 
        disableClose: true,
        data: { score }
      })
      .afterClosed();

      const selection = await firstValueFrom(dialog$);
      if (selection == SuccessDialogSelection.Retry) {
        await this.tryAgain();
      } else {
        this.onSwitchToNext.emit();
      }
  }

  async failPath(blocked: number) {
    const dialog$ = this.dialog
      .open<FailDialogComponent, FailDialogModel, FailtDialogSelection>(FailDialogComponent, { 
        disableClose: true,
        data: { blocked }
      })
      .afterClosed();

      const selection = await firstValueFrom(dialog$);
      if (selection == FailtDialogSelection.Retry) {
        await this.tryAgain();
      } else if (selection == FailtDialogSelection.ToMenu) {
        this.onMenuTransition.emit();
      } else {
        this.game.continuePlacing();
      }
  }

  async failGame() {
    const dialog$ = this.dialog
      .open<FailGameDialogComponent>(FailGameDialogComponent, { disableClose: true })
      .afterClosed();

      await firstValueFrom(dialog$);
      this.onMenuTransition.emit();
  }

  public isReplenishShown() {
    if(!this.game.furnituresPool.groups.some(items => items.length > 0)) return false;
    return true;

    if (this.game.furnituresRemain.length < 2) return true;

    if (this.game.furnituresRemain.length < 3 && !(this.game.furnitureSelectedState & SelectedFurnitureState.New)) return true;

    return false;
  }

  async replenishDeck() {
    const groups = this.game.furnituresPool.getSortedGroups().filter(it => it.items.length > 0);

    const CATEGORY_NAME = [
      'Living Room',
      'Kitchen',
      'Bathroom',
      'Office',
      'Bedroom',
      'Decor'
    ];

    const CATEGORY_DESC = [
      'Beds, dresser, mirrors',
      'Stoves, tables, chairs',
      'Bath, sink, toilet',
      'Tables, chairs, bookshelf',
      'Beds, wardrobes, dressers',
      'Plants, carpets, lamps'
    ];

    this.replenishDialogRef = this.dialog
      .open<ReplenishDeckDialogComponent, ReplenishDeckDialogModel, any>(ReplenishDeckDialogComponent, { 
        disableClose: true,
        data: { 
          categories: groups.slice(0, 3).map(it => ({
            id: it.group,
            name: CATEGORY_NAME[it.group],
            desc: CATEGORY_DESC[it.group],
            icon: it.group
          }))
        }
      });

      this.gameEvent.emit(createGameEvent(GameEventType.ReplenishDialog, null));

      const selectedGroup = await firstValueFrom(this.replenishDialogRef.afterClosed());

      if (selectedGroup >= 0) {
        const newItems = this.game.furnituresPool.takeFromGroup(selectedGroup, 3);
        newItems.forEach(it => this.game.furnituresAvailable.push(it));

        this.gameEvent.emit(createGameEvent(GameEventType.ReplenishCategoryCompleted, null));
        this.game.moves++;
        this.game.updateScore();
      }
  }

  toLevels() {
    this.onLevelsTransition.emit();
  }

  async cancelSelection(event: PointerEvent) {
    event.stopPropagation();
    this.game.select(-1);

    this.gameEvent.emit(createGameEvent(GameEventType.FurnitureCancel, null));
  }

  async rotateSelection(event: PointerEvent) {
    event.stopPropagation();
    this.game.rotateSelected();

    this.gameEvent.emit(createGameEvent(GameEventType.FurnitureRotate, null));
  }

  async placeSelection(event: PointerEvent) {
    event.stopPropagation();
    this.game.tryPlaceSelectedFurniture();

    this.gameEvent.emit(createGameEvent(GameEventType.FurniturePlace, null));
  }

  async rotateCameraLeft() {
    this.game.rotateCameraLeft();
    this.gameEvent.emit(createGameEvent(GameEventType.CameraRotate, null));
  }

  async rotateCameraRight() {
    this.game.rotateCameraRight();
    this.gameEvent.emit(createGameEvent(GameEventType.CameraRotate, null));
  }

  ngOnDestroy() {
    //this.resizeObserver.disconnect();
    this.game.destroy();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  onXChanged(event: any) {
    this.game.furnitureSprite()!.offsetX = event.target.value;
  }

  onYChanged(event: any) {
    this.game.furnitureSprite()!.offsetY = event.target.value;
  }

  onWidthChanged(event: any) {
    this.game.furnitureSprite()!.width = event.target.value;
  }

  onHeightChanged(event: any) {
    this.game.furnitureSprite()!.height = event.target.value;
  }

  isInsideToolbar(y: number) {
    const toolbarRect = this.el.nativeElement.querySelector('.toolbar').getBoundingClientRect();
    return y >= toolbarRect.top && y <= toolbarRect.bottom;
  }

  toggleRules() {
    this.rulesExpaned = !this.rulesExpaned;
  }

  get rules() {
    return this.game.furnituresPlacementRules[this.game.furnitureSelected];
  }

  get rulesCompleted() {
    return this.game.furnituresPlacementRules[this.game.furnitureSelected].filter(it => it.isValid);
  }

  isNextLevelAvailable() {
    return this.game.score >= this.game.nextLevelScore;
  }

  toNextLevel() {
    this.game.toNextLevel();
  }
}
