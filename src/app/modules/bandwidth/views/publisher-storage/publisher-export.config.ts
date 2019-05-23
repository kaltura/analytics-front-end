import { Injectable } from '@angular/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';

@Injectable()
export class PublisherExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }
  
  public getConfig(): ExportItem[] {
    return [
      {
        label: this._translate.instant('app.bandwidth.exportLabels.publisher'),
        reportType: KalturaReportType.partnerUsage,
        sections: [KalturaReportExportItemType.graph],
        order: '-date_id',
      },
    ];
  }
}
