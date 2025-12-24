import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable, Subject } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { GameLevelData } from 'src/app/core/game.model';
import { ActivatedRoute, Router } from '@angular/router';
import { GameProgressState } from '../../states/game-progress.state';
import { GameProgressLoadLevel, GameProgressLoadNextTask, GameProgressSubmitLevel } from '../../states/game-progress.actions';
import { GameLevelSubmitResultDto } from '../../models/game-progress.model';

const FACTS = [
    'The concept of an "open floor plan" became popular in the 1970s to create a sense of space and light.',
    'Feng Shui is an ancient Chinese art of arranging spaces to allow for the flow of positive energy, or "chi".',
    'Mirrors can make a small room feel larger by reflecting light and creating an illusion of depth.',
    'The color green is often used in interior design to create a sense of calm and tranquility.',
    'Minimalism, a design trend focused on simplicity, originated in the post-World War II era.',
    'Wabi-sabi is a Japanese design philosophy that finds beauty in imperfection and impermanence.',
    'Houseplants not only add beauty but can also improve indoor air quality.',
    'The "golden ratio" (approximately 1.618) is often used in design to create aesthetically pleasing proportions.'
];

@Component({
  selector: 'game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.scss']
})
export class GameScreenComponent implements OnInit, OnDestroy {
  @Select(GameProgressState.currentLevelId)
  public levelId$!: Observable<number>;

  @Select(GameProgressState.currentLevelOrder)
  public levelOrder$!: Observable<number>;

  @Select(GameProgressState.currentLevelData)
  public levelData$!: Observable<GameLevelData>;

  @Select(GameProgressState.levelLoaded)
  public loaded$!: Observable<boolean>;

  private hideSubject = new BehaviorSubject<boolean>(true);
  public hidden$ = this.hideSubject.asObservable();

  private showLoadingSubject = new BehaviorSubject<boolean>(true);
  public showLoading$ = this.showLoadingSubject.asObservable();

  public fact = FACTS[0];

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private store: Store, private route: ActivatedRoute, private router: Router) { }

  async ngOnInit() {
    this.fact = FACTS[Math.floor(Math.random() * FACTS.length)];
    this.hideSubject.next(true);
    this.showLoadingSubject.next(true);
    const levelId = this.route.snapshot.params['id'];
    await firstValueFrom(this.store.dispatch(new GameProgressLoadLevel(levelId)));
    await this.delay(4000);
    this.hideSubject.next(false);
    this.showLoadingSubject.next(false);
  }

  handleSubmitResult(data: GameLevelSubmitResultDto) {
    this.store.dispatch(new GameProgressSubmitLevel(data));
  }

  async toNextLevel() {
    this.fact = FACTS[Math.floor(Math.random() * FACTS.length)];
    this.hideSubject.next(true);
    await this.delay(400);
    this.showLoadingSubject.next(true);
    await this.delay(2000);
    this.store.dispatch(new GameProgressLoadNextTask());
    await this.delay(2000);
    this.showLoadingSubject.next(false);
    this.hideSubject.next(false);
  }

  async toMenu() {
    this.hideSubject.next(true);
    await this.delay(400);
    this.router.navigate(['/menu']);
  }

  async toLevels() {
    this.hideSubject.next(true);
    await this.delay(400);
    this.router.navigate(['/levels']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
