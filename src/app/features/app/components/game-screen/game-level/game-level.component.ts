import { Component, ElementRef, OnDestroy, ViewChild, AfterViewInit, HostListener, Input } from '@angular/core';

import { GameLevelData } from '../../../../../core/game.model';
import GameLevel from '../../../../../core/game-level';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { FailDialogComponent, FailDialogModel, FailtDialogSelection } from '../fail-dialog/fail-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'game-level',
  templateUrl: './game-level.component.html',
  styleUrls: ['./game-level.component.scss']
})
export class GameLevelComponent implements AfterViewInit, OnDestroy {
  @Input()
  public data!: GameLevelData;

  @ViewChild('pixiCanvas', { static: true }) pixiCanvas!: ElementRef<HTMLCanvasElement>;
  private resizeObserver!: ResizeObserver;

  public game = new GameLevel();

  constructor(private dialog: MatDialog, private router: Router) { }

  @HostListener('window:resize', ['$event']) onResize(event: UIEvent) { 
    this.game.updateViewPort();
  }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(event: PointerEvent) { 
    if (!this.pixiCanvas || !this.pixiCanvas.nativeElement) return;

    const rect = (this.pixiCanvas.nativeElement as any).getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    this.game.handlePointerMove(x, y);
  }

  @HostListener('window:pointerup', ['$event'])
  onPointerUp(event: PointerEvent) { 
    if (!this.pixiCanvas || !this.pixiCanvas.nativeElement) return;

    const rect = (this.pixiCanvas.nativeElement as any).getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    this.game.handlePointerUp(x, y);
  }

  @HostListener('window:pointerdown', ['$event'])
  onPointerDown(event: PointerEvent) { 
    if (!this.pixiCanvas || !this.pixiCanvas.nativeElement) return;

    const rect = (this.pixiCanvas.nativeElement as any).getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    this.game.handlePointerDown(x, y);
  }

  @HostListener('window:keydown', ['$event'])
  async handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key.toLowerCase() === 'r') {
      this.game.rotateSelected();
    }

    if (event.key.toLowerCase() === 'escape') {
      this.game.select(-1);
    }
  }

  async ngAfterViewInit() {  
    await this.game.init(this.pixiCanvas.nativeElement);
    await this.game.start(this.data);

    //this.resizeObserver = new ResizeObserver(() => this.game.updateViewPort());
    //this.resizeObserver.observe(this.pixiCanvas.nativeElement.parentElement!);
  }

  selectFurniture(index: number, event: PointerEvent) {
    this.onPointerDown(event);
    this.game.select(index);
  }

  async submit() {
    const blocked = await this.game.submit();
    await this.delay(500);
    if (blocked > 0) {
      await this.failPath(blocked);
    }
  }

  async tryAgain() {
    await this.game.restart();
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
      } else {
        this.router.navigate(['/menu']);
      }
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ngOnDestroy() {
    //this.resizeObserver.disconnect();
    this.game.destroy();
  }
}
