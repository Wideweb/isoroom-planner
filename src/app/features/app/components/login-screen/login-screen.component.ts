import { Component, OnDestroy, OnInit } from '@angular/core';
import { concatMap, filter, Subject, takeUntil, tap } from 'rxjs';
import { Store } from '@ngxs/store';
import { Router } from '@angular/router';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { LoginWithGoogle } from 'src/app/features/auth/state/auth.actions';
import { UserProfileLoadMe } from 'src/app/features/user-profile/state/user-profile.actions';

@Component({
  selector: 'login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss']
})
export class LoginScreenComponent implements OnInit, OnDestroy {
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private store: Store, private router: Router, private socialAuthService: SocialAuthService) { 

    this.socialAuthService.authState.pipe(
      filter(user => !!user),
      concatMap((user) => this.store.dispatch(new LoginWithGoogle(user.idToken))),
      concatMap(() => this.store.dispatch(new UserProfileLoadMe())),
      tap(() => this.router.navigate(['/menu'])),
      takeUntil(this.destroy$)
    ).subscribe();

  }

  async ngOnInit() {   }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
