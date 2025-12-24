import { Directive, ElementRef, HostListener, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appAutoResize]'
})
export class AutoResizeDirective implements AfterViewInit {
  constructor(private el: ElementRef<HTMLTextAreaElement>) {}

  ngAfterViewInit() {
    this.adjustHeight();
  }

  @HostListener('input')
  onInput() {
    this.adjustHeight();
  }

  private adjustHeight() {
    const textarea = this.el.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}