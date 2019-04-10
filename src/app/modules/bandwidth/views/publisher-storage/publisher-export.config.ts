import { Injectable } from '@angular/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-csv.component';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class PublisherExportConfig implements ExportConfigService {
  constructor(private _translate: TranslateService) {
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.bandwidth.exportLabels.publisher'),
        reportType: KalturaReportType.partnerUsage,
        sections: [KalturaReportExportItemType.graph]
      },
    ];
  }
}
