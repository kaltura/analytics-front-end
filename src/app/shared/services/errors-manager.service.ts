import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { analyticsConfig } from 'configuration/analytics-config';
import { BrowserService, HeaderTypes } from './browser.service';

@Injectable()
export class ErrorsManagerService {

    constructor(private _translate: TranslateService, private _browserService: BrowserService) {
    }

    public handleError(error: any, callback: Function = null): void {
      let message: string = error.message ? error.message : this._translate.instant('app.errors.general');
      let logout = false;

      if (error.code) {
        switch (error.code) {
          case 'INVALID_KS':
            message =  this._translate.instant('app.errors.invalidKS');
            logout = true;
            break;
          default:
            break;
        }
      }
      this._browserService.alert({
        message,
        header: this._translate.instant('app.errors.errorHeader'),
        headerType: HeaderTypes.error,
        icon : 'kIconerror',
        accept: () => {
          if ( logout && analyticsConfig.callbacks && analyticsConfig.callbacks.logout ) {
            analyticsConfig.callbacks.logout();
          }
        }
      });
    }

}

