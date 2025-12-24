import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom, from, map, Observable, shareReplay } from 'rxjs';
import { API } from 'src/environments/environment';
import { GameLevelListDto } from '../models/game-level-list.model';
import { GameLevelData } from 'src/app/core/game.model';
import GameAssets from 'src/app/core/game-assets';

const FAKE_LEVELS = [
  {
    id: 1,
    order: 0,
    locked: false,
    completed: true,
  },
  {
    id: 2,
    order: 1,
    locked: false,
    completed: false,
  },
  {
    id: 3,
    order: 2,
    locked: true,
    completed: false,
  },
  {
    id: 4,
    order: 3,
    locked: true,
    completed: false,
  }
];

@Injectable({
  providedIn: 'root',
})
export class GameDataService {

    private gameAssets = new GameAssets();

    constructor(private http: HttpClient) {}

    public loadLevelsList(): Observable<GameLevelListDto[]> {
        return from([]);
    }

    public async loadLevelData(level: number): Promise<GameLevelData> {
      const data = await firstValueFrom(this.http.get<GameLevelData>(`assets/levels/${level}.json`).pipe(shareReplay(1)));
      await this.gameAssets.preload(data.assets, progress => console.log(`${Math.round(progress * 100)}%`));
      return data;
    }
}