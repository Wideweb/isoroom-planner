import { Ref, Vector2 } from "../game.model";
import { isoGridToWorld } from "../math.helper";
import * as PIXI from 'pixi.js';
import { createIsoQuadPath } from "./primitive.helper";
import BaseView from "./base.view";

export default class PathView extends BaseView {
    private prevTileWidth = -1;
    private prevTileHeight = -1;

    public cells: Vector2[] = [];
    public isDirty = false;

    constructor(
        private tileWidth: Ref<number>,
        private tileHeight: Ref<number>
    ) {
        super();
    }

    override update(deltaMs: number) {
        super.update(deltaMs);

        if (this.prevTileWidth == this.tileWidth.value &&
            this.prevTileHeight == this.tileHeight.value &&
            !this.isDirty) {
            return;
        }

        this.container.removeChildren();

        if (this.cells.length <= 0) {
            return;
        }

        this.cells.forEach(cellPos => {
            const worldPos = isoGridToWorld(cellPos, this.tileWidth.value, this.tileHeight.value);

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value, this.tileHeight.value);
            quad.poly(quadPath).fill({ color: 0x0000ff, alpha: 0.5 });
            quad.poly(quadPath).stroke({ color: 0x0000ff, width: 1.0 });
            quad.position.set(worldPos.x, worldPos.y);

            this.container.addChild(quad);
        });

        this.prevTileWidth = this.tileWidth.value;
        this.prevTileHeight = this.tileHeight.value;
        this.isDirty = false;
    }
}