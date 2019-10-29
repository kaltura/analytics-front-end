import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import * as moment from 'moment';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';

@Injectable()
export class EntryLiveExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        id: 'geo',
        label: this._translate.instant('app.entryLive.exportLabels.geo'),
        reportType: liveReportTypeMap(KalturaReportType.mapOverlayCountryRealtime),
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
        startDate: () => this._getFromDate(),
        endDate: () => moment().unix()
      },
      {
        id: 'devices',
        label: this._translate.instant('app.entryLive.exportLabels.devices'),
        reportType: liveReportTypeMap(KalturaReportType.platformsRealtime),
        sections: [KalturaReportExportItemType.table],
        order: null,
        startDate: () => this._getFromDate(),
        endDate: () => moment().unix()
      },
      {
        id: 'discovery',
        label: this._translate.instant('app.entryLive.exportLabels.discovery'),
        items: [
          {
            id: 'graph',
            reportType: liveReportTypeMap(KalturaReportType.discoveryRealtime),
            sections: [KalturaReportExportItemType.graph],
            order: null,
            startDate: () => this._getTime(60),
            endDate: () => moment().unix()
          },
          {
            id: 'table',
            reportType: liveReportTypeMap(KalturaReportType.entryLevelUsersDiscoveryRealtime),
            sections: [KalturaReportExportItemType.table],
            order: null,
            startDate: () => this._getTime(60),
            endDate: () => moment().unix()
          },
        ]
      }
    ];
  }
  
  private _getTime(seconds: number): number {
    return moment().subtract(seconds, 'seconds').unix();
  }
  
  private _getFromDate(): number {
    return moment().subtract(3, 'hours').unix();
  }
}
