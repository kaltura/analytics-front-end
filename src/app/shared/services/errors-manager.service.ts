import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BrowserService } from './browser.service';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { KalturaAPIException } from 'kaltura-ngx-client';
import { AuthService } from 'shared/services/auth.service';

export type ErrorDetails = {
  title: string;
  message: string;
  forceLogout: boolean;
};

export type AreaBlockerMessageActions = { [key: string]: Function };

@Injectable()
export class ErrorsManagerService {

    constructor(private _translate: TranslateService,
                private _browserService: BrowserService,
                private _authService: AuthService) {
    }
    
    private _executeAction(actions: AreaBlockerMessageActions, action: string): void {
      if (typeof actions[action] === 'function') {
        actions[action]();
      }
    }

    public getError(error: any): ErrorDetails {
      const title = this._translate.instant('app.errors.errorHeader');
      let message: string = error.message ? error.message : this._translate.instant('app.errors.general');
      let forceLogout = false;

      if (error.code) {
        switch (error.code) {
          case 'INVALID_KS':
            message =  this._translate.instant('app.errors.invalidKS');
            forceLogout = true;
            break;
          case 'SEARCH_TOO_GENERAL':
            message =  this._translate.instant('app.errors.searchTooGeneral');
            break;
          case 'DRUID_QUERY_TIMED_OUT':
            message = this._translate.instant('app.errors.timeout');
            break;
          default:
            break;
        }
      }
      return { title, message, forceLogout};
    }
  
  public getErrorMessage(error: KalturaAPIException, actions: AreaBlockerMessageActions): AreaBlockerMessage {
    if (!error) {
      return null;
    }
    const err: ErrorDetails = this.getError(error);
    let buttons: AreaBlockerMessageButton[] = [];
    if (err.forceLogout) {
      buttons = [{
        label: this._translate.instant('app.common.ok'),
        action: () => {
          this._authService.logout();
          this._executeAction(actions, 'close');
        }
      }];
    } else {
      buttons = [{
        label: this._translate.instant('app.common.close'),
        action: () => this._executeAction(actions, 'close')
      }];

      if (actions.hasOwnProperty('retry')) {
        buttons.push({
          label: this._translate.instant('app.common.retry'),
          action: () => this._executeAction(actions, 'retry')
        });
      }
    }
  
    return new AreaBlockerMessage({
      title: err.title,
      message: err.message,
      buttons
    });
  }

}

