import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LiveUsersData, LiveUsersWidget } from './live-users.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-live-users',
  templateUrl: './live-users.component.html',
  styleUrls: ['./live-users.component.scss']
})
export class LiveUsersComponent implements OnInit, OnDestroy {
  private _graphPoints: number[][] = [
    Array.from({ length: 18 }, () => 0),
    Array.from({ length: 18 }, () => 0),
  ];
  private _echartsIntance: any;

  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _data: LiveUsersData;
  public _graphData: { [key: string]: any } = {};
  public _engagedUsers = '0';

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
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(data => {
        this._isBusy = false;
        this._data = data;
  
        // this._updateGraphPoints(data.watchers);
      });
  
    this._graphData = this._liveUsersWidget.getGraphConfig(this._graphPoints[0], this._graphPoints[1]);
  
    setInterval(() => {
      this._updateGraphPoints(Math.abs(Math.round(Math.random() * 21 - 10)), Math.abs(Math.round(Math.random() * 21 - 10)));
      this._engagedUsers = `${Math.abs(Math.round(Math.random() * 21 - 10))}%`;
    }, 10000);
  }
  
  ngOnDestroy(): void {
  }
  
  private _updateGraphPoints(activeUsers: number, engagedUsers: number): void {
    const active = [...this._graphPoints[0]];
    const engaged = [...this._graphPoints[1]];
    active.shift();
    active.push(activeUsers);
    engaged.shift();
    engaged.push(engagedUsers);
  
    this._graphPoints = [active, engaged];

    if (this._echartsIntance) {
      this._echartsIntance.setOption({ series: [{ data: active }, { data: engaged }] });
    }
  }
  
  public _onChartInit(ec: any): void {
    this._echartsIntance = ec;
  }
}
