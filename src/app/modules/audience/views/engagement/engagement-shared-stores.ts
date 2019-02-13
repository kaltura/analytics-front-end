import { FactoryProvider, InjectionToken } from '@angular/core';
import { SharedReportBaseStore } from 'shared/services/shared-report-base-store';
import { ReportService } from 'shared/services';

export const HighlightsSharedStore = new InjectionToken('HighlightsSharedStore');

export const TopVideosSharedStore = new InjectionToken('TopVideosSharedStore');

export function provideSharedStore(token: InjectionToken<string>): FactoryProvider {
  return {
    provide: token,
    useFactory: (reportService: ReportService) => new SharedReportBaseStore(reportService),
    deps: [ReportService],
  };
}
