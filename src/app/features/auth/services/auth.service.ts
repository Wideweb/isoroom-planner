import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { API } from 'src/environments/environment';
import { UserDto } from '../models/user.model';
import { SessionData } from '../models/session-data.model';
import { CANCEL_AUTH } from '../interceptors/auth.interceptor';

@Injectable()
export class AuthService {

  constructor(private http: HttpClient) { }

  public loadMe(): Observable<UserDto> {
    return this.http.get<UserDto>(`${API}/me`).pipe(
      shareReplay(1),
    );
  }

  public loginWithGoogle(token: string, ref: string, tempId: string | null): Observable<SessionData> {
    return this.http.post<SessionData>(`${API}/google-login`, { token, ref, tempId }).pipe(
      shareReplay(1),
    );
  }

  public logout() {
    return this.http.post<void>(`${API}/logout`, null).pipe(
      shareReplay(1),
    );
  }

  public refreshAccessToken(refreshToken: string) {
    return this.http.post<{ token: string; expiresAt: number }>(`${API}/refreshToken`, { refreshToken }, {
      context: new HttpContext().set(CANCEL_AUTH, true)
    }).pipe(
      shareReplay(1),
    );
  }
}