import { Injectable, KeyValueDiffer, KeyValueDiffers, OnDestroy } from '@angular/core';
import { ReportConfig, ReportService } from 'src/app/shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { BehaviorSubject } from 'rxjs';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { FilterBaseService } from "shared/components/filter/filter-base.service";

export interface BrowserFilterItem {
  value: { id: string, name: string };
  label: string;
}

@Injectable()
export class BrowserFilterService extends FilterBaseService implements OnDestroy {
  private _isBusy: boolean;
  private _browserOptions = new BehaviorSubject<BrowserFilterItem[]>([]);
  private _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _order = '-count_plays';

  private _reportConfig = {
    table: {
      fields: {
        'count_plays': { format: value => value },
        'browser_family': { format: value => value }
      }
    }
  };

  public readonly browserOptions = this._browserOptions.asObservable();

  constructor(protected _reportService: ReportService,
              protected _objectDiffers: KeyValueDiffers) {
    super(_reportService, _objectDiffers);
    this._reportType = reportTypeMap(KalturaReportType.browsersFamilies);
  }

  ngOnDestroy() {
    this._browserOptions.complete();
  }

  private _handleBrowsersTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._reportConfig.table);

    this._browserOptions.next(tableData.map((data, index) => ({
      value: { name: data.browser_family, id: index.toString() },
      label: data.browser_family,
    })));
  }

  private _loadBrowsersData(): void {
    this._isBusy = true;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager };
    this._reportService.getReport(reportConfig, this._reportConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.table && report.table.header && report.table.data) {
            this._handleBrowsersTable(report.table); // handle table
          }

          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
        });
  }


  public resetAll(): void {
    this._browserOptions.next([]);
  }


  public updateDateFilter(event: DateChangeEvent, callback: () => void): void {
    if (this._dateFilterDiffer.diff(event)) {
      this._filter.timeZoneOffset = event.timeZoneOffset;
      this._filter.fromDate = event.startDate;
      this._filter.toDate = event.endDate;
      this._filter.interval = event.timeUnits;
      this._pager.pageIndex = 1;

      this.resetAll();
      this._loadBrowsersData();

      if (typeof callback === 'function') {
        callback();
      }
    }
  }

  public isBusy(type: string): boolean {
    return this._isBusy;
  }
}
