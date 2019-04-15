import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-csv.component';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';

@Injectable()
export class ContentInteractionsExportConfig implements ExportConfigService {
  constructor(private _translate: TranslateService) {
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.contentInteractions.exportLabels.interactions'),
        reportType: KalturaReportType.playerRelatedInteractions,
        sections: [KalturaReportExportItemType.graph, KalturaReportExportItemType.table],
        order: '-count_viral',
      },
      {
        label: this._translate.instant('app.contentInteractions.exportLabels.moderation'),
        reportType: KalturaReportType.contentReportReasons,
        sections: [KalturaReportExportItemType.table],
      },
      {
        label: this._translate.instant('app.contentInteractions.exportLabels.playback'),
        reportType: KalturaReportType.playbackRate,
        sections: [KalturaReportExportItemType.total],
      },
      {
        label: this._translate.instant('app.contentInteractions.exportLabels.highlights'),
        reportType: KalturaReportType.playerRelatedInteractions,
        sections: [KalturaReportExportItemType.total],
        order: '-count_viral',
      },
    ];
  }
}
