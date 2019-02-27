import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { tableLocalSortHandler, TableRow } from 'shared/utils/table-local-sort-handler';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';
import * as echarts from 'echarts';
import { EChartOption } from 'echarts';
import { getCountryName } from 'shared/utils/get-country-name';
import { TopCountriesConfig } from '../top-countries.config';

@Component({
  selector: 'app-entry-geo',
  templateUrl: './geo.component.html',
  styleUrls: ['./geo.component.scss'],
})
export class GeoComponent {
  @Input() tableData: TableRow<any>[] = [];
  @Input() isBusy = false;
  @Input() isCompareMode = false;
  @Input() showTrend = false;
  @Input() selectedMetrics = 'count_plays';
  
  @Input() set mapData(value) {
    if (value) {
      this._mapDataReady = true;
      echarts.registerMap('world', value);
    }
  }
  
  @Output() onDrillDown = new EventEmitter<string[]>();
  
  private _order = '-count_plays';
  private _echartsIntance: any; // echart instance
  
  public _mapChartData: any = {};
  public _drillDown: string[] = [];
  public _mapZoom = 1.2;
  public _mapDataReady = false;
  
  constructor(private _translate: TranslateService,
              private _logger: KalturaLogger,
              private _dataConfigService: TopCountriesConfig) {
  }
  
  public _onSortChanged(event) {
    tableLocalSortHandler(event, this._order, this.isCompareMode);
  }
  
  public _onChartInit(ec) {
    this._echartsIntance = ec;
  }
  
  public _zoom(direction: string): void {
    this._logger.trace('Handle zoom action by user', { direction });
    if (direction === 'in') {
      this._mapZoom = this._mapZoom * 2;
    } else {
      this._mapZoom = this._mapZoom / 2;
    }
    const roam = this._mapZoom > 1.2 ? 'move' : 'false';
    if (this._drillDown.length > 0) {
      this._echartsIntance.setOption({ geo: [{ zoom: this._mapZoom }] }, false);
      this._echartsIntance.setOption({ geo: [{ roam: roam }] }, false);
    } else {
      this._echartsIntance.setOption({ series: [{ zoom: this._mapZoom }] }, false);
      this._echartsIntance.setOption({ series: [{ roam: roam }] }, false);
    }
  }
  
  public _onChartClick(event): void {
    this._logger.trace('Handle click on chart by user', { country: event.data.name });
    if (event.data && event.data.name && this._drillDown.length < 2) {
      this.drillDown(event.data.name);
    }
  }
  
  public updateMap(mapCenter: number[]): void {
    let mapConfig: EChartOption = this._dataConfigService.getMapConfig(this._drillDown.length > 0);
    mapConfig.series[0].name = this._translate.instant('app.audience.geo.' + this.selectedMetrics);
    mapConfig.series[0].data = [];
    let maxValue = 0;
    
    this.tableData.forEach(data => {
      const coords = data['coordinates'].split('/');
      let value = [coords[1], coords[0]];
      value.push(parseFloat(data[this.selectedMetrics].replace(new RegExp(analyticsConfig.valueSeparator, 'g'), '')));
      mapConfig.series[0].data.push({
        name: this._drillDown.length === 0
          ? getCountryName(data.country, false)
          : this._drillDown.length === 1
            ? data.region
            : data.city,
        value
      });
      if (parseInt(data[this.selectedMetrics]) > maxValue) {
        maxValue = parseInt(data[this.selectedMetrics].replace(new RegExp(analyticsConfig.valueSeparator, 'g'), ''));
      }
    });
    
    mapConfig.visualMap.max = maxValue;
    const map = this._drillDown.length > 0 ? mapConfig.geo : mapConfig.visualMap;
    map.center = mapCenter;
    map.zoom = this._mapZoom;
    map.roam = this._drillDown.length === 0 ? 'false' : 'move';
    this._mapChartData = mapConfig;
    console.warn(mapConfig);
  }
  
  public drillDown(country: string): void {
    this._logger.trace('Handle drill down to country action by user', { country });
    if (country === '') {
      this._drillDown = [];
    } else if (this._drillDown.length < 2) {
      this._drillDown.push(getCountryName(country, true));
    } else if (this._drillDown.length === 2) {
      this._drillDown.pop();
    }
    this._mapZoom = this._drillDown.length === 0 ? 1.2 : this._mapZoom;
    this.onDrillDown.emit(this._drillDown);
  }
}
