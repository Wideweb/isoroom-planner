import { Ref, Room } from "../game.model";
import { isoGridToWorld } from "../math.helper";
import * as PIXI from 'pixi.js';
import { createIsoQuadPath } from "./primitive.helper";
import BaseView from "./base.view";

export default class RoomView extends BaseView {
    private prevTileWidth = -1;
    private prevTileHeight = -1;

    constructor(
        private model: Room,
        private tileWidth: Ref<number>,
        private tileHeight: Ref<number>
    ) {
        super();
    }

    override update(deltaMs: number) {
        super.update(deltaMs);
        
        if (this.prevTileWidth == this.tileWidth.value &&
            this.prevTileHeight == this.tileHeight.value) {
            return;
        }

        console.log('update room');

        this.view.removeChildren();

        this.model.cells.forEach(cellPos => {
            const worldPos = isoGridToWorld(cellPos, this.tileWidth.value, this.tileHeight.value);

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value, this.tileHeight.value);
            quad.poly(quadPath).fill({ color: 0x374151, alpha: 1.0 });
            quad.poly(quadPath).stroke({ color: 0x4b5563, width: 1.0 });
            quad.position.set(worldPos.x, worldPos.y);

            this.view.addChild(quad);
        });

        if (this.model.entrance) {
            const worldPos = isoGridToWorld(this.model.entrance, this.tileWidth.value, this.tileHeight.value);

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value, this.tileHeight.value);
            quad.poly(quadPath).fill({ color: 0x1f2937, alpha: 1.0 });
            quad.poly(quadPath).stroke({ color: 0x34d399, width: 1.0 });
            quad.position.set(worldPos.x, worldPos.y);

            this.view.addChild(quad);
        }

        this.prevTileWidth = this.tileWidth.value;
        this.prevTileHeight = this.tileHeight.value;
    }
}