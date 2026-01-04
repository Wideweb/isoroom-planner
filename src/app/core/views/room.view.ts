import { Camera, Ref, Room } from "../game.model";
import { isoGridToView } from "../math.helper";
import * as PIXI from 'pixi.js';
import { createIsoQuadPath } from "./primitive.helper";
import BaseView from "./base.view";

export default class RoomView extends BaseView {
    private prevTileWidth = -1;
    private prevTileHeight = -1;
    private cameraVersion = -1;

    constructor(
        private model: Room,
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
            this.cameraVersion == this.camera.version) {
            return;
        }

        console.log('update room');

        this.container.removeChildren();

        this.model.cells.forEach(cellPos => {
            const viewPos = isoGridToView(cellPos, this.camera, this.tileWidth.value, this.tileHeight.value);

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value * this.camera.scale, this.tileHeight.value * this.camera.scale);
            quad.poly(quadPath).fill({ color: 0x374151, alpha: 1.0 });
            quad.poly(quadPath).stroke({ color: 0x4b5563, width: 1.0 });
            quad.position.set(viewPos.x, viewPos.y);

            this.container.addChild(quad);
        });

        if (this.model.entrance) {
            const viewPos = isoGridToView(this.model.entrance, this.camera, this.tileWidth.value, this.tileHeight.value);

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value * this.camera.scale, this.tileHeight.value * this.camera.scale);
            quad.poly(quadPath).fill({ color: 0x1f2937, alpha: 1.0 });
            quad.poly(quadPath).stroke({ color: 0x34d399, width: 1.0 });
            quad.position.set(viewPos.x, viewPos.y);

            this.container.addChild(quad);
        }

        this.prevTileWidth = this.tileWidth.value;
        this.prevTileHeight = this.tileHeight.value;
        this.cameraVersion = this.camera.version;
    }
}