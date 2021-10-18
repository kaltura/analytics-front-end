import { Injectable } from '@angular/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Injectable()
export class StorageExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }

  public getConfig(): ExportItem[] {
    return [
      {
        id: 'overview',
        label: this._translate.instant('app.modules.bandwidth'),
        reportType: reportTypeMap(KalturaReportType.selfServeUsage),
        sections: [KalturaReportExportItemType.total, KalturaReportExportItemType.graph]
      },
    ];
  }
}
