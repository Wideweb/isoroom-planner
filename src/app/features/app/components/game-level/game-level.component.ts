import { Component, ElementRef, OnDestroy, ViewChild, AfterViewInit, HostListener, Input } from '@angular/core';

import { GameLevelData } from '../../../../core/game.model';
import GameLevel from '../../../../core/game-level';

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

  constructor() { }

  @HostListener('window:resize', ['$event']) onResize(event: UIEvent) { 
    this.game.updateViewPort();
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

  selectFurniture(index: number) {
    this.game.select(index);
  }

  async submit() {
    await this.game.submit();
  }

  async tryAgain() {
    await this.game.restart();
  }

  ngOnDestroy() {
    //this.resizeObserver.disconnect();
    this.game.destroy();
  }
}
