import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BrowserService } from './browser.service';

export type ErrorDetails = {
  title: string;
  message: string;
  forceLogout: boolean;
};

@Injectable()
export class ErrorsManagerService {

    constructor(private _translate: TranslateService, private _browserService: BrowserService) {
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
          default:
            break;
        }
      }
      return { title, message, forceLogout};
    }

}

