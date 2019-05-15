import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveDevicesRequestFactory } from './live-devices-request-factory';
import { EntryLiveGeoDevicesPollsService } from '../../providers/entry-live-geo-devices-polls.service';
import { KalturaReportTable, KalturaReportTotal, KalturaReportType, KalturaResponse } from 'kaltura-ngx-client';
import { significantDigits } from 'shared/utils/significant-digits';
import { ReportHelper, ReportService } from 'shared/services';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { LiveDevicesConfig } from './live-devices.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';

@Injectable()
export class LiveDevicesWidget extends WidgetBase<any> {
  protected _widgetId = 'devices';
  protected _pollsFactory: LiveDevicesRequestFactory = null;
  protected _dataConfig: ReportDataConfig;
  protected _selectedMetrics: string;
  
  constructor(protected _serverPolls: EntryLiveGeoDevicesPollsService,
              protected _reportService: ReportService,
              private _dataConfigService: LiveDevicesConfig) {
    super(_serverPolls);
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveDevicesRequestFactory(widgetsArgs.entryId, widgetsArgs.streamStartTime);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(responses: KalturaResponse<KalturaReportTotal | KalturaReportTable>[]): any {
  
  }
  
  protected _getResponseByType(responses: KalturaResponse<any>[], type: any): any {
    const isType = t => r => r.result instanceof t || Array.isArray(r.result) && r.result.length && r.result[0] instanceof t;
    const result = Array.isArray(responses) ? responses.find(response => isType(type)(response)) : null;
    return result ? result.result : null;
  }
}
