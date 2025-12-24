import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthState } from 'src/app/features/auth/state/auth.state';
import { GameProgressLoad } from '../../states/game-progress.actions';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss']
})
export class SplashScreenComponent implements OnDestroy, AfterViewInit {
  // @Select(AuthState.inited)
  // public isAuthInited$!: Observable<boolean>;

  // private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private router: Router, private store: Store) {}

  async ngAfterViewInit() {
    await this.delay(2000);

    const inited = this.store.selectSnapshot(AuthState.inited);
    if (!inited) {
      console.error('AuthState is not initialized');
    }

    const authenticated = this.store.selectSnapshot(AuthState.isAuthenticated);
    if (authenticated) {
      this.router.navigate(['/menu']);
    } else {
      //this.router.navigate(['/login']);
      await firstValueFrom(this.store.dispatch(new GameProgressLoad()));
      this.router.navigate(['/menu']);
    }
  }

  ngOnDestroy() { }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
