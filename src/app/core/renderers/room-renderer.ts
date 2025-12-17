import { Camera, Ref, Room } from "../game.model";
import { isoGridToWorld } from "../math.helper";
import * as PIXI from 'pixi.js';
import { createIsoQuadPath } from "./primitive.helper";

export default class RoomRenderer {
    constructor(private camera: Camera, private tileWidth: Ref<number>, private tileHeight: Ref<number>) {}

    render(container: PIXI.Container, room: Room | null) {
        if (!room) return;

        room.cells.forEach(cellPos => {
            const worldPos = isoGridToWorld(cellPos, this.tileWidth.value, this.tileHeight.value);
            const screenPosX = worldPos.x - this.camera.position.x;
            const screenPosY = worldPos.y - this.camera.position.y;

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value, this.tileHeight.value);
            quad.poly(quadPath).fill({ color: 0x374151, alpha: 1.0 });
            quad.poly(quadPath).stroke({ color: 0x4b5563, width: 1.0 });
            quad.position.set(screenPosX, screenPosY);

            container.addChild(quad);
        });

        if (room.entrance) {
            const worldPos = isoGridToWorld(room.entrance, this.tileWidth.value, this.tileHeight.value);
            const screenPosX = worldPos.x - this.camera.position.x;
            const screenPosY = worldPos.y - this.camera.position.y;

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value, this.tileHeight.value);
            quad.poly(quadPath).fill({ color: 0x1f2937, alpha: 1.0 });
            quad.poly(quadPath).stroke({ color: 0x34d399, width: 1.0 });
            quad.position.set(screenPosX, screenPosY);

            container.addChild(quad);
        }
    }
}