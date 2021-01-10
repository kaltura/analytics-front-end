import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { ViewConfig } from 'configuration/view-config';

@Injectable()
export class ManualExportConfig extends ExportConfigService {
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
      },
      {
        id: 'performance',
        label: this._translate.instant('app.playlist.exportLabels.videoPerformance'),
        reportType: reportTypeMap(KalturaReportType.userInteractiveVideo),
        sections: [KalturaReportExportItemType.graph],
        order: '-date_id',
      },
      {
        id: 'videos',
        label: this._translate.instant('app.playlist.exportLabels.videos'),
        reportType: reportTypeMap(KalturaReportType.interactiveVideoTopNodes),
        sections: [KalturaReportExportItemType.table],
        order: '-count_node_plays',
      }
    ];
    return viewConfig ? config.filter((item: ExportItem) => viewConfig[item.id]) : config;
  }

}
