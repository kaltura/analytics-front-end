import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Injectable()
export class ExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }

  public getConfig(): ExportItem[] {
    return [
      {
        id: 'viewer-engagement',
        label: this._translate.instant('app.entryEp.session.viewer'),
        reportType: reportTypeMap(KalturaReportType.epWebcastLiveUserEngagement),
        sections: [KalturaReportExportItemType.table],
        order: '-live_view_time',
      },
    ];
  }
}
