import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { LiveDiscoveryWidget, LiveUsersData } from './live-discovery.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { DateFiltersChangedEvent } from './filters/filters.component';
import { LiveDiscoveryConfig } from './live-discovery.config';
import { ReportDataFields, ReportDataSection } from 'shared/services/storage-data-base.config';
import { MetricsSelectorChangeEvent } from './metrics-selector/metrics-selector.component';
import { DiscoveryChartComponent } from './discovery-chart/discovery-chart.component';

@Component({
  selector: 'app-live-discovery',
  templateUrl: './live-discovery.component.html',
  styleUrls: ['./live-discovery.component.scss']
})
export class LiveDiscoveryComponent implements OnInit, OnDestroy {
  @ViewChild(DiscoveryChartComponent) _discoveryChart: DiscoveryChartComponent;

  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _data: any;
  public _fields: ReportDataFields;
  public _selectedMetrics: string[];

  constructor(private _liveExploreWidget: LiveDiscoveryWidget,
              private _errorsManager: ErrorsManagerService,
              protected _dataConfigService: LiveDiscoveryConfig) {
    this._fields = _dataConfigService.getConfig()[ReportDataSection.graph].fields;
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
      .pipe(cancelOnDestroy(this))
      .subscribe((data: LiveUsersData) => {
        this._isBusy = false;
        this._data = data;
      });
  }

  ngOnDestroy(): void {
  }

  public _onFiltersChanged(event: DateFiltersChangedEvent): void {
    if (!event.initialRun) {
      this._isBusy = true;
      this._liveExploreWidget.updateFilters(event.timeIntervalServerValue, event.dateRangeServerValue);
    }
  }
  
  public _onMetricsSelectorChange(event: MetricsSelectorChangeEvent): void {
    this._selectedMetrics = event.selected;
    if (!event.initialRun && this._discoveryChart) {
      this._discoveryChart.displayMetrics(this._selectedMetrics);
    }
  }
}
