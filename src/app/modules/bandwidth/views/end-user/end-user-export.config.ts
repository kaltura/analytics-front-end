import { Injectable } from '@angular/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';

@Injectable()
export class EndUserExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        id: 'end-user',
        label: this._translate.instant('app.bandwidth.exportLabels.endUser'),
        reportType: KalturaReportType.userUsage,
        sections: [KalturaReportExportItemType.graph, KalturaReportExportItemType.table],
        order: '-total_storage_mb',
      },
    ];
  }
}
