import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';

@Injectable()
export class UserExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }
  
  public getConfig(userId?: string): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.user.exportLabels.highlights'),
        reportType: reportTypeMap(KalturaReportType.userHighlights),
        sections: [KalturaReportExportItemType.total],
      },
      {
        label: this._translate.instant('app.user.exportLabels.topLocation'),
        reportType: reportTypeMap(KalturaReportType.mapOverlayCity),
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
      {
        label: this._translate.instant('app.user.exportLabels.devices'),
        reportType: reportTypeMap(KalturaReportType.platforms),
        sections: [KalturaReportExportItemType.total, KalturaReportExportItemType.table],
      },
      {
        id: 'groupNode',
        label: this._translate.instant('app.user.exportLabels.viewingEngagement'),
      },
      {
        label: this._translate.instant('app.user.exportLabels.metricsOverTime'),
        reportType: reportTypeMap(KalturaReportType.topUserContent),
        sections: [KalturaReportExportItemType.total, KalturaReportExportItemType.table, KalturaReportExportItemType.graph],
      },
      {
        label: this._translate.instant('app.user.exportLabels.engagement'),
        reportType: reportTypeMap(KalturaReportType.contentDropoff),
        sections: [KalturaReportExportItemType.total],
      },
      {
        id: 'groupNode',
        label: this._translate.instant('app.user.exportLabels.contribution'),
      },
      {
        label: this._translate.instant('app.user.exportLabels.metricsOverTime'),
        reportType: reportTypeMap(KalturaReportType.topContentContributors),
        sections: [KalturaReportExportItemType.total, KalturaReportExportItemType.table],
        ownerId: userId,
      },
      {
        label: this._translate.instant('app.user.exportLabels.topContent'),
        reportType: reportTypeMap(KalturaReportType.topContentCreator),
        sections: [KalturaReportExportItemType.table],
        ownerId: userId,
      },
      {
        label: this._translate.instant('app.user.exportLabels.sources'),
        reportType: reportTypeMap(KalturaReportType.topSources),
        sections: [KalturaReportExportItemType.total, KalturaReportExportItemType.table, KalturaReportExportItemType.graph],
        ownerId: userId,
      },
    ];
  }
}
