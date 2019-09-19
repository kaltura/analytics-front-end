import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Injectable()
export class TopContributorsExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.contributors.exportLabels.highlights'),
        reportType: reportTypeMap(KalturaReportType.topContentContributors),
        sections: [KalturaReportExportItemType.total],
        order: '-month_id',
      },
      {
        label: this._translate.instant('app.contributors.exportLabels.topContributors'),
        reportType: reportTypeMap(KalturaReportType.topContentContributors),
        sections: [KalturaReportExportItemType.table],
        order: '-contributor_ranking',
      },
      {
        label: this._translate.instant('app.contributors.exportLabels.general'),
        reportType: reportTypeMap(KalturaReportType.topContentContributors),
        sections: [KalturaReportExportItemType.graph],
      },
      {
        label: this._translate.instant('app.contributors.exportLabels.topSources'),
        reportType: reportTypeMap(KalturaReportType.topSources),
        sections: [KalturaReportExportItemType.table],
      },
    ];
  }
}
