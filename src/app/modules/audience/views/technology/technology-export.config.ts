import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-csv.component';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';

@Injectable()
export class TechnologyExportConfig implements ExportConfigService {
  constructor(private _translate: TranslateService) {
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.audience.technology.exportLabels.overview'),
        reportType: KalturaReportType.platforms,
        sections: [KalturaReportExportItemType.table],
      },
      {
        label: this._translate.instant('app.audience.technology.exportLabels.topOs'),
        reportType: KalturaReportType.operatingSystemFamilies,
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
      {
        label: this._translate.instant('app.audience.technology.exportLabels.topBrowsers'),
        reportType: KalturaReportType.browsersFamilies,
        sections: [KalturaReportExportItemType.table],
        order: '-count_plays',
      },
    ];
  }
}
