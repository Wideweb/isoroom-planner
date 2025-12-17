import { Camera, Furniture, Placement, Ref } from "../game.model";
import { isoGridToWorld } from "../math.helper";
import * as PIXI from 'pixi.js';

export default class FurnitureRenderer {
    constructor(private camera: Camera, private tileWidth: Ref<number>, private tileHeight: Ref<number>) {}

    render(container: PIXI.Container, furniture: Furniture, placement: Placement, alpha: number = 1, tint = 0xffffff): PIXI.Sprite {
        const spriteSrc = furniture.sprite[placement.rotation / 90];
        const sprite = new PIXI.Sprite(PIXI.Assets.get(spriteSrc.name));

        const scale = this.tileWidth.value / 64;

        sprite.setSize(spriteSrc.width * scale, spriteSrc.height * scale);
        sprite.anchor.set(0.5, 0.5);
        sprite.alpha = alpha;
        sprite.tint = tint;

        const worldPos = isoGridToWorld(placement.position, this.tileWidth.value, this.tileHeight.value);
        const screenPosX = worldPos.x - this.camera.position.x;
        const screenPosY = worldPos.y - this.camera.position.y;
        
        sprite.position.set(screenPosX - spriteSrc.originX * scale, screenPosY - spriteSrc.originY * scale);

        container.addChild(sprite);
        return sprite;
    }
}