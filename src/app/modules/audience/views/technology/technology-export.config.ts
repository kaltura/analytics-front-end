import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Injectable()
export class TechnologyExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.audience.technology.exportLabels.overview'),
        reportType: reportTypeMap(KalturaReportType.platforms),
        sections: [KalturaReportExportItemType.table],
      },
      {
        id: 'top-os',
        label: this._translate.instant('app.audience.technology.exportLabels.topOs'),
        reportType: reportTypeMap(KalturaReportType.operatingSystemFamilies),
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
      {
        id: 'top-browsers',
        label: this._translate.instant('app.audience.technology.exportLabels.topBrowsers'),
        reportType: reportTypeMap(KalturaReportType.browsersFamilies),
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
    ];
  }
}
