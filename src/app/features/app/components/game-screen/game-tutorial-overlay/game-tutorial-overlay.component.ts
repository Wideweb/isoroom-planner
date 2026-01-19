import { Component, ElementRef, ViewChild, HostListener, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';

import { TutorialStep, TutorialStepTargetArea } from '../../../services/game-tutorial.manager';


@Component({
  selector: 'game-tutorial-overlay',
  templateUrl: './game-tutorial-overlay.component.html',
  styleUrls: ['./game-tutorial-overlay.component.scss']
})
export class GameTutorialOverlayComponent implements OnChanges {

  @Input()
  public step!: TutorialStep;

  @Output()
  messageClosed = new EventEmitter<void>();

  @ViewChild('tutorialTextbox') tutorialTextbox!: ElementRef<HTMLDivElement>;
  @ViewChild('tutorialHighlightBox') tutorialHighlightBox!: ElementRef<HTMLDivElement>;
  @ViewChild('tutorialHandIcon') tutorialHandIcon!: ElementRef<HTMLDivElement>;
  @ViewChild('tutorialText') tutorialText!: ElementRef<HTMLDivElement>;
  @ViewChild('tutorialButtons') tutorialButtons!: ElementRef<HTMLDivElement>;

  @ViewChild('tutorialBlockerTop') tutorialBlockerTop!: ElementRef<HTMLDivElement>;
  @ViewChild('tutorialBlockerRight') tutorialBlockerRight!: ElementRef<HTMLDivElement>;
  @ViewChild('tutorialBlockerBottom') tutorialBlockerBottom!: ElementRef<HTMLDivElement>;
  @ViewChild('tutorialBlockerLeft') tutorialBlockerLeft!: ElementRef<HTMLDivElement>;

  constructor() { }

  async ngOnChanges(changes: SimpleChanges) {
      if ('step' in changes && this.step) {
        await this.showTutorialStep();
      }
    }

  @HostListener('window:resize', ['$event'])
  async onResize(event: UIEvent) {
    await this.showTutorialStep();
  }

  highlightElement(rect: TutorialStepTargetArea | null, padding = 10) {
    const box = this.tutorialHighlightBox.nativeElement;

    if (!rect) {
      box.style.display = 'none';
      return;
    }

    box.style.display = 'block';
    box.style.top = `${rect.top - padding}px`;
    box.style.left = `${rect.left - padding}px`;
    box.style.width = `${rect.width + 2 * padding}px`;
    box.style.height = `${rect.height + 2 * padding}px`;
  }

  positionBlockArea(blockArea: 'outside-area' | 'window' | 'none', highlightAreaRect: TutorialStepTargetArea | null, padding = 10) {
    const topBlocker = this.tutorialBlockerTop.nativeElement;
    const rightBlocker = this.tutorialBlockerRight.nativeElement;
    const bottomBlocker = this.tutorialBlockerBottom.nativeElement;
    const leftBlocker = this.tutorialBlockerLeft.nativeElement;

    if (blockArea == 'window') {
      topBlocker.style.top = '0px';
      topBlocker.style.left = '0px';
      topBlocker.style.width = '100%';
      topBlocker.style.height = `100%`;
      topBlocker.style.display = 'block';

      rightBlocker.style.display = 'none';
      bottomBlocker.style.display = 'none';
      leftBlocker.style.display = 'none';

      return;
    }

    if (blockArea == 'none' || !highlightAreaRect) {
      topBlocker.style.display = 'none';
      rightBlocker.style.display = 'none';
      bottomBlocker.style.display = 'none';
      leftBlocker.style.display = 'none';
      return;
    }

    if (blockArea == 'outside-area') {
      topBlocker.style.top = '0px';
      topBlocker.style.left = '0px';
      topBlocker.style.width = '100%';
      topBlocker.style.height = `${Math.max(highlightAreaRect.top - padding, 0)}px`;

      rightBlocker.style.top = '0px';
      rightBlocker.style.right = '0px';
      rightBlocker.style.width = `${Math.max(window.innerWidth - highlightAreaRect.left - highlightAreaRect.width - padding, 0)}px`;
      rightBlocker.style.height = `${window.innerHeight}px`;

      bottomBlocker.style.bottom = `0px`;
      bottomBlocker.style.left = '0px';
      bottomBlocker.style.width = '100%';
      bottomBlocker.style.height = `${Math.max(window.innerHeight - highlightAreaRect.top - highlightAreaRect.height - padding, 0)}px`;

      leftBlocker.style.top = '0px';
      leftBlocker.style.left = '0px';
      leftBlocker.style.width = `${Math.max(highlightAreaRect.left - padding, 0)}px`;
      leftBlocker.style.height = `${window.innerHeight}px`;

      topBlocker.style.display = 'block';
      rightBlocker.style.display = 'block';
      bottomBlocker.style.display = 'block';
      leftBlocker.style.display = 'block';
    }
  }

  positionTextbox(text: string | null, targetArea: TutorialStepTargetArea | null, position: 'top-center' | 'bottom-center' | 'center' = 'bottom-center') {
    const textbox = this.tutorialTextbox.nativeElement;

    if (!text) {
      textbox.classList.remove('is-visible');
      return;
    }
    this.tutorialText.nativeElement.textContent = text;

    const elRect = targetArea || { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };

    let textRect = textbox.getBoundingClientRect();
    let top: number;
    let left: number = elRect.left + elRect.width / 2 - textRect.width / 2;

    if (position === 'top-center') {
      top = elRect.top - textRect.height - 30;
    } else if (position === 'center') {
      top = elRect.top - elRect.height / 2 - textRect.height / 2;
    } else { // 'bottom-center'
      top = elRect.top + elRect.height + 30;
    }

    // Проверка выхода за границы экрана
    let movedRight = false;
    let movedLeft = false;
    let movedTop = false;
    let movedBottom = false;

    if (left < 0) {
      left = 0;
      movedRight = true;
    }
    if (left + textRect.width > window.innerWidth) {
      left = Math.max(window.innerWidth - textRect.width, 0);
      movedLeft = true;
    }
    if (top < 0) {
      top = 0;
      movedBottom = true;
    }
    if (top + textRect.height > window.innerHeight) {
      top = Math.max(window.innerHeight - textRect.height, 0);
      movedTop = true;
    }

    // Устанавливаем смещенные координаты
    textbox.style.top = `${top}px`;
    textbox.style.left = `${left}px`;

    if ((movedRight || movedLeft) && left + textRect.width > window.innerWidth) {
      textbox.style.maxWidth = `${window.innerWidth}px`;
    }

    if ((movedBottom || movedTop) && top + textRect.height > window.innerHeight) {
      textbox.style.maxHeight = `${window.innerHeight}px`;
    }

    textbox.classList.add('is-visible');
  }

  positionHandIcon(cursor: string, rect: TutorialStepTargetArea | null, start: { x: number, y: number } | null, end: { x: number, y: number } | null) {
    const hand = this.tutorialHandIcon.nativeElement;
    if ((!rect && (!start || !end)) || cursor == 'none') {
      hand.classList.remove('is-visible', 'tutorial-hand--drag', 'tutorial-hand--tap');
      return;
    }

    const handRect = hand.getBoundingClientRect();
    const handWidthHalf = handRect.width / 2;
    const handHeightHalf = handRect.height / 2;

    if (start && end) {
      hand.style.setProperty('--start-x', `${start.x - handWidthHalf}px`);
      hand.style.setProperty('--start-y', `${start.y - handHeightHalf}px`);
      hand.style.setProperty('--end-x', `${end.x - handWidthHalf}px`);
      hand.style.setProperty('--end-y', `${end.y - handHeightHalf}px`);
      hand.classList.remove('tutorial-hand--tap');
      hand.classList.add('is-visible', 'tutorial-hand--drag');
    } else if (rect) {
      hand.style.top = `${rect.top + rect.height / 2 - handHeightHalf + 30}px`;
      hand.style.left = `${rect.left + rect.width / 2 - handWidthHalf + 20}px`;
      hand.classList.remove('tutorial-hand--drag');
      hand.classList.add('is-visible', 'tutorial-hand--tap');
    }
  }

  async showTutorialStep() {
    await this.step.wait()

    const targetArea = this.step.area ? this.step.area() : null;

    if (this.step.action == 'game') {
      this.tutorialButtons.nativeElement.style.display = 'none';
    } else {
      this.tutorialButtons.nativeElement.style.display = 'block';
    }

    this.positionBlockArea(this.step.blockArea, targetArea, 10);
    this.highlightElement(targetArea, 10);
    this.positionTextbox(this.step.text, targetArea, this.step.position);
    this.positionHandIcon(this.step.cursor, targetArea, this.step.cursorStart(), this.step.cursorEnd());
  }
}
