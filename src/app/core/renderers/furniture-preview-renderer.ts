import { getAccessibilityCells, getFootprint } from "../furniture-placement.helper";
import { Camera, Furniture, Placement, Ref } from "../game.model";
import { isoGridToWorld, worldToIsoGrid } from "../math.helper";
import * as PIXI from 'pixi.js';
import { createIsoQuadPath } from "./primitive.helper";
import FurnitureRenderer from "./furniture-renderer";

export default class FurniturePreviewRenderer {
    private furnitureRenderer: FurnitureRenderer;

    constructor(private camera: Camera, private tileWidth: Ref<number>, private tileHeight: Ref<number>) {
        this.furnitureRenderer = new FurnitureRenderer(camera, tileWidth, tileHeight);
    }

    render(container: PIXI.Container, furniture: Furniture, placement: Placement, isValid: boolean) {
        const footprint = getFootprint(furniture, placement.position, placement.rotation);
        const accessibilityCells = getAccessibilityCells(furniture, placement.position, placement.rotation);

        footprint.forEach(cellPos => {
            const worldPos = isoGridToWorld(cellPos, this.tileWidth.value, this.tileHeight.value);
            const screenPosX = worldPos.x - this.camera.position.x;
            const screenPosY = worldPos.y - this.camera.position.y;

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value, this.tileHeight.value);
            quad.poly(quadPath).fill({ color: isValid ? 0x34d399 : 0xf87171, alpha: 0.6 });
            quad.poly(quadPath).stroke({ color: 0xffffff, width: 2, alpha: 0.5 });

            quad.position.set(screenPosX, screenPosY);

            container.addChild(quad);
        });

        accessibilityCells.forEach(cellPos => {
            const worldPos = isoGridToWorld(cellPos, this.tileWidth.value, this.tileHeight.value);
            const screenPosX = worldPos.x - this.camera.position.x;
            const screenPosY = worldPos.y - this.camera.position.y;

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value, this.tileHeight.value);
            quad.poly(quadPath).fill({ color: 0x38bdf8, alpha: 0.5 });

            quad.position.set(screenPosX, screenPosY);

            container.addChild(quad);
        });

        this.furnitureRenderer.render(container, furniture, placement, 0.5, isValid ? 0xffffff : 0xf87171);
    }
}