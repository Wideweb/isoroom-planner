import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom, from, map, Observable, shareReplay } from 'rxjs';
import { API } from 'src/environments/environment';
import { GameLevelListDto } from '../models/game-level-list.model';
import { GameLevelData } from 'src/app/core/game.model';
import GameAssets from 'src/app/core/game-assets';

@Injectable({
  providedIn: 'root',
})
export class GameLevelService {

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