import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, firstValueFrom, shareReplay, Subject } from 'rxjs';
import { Store } from '@ngxs/store';
import { GameLevelData } from 'src/app/core/game.model';
import { GameLevelLoadLevel } from '../../states/game-level.actions';
import { Router } from '@angular/router';

@Component({
  selector: 'levels-screen',
  templateUrl: './levels-screen.component.html',
  styleUrls: ['./levels-screen.component.scss']
})
export class LevelsScreenComponent implements OnInit, OnDestroy {
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private store: Store, private router: Router) { }

  async ngOnInit() {   }

  // async selectLevel(level: number) {
  //   this.router.navigate
  //   await firstValueFrom(this.store.dispatch(new GameLevelLoadLevel(level)));
  // }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
