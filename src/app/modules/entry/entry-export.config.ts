import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-csv.component';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';

@Injectable()
export class EntryExportConfig implements ExportConfigService {
  constructor(private _translate: TranslateService) {
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.entry.exportLabels.userEngagement'),
        reportType: KalturaReportType.userTopContent,
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
      {
        label: this._translate.instant('app.entry.exportLabels.videoPerformance'),
        reportType: KalturaReportType.userTopContent,
        sections: [KalturaReportExportItemType.graph],
        order: '-date_id',
      },
      {
        label: this._translate.instant('app.entry.exportLabels.impressions'),
        reportType: KalturaReportType.contentDropoff,
        sections: [KalturaReportExportItemType.total],
        order: '-count_plays',
      },
      {
        label: this._translate.instant('app.entry.exportLabels.topCountries'),
        reportType: KalturaReportType.mapOverlayCountry,
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
      {
        label: this._translate.instant('app.entry.exportLabels.devicesOverview'),
        reportType: KalturaReportType.platforms,
        sections: [KalturaReportExportItemType.table],
        order: null,
      },
      {
        label: this._translate.instant('app.entry.exportLabels.syndication'),
        reportType: KalturaReportType.topSyndication,
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
    ];
  }
}
