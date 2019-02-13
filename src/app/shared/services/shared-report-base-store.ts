import { OnDestroy } from '@angular/core';
import { Report, ReportConfig, ReportService } from 'src/app/shared/services';
import { BehaviorSubject, of as ObservableOf } from 'rxjs';
import { KalturaAPIException } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { map, switchMap } from 'rxjs/operators';

export class SharedReportBaseStore implements OnDestroy {
  protected _report = new BehaviorSubject<{ current: Report, compare?: Report }>(null);
  protected _status = new BehaviorSubject<{ loading: boolean, error?: KalturaAPIException }>({ loading: false });
  
  public readonly data$ = {
    report: this._report.asObservable(),
    status: this._status.asObservable(),
    
  };
  
  constructor(protected _reportService: ReportService) {
  
  }
  
  ngOnDestroy() {
    this._report.complete();
    this._status.complete();
  }
  
  public loadData(sections: ReportDataConfig, reportConfig: ReportConfig, compareReportConfig: ReportConfig): void {
    this._status.next({ loading: true });
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(current => {
        if (!compareReportConfig) {
          return ObservableOf({ current, compare: null });
        }
        
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ current, compare })));
      }))
      .subscribe(
        response => {
          this._status.next({ loading: false });
          this._report.next(response);
        },
        error => {
          this._status.next({ loading: false, error });
        });
  }
}
