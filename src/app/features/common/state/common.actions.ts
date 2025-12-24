export class CommonTaskSubmited {
    static readonly type = '[Common] Task Submitted';
    constructor(public accepted: boolean) {}
}

export class CommonUserAccountUpdated {
    static readonly type = '[Common] User Account Updated';
}

export class CommonLoadUser {
    static readonly type = '[Common] Load User';
}

export class CommonLoadUserRating {
    static readonly type = '[Common] Load User Rating';
}

export class CommonPremiumLockIssue {
    static readonly type = '[Common] Premium Lock Issue';
}

export class CommonPremiumExpired {
    static readonly type = '[Common] Premium Expired';
}