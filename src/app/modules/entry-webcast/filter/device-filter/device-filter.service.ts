import { Injectable, KeyValueDiffer, KeyValueDiffers, OnDestroy } from '@angular/core';
import { ReportConfig, ReportService } from 'src/app/shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { BehaviorSubject } from 'rxjs';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { FilterBaseService } from "shared/components/filter/filter-base.service";

export interface DeviceFilterItem {
  value: { id: string, name: string };
  label: string;
}

@Injectable()
export class DeviceFilterService extends FilterBaseService implements OnDestroy {
  private _isBusy: boolean;
  private _deviceOptions = new BehaviorSubject<DeviceFilterItem[]>([]);
  private _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _order = '-count_plays';

  private _reportConfig = {
    table: {
      fields: {
        'device': { format: value => value },
        'count_plays': { format: value => value }
      }
    }
  };

  public readonly deviceOptions = this._deviceOptions.asObservable();

  constructor(protected _reportService: ReportService,
              protected _objectDiffers: KeyValueDiffers) {
    super(_reportService, _objectDiffers);
    this._reportType = reportTypeMap(KalturaReportType.platforms);
  }

  ngOnDestroy() {
    this._deviceOptions.complete();
  }

  private _handleDevicesTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._reportConfig.table);

    this._deviceOptions.next(tableData.map((data, index) => ({
      value: { name: data.device, id: index.toString() },
      label: data.device,
    })));
  }

  private _loadDevicesData(): void {
    this._isBusy = true;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager };
    this._reportService.getReport(reportConfig, this._reportConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.table && report.table.header && report.table.data) {
            this._handleDevicesTable(report.table); // handle table
          }

          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
        });
  }


  public resetAll(): void {
    this._deviceOptions.next([]);
  }


  public updateDateFilter(event: DateChangeEvent, callback: () => void): void {
    if (this._dateFilterDiffer.diff(event)) {
      this._filter.timeZoneOffset = event.timeZoneOffset;
      this._filter.fromDate = event.startDate;
      this._filter.toDate = event.endDate;
      this._filter.interval = event.timeUnits;
      this._pager.pageIndex = 1;

      this.resetAll();
      this._loadDevicesData();

      if (typeof callback === 'function') {
        callback();
      }
    }
  }

  public isBusy(type: string): boolean {
    return this._isBusy;
  }
}
