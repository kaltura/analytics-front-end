import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-csv.component';
import { KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataSection } from 'shared/services/storage-data-base.config';

@Injectable()
export class EngagementExportConfig implements ExportConfigService {
  constructor(private _translate: TranslateService) {
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.engagement.exportLabels.highlights'),
        reportType: KalturaReportType.userEngagementTimeline,
        sections: [ReportDataSection.totals, ReportDataSection.graph, ReportDataSection.table]
      },
      {
        label: this._translate.instant('app.engagement.exportLabels.topVideos'),
        reportType: KalturaReportType.topContentCreator,
        sections: [ReportDataSection.table]
      },
      {
        label: this._translate.instant('app.engagement.exportLabels.users'),
        reportType: KalturaReportType.uniqueUsersPlay,
        sections: [ReportDataSection.table]
      },
      {
        label: this._translate.instant('app.engagement.exportLabels.insights'),
        reportType: KalturaReportType.userEngagementTimeline,
        sections: [ReportDataSection.table]
      },
    ];
  }
}
