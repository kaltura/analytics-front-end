import { Component, OnDestroy, OnInit } from '@angular/core';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { BarChartRow } from 'shared/components/horizontal-bar-chart/horizontal-bar-chart.component';
import { filter } from 'rxjs/operators';
import { LiveDevicesData, LiveDevicesWidget } from './live-devices.widget';

@Component({
  selector: 'app-live-devices',
  templateUrl: './live-devices.component.html',
  styleUrls: ['./live-devices.component.scss'],
  providers: [KalturaLogger.createLogger('LiveDevicesComponent')]
})
export class LiveDevicesComponent implements OnInit, OnDestroy {
  protected _componentId = 'devices-overview';
  
  public _blockerMessage: AreaBlockerMessage = null;
  public _summaryData: BarChartRow[] = [];
  public _isBusy = false;
  public _totalCount = 0;
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _liveDevicesWidget: LiveDevicesWidget) {
  }
  
  ngOnInit() {
    this._isBusy = true;
    
    this._liveDevicesWidget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._isBusy = true;
              this._liveDevicesWidget.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
    
    this._liveDevicesWidget.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe((data: LiveDevicesData) => {
        this._isBusy = false;
        this._summaryData = data.data;
        this._totalCount = data.totalCount;
      });
  }
  
  ngOnDestroy() {
  }
}
