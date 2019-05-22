import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveDiscoveryRequestFactory } from './live-discovery-request-factory';
import { KalturaReportGraph, KalturaReportInterval } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { EntryLiveDiscoveryPollsService } from '../../providers/entry-live-discovery-polls.service';
import { LiveDiscoveryConfig } from './live-discovery.config';
import { ReportService } from 'shared/services';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';

export interface LiveUsersData {
  activeUsers: number[];
  engagedUsers: number[];
  dates: string[];
}

@Injectable()
export class LiveDiscoveryWidget extends WidgetBase<any> {
  protected _widgetId = 'explore';
  protected _pollsFactory: LiveDiscoveryRequestFactory = null;
  protected _dataConfig: ReportDataConfig;
  
  constructor(protected _serverPolls: EntryLiveDiscoveryPollsService,
              protected _translate: TranslateService,
              protected _dataConfigService: LiveDiscoveryConfig,
              protected _reportService: ReportService) {
    super(_serverPolls);
  
    this._dataConfig = this._dataConfigService.getConfig();
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveDiscoveryRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(reports: KalturaReportGraph[]): any {
    this._pollsFactory.updateDateInterval();
  
    const r = this._reportService.parseGraphs(reports, this._dataConfig[ReportDataSection.graph], null, KalturaReportInterval.hours);
    console.warn(r);
  }
}
