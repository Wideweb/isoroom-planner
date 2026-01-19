import { NgZone } from '@angular/core';
import { waitForElementInZone, waitForTime } from './wait-for';
import { GameLevelComponent } from '../components/game-screen/game-level/game-level.component';
import { GameEvent, GameEventFurnitureDragData, GameEventType } from '../models/game-event.model';

export interface TutorialStepTargetArea {
    top: number,
    left: number,
    width: number,
    height: number
};

export enum TutorialStepID {
    WelcomeAndGoal = 0,
    TheRoom = 1,
    TheEntrance = 2,
    CardPanel = 3,
    DragFurnitureOut = 4,
    RotateFurniture = 5,
    PlacingFurniture = 6,
    Points = 7,
    RotateCamera = 8,
    PickUpFurniture = 9,
    PlacementRules = 10,
    CancelAndReturn = 11,
    Moves = 12,
    Replenish = 13,
    ReplenishCategoryCompleted = 14,
    LevelAndProgression = 15,
    End = 16
}

export interface TutorialStep {
    id: TutorialStepID,
    wait: () => Promise<any>;
    area: () => TutorialStepTargetArea | null;
    cursorStart: () => { x: number; y: number } | null;
    cursorEnd: () => { x: number; y: number } | null;
    isCompleted: (event: GameEvent) => boolean;
    text: string | null;
    position: 'top-center' | 'bottom-center' | 'center';
    cursor: 'pointer' | 'none';
    action: 'end' | 'popup' | 'game';
    blockArea: 'outside-area' | 'window' | 'none'
}

export class GameTutorialManager {

