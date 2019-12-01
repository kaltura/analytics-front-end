import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { ViewConfig } from 'configuration/view-config';

@Injectable()
export class PathExportConfig extends ExportConfigService {
  constructor(private _translate: TranslateService) {
    super();
  }
  
  public getConfig(viewConfig?: ViewConfig): ExportItem[] {
    const config: ExportItem[] = [
      {
        id: "totals",
        label: this._translate.instant('app.playlist.exportLabels.highlights'),
        reportType: reportTypeMap(KalturaReportType.userInteractiveVideo),
        sections: [KalturaReportExportItemType.total],
      }
    ];
    return viewConfig ? config.filter((item: ExportItem) => viewConfig[item.id]) : config;
  }

}
