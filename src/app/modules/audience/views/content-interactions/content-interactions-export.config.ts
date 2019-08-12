import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Injectable()
export class ContentInteractionsExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.contentInteractions.exportLabels.interactions'),
        reportType: reportTypeMap(KalturaReportType.playerRelatedInteractions),
        sections: [KalturaReportExportItemType.graph, KalturaReportExportItemType.table],
        order: '-count_viral',
      },
      {
        label: this._translate.instant('app.contentInteractions.exportLabels.moderation'),
        reportType: reportTypeMap(KalturaReportType.contentReportReasons),
        sections: [KalturaReportExportItemType.table],
      },
      {
        label: this._translate.instant('app.contentInteractions.exportLabels.playback'),
        reportType: reportTypeMap(KalturaReportType.playbackRate),
        sections: [KalturaReportExportItemType.total],
      },
      {
        label: this._translate.instant('app.contentInteractions.exportLabels.highlights'),
        reportType: reportTypeMap(KalturaReportType.playerRelatedInteractions),
        sections: [KalturaReportExportItemType.total],
        order: '-count_viral',
      },
    ];
  }
}
