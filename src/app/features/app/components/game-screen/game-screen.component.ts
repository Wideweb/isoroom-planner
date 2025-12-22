import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { GameLevelData } from 'src/app/core/game.model';
import { GameLevelState } from '../../states/game-level.state';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { GameLevelLoadLevel } from '../../states/game-level.actions';

@Component({
  selector: 'game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.scss']
})
export class GameScreenComponent implements OnInit, OnDestroy {
  @Select(GameLevelState.levelData)
  public levelData$!: Observable<GameLevelData>;

  @Select(GameLevelState.loaded)
  public loaded$!: Observable<boolean>;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private store: Store, private route: ActivatedRoute) {

  }

  async ngOnInit() { 
    const levelId = this.route.snapshot.params['id'];
    this.store.dispatch(new GameLevelLoadLevel(levelId));
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
