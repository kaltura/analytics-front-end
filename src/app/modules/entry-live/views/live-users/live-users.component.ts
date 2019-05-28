import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LiveUsersData, LiveUsersWidget } from './live-users.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportHelper } from 'shared/services';
import { filter } from 'rxjs/operators';
import { KalturaExtendedLiveEntry } from '../../entry-live.service';
import { KalturaStreamStatus } from '../../utils/get-stream-status';

@Component({
  selector: 'app-live-users',
  templateUrl: './live-users.component.html',
  styleUrls: ['./live-users.component.scss']
})
export class LiveUsersComponent implements OnInit, OnDestroy {
  @Input() set entry(value: KalturaExtendedLiveEntry) {
    if (value) {
      this._isLive = [KalturaStreamStatus.offline, KalturaStreamStatus.initializing].indexOf(value.streamStatus) === -1;
      
      if (!this._isLive) {
        this._resetGraph();
      } else if (this._data) {
        this._updateGraphPoints(
          this._data.activeUsers,
          this._data.engagedUsers,
          this._data.dates,
        );
      }
    } else {
      this._resetGraph();
    }
  }
  
  private _graphPoints: number[][];
  private _echartsIntance: any;
  private _isLive = false;
  
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _data: LiveUsersData;
  public _graphData: { [key: string]: any } = {};
  public _activeUsersCount = '0';
  public _engagedUsersCount = '0';
  
  constructor(private _liveUsersWidget: LiveUsersWidget,
              private _errorsManager: ErrorsManagerService) {
    this._resetGraph();
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
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe((data: LiveUsersData) => {
        this._isBusy = false;
        this._data = data;
        
        if (this._isLive) {
          this._updateGraphPoints(
            this._data.activeUsers,
            this._data.engagedUsers,
            this._data.dates,
          );
        }
      });
    this._graphData = this._liveUsersWidget.getGraphConfig(this._graphPoints[0], this._graphPoints[1]);
  }
  
  ngOnDestroy(): void {
  }
  
  private _resetGraph(): void {
    this._updateGraphPoints(
      Array.from({ length: 18 }, () => 0),
      Array.from({ length: 18 }, () => 0),
      []
    );
  }

  private _updateGraphPoints(active: number[], engaged: number[], times: string[]): void {
    this._graphPoints = [active, engaged];
    
    if (this._echartsIntance) {
      this._echartsIntance.setOption({
        series: [{ data: active }, { data: engaged }],
        xAxis: [{ data: times }],
      });
    }
  
    this._activeUsersCount = ReportHelper.numberOrZero([...this._graphPoints[0]].pop()); // get last item
    this._engagedUsersCount = ReportHelper.percents([...this._graphPoints[1]].pop(), false, false); // get last item
  }
  
  public _onChartInit(ec: any): void {
    this._echartsIntance = ec;
  }
}
