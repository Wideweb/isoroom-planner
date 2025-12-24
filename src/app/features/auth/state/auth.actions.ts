export class LoginWithGoogle {
    static readonly type = '[Auth] LoginWithGoogle';
    constructor(public token: string) {}
}
  
export class Logout {
    static readonly type = '[Auth] Logout';
}

export class LoadMe {
    static readonly type = '[Auth] Me';
}

export class RefreshAccessToken {
    static readonly type = '[Auth] Refresh Access Token';
}

export class UpdateToken {
    static readonly type = '[Auth] Update Token';
    constructor(
        public accessToken: {value: string; expiresAt: number;},
        public refreshToken: {value: string; expiresAt: number;},
        public stored: boolean = false) {}
}

export class SetTokenStored {
    static readonly type = '[Auth] Stored';
    constructor(public payload: boolean) {}
}

export class IsTokenExpired {
    static readonly type = '[Auth] Is Token Expired';
    constructor(public accessTokenExpired: boolean, public refreshTokenExpired: boolean) {}
}

export class AuthClear {
    static readonly type = '[Auth] Clear';
}

export class AuthUserChanged {
    static readonly type = '[Auth] User Changed';
}