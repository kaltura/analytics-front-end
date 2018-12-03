import { Injectable, KeyValueDiffer, KeyValueDiffers, OnDestroy } from '@angular/core';
import { ReportConfig, ReportService } from 'shared/services';
import { KalturaFilterPager, KalturaReportInputFilter, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { BehaviorSubject } from 'rxjs';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';

export interface LocationFilterItem {
  value: string;
  label: string;
}

@Injectable()
export class LocationsFilterService implements OnDestroy {
  private _isBusy: boolean;
  private _countriesOptions = new BehaviorSubject<LocationFilterItem[]>([]);
  private _regionsOptions = new BehaviorSubject<LocationFilterItem[]>([]);
  private _citiesOptions = new BehaviorSubject<LocationFilterItem[]>([]);
  private _dateFilterDiffer: KeyValueDiffer<DateChangeEvent, any>;
  private _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _filter = new KalturaReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  private _reportConfig = {
    table: {
      fields: {
        'country': { format: value => value },
        'object_id': { format: value => value },
      }
    }
  };
  
  public readonly countriesOptions = this._countriesOptions.asObservable();
  public readonly regionOptions = this._regionsOptions.asObservable();
  public readonly citiesOptions = this._citiesOptions.asObservable();
  
  constructor(private _reportService: ReportService,
              private _objectDiffers: KeyValueDiffers) {
    this._dateFilterDiffer = this._objectDiffers.find([]).create();
  }
  
  ngOnDestroy() {
    this._countriesOptions.complete();
    this._regionsOptions.complete();
    this._citiesOptions.complete();
  }
  
  
  private _loadCountryData(): void {
    this._isBusy = true;
    
    const reportConfig: ReportConfig = {
      reportType: KalturaReportType.mapOverlay,
      filter: this._filter,
      pager: this._pager,
      order: null,
    };
    this._reportService.getReport(reportConfig, this._reportConfig)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.table && report.table.header && report.table.data) {
            this.handleCountryTable(report.table); // handle table
          }
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
        });
  }
  
  private handleCountryTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._reportConfig.table);
    
    this._countriesOptions.next(tableData.map(data => ({ value: data.country.toLowerCase(), label: data.object_id })));
  }
  
  private _resetAll(): void {
    this._countriesOptions.next([]);
    this._regionsOptions.next([]);
    this._citiesOptions.next([]);
  }
  
  public updateDateFilter(event: DateChangeEvent): void {
    if (this._dateFilterDiffer.diff(event)) {
      this._filter.timeZoneOffset = event.timeZoneOffset;
      this._filter.fromDay = event.startDay;
      this._filter.toDay = event.endDay;
      this._filter.interval = event.timeUnits;
      this._pager.pageIndex = 1;
  
      this._resetAll();
      this._loadCountryData();
    }
  }
  
  public isBusy(type: string): boolean {
    return this._isBusy;
  }
}
