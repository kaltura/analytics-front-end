import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';

@Injectable()
export class EntryExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
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
        label: this._translate.instant('app.entry.exportLabels.imagePerformance'),
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
        id: 'geo',
        label: this._translate.instant('app.entry.exportLabels.topCountries'),
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
}
