import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, firstValueFrom, shareReplay, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { GameLevelData } from 'src/app/core/game.model';
import GameAssets from 'src/app/core/game-assets';
import { SpinnerService } from '../../services/spinner.service';
import { Router } from '@angular/router';

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
  
  constructor(
    private http: HttpClient,
    public spinner: SpinnerService,
    private router: Router,
  ) { 
    this.router.navigateByUrl('/');
  }

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




// import { Component, OnInit } from '@angular/core';
// import { HttpClient } from '@angular/common/http';

// declare global {
//   interface Window {
//     Telegram: any;
//   }
// }

// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html'
// })
// export class AppComponent implements OnInit {
//   tg: any;
//   userName: string = '';

//   constructor(private http: HttpClient) {}

//   ngOnInit(): void {
//     this.tg = window.Telegram.WebApp;
//     this.tg.ready();
//     this.tg.expand();

//     const user = this.tg.initDataUnsafe?.user;
//     if (user) {
//       this.userName = user.first_name;

//       // Отправляем initData на сервер для авторизации
//       this.http.post('/api/auth/telegram', {
//         initData: this.tg.initData
//       }).subscribe({
//         next: (res) => console.log('Auth success', res),
//         error: (err) => console.error('Auth error', err)
//       });
//     }
//   }
// }


// const crypto = require('crypto');
// const express = require('express');
// const bodyParser = require('body-parser');

// const app = express();
// app.use(bodyParser.json());

// // токен твоего бота
// const BOT_TOKEN = process.env.BOT_TOKEN;

// function checkTelegramAuth(initData) {
//   const urlParams = new URLSearchParams(initData);
//   const hash = urlParams.get('hash');
//   urlParams.delete('hash');

//   const dataCheckString = [...urlParams.entries()]
//     .map(([key, value]) => `${key}=${value}`)
//     .sort()
//     .join('\n');

//   const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
//   const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

//   return hmac === hash;
// }

// app.post('/api/auth/telegram', (req, res) => {
//   const { initData } = req.body;

//   if (!checkTelegramAuth(initData)) {
//     return res.status(403).json({ error: 'Invalid auth data' });
//   }

//   const params = new URLSearchParams(initData);
//   const userJson = params.get('user');
//   const user = JSON.parse(userJson);

//   // Проверяем в базе
//   let account = findUserByTelegramId(user.id);
//   if (!account) {
//     account = createUser({
//       telegramId: user.id,
//       firstName: user.first_name,
//       username: user.username
//     });
//   }

//   // Возвращаем токен/сессию
//   res.json({ success: true, user: account });
// });

// function findUserByTelegramId(id) {
//   // Заглушка: ищем в базе
//   return null;
// }

// function createUser(data) {
//   // Заглушка: создаём в базе
//   return { id: 1, ...data };
// }

// app.listen(3000, () => console.log('Server running on port 3000'));
