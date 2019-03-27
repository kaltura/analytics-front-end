import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-csv.component';
import { KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataSection } from 'shared/services/storage-data-base.config';

@Injectable()
export class TechnologyExportConfig implements ExportConfigService {
  constructor(private _translate: TranslateService) {
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.audience.technology.exportLabels.overview'),
        reportType: KalturaReportType.platforms,
        sections: [ReportDataSection.totals, ReportDataSection.table]
      },
      {
        label: this._translate.instant('app.audience.technology.exportLabels.topOs'),
        reportType: KalturaReportType.operatingSystemFamilies,
        sections: [ReportDataSection.table, ReportDataSection.totals]
      },
      {
        label: this._translate.instant('app.audience.technology.exportLabels.topBrowsers'),
        reportType: KalturaReportType.browsersFamilies,
        sections: [ReportDataSection.table, ReportDataSection.totals]
      },
    ];
  }
}
