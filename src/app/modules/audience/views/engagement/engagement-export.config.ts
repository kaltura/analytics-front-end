import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-csv.component';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';

@Injectable()
export class EngagementExportConfig implements ExportConfigService {
  constructor(private _translate: TranslateService) {
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.engagement.exportLabels.highlights'),
        reportType: KalturaReportType.userEngagementTimeline,
        sections: [KalturaReportExportItemType.total],
        order: '-count_plays',
      },
      {
        label: this._translate.instant('app.engagement.exportLabels.topVideos'),
        reportType: KalturaReportType.topContentCreator,
        sections: [KalturaReportExportItemType.table],
        order: '-engagement_ranking',
      },
      {
        label: this._translate.instant('app.engagement.exportLabels.general'),
        reportType: KalturaReportType.userEngagementTimeline,
        sections: [KalturaReportExportItemType.table],
        order: '-date_id',
      },
      {
        label: this._translate.instant('app.engagement.exportLabels.impressions'),
        reportType: KalturaReportType.contentDropoff,
        sections: [KalturaReportExportItemType.total],
        order: '-count_plays',
      },
      {
        label: this._translate.instant('app.engagement.exportLabels.syndication'),
        reportType: KalturaReportType.topSyndication,
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
    ];
  }
}
