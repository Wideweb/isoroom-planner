import { Camera, Placement, Ref, Room, ZERO_VECTOR } from "../game.model";
import { isoGridToView, isoGridToWorld } from "../math.helper";
import * as PIXI from 'pixi.js';
import { createIsoQuadPath } from "./primitive.helper";

export default class RoomView {
    public view = new PIXI.Container();
        
    private prevTileWidth = -1;
    private prevTileHeight = -1;
    private prevCameraPos = ZERO_VECTOR();

    constructor(
        private model: Room,
        private camera: Camera,
        private tileWidth: Ref<number>,
        private tileHeight: Ref<number>
    ) { }

    update() {
        if (this.prevTileWidth == this.tileWidth.value &&
            this.prevTileHeight == this.tileHeight.value &&
            this.prevCameraPos.x == this.camera.position.x &&
            this.prevCameraPos.y == this.camera.position.y) {
            return;
        }

        console.log('update room', this.tileWidth.value, this.tileHeight.value, this.camera.position.x, this.camera.position.y);

        this.view.removeChildren();

        this.model.cells.forEach(cellPos => {
            const viewPos = isoGridToView(cellPos, this.camera, this.tileWidth.value, this.tileHeight.value);

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value, this.tileHeight.value);
            quad.poly(quadPath).fill({ color: 0x374151, alpha: 1.0 });
            quad.poly(quadPath).stroke({ color: 0x4b5563, width: 1.0 });
            quad.position.set(viewPos.x, viewPos.y);

            this.view.addChild(quad);
        });

        if (this.model.entrance) {
            const viewPos = isoGridToView(this.model.entrance, this.camera, this.tileWidth.value, this.tileHeight.value);

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value, this.tileHeight.value);
            quad.poly(quadPath).fill({ color: 0x1f2937, alpha: 1.0 });
            quad.poly(quadPath).stroke({ color: 0x34d399, width: 1.0 });
            quad.position.set(viewPos.x, viewPos.y);

            this.view.addChild(quad);
        }

        this.prevTileWidth = this.tileWidth.value;
        this.prevTileHeight = this.tileHeight.value;
        this.prevCameraPos.x = this.camera.position.x;
        this.prevCameraPos.y = this.camera.position.y;
    }

    draw(container: PIXI.Container) {
        container.addChild(this.view);
    }
}