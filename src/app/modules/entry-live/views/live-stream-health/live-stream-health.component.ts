import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage, ScrollToTopContainerComponent } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { LiveEntryDiagnosticsInfo, StreamHealth } from './live-stream-health.types';
import { LiveStreamHealthWidget } from './live-stream-health.widget';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-live-stream-health',
  templateUrl: './live-stream-health.component.html',
  styleUrls: ['./live-stream-health.component.scss']
})
export class LiveStreamHealthComponent implements OnInit, OnDestroy {
  @ViewChild(ScrollToTopContainerComponent, { static: false }) _listContainer: ScrollToTopContainerComponent;
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _data: StreamHealth[] = [];
  
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
        this._data = this._parseData(data);
        if (this._listContainer) {
          this._listContainer.scrollToTop();
        }
      });
  }

  ngOnDestroy(): void {
  }
  
  private _parseData(response: LiveEntryDiagnosticsInfo): StreamHealth[] {
    const sortHealthNotifications = (a: StreamHealth, b: StreamHealth) => {
      if (a.updatedTime > b.updatedTime) {
        return -1;
      }
      if (a.updatedTime < b.updatedTime) {
        return 1;
      }
      return 0;
    };
    
    return [...response.streamHealth.data.primary, ...response.streamHealth.data.secondary].sort(sortHealthNotifications);
  }
}
