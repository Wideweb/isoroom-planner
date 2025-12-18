import { Camera, Furniture, Placement, Ref, ZERO_VECTOR } from "../game.model";
import { isoGridToView } from "../math.helper";
import * as PIXI from 'pixi.js';
import FurnitureView from "./furniture-view";
import { getAccessibilityCells, getFootprint } from "../furniture-placement.helper";
import { createIsoQuadPath } from "./primitive.helper";

export default class FurniturePreviewView {
    public view = new PIXI.Container();
    public furnitureView: FurnitureView | null = null;
    
    private prevTileWidth = -1;
    private prevTileHeight = -1;
    private prevPlacement = new Placement();
    private prevCameraPos = ZERO_VECTOR();
    private prevIsValid = true;

    constructor(
        private camera: Camera,
        private tileWidth: Ref<number>,
        private tileHeight: Ref<number>
    ) { }

    update(furniture: Furniture, furnitureView: FurnitureView, placement: Placement, isValid: boolean) {
        if (placement.equalTo(this.prevPlacement) &&
            this.prevTileWidth == this.tileWidth.value &&
            this.prevTileHeight == this.tileHeight.value &&
            this.prevCameraPos.x == this.camera.position.x &&
            this.prevCameraPos.y == this.camera.position.y &&
            this.furnitureView == furnitureView &&
            this.prevIsValid == isValid) {
            return;
        }

        console.log('update furniture preview');

        this.view.removeChildren();

        const footprint = getFootprint(furniture, placement.position, placement.rotation);
        const accessibilityCells = getAccessibilityCells(furniture, placement.position, placement.rotation);

        footprint.forEach(cellPos => {
            const viewPos = isoGridToView(cellPos, this.camera, this.tileWidth.value, this.tileHeight.value);

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value, this.tileHeight.value);
            quad.poly(quadPath).fill({ color: isValid ? 0x34d399 : 0xf87171, alpha: 0.6 });
            quad.poly(quadPath).stroke({ color: 0xffffff, width: 2, alpha: 0.5 });

            quad.position.set(viewPos.x, viewPos.y);

            this.view.addChild(quad);
        });

        accessibilityCells.forEach(cellPos => {
            const viewPos = isoGridToView(cellPos, this.camera, this.tileWidth.value, this.tileHeight.value);

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value, this.tileHeight.value);
            quad.poly(quadPath).fill({ color: 0x38bdf8, alpha: 0.5 });

            quad.position.set(viewPos.x, viewPos.y);

            this.view.addChild(quad);
        });

        furnitureView.update(placement, 0.5, isValid ? 0xffffff : 0xf87171);
        furnitureView.draw(this.view);

        this.prevTileWidth = this.tileWidth.value;
        this.prevTileHeight = this.tileHeight.value;
        placement.copyTo(this.prevPlacement);
        this.prevCameraPos.x = this.camera.position.x;
        this.prevCameraPos.y = this.camera.position.y;
        this.furnitureView = furnitureView;
        this.prevIsValid = isValid;
    }

    draw(container: PIXI.Container) {
        container.addChild(this.view);
    }
}