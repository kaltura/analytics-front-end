import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-csv.component';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';

@Injectable()
export class TopContributorsExportConfig implements ExportConfigService {
  constructor(private _translate: TranslateService) {
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.contributors.exportLabels.highlights'),
        reportType: KalturaReportType.topContentContributors,
        sections: [KalturaReportExportItemType.total]
      },
      {
        label: this._translate.instant('app.contributors.exportLabels.topContributors'),
        reportType: KalturaReportType.topContentContributors,
        sections: [KalturaReportExportItemType.table]
      },
      {
        label: this._translate.instant('app.contributors.exportLabels.general'),
        reportType: KalturaReportType.topContentContributors,
        sections: [KalturaReportExportItemType.graph]
      },
      {
        label: this._translate.instant('app.contributors.exportLabels.topSources'),
        reportType: KalturaReportType.topSources,
        sections: [KalturaReportExportItemType.table]
      },
    ];
  }
}
