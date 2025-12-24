import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { Router } from '@angular/router';
import { GameProgressState } from '../../states/game-progress.state';
import { GameLevelProgressDto } from '../../models/game-progress.model';

@Component({
  selector: 'levels-screen',
  templateUrl: './levels-screen.component.html',
  styleUrls: ['./levels-screen.component.scss']
})
export class LevelsScreenComponent implements OnInit, OnDestroy {
  @Select(GameProgressState.levels)
  public levels$!: Observable<GameLevelProgressDto[]>;

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
