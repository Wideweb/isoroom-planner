export enum GameEventType {
    CameraRotate,
    FurniturePickUp,
    FurnitureDrag,
    FurniturePlace,
    FurnitureRotate,
    FurnitureCancel,
    ReplenishDialog,
    ReplenishCategoryCompleted,
    ViewPortUpdate,
}

export interface GameEvent {
    type: GameEventType;
    data: any;
}

const GAME_EVENT_INSTANCE: GameEvent = {
    type: 0,
    data: null
}

export const createGameEvent = (type: GameEventType, data: GameEventFurnitureDragData | null) => {
    GAME_EVENT_INSTANCE.type = type;
    GAME_EVENT_INSTANCE.data = data;

    return GAME_EVENT_INSTANCE;
}

export interface GameEventFurnitureDragData {
    id: number;
    x: number;
    y: number;
}

const GAME_EVENT_FURNITURE_DRAG_DATA_INSTANCE: GameEventFurnitureDragData = {
    id: -1,
    x: 0,
    y: 0,
}

export const createGameEventFurnitureDragData = (id: number, x: number, y: number) => {
    GAME_EVENT_FURNITURE_DRAG_DATA_INSTANCE.id = id;
    GAME_EVENT_FURNITURE_DRAG_DATA_INSTANCE.x = x;
    GAME_EVENT_FURNITURE_DRAG_DATA_INSTANCE.y = y;

    return GAME_EVENT_FURNITURE_DRAG_DATA_INSTANCE;
}