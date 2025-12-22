import { Routes } from "@angular/router";
import { SplashScreenComponent } from "./components/splash-screen/splash-screen.component";
import { MenuScreenComponent } from "./components/menu-screen/menu-screen.component";
import { LevelsScreenComponent } from "./components/levels-screen/levels-screen.component";
import { GameScreenComponent } from "./components/game-screen/game-screen.component";

export const routes: Routes = [  
  { path: 'menu', component: MenuScreenComponent },

  { path: 'levels', component: LevelsScreenComponent },

  { path: 'level/:id', component: GameScreenComponent },

  { path: '**', component: SplashScreenComponent },
];
