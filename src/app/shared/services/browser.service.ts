import { EventEmitter, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';

export enum HeaderTypes {
    error = 1,
    attention = 2,
    cancel = 3,
    retry = 4
}

export interface Confirmation {
	message: string;
	key?: string;
	icon?: string;
	header?: string;
	headerType?: HeaderTypes;
	accept?: Function;
	reject?: Function;
	acceptVisible?: boolean;
	rejectVisible?: boolean;
	acceptEvent?: EventEmitter<any>;
	rejectEvent?: EventEmitter<any>;
	alignMessage?: 'left' | 'center' | 'byContent';
}

export type OnShowConfirmationFn = (confirmation: Confirmation) => void;

@Injectable()
export class BrowserService {

    private _onConfirmationFn: OnShowConfirmationFn = (confirmation: Confirmation) => {
        // this is the default confirmation dialog provided by the browser.
        if (confirm(confirmation.message)) {
            if (confirmation.accept) {
                confirmation.accept.apply(null);
            }

            if (confirmation.acceptEvent) {
                confirmation.acceptEvent.next();
            }
        } else {
            if (confirmation.reject) {
                confirmation.reject.apply(null);
            }

            if (confirmation.rejectEvent) {
                confirmation.rejectEvent.next();
            }
        }
    }

    constructor(private _translateService: TranslateService) {
    }

    public registerOnShowConfirmation(fn: OnShowConfirmationFn) {
        if (fn) {
            this._onConfirmationFn = fn;
        }
    }

    private _fixConfirmation(confirmation: Confirmation): void {
        if (!confirmation) {
            return;
        }

        if (confirmation.headerType) {
            switch (confirmation.headerType) {
                case HeaderTypes.attention:
                    confirmation.header = this._translateService.instant('app.common.attention');
                    break;
                case HeaderTypes.error:
                    confirmation.header = this._translateService.instant('app.common.error');
                    break;
                case HeaderTypes.retry:
                    confirmation.header = this._translateService.instant('app.common.retry');
                    break;
                case HeaderTypes.cancel:
                    confirmation.header = this._translateService.instant('app.common.cancel');
                    break;
                default:
                    break;
            }
        }

        if (!(confirmation.header || '').trim()) {
            confirmation.header = this._translateService.instant('app.common.attention');
        }
    }

    public confirm(confirmation: Confirmation) {
        confirmation.key = 'confirm';
        this._fixConfirmation(confirmation);
        this._onConfirmationFn(confirmation);
    }

    public alert(confirmation: Confirmation) {
        confirmation.key = 'alert';
        this._fixConfirmation(confirmation);
        this._onConfirmationFn(confirmation);
    }

  public openLink(baseUrl: string, params: any = {}, target: string = '_blank') {
    // if we got params, append to the base URL using query string
    if (baseUrl && baseUrl.length) {
      if (Object.keys(params).length > 0) {
        baseUrl += '?';
        for (let key of Object.keys(params)) {
          baseUrl += key + '=' + params[key] + '&';
        }
        baseUrl = baseUrl.slice(0, -1); // remove last &
      }
    }
    window.open(baseUrl, target);
  }

  public isIE11(): boolean {
    return !!window['MSInputMethodContext'] && !!document['documentMode'];
  }

  public download(data, filename, type): void {
    let file;
    if (typeof data === 'string' && /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(data)) { // if data is url
      if (this.isIE11()) {
        this.openLink(data);
        return;
      }
      file = this._downloadContent(data);
    } else {
      file = Observable.of(new Blob([data], {type: type}));
    }

    file.subscribe(content => {
      if (window.navigator.msSaveOrOpenBlob) {// IE10+
        window.navigator.msSaveOrOpenBlob(content, filename);
      } else { // Others
        const a = document.createElement('a');
        const url = URL.createObjectURL(content);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 0);
      }
    });
  }

  private _downloadContent(url: string): void {
    return Observable.create(observer => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        observer.next(xhr.response);
        observer.complete();
      };
      xhr.open('GET', url);
      xhr.responseType = 'blob';
      xhr.send();
    });
  }

}

