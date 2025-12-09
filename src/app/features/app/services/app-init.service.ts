import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppInitService implements OnDestroy {

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor() { }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  public async init(): Promise<any> { }
}