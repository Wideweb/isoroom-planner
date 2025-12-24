import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, of, shareReplay } from 'rxjs';
import { API } from 'src/environments/environment';
import { CANCEL_SPINNER_TOKEN } from '../../common/interceptors/spinner.interceptor';
import { GameLevelSubmitResultDto, GameProgressDto } from '../models/game-progress.model';

const FAKE_GAME_PROGRESS_DATA: GameProgressDto = {
  levels: [
    {
      id: 1,
      order: 0,
      locked: false,
      premium: false,
      premiumLock: false,
      accepted: false,
      rejected: false,
      score: 0
    },
    {
      id: 2,
      order: 1,
      locked: true,
      premium: false,
      premiumLock: false,
      accepted: false,
      rejected: false,
      score: 0
    },
    {
      id: 3,
      order: 2,
      locked: true,
      premium: false,
      premiumLock: false,
      accepted: false,
      rejected: false,
      score: 0
    },
    {
      id: 4,
      order: 3,
      locked: true,
      premium: false,
      premiumLock: false,
      accepted: false,
      rejected: false,
      score: 0
    }
  ]
}

@Injectable({
  providedIn: 'root',
})
export class GameProgressService {

    constructor(private http: HttpClient) {}

    public getUserProgress(): Observable<GameProgressDto> {
      return of(FAKE_GAME_PROGRESS_DATA);

      return this.http.get<GameProgressDto>(
        `${API}/game/progress`,
        { context: new HttpContext().set(CANCEL_SPINNER_TOKEN, true) }
      ).pipe(shareReplay(1));
    }

    public submitLevel(levelSubmit: GameLevelSubmitResultDto) {
      return of(null);

      return  this.http.post<GameLevelSubmitResultDto>(
        `${API}/game/level/${levelSubmit.id}/submit`, levelSubmit,
        { context: new HttpContext().set(CANCEL_SPINNER_TOKEN, true) }
      ).pipe(shareReplay(1));
    }
}