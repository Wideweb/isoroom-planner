import { ElementRef, NgZone } from '@angular/core';

// wait-for-element.ts
export interface WaitForElementOptions {
  timeoutMs?: number;     // stop after this time
  maxFrames?: number;     // safety cap on frames
  root?: ParentNode;      // search scope (defaults to document)
}

export function waitForElement<T extends Element = Element>(
  selector: string | ElementRef<T>,
  options: WaitForElementOptions = {}
): Promise<T> {
  const {
    timeoutMs = 5000,
    maxFrames = 600, // ~10s at 60fps
    root = document
  } = options;

  let frameId = 0;
  let frames = 0;
  let timedOut = false;

  return new Promise<T>((resolve, reject) => {
    const start = performance.now();

    const cancel = () => {
      if (frameId) cancelAnimationFrame(frameId);
    };

    const tick = () => {
      // Try to find the element each frame
      const el = typeof selector === 'string' ? (root.querySelector(selector) as T | null) : selector.nativeElement;
      if (el) {
        cancel();
        resolve(el);
        return;
      }

      frames++;
      const elapsed = performance.now() - start;

      if (elapsed >= timeoutMs || frames >= maxFrames) {
        timedOut = true;
        cancel();
        reject(new Error(`waitForElement timeout: "${selector}" not found after ${elapsed.toFixed(0)}ms / ${frames} frames`));
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
  });
}

export function waitForElementInZone<T extends Element = Element>(
  zone: NgZone,
  selector: string | ElementRef<T>,
  options: { timeoutMs?: number; maxFrames?: number; root?: ParentNode } = {}
): Promise<T> {
  return zone.runOutsideAngular(() =>
    waitForElement<T>(selector, options)
  );
}


export function waitForTime(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
