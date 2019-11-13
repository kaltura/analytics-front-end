import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { GraphPoint, LiveBandwidthWidget, LiveQoSData } from './live-bandwidth.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportHelper } from 'shared/services';
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
        this._updateGraphPoints(this._data);
      }
    } else {
      this._resetGraph();
    }
  }
  
  private _graphPoints: GraphPoint[][];
  private _echartsIntance: any;
  private _isLive = false;
  
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage;
  public _data: any;
  public _graphData: { [key: string]: any } = {};
  public _bufferCount = '0%';
  public _bandwidthCount = '0 Kbps';
  
  constructor(private _bandwidthWidget: LiveBandwidthWidget,
              private _errorsManager: ErrorsManagerService) {
    this._resetGraph();
  }
  
  ngOnInit() {
    this._bandwidthWidget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        this._isBusy = state.isBusy;
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._blockerMessage = null;
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
          this._updateGraphPoints(this._data);
        }
      });
    
    this._graphData = this._bandwidthWidget.getGraphConfig(this._graphPoints[0], this._graphPoints[1]);
  }
  
  ngOnDestroy(): void {
  }
  
  private _resetGraph(): void {
    this._updateGraphPoints({
        buffering: Array.from({ length: 18 }, () => ({ value: 0 })),
        bandwidth: Array.from({ length: 18 }, () => ({ value: 0 })),
        dates: [],
        currentBandwidth: '0 Kbps',
        currentBuffering: '0%'
      }
    );
  }
  
  private _updateGraphPoints(data: LiveQoSData): void {
    const { dates, buffering, bandwidth, currentBuffering, currentBandwidth } = data;
    this._graphPoints = [buffering, bandwidth];
    
    if (this._echartsIntance) {
      this._echartsIntance.setOption({
        series: [{ data: buffering }, { data: bandwidth }],
        xAxis: [{ data: dates }],
      });
    }
    
    this._bufferCount = currentBuffering;
    this._bandwidthCount = currentBandwidth;
  }
  
  public _onChartInit(ec: any): void {
    this._echartsIntance = ec;
  }
}
