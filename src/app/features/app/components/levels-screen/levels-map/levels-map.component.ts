import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { GameLevelProgressDto } from '../../../models/game-progress.model';

@Component({
  selector: 'levels-map',
  templateUrl: './levels-map.component.html',
  styleUrls: ['./levels-map.component.scss']
})
export class LevelsMapComponent implements OnInit {
  @Input()
  public levels: GameLevelProgressDto[] = [];

  async ngOnInit() {   }
}
