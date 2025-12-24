import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { API } from 'src/environments/environment';
import { UserProfileDto } from '../models/user-profile.model';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {

  constructor(private http: HttpClient) {}

  public getProfileMe(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${API}/me/profile`).pipe(shareReplay(1));
  }
}