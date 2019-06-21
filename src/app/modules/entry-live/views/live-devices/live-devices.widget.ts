import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveDevicesRequestFactory } from './live-devices-request-factory';
import { EntryLiveGeoDevicesPollsService } from '../../providers/entry-live-geo-devices-polls.service';
import { KalturaReportTable, KalturaReportTotal, KalturaResponse } from 'kaltura-ngx-client';
import { ReportHelper, ReportService } from 'shared/services';
import { LiveDevicesConfig } from './live-devices.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { BarChartRow } from 'shared/components/horizontal-bar-chart/horizontal-bar-chart.component';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { DeviceIconPipe } from 'shared/pipes/device-icon.pipe';
import { TranslateService } from '@ngx-translate/core';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';

export interface LiveDevicesData {
  data: BarChartRow[];
  totalCount: number;
}

@Injectable()
export class LiveDevicesWidget extends WidgetBase<LiveDevicesData> {
  protected readonly _allowedDevices = ['Computer', 'Mobile', 'Tablet', 'Game console', 'Digital media receiver'];
  protected _widgetId = 'devices';
  protected _pollsFactory: LiveDevicesRequestFactory = null;
  protected _dataConfig: ReportDataConfig;
  protected _selectedMetric: string;
  protected _deviceIconPipe = new DeviceIconPipe();
  protected _fractions = 1;
  
  constructor(protected _serverPolls: EntryLiveGeoDevicesPollsService,
              protected _reportService: ReportService,
              protected _translate: TranslateService,
              protected _frameEventManager: FrameEventManagerService,
              protected _dataConfigService: LiveDevicesConfig) {
    super(_serverPolls, _frameEventManager);
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetric = this._dataConfig.totals.preSelected;
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveDevicesRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(table: KalturaReportTable): LiveDevicesData {
    let result = {
      data: [],
      totalCount: 0
    };
    
    if (table && table.header && table.data) {
      const relevantFields = Object.keys(this._dataConfig.totals.fields);
      const { data } = this._getOverviewData(table, relevantFields);
      
      result.totalCount = table.totalCount;
      result.data = this._getSummaryData(data);
    }
    
    return result;
  }
  
  protected _getOverviewData(table: KalturaReportTable, relevantFields: string[]): { data: { [key: string]: string }[], columns: string[] } {
    const { tableData, columns } = this._reportService.parseTableData(table, this._dataConfig.table);
    const data = tableData.reduce((data, item) => {
      if (this._allowedDevices.indexOf(item.device) > -1) {
        data.push(item);
      } else {
        const otherIndex = data.findIndex(({ device }) => device === 'OTHER');
        if (otherIndex !== -1) {
          relevantFields.forEach(key => {
            data[otherIndex][key] = (parseFloat(data[otherIndex][key]) || 0) + (parseFloat(item[key]) || 0);
          });
        } else {
          item.device = 'OTHER';
          data.push(item);
        }
      }
      return data;
    }, []);
    
    return { data, columns };
  }
  
  protected _getSummaryData(data: { [key: string]: string }[]): BarChartRow[] {
    const key = this._selectedMetric;
    const getValue = (itemValue, totalValue) => {
      let value = 0;
      if (!isNaN(itemValue) && !isNaN(totalValue) && totalValue !== 0) {
        value = (itemValue / totalValue) * 100;
        if (value % 1 !== 0) {
          value = Number(value.toFixed(this._fractions));
        }
      }
      return value;
    };

    const totalValue = data.reduce((acc, item) => acc + parseFloat(item[key]), 0);
    return data.map(item => {
      const rawValue = parseFloat(item[key]);
      const currentValue = getValue(rawValue, totalValue);
      return {
        value: currentValue,
        tooltip: { value: ReportHelper.numberOrZero(rawValue), label: this._translate.instant(`app.entryLive.view_unique_audience`) },
        label: this._translate.instant(`app.audience.technology.devices.${item.device}`),
        icon: this._deviceIconPipe.transform(item.device),
      };
    });
    return [];
  }
}
