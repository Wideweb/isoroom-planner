import * as PIXI from 'pixi.js';

export default class GameAssets {
    public async preload(assets: string[], onProgress?: (progress: number) => void) {
        await PIXI.Assets.load(assets, onProgress);
    }
}