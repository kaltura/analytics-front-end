import { Injectable } from '@angular/core';
import { SharedReportBaseStore } from 'shared/services/shared-report-base-store';
import { ReportService } from 'shared/services';

@Injectable()
export class HighlightsSharedStoreService extends SharedReportBaseStore {
  constructor(protected _reportService: ReportService) {
    super(_reportService);
  }
}
