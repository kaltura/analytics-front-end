import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-csv.component';
import { KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataSection } from 'shared/services/storage-data-base.config';

@Injectable()
export class TopContributorsExportConfig implements ExportConfigService {
  constructor(private _translate: TranslateService) {
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.contributors.exportLabels.topContributors'),
        reportType: KalturaReportType.topContentContributors,
        sections: [ReportDataSection.totals, ReportDataSection.graph, ReportDataSection.table]
      },
      {
        label: this._translate.instant('app.contributors.exportLabels.topSources'),
        reportType: KalturaReportType.topSources,
        sections: [ReportDataSection.totals, ReportDataSection.graph, ReportDataSection.table]
      },
    ];
  }
}
