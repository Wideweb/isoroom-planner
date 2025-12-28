import { Component, ElementRef, OnDestroy, ViewChild, AfterViewInit, HostListener, Input, Output, EventEmitter } from '@angular/core';

import { GameLevelData } from '../../../../../core/game.model';
import GameLevel from '../../../../../core/game-level';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { FailDialogComponent, FailDialogModel, FailtDialogSelection } from '../fail-dialog/fail-dialog.component';
import { GameLevelSubmitResultDto } from '../../../models/game-progress.model';
import { SuccessDialogComponent, SuccessDialogModel, SuccessDialogSelection } from '../success-dialog/success-dialog.component';

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

  @ViewChild('pixiCanvas', { static: true }) pixiCanvas!: ElementRef<HTMLCanvasElement>;
  private resizeObserver!: ResizeObserver;

  public game = new GameLevel();

  private pointerSelectionFurnitureIndex = -1;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private toolbarRect: DOMRect | null = null;
  private isPointerDown = false;
  private toolbarScrollLeft = 0;

  constructor(private dialog: MatDialog, private el: ElementRef) { }

  @HostListener('window:resize', ['$event']) onResize(event: UIEvent) { 
    this.game.updateViewPort();
  }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(event: PointerEvent) { 
    if (!this.pixiCanvas || !this.pixiCanvas.nativeElement) return;

    if (this.isPointerDown && this.toolbarRect) {
      const dx = event.clientX - this.pointerDownX;
      const dy = event.clientY - this.pointerDownY;
      const insideToolbar = event.clientY >= this.toolbarRect.top && event.clientY <= this.toolbarRect.bottom;
      if (Math.abs(dy) > Math.abs(dx) * 0.5 && this.pointerSelectionFurnitureIndex >= 0) { 
        if (!insideToolbar) {
          // Drag detected 
          this.game.select(this.pointerSelectionFurnitureIndex);
          this.isPointerDown = false;
          this.toolbarRect = null;
          this.pointerSelectionFurnitureIndex = -1;
        } 
      } else {
          // Scroll detected
          this.pointerSelectionFurnitureIndex = -1;

          const scroller = this.el.nativeElement.querySelector('.toolbar__scroller');
          const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
          let newScrollLeft = this.toolbarScrollLeft - dx;
          newScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScrollLeft));
          scroller.scrollLeft = newScrollLeft;
      }
    }

    const rect = (this.pixiCanvas.nativeElement as any).getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    this.game.handlePointerMove(x, y);
  }

  @HostListener('window:pointerup', ['$event'])
  onPointerUp(event: PointerEvent) { 
    this.isPointerDown = false;
    this.toolbarRect = null;
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

    if ((event.target as HTMLElement).closest('.toolbar')) {
      this.isPointerDown = true;
      this.pointerDownX = event.clientX;
      this.pointerDownY = event.clientY;
      this.toolbarRect = this.el.nativeElement.querySelector('.toolbar').getBoundingClientRect();
      this.toolbarScrollLeft = this.el.nativeElement.querySelector('.toolbar__scroller').scrollLeft;
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

    //this.resizeObserver = new ResizeObserver(() => this.game.updateViewPort());
    //this.resizeObserver.observe(this.pixiCanvas.nativeElement.parentElement!);
  }

  selectFurniture(index: number, event: PointerEvent) {
    this.onPointerDown(event);
    this.pointerSelectionFurnitureIndex = index;
  }

  async submit() {
    const blocked = await this.game.submit();
    await this.delay(500);
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

  toLevels() {
    this.onLevelsTransition.emit();
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cancelSelection(event: PointerEvent) {
    event.stopPropagation();
    this.game.select(-1);
  }

  rotateSelection(event: PointerEvent) {
    event.stopPropagation();
    this.game.rotateSelected();
  }

  placeSelection(event: PointerEvent) {
    event.stopPropagation();
    this.game.tryPlaceSelectedFurniture();
  }

  ngOnDestroy() {
    //this.resizeObserver.disconnect();
    this.game.destroy();
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
}
