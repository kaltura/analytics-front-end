import { Injectable } from '@angular/core';
import { analyticsConfig } from 'configuration/analytics-config';

@Injectable()
export class AuthService {

    constructor() {
    }

    public logout(): void {
      window.parent.postMessage({
        'messageType': 'logout'
      }, "*");
    }

}

