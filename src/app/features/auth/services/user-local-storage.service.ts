import { Injectable } from '@angular/core';
import { LocalService } from '../../common/services/local-storage.service';
import { AuthState } from '../state/auth.state';
import { Store } from '@ngxs/store';

@Injectable()
export class UserLocalService {

    constructor(private storage: LocalService, private store: Store) { }

    public getData<T>(key: string): T | null {
        if(!this.store.selectSnapshot(AuthState.isAuthenticated)) {
            return null;
        }

        const user = this.store.selectSnapshot(AuthState.user);

        if(!user) {
            return null;
        }

        const data = this.storage.getData(`user${user.id}/${key}`);
        const parsedData = data ? JSON.parse(data) : null;

        return parsedData;
    }

    public saveData<T>(key: string, data: T): void {
        if(!this.store.selectSnapshot(AuthState.isAuthenticated)) {
            return;
        }

        const user = this.store.selectSnapshot(AuthState.user);

        if(!user) {
            return;
        }

        this.storage.saveData(`user${user.id}/${key}`, JSON.stringify(data));
    }
}