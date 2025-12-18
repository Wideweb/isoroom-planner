import { Camera, Furniture, Placement, Ref, ZERO_VECTOR } from "../game.model";
import { isoGridToView } from "../math.helper";
import * as PIXI from 'pixi.js';

// const halfw = spriteSrc.width * scale * 0.5;
// const halfh = spriteSrc.height * scale * 0.5;
// const points = [
//     new PIXI.Point(-halfw, -halfh),
//     new PIXI.Point(halfw, -halfh),
//     new PIXI.Point(halfw, halfh),
//     new PIXI.Point(-halfw, halfh)
// ];
// sprite.hitArea = new PIXI.Polygon(points);

export default class FurnitureView {
    public views: PIXI.Sprite[] = [];
    
    private prevTileWidth = -1;
    private prevTileHeight = -1;
    private prevPlacement = new Placement();
    private prevCameraPos = ZERO_VECTOR();
    private prevTint = 0xffffff;
    private prevAlpha = 1;

    constructor(
        private model: Furniture,
        private camera: Camera,
        private tileWidth: Ref<number>,
        private tileHeight: Ref<number>,
        onSelect?: () => void,
    ) {
        this.model.sprite.forEach(src => {
            const sprite = new PIXI.Sprite(PIXI.Assets.get(src.name));
            sprite.scale.x = Math.sign(src.width);
            sprite.scale.y = Math.sign(src.height);
            sprite.anchor.set(0.5, 0.5);
            
            if (onSelect) {
                sprite.eventMode = 'static';
                sprite.on('pointerdown', (event) => {
                    event.stopPropagation();
                    onSelect();
                });
            }

            this.views.push(sprite);
        });
    }

    update(placement: Placement, alpha = 1, tint = 0xffffff) {
        if (this.prevAlpha != alpha) {
            this.views.forEach(s => {s.alpha = alpha;});
            this.prevAlpha = alpha;
        }
        
        this.prevTint = tint;
        if (this.prevTint != tint) {
            this.views.forEach(s => {s.tint = tint;});
            this.prevTint = tint;
        }

        if (placement.equalTo(this.prevPlacement) &&
            this.prevTileWidth == this.tileWidth.value &&
            this.prevTileHeight == this.tileHeight.value &&
            this.prevCameraPos.x == this.camera.position.x &&
            this.prevCameraPos.y == this.camera.position.y) {
            return;
        }

        console.log('update furniture');

        const scale = this.tileWidth.value / 64;

        this.views.forEach((sprite, index) => {
            const src = this.model.sprite[index];
            sprite.setSize(Math.abs(src.width) * scale, Math.abs(src.height) * scale);

            const viewPos = isoGridToView(placement.position, this.camera, this.tileWidth.value, this.tileHeight.value);

            sprite.position.set(viewPos.x - src.originX * scale, viewPos.y - src.originY * scale);
        });

        this.prevTileWidth = this.tileWidth.value;
        this.prevTileHeight = this.tileHeight.value;
        placement.copyTo(this.prevPlacement);
        this.prevCameraPos.x = this.camera.position.x;
        this.prevCameraPos.y = this.camera.position.y;
    }

    draw(container: PIXI.Container) {
        container.addChild(this.views[this.prevPlacement.rotation / 90]);
    }
}