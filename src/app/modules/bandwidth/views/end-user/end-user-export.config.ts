import { Injectable } from '@angular/core';
import { ExportConfigService, ExportItem } from 'shared/components/export-csv/export-csv.component';
import { KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataSection } from 'shared/services/storage-data-base.config';

@Injectable()
export class EndUserExportConfig implements ExportConfigService {
  public getConfig(): ExportItem[] {
    return [
      {
        label: null,
        reportType: KalturaReportType.userUsage,
        sections: [ReportDataSection.totals, ReportDataSection.graph, ReportDataSection.table]
      },
    ];
  }
}
