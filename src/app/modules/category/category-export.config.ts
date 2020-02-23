import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { ViewConfig } from 'configuration/view-config';

@Injectable()
export class CategoryExportConfig extends ExportConfigService {
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
      },*/
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
