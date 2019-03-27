import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-csv.component';
import { KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataSection } from 'shared/services/storage-data-base.config';

@Injectable()
export class ContentInteractionsExportConfig implements ExportConfigService {
  constructor(private _translate: TranslateService) {
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.contentInteractions.exportLabels.interactions'),
        reportType: KalturaReportType.playerRelatedInteractions,
        sections: [ReportDataSection.totals, ReportDataSection.graph, ReportDataSection.table]
      },
      {
        label: this._translate.instant('app.contentInteractions.exportLabels.moderation'),
        reportType: KalturaReportType.contentReportReasons,
        sections: [ReportDataSection.totals, ReportDataSection.table]
      },
      {
        label: this._translate.instant('app.contentInteractions.exportLabels.playback'),
        reportType: KalturaReportType.playbackRate,
        sections: [ReportDataSection.totals]
      },
      {
        label: this._translate.instant('app.contentInteractions.exportLabels.highlights'),
        reportType: KalturaReportType.contentInteractions,
        sections: [ReportDataSection.totals]
      },
    ];
  }
}
