import { Camera, Furniture, Placement, Ref } from "../game.model";
import { isoGridToView } from "../math.helper";
import * as PIXI from 'pixi.js';
import FurnitureView from "./furniture.view";
import { getAccessibilityCells, getFootprint } from "../furniture-placement.helper";
import { createIsoQuadPath } from "./primitive.helper";
import BaseView from "./base.view";

export default class FurniturePreviewView extends BaseView {
    public furnitureView: FurnitureView | null = null;
    
    private prevTileWidth = -1;
    private prevTileHeight = -1;
    private prevPlacement = new Placement();
    private prevIsValid = true;
    private cameraVersion = -1;

    private footprintContainer = new PIXI.Container();
    private accessibilityContainer = new PIXI.Container();

    constructor(
        private tileWidth: Ref<number>,
        private tileHeight: Ref<number>,
        private camera: Camera
    ) { 
        super();
    }

    update2(deltaMs: number, furniture: Furniture, furnitureView: FurnitureView, placement: Placement, isValid: boolean) {
        super.update(deltaMs);

        if (placement.equalTo(this.prevPlacement) &&
            this.prevTileWidth == this.tileWidth.value &&
            this.prevTileHeight == this.tileHeight.value &&
            this.furnitureView == furnitureView &&
            this.prevIsValid == isValid &&
            this.cameraVersion == this.camera.version) {
            return;
        }

        console.log('update furniture preview');

        this.container.removeChildren();
        this.footprintContainer.removeChildren();
        this.accessibilityContainer.removeChildren();

        const footprint = getFootprint(furniture, placement.position, placement.rotation);
        const accessibilityCells = getAccessibilityCells(furniture, placement.position, placement.rotation);

        footprint.forEach(cellPos => {
            const viewPos = isoGridToView(cellPos, this.camera, this.tileWidth.value, this.tileHeight.value);

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value * this.camera.scale, this.tileHeight.value * this.camera.scale);
            quad.poly(quadPath).fill({ color: isValid ? 0x28a745 : 0xdc3545, alpha: 0.5 });
            quad.poly(quadPath).stroke({ color: 0xffffff, width: 2, alpha: 0.25 });

            quad.position.set(viewPos.x, viewPos.y);

            this.footprintContainer.addChild(quad);
        });
        this.container.addChild(this.footprintContainer);

        accessibilityCells.forEach(cellPos => {
            const viewPos = isoGridToView(cellPos, this.camera, this.tileWidth.value, this.tileHeight.value);

            const quad = new PIXI.Graphics();
            const quadPath = createIsoQuadPath(this.tileWidth.value * this.camera.scale, this.tileHeight.value * this.camera.scale);
            quad.poly(quadPath).fill({ color: 0x0a84ff, alpha: 0.5 });

            quad.position.set(viewPos.x, viewPos.y);

            this.accessibilityContainer.addChild(quad);
        });
        this.container.addChild(this.accessibilityContainer);

        furnitureView.update2(deltaMs, placement, 0.5, isValid ? 0xffffff : 0xf87171);
        furnitureView.draw(this.container);

        this.prevTileWidth = this.tileWidth.value;
        this.prevTileHeight = this.tileHeight.value;
        placement.copyTo(this.prevPlacement);
        this.furnitureView = furnitureView;
        this.prevIsValid = isValid;
        this.cameraVersion = this.camera.version;
    }

    public getAccessibilityCellsBoundingClientRect() {
        const cells = this.accessibilityContainer.children.map(c => c);
        
        const minX = Math.min(...cells.map(c => c.position.x)) - this.tileWidth.value / 2 * this.camera.scale;
        const minY = Math.min(...cells.map(c => c.position.y)) - this.tileHeight.value / 2 * this.camera.scale;

        return {
            left: minX,
            top: minY,
            width: this.accessibilityContainer.getSize().width,
            height: this.accessibilityContainer.getSize().height
        };
    }
}