    private TUTORIAL_STEPS: TutorialStep[] = [
        {
            id: TutorialStepID.WelcomeAndGoal,
            wait: () => waitForElementInZone(this.zone, 'game-tutorial-overlay'),
            area: () => ({ left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 }),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => false,
            text: 'Welcome! In this game, you will furnish a room with furniture and earn points.',
            position: 'center',
            cursor: 'none',
            action: 'popup',
            blockArea: 'window',
        },
        {
            id: TutorialStepID.TheRoom,
            wait: () => waitForElementInZone(this.zone, '.game-board'),
            area: () => this.component.game.getRoomBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => false,
            text: 'This is your room. You will place furniture here.',
            position: 'top-center',
            cursor: 'none',
            action: 'popup',
            blockArea: 'window',
        },
        {
            id: TutorialStepID.TheEntrance,
            wait: () => waitForElementInZone(this.zone, '.game-board'),
            area: () => this.component.game.getRoomEntraceBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => false,
            text: 'This cell is the entrance to the room. Furniture must not block it.',
            position: 'top-center',
            cursor: 'none',
            action: 'popup',
            blockArea: 'window',
        },
        {
            id: TutorialStepID.CardPanel,
            wait: () => waitForElementInZone(this.zone, '.toolbar'),
            area: () => this.component.el.nativeElement.querySelector('.toolbar').getBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => false,
            text: 'Here are your furniture cards. Drag one into the room.',
            position: 'top-center',
            cursor: 'none',
            action: 'popup',
            blockArea: 'window',
        },
        {
            id: TutorialStepID.DragFurnitureOut,
            wait: () => waitForElementInZone(this.zone, '.item-card'),
            area: () => null,
            cursorStart: () => {
                const rect = this.component.el.nativeElement.querySelector('.item-card').getBoundingClientRect() as DOMRect;
                return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            },
            cursorEnd: () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }),
            isCompleted: (event: GameEvent) => {
                if (event.type == GameEventType.FurnitureDrag && this.component.game.isFurnitureSelectedPlacementValid) {
                    const eventData = event.data as GameEventFurnitureDragData;
                    this.component.game.handlePointerUp(eventData.x, eventData.y);
                    return true;
                }
                return false;
            },
            text: null,
            position: 'center',
            cursor: 'pointer',
            action: 'game',
            blockArea: 'none',
        },
        {
            id: TutorialStepID.RotateFurniture,
            wait: () => waitForElementInZone(this.zone, '#placement-rotate-btn'),
            area: () => this.component.el.nativeElement.querySelector('#placement-rotate-btn').getBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => event.type == GameEventType.FurnitureRotate,
            text: 'You can rotate furniture before placing it.',
            position: 'top-center',
            cursor: 'pointer',
            action: 'game',
            blockArea: 'outside-area',
        },
        {
            id: TutorialStepID.PlacingFurniture,
            wait: () => waitForElementInZone(this.zone, '#placement-place-btn'),
            area: () => this.component.el.nativeElement.querySelector('#placement-place-btn').getBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => event.type == GameEventType.FurniturePlace,
            text: 'Once you\'re ready, you can fix the item\'s position.',
            position: 'top-center',
            cursor: 'pointer',
            action: 'game',
            blockArea: 'outside-area',
        },
        {
            id: TutorialStepID.Points,
            wait: () => waitForElementInZone(this.zone, '#user-score'),
            area: () => this.component.el.nativeElement.querySelector('#user-score').getBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => false,
            text: 'Each successful placement earns you points.',
            position: 'bottom-center',
            cursor: 'none',
            action: 'popup',
            blockArea: 'window',
        },
        {
            id: TutorialStepID.RotateCamera,
            wait: () => waitForElementInZone(this.zone, '#rotate-camera-left-btn'),
            area: () => this.component.el.nativeElement.querySelector('#rotate-camera-left-btn').getBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => event.type == GameEventType.CameraRotate,
            text: 'You can rotate the isometric room to view it from different angles.',
            position: 'bottom-center',
            cursor: 'pointer',
            action: 'game',
            blockArea: 'outside-area',
        },
        {
            id: TutorialStepID.PickUpFurniture,
            wait: () => waitForElementInZone(this.zone, '.game-board'),
            area: () => this.component.game.getFirstFurnitureBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => event.type == GameEventType.FurniturePickUp,
            text: 'You can pick up the furniture that has been placed. Tap on the furniture.',
            position: 'top-center',
            cursor: 'pointer',
            action: 'game',
            blockArea: 'outside-area',
        },
        {
            id: TutorialStepID.PlacementRules,
            wait: () => waitForElementInZone(this.zone, '.placement-rules'),
            area: () => this.component.el.nativeElement.querySelector('.placement-rules').getBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => false,
            text: 'Some furniture has special placement rules. If you follow them, you earn bonus points!',
            position: 'top-center',
            cursor: 'none',
            action: 'popup',
            blockArea: 'window',
        },
        {
            id: TutorialStepID.CancelAndReturn,
            wait: () => waitForElementInZone(this.zone, '#placement-cancel-btn'),
            area: () => this.component.el.nativeElement.querySelector('#placement-cancel-btn').getBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => event.type == GameEventType.FurnitureCancel,
            text: 'If you change your mind, return the card back to the panel.',
            position: 'top-center',
            cursor: 'pointer',
            action: 'game',
            blockArea: 'outside-area',
        },
        {
            id: TutorialStepID.Moves,
            wait: () => waitForElementInZone(this.zone, '#user-moves'),
            area: () => this.component.el.nativeElement.querySelector('#user-moves').getBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => false,
            text: 'You have a limited number of actions. If they run out, you lose the game.',
            position: 'bottom-center',
            cursor: 'none',
            action: 'popup',
            blockArea: 'window',
        },
        {
            id: TutorialStepID.Replenish,
            wait: () => waitForElementInZone(this.zone, '#replenish-btn'),
            area: () => this.component.el.nativeElement.querySelector('#replenish-btn').getBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => event.type == GameEventType.ReplenishDialog,
            text: 'Need more furniture? Press Replenish.',
            position: 'top-center',
            cursor: 'pointer',
            action: 'game',
            blockArea: 'outside-area',
        },
        {
            id: TutorialStepID.ReplenishCategoryCompleted,
            wait: async () => {
                await waitForElementInZone(this.zone, '#replenish-categories .category-card');
                await waitForTime(200);
            },
            area: () => this.component.replenishDialogRef?.componentInstance.getCategoryCardBoundingClientRect(),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => event.type == GameEventType.ReplenishCategoryCompleted,
            text: 'Choose a theme, and your hand will be replenished with furniture from that category.',
            position: 'top-center',
            cursor: 'pointer',
            action: 'game',
            blockArea: 'outside-area',
        },
        {
            id: TutorialStepID.End,
            wait: () => Promise.resolve(),
            area: () => ({ left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 }),
            cursorStart: () => null,
            cursorEnd: () => null,
            isCompleted: (event: GameEvent) => false,
            text: 'Now you know everything you need: place furniture, follow special rules for bonus points, replenish your hand, earn points, and progress through levels!',
            position: 'center',
            cursor: 'none',
            action: 'end',
            blockArea: 'window',
        }
    ];

    public isTutorialActive = false;
    public isTutorialCompleted = false;

    public currentTutorialStepId = 0;

    public get currentTutorialStep () { 
        if (this.currentTutorialStepId >= this.TUTORIAL_STEPS.length) return null;

        return this.TUTORIAL_STEPS[this.currentTutorialStepId];
    }

    private advanceTutorialInProgress = false;

    constructor(private component: GameLevelComponent, private zone: NgZone) { }

    async startTutorial() {
        if (this.isTutorialActive) return;

        this.isTutorialActive = true;
        this.currentTutorialStepId = TutorialStepID.WelcomeAndGoal;

        const step = this.TUTORIAL_STEPS[this.currentTutorialStepId];
        await step.wait();
    }

    async advanceTutorial() {
        if (this.advanceTutorialInProgress) {
            return;
        }
        this.advanceTutorialInProgress = true;

        this.currentTutorialStepId++;
        if (this.currentTutorialStep) {
            await this.currentTutorialStep.wait();

            if (this.currentTutorialStep.action == 'end') {
                this.endTutorial();
            }
        } else {
            this.endTutorial();
        }
        this.advanceTutorialInProgress = false;
    }

    public endTutorial() {
        this.isTutorialActive = false;
        this.isTutorialCompleted = true;
    }

    public async handleEvent(event: GameEvent) {
        if (!this.isTutorialActive) return;

        if(this.currentTutorialStep?.isCompleted(event)) {
            this.advanceTutorial();
        }
    }
}