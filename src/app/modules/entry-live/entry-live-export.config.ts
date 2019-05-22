import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import * as moment from "moment";

@Injectable()
export class EntryLiveExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.entryLive.exportLabels.users'),
        reportType: KalturaReportType.usersOverviewRealtime,
        sections: [KalturaReportExportItemType.graph],
        startDate: this._getTime(200),
        endDate: this._getTime(30)
      },
      {
        label: this._translate.instant('app.entryLive.exportLabels.bandwidth'),
        reportType: KalturaReportType.qosOverviewRealtime,
        sections: [KalturaReportExportItemType.graph],
        startDate: this._getTime(200),
        endDate: this._getTime(30)
      },
      {
        label: this._translate.instant('app.entryLive.exportLabels.geo'),
        reportType: KalturaReportType.contentDropoff,
        sections: [KalturaReportExportItemType.total],
        order: '-count_plays',
      },
      {
        label: this._translate.instant('app.entryLive.exportLabels.devices'),
        reportType: KalturaReportType.mapOverlayCountry,
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
      {
        label: this._translate.instant('app.entry.exportLabels.devicesOverview'),
        reportType: KalturaReportType.platforms,
        sections: [KalturaReportExportItemType.table],
      },
      {
        id: 'syndication',
        label: this._translate.instant('app.entry.exportLabels.syndication'),
        reportType: KalturaReportType.topSyndication,
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
    ];
  }

  private _getTime(seconds: number): number {
    return moment().subtract(seconds, 'seconds').unix();
  }

  private _getFromDate(): number {
    return moment().subtract(10, 'seconds').unix();
  }
}
