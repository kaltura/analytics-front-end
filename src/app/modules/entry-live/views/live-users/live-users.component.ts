import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LiveUsersData, LiveUsersWidget } from './live-users.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportHelper } from 'shared/services';
import { filter } from 'rxjs/operators';
import { KalturaExtendedLiveEntry } from '../../entry-live.service';
import { KalturaStreamStatus } from '../../utils/get-stream-status';
import { getGraphAxisBoundaries } from 'shared/utils/graph-interval-utils';

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
        this._updateGraphPoints(this._data);
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
  public _engagedUsersCount = '0%';
  
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
          this._updateGraphPoints(this._data);
        }
      });
    this._graphData = this._liveUsersWidget.getGraphConfig(this._graphPoints[0], this._graphPoints[1]);
  }
  
  ngOnDestroy(): void {
  }
  
  private _resetGraph(): void {
    this._updateGraphPoints({
      activeUsers: Array.from({ length: 18 }, () => 0),
      engagedUsers: Array.from({ length: 18 }, () => 0),
      dates: [],
      currentActiveUsers: '0',
      currentEngagedUsers: '0%'
    });
  }

  private _updateGraphPoints(data: LiveUsersData): void {
    const { dates, activeUsers, engagedUsers, currentEngagedUsers, currentActiveUsers } = data;
    this._graphPoints = [activeUsers, engagedUsers];
    
    if (this._echartsIntance) {
      this._echartsIntance.setOption({
        series: [{ data: activeUsers }, { data: engagedUsers }],
        xAxis: [{ data: dates }],
      });
    }
  
    this._activeUsersCount = currentActiveUsers;
    this._engagedUsersCount = currentEngagedUsers;
  }
  
  public _onChartInit(ec: any): void {
    this._echartsIntance = ec;
  }
}
