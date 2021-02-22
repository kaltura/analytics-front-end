import { Injectable, KeyValueDiffer, KeyValueDiffers, OnDestroy } from '@angular/core';
import { ReportConfig, ReportService } from 'src/app/shared/services';
import { KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInputFilter, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { BehaviorSubject } from 'rxjs';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { reportTypeMap } from 'shared/utils/report-type-map';

export interface DomainsFilterItem {
  value: { id: string, name: string };
  label: string;
}

@Injectable()
export class DomainsFilterService implements OnDestroy {
  private _isBusy: boolean;
  private _domainsOptions = new BehaviorSubject<DomainsFilterItem[]>([]);
  private _pagesOptions = new BehaviorSubject<DomainsFilterItem[]>([]);
  private _dateFilterDiffer: KeyValueDiffer<DateChangeEvent, any>;
  private _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _currentlyLoading: string[] = [];
  private _filter = new KalturaReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  private _reportConfig = {
    table: {
      fields: {
        'domain_name': { format: value => value },
        'object_id': { format: value => value },
        'referrer': { format: value => value }
      }
    }
  };

  public readonly domainsOptions = this._domainsOptions.asObservable();
  public readonly pagesOptions = this._pagesOptions.asObservable();

  constructor(private _reportService: ReportService,
              private _objectDiffers: KeyValueDiffers) {
    this._dateFilterDiffer = this._objectDiffers.find([]).create();
  }

  ngOnDestroy() {
    this._domainsOptions.complete();
    this._pagesOptions.complete();
  }

  private _handleDomainsTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._reportConfig.table);
    // server might return unknown countries with empty object_id. Filter them out before mapping data.
    this._domainsOptions.next(tableData.filter(data => data['object_id'] !== '').map(data => ({
      value: { name: data.domain_name, id: data.object_id.toLowerCase() },
      label: data.domain_name,
    })));
  }

  private _handlePagesTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._reportConfig.table);

    this._pagesOptions.next(tableData.map(data => ({
      value: { name: data.referrer, id: data.referrer },
      label: data.referrer,
    })));
  }

  private _loadDomainsData(): void {
    this._isBusy = true;
    this._currentlyLoading.push('domains');

    const reportConfig: ReportConfig = {
      reportType: reportTypeMap(KalturaReportType.topSyndication),
      filter: this._filter,
      pager: this._pager,
      order: '+domain_name',
    };
    // TODO delete new filter field if exists
    // if (reportConfig.filter.countryIn) {
    //   delete reportConfig.filter.countryIn;
    // }
    this._reportService.getReport(reportConfig, this._reportConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.table && report.table.header && report.table.data) {
            this._handleDomainsTable(report.table); // handle table
          }
          this._currentlyLoading.splice(this._currentlyLoading.indexOf('domains'), 1);

          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          this._currentlyLoading.splice(this._currentlyLoading.indexOf('domains'), 1);
        });
  }

  private _loadPagesData(domains: string): void {
    this._isBusy = true;
    this._currentlyLoading.push('pages');

    let reportConfig: ReportConfig = {
      reportType: reportTypeMap(KalturaReportType.topSyndication),
      filter: this._filter,
      pager: this._pager,
      order: '+referrer',
    };
    reportConfig.objectIds = domains;
    this._reportService.getReport(reportConfig, this._reportConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.table && report.table.header && report.table.data) {
            this._handlePagesTable(report.table); // handle table
          }
          this._currentlyLoading.splice(this._currentlyLoading.indexOf('pages'), 1);

          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          this._currentlyLoading.splice(this._currentlyLoading.indexOf('pages'), 1);
        });
  }

  public resetAll(): void {
    this._domainsOptions.next([]);
    this.resetPages();
  }

  public resetPages(domains?: string): void {
    this._pagesOptions.next([])

    if (domains) {
      this._loadPagesData(domains);
    }
  }

  public updateDateFilter(event: DateChangeEvent, callback: () => void): void {
    if (this._dateFilterDiffer.diff(event)) {
      this._filter.timeZoneOffset = event.timeZoneOffset;
      this._filter.fromDate = event.startDate;
      this._filter.toDate = event.endDate;
      this._filter.interval = event.timeUnits;
      this._pager.pageIndex = 1;

      this.resetAll();
      this._loadDomainsData();

      if (typeof callback === 'function') {
        callback();
      }
    }
  }

  public isBusy(type: string): boolean {
    return this._isBusy && this._currentlyLoading.indexOf(type) !== -1;
  }
}
