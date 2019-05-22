import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LiveDiscoveryWidget, LiveUsersData } from './live-discovery.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { filter } from 'rxjs/operators';
import { KalturaExtendedLiveEntry } from '../../entry-live.service';
import { KalturaStreamStatus } from '../../utils/get-stream-status';

@Component({
  selector: 'app-live-discovery',
  templateUrl: './live-discovery.component.html',
  styleUrls: ['./live-discovery.component.scss']
})
export class LiveDiscoveryComponent implements OnInit, OnDestroy {
  @Input() set entry(value: KalturaExtendedLiveEntry) {
    if (value) {
      this._isLive = [KalturaStreamStatus.offline, KalturaStreamStatus.initializing].indexOf(value.streamStatus) === -1;
      this._entry = value;
    }
  }
  
  private _isLive = false;
  private _entry: KalturaExtendedLiveEntry;
  
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _data: any;
  
  constructor(private _liveExploreWidget: LiveDiscoveryWidget,
              private _errorsManager: ErrorsManagerService) {
  }
  
  ngOnInit() {
    this._liveExploreWidget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._isBusy = true;
              this._liveExploreWidget.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
    
    this._liveExploreWidget.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe((data: LiveUsersData) => {
        this._isBusy = false;
        this._data = data;
      });
  }
  
  ngOnDestroy(): void {
  }
}
