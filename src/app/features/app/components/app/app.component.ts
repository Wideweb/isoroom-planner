import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, firstValueFrom, shareReplay, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { GameLevelData } from 'src/app/core/game.model';
import GameAssets from 'src/app/core/game-assets';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$: Subject<boolean> = new Subject<boolean>();

  public levelData$ = new BehaviorSubject<GameLevelData | null>(null);
  public loaded$ = new BehaviorSubject<boolean>(false);

  private gameAssets = new GameAssets();
  
  constructor(private http: HttpClient) { }

  async ngOnInit() {   }

  async loadLevel(level: number) {
    this.loaded$.next(false);
    const data = await firstValueFrom(this.http.get<GameLevelData>(`assets/levels/${level}.json`).pipe(shareReplay(1)));
    await this.gameAssets.preload(data.assets, progress => console.log(`${Math.round(progress * 100)}%`));
    this.levelData$.next(data);
    this.loaded$.next(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
