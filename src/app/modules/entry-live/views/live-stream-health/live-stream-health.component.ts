import { Component, OnDestroy, OnInit } from '@angular/core';
import { LiveStreamHealthWidget } from './live-stream-health.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-live-stream-health',
  templateUrl: './live-stream-health.component.html',
  styleUrls: ['./live-stream-health.component.scss']
})
export class LiveStreamHealthComponent implements OnInit, OnDestroy {
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _data: any;
  
  constructor(private _liveStreamHealth: LiveStreamHealthWidget,
              private _errorsManager: ErrorsManagerService) {
  }
  
  ngOnInit() {
    this._liveStreamHealth.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._isBusy = true;
              this._liveStreamHealth.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
    
    this._liveStreamHealth.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(data => {
        this._isBusy = false;
        this._data = data;
      });
  }
  
  ngOnDestroy(): void {
  }
}
