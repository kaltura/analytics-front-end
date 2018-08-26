import { EventEmitter, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

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

}

