import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { GameProgressState } from '../../states/game-progress.state';
import { Router } from '@angular/router';

@Component({
  selector: 'menu-screen',
  templateUrl: './menu-screen.component.html',
  styleUrls: ['./menu-screen.component.scss']
})
export class MenuScreenComponent implements OnInit, OnDestroy {
  @Select(GameProgressState.hasProgress)
  public hasProgress$!: Observable<boolean>;

  @Select(GameProgressState.finished)
  public finished$!: Observable<boolean>;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private store: Store, private router: Router) {}

  async ngOnInit() {   }

  start() {
    const levels = this.store.selectSnapshot(GameProgressState.progress)?.levels || [];
    const nextLevel = levels.find(it => !it.accepted);
    if (!nextLevel) {
      return;
    }
    this.router.navigate([`/level/${nextLevel.id}`])
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
