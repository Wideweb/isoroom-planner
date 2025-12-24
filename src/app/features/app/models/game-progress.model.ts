export interface GameLevelProgressDto {
    id: number;
    order: number;
    locked: boolean;
    premium: boolean;
    premiumLock: boolean;
    accepted: boolean;
    rejected: boolean;
    score: number;
}

export interface GameProgressDto {
    levels: GameLevelProgressDto[];
}

export interface GameLevelSubmitResultDto {
    id: number;
    accepted: boolean;
    rejected: boolean;
    score: number;
}