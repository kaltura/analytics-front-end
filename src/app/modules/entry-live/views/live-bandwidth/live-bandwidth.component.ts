import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LiveBandwidthWidget, LiveQoSData } from './live-bandwidth.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { filter } from 'rxjs/operators';
import { KalturaExtendedLiveEntry } from '../../entry-live.service';
import { KalturaStreamStatus } from '../../utils/get-stream-status';

@Component({
  selector: 'app-live-bandwidth',
  templateUrl: './live-bandwidth.component.html',
  styleUrls: ['./live-bandwidth.component.scss']
})
export class LiveBandwidthComponent implements OnInit, OnDestroy {
  @Input() set entry(value: KalturaExtendedLiveEntry) {
    if (value) {
      this._isLive = [KalturaStreamStatus.offline, KalturaStreamStatus.initializing].indexOf(value.streamStatus) === -1;
  
      if (!this._isLive) {
        this._resetGraph();
      } else if (this._data) {
        this._updateGraphPoints(
          this._data.buffering,
          this._data.bandwidth,
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
  public _data: any;
  public _graphData: { [key: string]: any } = {};
  public _bufferCount = 0;
  public _bandwidthCount = 0;
  
  constructor(private _bandwidthWidget: LiveBandwidthWidget,
              private _errorsManager: ErrorsManagerService) {
    this._resetGraph();
  }
  
  ngOnInit() {
    this._bandwidthWidget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._isBusy = true;
              this._bandwidthWidget.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
    
    this._bandwidthWidget.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe((data: LiveQoSData) => {
        this._isBusy = false;
        this._data = data;
  
        if (this._isLive) {
          this._updateGraphPoints(
            this._data.buffering,
            this._data.bandwidth,
            this._data.dates,
          );
        }
      });
    
    this._graphData = this._bandwidthWidget.getGraphConfig(this._graphPoints[0], this._graphPoints[1]);
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

  private _updateGraphPoints(buffer: number[], bandwidth: number[], times: string[]): void {
    this._graphPoints = [buffer, bandwidth];
    
    if (this._echartsIntance) {
      this._echartsIntance.setOption({
        series: [{ data: buffer }, { data: bandwidth }],
        xAxis: [{ data: times }],
      });
    }
  
    this._bufferCount = [...this._graphPoints[0]].pop();
    this._bandwidthCount = [...this._graphPoints[1]].pop();
  }
  
  public _onChartInit(ec: any): void {
    this._echartsIntance = ec;
  }
}
