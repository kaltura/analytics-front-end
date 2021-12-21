import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import {ViewConfig} from "configuration/view-config";

@Injectable()
export class EngagementExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }

  public getConfig(viewConfig?: ViewConfig): ExportItem[] {
    const exportConfig = [
      {
        label: this._translate.instant('app.engagement.exportLabels.highlights'),
        reportType: reportTypeMap(KalturaReportType.userEngagementTimeline),
        sections: [KalturaReportExportItemType.total],
        order: '-count_plays',
      },
      {
        label: this._translate.instant('app.engagement.exportLabels.topVideos'),
        reportType: reportTypeMap(KalturaReportType.topContentCreator),
        sections: [KalturaReportExportItemType.table],
        order: '-engagement_ranking',
      },
      {
        label: this._translate.instant('app.engagement.exportLabels.general'),
        reportType: reportTypeMap(KalturaReportType.userEngagementTimeline),
        sections: [KalturaReportExportItemType.table],
        order: '-date_id',
      },
      {
        label: this._translate.instant('app.engagement.exportLabels.users'),
        reportType: reportTypeMap(KalturaReportType.userTopContent),
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
      {
        label: this._translate.instant('app.engagement.exportLabels.impressions'),
        reportType: reportTypeMap(KalturaReportType.contentDropoff),
        sections: [KalturaReportExportItemType.total],
        order: '-count_plays',
      },
      {
        id: 'syndication',
        label: this._translate.instant('app.engagement.exportLabels.syndication'),
        reportType: reportTypeMap(KalturaReportType.topSyndication),
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
    ];
    if (!viewConfig.syndication) {
      exportConfig.pop();
    }
    return exportConfig;
  }
}
