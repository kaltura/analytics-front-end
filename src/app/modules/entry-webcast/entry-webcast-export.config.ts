import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { ViewConfig } from 'configuration/view-config';

@Injectable()
export class EntryWebcastExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }

  public getConfig(viewConfig?: ViewConfig): ExportItem[] {
    const config: ExportItem[] = [
      {
        id: 'geo',
        label: this._translate.instant('app.entryWebcast.exportLabels.geo'),
        reportType: reportTypeMap(KalturaReportType.mapOverlayCountryWebcast),
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays'
      },
      {
        id: 'devices',
        label: this._translate.instant('app.entryWebcast.exportLabels.devices'),
        reportType: reportTypeMap(KalturaReportType.platformsWebcast),
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays'
      },
      {
        id: 'domains',
        label: this._translate.instant('app.entryWebcast.exportLabels.domains'),
        reportType: reportTypeMap(KalturaReportType.topDomainsWebcast),
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays'
      }
    ];

    return viewConfig ? config.filter((item: ExportItem) => viewConfig[item.id]) : config;
  }

}
