import { Injectable } from '@angular/core';
import { analyticsConfig } from 'configuration/analytics-config';

@Injectable()
export class AuthService {

    constructor() {
    }

    public logout(): void {
      if ( analyticsConfig.callbacks && analyticsConfig.callbacks.logout ) {
        analyticsConfig.callbacks.logout();
      }
    }

}

