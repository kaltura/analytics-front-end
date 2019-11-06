import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { ErrorsManagerService } from 'shared/services';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { HttpClient } from '@angular/common/http';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { LiveGeoConfig } from './live-geo.config';
import { getCountryName } from 'shared/utils/get-country-name';
import * as echarts from 'echarts';
import { EChartOption } from 'echarts';
import { canDrillDown } from 'shared/utils/can-drill-down-country';
import { Table } from 'primeng/table';
import { filter } from 'rxjs/operators';
import { LiveGeoWidget, LiveGeoWidgetData } from './live-geo.widget';
import { KalturaExtendedLiveEntry } from '../../entry-live.service';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';

@Component({
  selector: 'app-live-geo',
  templateUrl: './live-geo.component.html',
  styleUrls: ['./live-geo.component.scss'],
})
export class LiveGeoComponent implements OnInit, OnDestroy {
  @Input() set entry(value: KalturaExtendedLiveEntry) {
    if (value) {
      this._entry = value;
    }
  }
  @ViewChild('table', { static: false }) _table: Table;
  @Output() onDrillDown = new EventEmitter<{reportType: string, drillDown: string[]}>();
  
  private _mapCenter = [0, 10];
  private _echartsIntance: any; // echart instance
  private _canMapDrillDown = true;
  
  public _entry: KalturaExtendedLiveEntry = null;
  public _mapChartData: any = {};
  public _mapZoom = 1.2;
  public _mapDataReady = false;
  public _dateFilter: DateChangeEvent = null;
  public _selectedMetrics: string;
  public _reportInterval = KalturaReportInterval.days;
  public _tableData: TableRow<any>[] = [];
  public _tabsData: Tab[] = [];
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _drillDown: string[] = [];
  public _showTable = false;

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _http: HttpClient,
              private _liveGeoWidget: LiveGeoWidget,
              private _dataConfigService: LiveGeoConfig) {
  }
  
  ngOnDestroy() {
  }
  
  ngOnInit() {
    // load works map data
    this._http.get('assets/world.json')
      .subscribe(data => {
        echarts.registerMap('world', data);
        this._mapDataReady = true;
      });
    
    this._liveGeoWidget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        this._isBusy = state.isBusy;
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._liveGeoWidget.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
    
    this._liveGeoWidget.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe((data: LiveGeoWidgetData) => {
        this._tableData = data.table;
        this._columns = data.columns;
        this._selectedMetrics = data.selectedMetric;
        this._setMapCenter();
        setTimeout(() => {
          this._updateMap(this._mapCenter);
        }, 0);
      });
  }
  
  private _updateMap(mapCenter: number[]): void {
    let mapConfig: EChartOption = this._dataConfigService.getMapConfig(this._drillDown.length > 0 && this._canMapDrillDown);
    mapConfig.series[0].name = this._translate.instant('app.entryLive.geo.distribution');
    mapConfig.series[0].data = [];
    let maxValue = 0;
    this._tableData.forEach(data => {
      const coords = data['coordinates'].split('/');
      let value = [coords[1], coords[0]];
      value.push(parseFormattedValue(data['distribution']));
      mapConfig.series[0].data.push({
        name: this._drillDown.length === 0
          ? getCountryName(data.country, false)
          : this._drillDown.length === 1
            ? data.region
            : data.city,
        value
      });
      if (parseInt(data['distribution']) > maxValue) {
        maxValue = parseFormattedValue(data['distribution']);
      }
    });
    
    mapConfig.visualMap.inRange.color = this._tableData.length ? ['#B4E9FF', '#2541B8'] : ['#EBEBEB', '#EBEBEB'];
    mapConfig.visualMap.max = maxValue;
    const map = this._drillDown.length > 0 && this._canMapDrillDown ? mapConfig.geo : mapConfig.series[0];
    map.zoom = this._mapZoom;
    map.center = this._drillDown.length === 0 && this._echartsIntance && this._echartsIntance.getOption().series.length ? this._echartsIntance.getOption().series[0].center : mapCenter;
    map.roam = this._drillDown.length === 0 && this._canMapDrillDown && this._mapZoom === 1.2 ? 'false' : 'move';
    this._mapChartData = mapConfig;
  }

  private _setMapCenter(): void {
    this._mapCenter = [0, 10];
    if (this._drillDown.length > 0) {
      const location = this._drillDown.length === 1 ? this._drillDown[0] : this._drillDown[1];
      let found = false;
      this._tableData.forEach(data => {
        const name = this._drillDown.length === 1 ? data.country : data.region;
        if (location === name) {
          found = true;
          this._mapCenter = [data['coordinates'].split('/')[1], data['coordinates'].split('/')[0]];
        }
      });
      if (!found && this._tableData.length) {
        this._mapCenter = [this._tableData[0]['coordinates'].split('/')[1], this._tableData[0]['coordinates'].split('/')[0]];
      }
    }
  }
  
  public _onChartClick(event): void {
    if (event.data && event.data.name && this._drillDown.length < 2) {
      this._onDrillDown(event.data.name);
    }
  }
  
  public _onDrillDown(country: string, reload = true): void {
    let drillDown = [...this._drillDown];
    if (country === null) {
      drillDown = [];
    } else if (drillDown.length < 2) {
      drillDown.push(getCountryName(country, true));
    } else if (drillDown.length === 2) {
      drillDown.pop();
    }
    
    this._canMapDrillDown = canDrillDown(drillDown[0]);
    
    if (this._table) {
      this._table.reset();
    }
    
    this._mapZoom = drillDown.length === 0 || !this._canMapDrillDown ? 1.2 : this._mapZoom;
    
    this._drillDown = Array.isArray(drillDown) ? drillDown : [drillDown];
    
    this._liveGeoWidget.updatePollsFilter(this._drillDown, reload);
    
    if (reload) {
      this._isBusy = true;
    }
    const reportType = this._drillDown.length === 2 ? liveReportTypeMap(KalturaReportType.mapOverlayCity) : this._drillDown.length === 1 ? liveReportTypeMap(KalturaReportType.mapOverlayRegion) : liveReportTypeMap(KalturaReportType.mapOverlayCountry);
    this.onDrillDown.emit({ reportType: reportType, drillDown: this._drillDown });
  }
  
  public _onChartInit(ec) {
    this._echartsIntance = ec;
  }
  
  public _zoom(direction: string): void {
    if (direction === 'in') {
      this._mapZoom = this._mapZoom * 2;
    } else {
      this._mapZoom = this._mapZoom / 2;
    }
    const roam = this._mapZoom > 1.2 ? 'move' : 'false';
    if (this._drillDown.length > 0 && this._canMapDrillDown) {
      this._echartsIntance.setOption({ geo: [{ zoom: this._mapZoom }] }, false);
      this._echartsIntance.setOption({ geo: [{ roam: roam }] }, false);
    } else {
      this._echartsIntance.setOption({ series: [{ zoom: this._mapZoom }] }, false);
      this._echartsIntance.setOption({ series: [{ roam: roam }] }, false);
    }
  }
  
  public _toggleTable(): void {
    this._showTable = !this._showTable;
  
    this._liveGeoWidget.updateLayout();
  }
}
