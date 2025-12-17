import { Camera, Furniture, Placement, Ref } from "../game.model";
import * as PIXI from 'pixi.js';
import FurnitureRenderer from "./furniture-renderer";

export default class FurnituresRenderer {
    private furnitureRender: FurnitureRenderer;
    
    constructor(private camera: Camera, private tileWidth: Ref<number>, private tileHeight: Ref<number>) {
        this.furnitureRender = new FurnitureRenderer(camera, tileWidth, tileHeight);
    }

    render(container: PIXI.Container, models: Furniture[], furnitures: number[], placements: Placement[], onSelect: (id: number) => void) {
        const sortedFurniture = [...furnitures].map((id, index) => ({id, index})).sort((a, b) => {
            const aPlacement = placements[a.index];
            const bPlacement = placements[b.index];

            const aPos = aPlacement.position.y * 1000 + aPlacement.position.x;
            const bPos = bPlacement.position.y * 1000 + bPlacement.position.x;
            return aPos - bPos;
        });

        sortedFurniture.forEach(item => {
            const placement = placements[item.index];
            const model = models[item.id];
            const sprite = this.furnitureRender.render(container, model, placement);
            sprite.eventMode = 'static';
            const id = item.id;
            sprite.on('pointerdown', (event) => {
                event.stopPropagation();
                onSelect(id);
            });
        });
    }
}