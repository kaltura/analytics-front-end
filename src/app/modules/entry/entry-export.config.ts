import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-csv.component';
import { KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataSection } from 'shared/services/storage-data-base.config';

@Injectable()
export class EntryExportConfig implements ExportConfigService {
  constructor(private _translate: TranslateService) {
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.entry.exportLabels.userEngagement'),
        reportType: KalturaReportType.topContentCreator,
        sections: [ReportDataSection.table, ReportDataSection.totals]
      },
      {
        label: this._translate.instant('app.entry.exportLabels.videoPerformance'),
        reportType: KalturaReportType.userTopContent,
        sections: [ReportDataSection.graph, ReportDataSection.totals]
      },
      {
        label: this._translate.instant('app.entry.exportLabels.impressions'),
        reportType: KalturaReportType.contentDropoff,
        sections: [ReportDataSection.totals]
      },
      {
        label: this._translate.instant('app.entry.exportLabels.topCountries'),
        reportType: KalturaReportType.mapOverlayCountry,
        sections: [ReportDataSection.totals, ReportDataSection.table]
      },
      {
        label: this._translate.instant('app.entry.exportLabels.devicesOverview'),
        reportType: KalturaReportType.platforms,
        sections: [ReportDataSection.totals, ReportDataSection.table]
      },
      {
        label: this._translate.instant('app.entry.exportLabels.syndication'),
        reportType: KalturaReportType.topSyndication,
        sections: [ReportDataSection.totals, ReportDataSection.graph, ReportDataSection.table]
      },
    ];
  }
}
