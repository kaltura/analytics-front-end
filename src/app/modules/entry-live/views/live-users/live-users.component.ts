import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LiveUsersWidget } from './live-users.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';

@Component({
  selector: 'app-live-users',
  templateUrl: './live-users.component.html',
  styleUrls: ['./live-users.component.scss']
})
export class LiveUsersComponent implements OnInit, OnDestroy {
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _data: any; // widget data goes here, define type according to response or response mapping

  constructor(private _liveUsersWidget: LiveUsersWidget,
              private _errorsManager: ErrorsManagerService) {
  }
  
  ngOnInit() {
    this._liveUsersWidget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._isBusy = true;
              this._liveUsersWidget.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
  
    this._liveUsersWidget.data$
      .pipe(cancelOnDestroy(this))
      .subscribe(data => {
        this._isBusy = false;
        this._data = data;
      });
  }
  
  ngOnDestroy(): void {
  }
}
