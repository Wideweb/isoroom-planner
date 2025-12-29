import { Component, Input } from '@angular/core';
import * as PIXI from 'pixi.js';

@Component({
  selector: 'pixi-asset-img',
  templateUrl: './pixi-asset-img.component.html',
  styleUrls: ['./pixi-asset-img.component.scss']
})
export class PixiAssetImgComponent {
  @Input()
  public asset: string = '';
  
  @Input()
  public renderer: PIXI.Renderer | null = null;

  public base64: string | null = null;
  
  async ngOnInit() {
    const texture = PIXI.Assets.get(this.asset) as PIXI.Texture;
    const sprite = new PIXI.Sprite(texture); 
    this.base64 = await this.renderer!.extract.base64(sprite);
  }
}
