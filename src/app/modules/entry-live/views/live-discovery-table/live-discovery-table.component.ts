import { Component, OnDestroy, OnInit } from '@angular/core';
import { LiveDiscoveryTableWidget } from './live-discovery-table.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';

@Component({
  selector: 'app-live-discovery-table',
  templateUrl: './live-discovery-table.component.html',
  styleUrls: ['./live-discovery-table.component.scss']
})
export class LiveDiscoveryTableComponent implements OnInit, OnDestroy {
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _data: any;
  
  constructor(private _errorsManager: ErrorsManagerService,
              public _liveDiscoveryTableWidget: LiveDiscoveryTableWidget) {
    
  }
  
  ngOnInit() {
    this._liveDiscoveryTableWidget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._isBusy = true;
              this._liveDiscoveryTableWidget.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
    
    this._liveDiscoveryTableWidget.data$
      .pipe(cancelOnDestroy(this))
      .subscribe((data: any) => {
        this._isBusy = false;
        this._data = data;
      });
  }
  
  ngOnDestroy(): void {
    this._liveDiscoveryTableWidget.stopPolling();
  }
}
