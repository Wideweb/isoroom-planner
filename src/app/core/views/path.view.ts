import { Camera, Ref, Vector2 } from "../game.model";
import { isoGridToView } from "../math.helper";
import * as PIXI from 'pixi.js';
import { createIsoQuadPath } from "./primitive.helper";
import BaseView from "./base.view";

export default class PathView extends BaseView {
    private prevTileWidth = -1;
    private prevTileHeight = -1;
    private cameraVersion = -1;

    public cells: Vector2[] = [];
    public isDirty = false;

    constructor(
        private tileWidth: Ref<number>,
        private tileHeight: Ref<number>,
        private camera: Camera
    ) {
        super();
    }

    override update(deltaMs: number) {
        super.update(deltaMs);

        if (this.prevTileWidth == this.tileWidth.value &&
            this.prevTileHeight == this.tileHeight.value &&
            this.cameraVersion == this.camera.version &&
            !this.isDirty) {
            return;
        }

        this.container.removeChildren();

        if (this.cells.length <= 0) {
            return;
        }

        this.cells.forEach(cellPos => {
            const viewPos = isoGridToView(cellPos, this.camera, this.tileWidth.value, this.tileHeight.value);

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value * this.camera.scale, this.tileHeight.value * this.camera.scale);
            quad.poly(quadPath).fill({ color: 0x0a84ff, alpha: 0.5 });
            quad.poly(quadPath).stroke({ color: 0x0a84ff, width: 1.0 });
            quad.position.set(viewPos.x, viewPos.y);

            this.container.addChild(quad);
        });

        this.prevTileWidth = this.tileWidth.value;
        this.prevTileHeight = this.tileHeight.value;
        this.isDirty = false;
        this.cameraVersion = this.camera.version;
    }
}