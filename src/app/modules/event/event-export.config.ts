import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { ViewConfig } from 'configuration/view-config';

@Injectable()
export class EventExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }

  public getConfig(viewConfig?: ViewConfig): ExportItem[] {
    const config: ExportItem[] = [
     /* {
        id: 'userEngagement',
        label: this._translate.instant('app.entry.exportLabels.userEngagement'),
        reportType: reportTypeMap(KalturaReportType.userTopContent),
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
      {
        id: 'performance',
        label: this._translate.instant('app.entry.exportLabels.videoPerformance'),
        reportType: reportTypeMap(KalturaReportType.userTopContent),
        sections: [KalturaReportExportItemType.graph],
        order: '-date_id',
      },
      {
        id: 'impressions',
        label: this._translate.instant('app.entry.exportLabels.impressions'),
        reportType: reportTypeMap(KalturaReportType.contentDropoff),
        sections: [KalturaReportExportItemType.total],
        order: '-count_plays',
      },
      */
      {
        id: 'miniHighlights',
        label: this._translate.instant('app.category.highlights'),
        reportType: reportTypeMap(KalturaReportType.categoryHighlights),
        sections: [KalturaReportExportItemType.total],
        order: '-count_plays',
      },
      {
        id: 'topVideos',
        label: this._translate.instant('app.engagement.exportLabels.topVideos'),
        reportType: reportTypeMap(KalturaReportType.topContentCreator),
        sections: [KalturaReportExportItemType.table],
        order: '-engagement_ranking',
      },
      {
        id: 'performance',
        label: this._translate.instant('app.category.exportLabels.metrics'),
        reportType: reportTypeMap(KalturaReportType.userEngagementTimeline),
        sections: [KalturaReportExportItemType.graph],
        order: '-date_id',
      },
      {
        id: 'performance',
        label: this._translate.instant('app.category.exportLabels.user'),
        reportType: reportTypeMap(KalturaReportType.userTopContent),
        sections: [KalturaReportExportItemType.table],
        order: '-count_loads',
      },
      {
        id: 'performance',
        label: this._translate.instant('app.category.exportLabels.media'),
        reportType: reportTypeMap(KalturaReportType.topContentCreator),
        sections: [KalturaReportExportItemType.table],
        order: '-count_loads',
      },
      {
        id: 'geo',
        label: this._translate.instant('app.entry.exportLabels.topCountries'),
        reportType: reportTypeMap(KalturaReportType.mapOverlayCountry),
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
      {
        id: 'devices',
        label: this._translate.instant('app.entry.exportLabels.devicesOverview'),
        reportType: reportTypeMap(KalturaReportType.platforms),
        sections: [KalturaReportExportItemType.table],
      },
      {
        id: 'syndication',
        label: this._translate.instant('app.entry.exportLabels.syndication'),
        reportType: reportTypeMap(KalturaReportType.topSyndication),
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      }
    ];

    return viewConfig ? config.filter((item: ExportItem) => viewConfig[item.id]) : config;
  }

}
