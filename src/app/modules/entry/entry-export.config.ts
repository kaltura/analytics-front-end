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
        reportType: KalturaReportType.topContentCreator,
        sections: [KalturaReportExportItemType.table, KalturaReportExportItemType.total]
      },
      {
        label: this._translate.instant('app.entry.exportLabels.videoPerformance'),
        reportType: KalturaReportType.userTopContent,
        sections: [KalturaReportExportItemType.graph, KalturaReportExportItemType.total]
      },
      {
        label: this._translate.instant('app.entry.exportLabels.impressions'),
        reportType: KalturaReportType.contentDropoff,
        sections: [KalturaReportExportItemType.total]
      },
      {
        label: this._translate.instant('app.entry.exportLabels.topCountries'),
        reportType: KalturaReportType.mapOverlayCountry,
        sections: [KalturaReportExportItemType.total, KalturaReportExportItemType.table]
      },
      {
        label: this._translate.instant('app.entry.exportLabels.devicesOverview'),
        reportType: KalturaReportType.platforms,
        sections: [KalturaReportExportItemType.total, KalturaReportExportItemType.table]
      },
      {
        label: this._translate.instant('app.entry.exportLabels.syndication'),
        reportType: KalturaReportType.topSyndication,
        sections: [KalturaReportExportItemType.total, KalturaReportExportItemType.graph, KalturaReportExportItemType.table]
      },
    ];
  }
}
