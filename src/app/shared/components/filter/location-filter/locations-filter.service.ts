import { Injectable, KeyValueDiffer, KeyValueDiffers, OnDestroy } from '@angular/core';
import { ReportConfig, ReportService } from 'src/app/shared/services';
import { KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInputFilter, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { BehaviorSubject } from 'rxjs';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';

export interface LocationFilterItem {
  value: { id: string, name: string };
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
  private _currentlyLoading: string[] = [];
  private _filter = new KalturaReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  private _reportConfig = {
    table: {
      fields: {
        'country': { format: value => value },
        'object_id': { format: value => value },
        'region': { format: value => value },
        'city': { format: value => value },
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
  
  private _handleCountryTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._reportConfig.table);
  
    this._countriesOptions.next(tableData.map(data => ({
      value: { name: data.country, id: data.object_id.toLowerCase() },
      label: data.country,
    })));
  }
  
  private _handleRegionTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._reportConfig.table);
  
    this._regionsOptions.next(tableData.map(data => ({
      value: { name: data.region, id: data.region },
      label: data.region,
    })));
  }
  
  private _handleCityTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._reportConfig.table);
    
    this._citiesOptions.next(tableData.map(data => ({
      value: { name: data.city, id: data.city },
      label: data.city,
    })));
  }
  
  private _loadCountryData(): void {
    this._isBusy = true;
    this._currentlyLoading.push('country');
    
    const reportConfig: ReportConfig = {
      reportType: KalturaReportType.mapOverlayCountry,
      filter: this._filter,
      pager: this._pager,
      order: null,
    };
    this._reportService.getReport(reportConfig, this._reportConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.table && report.table.header && report.table.data) {
            this._handleCountryTable(report.table); // handle table
          }
          this._currentlyLoading.splice(this._currentlyLoading.indexOf('country'), 1);
          
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          this._currentlyLoading.splice(this._currentlyLoading.indexOf('country'), 1);
        });
  }
  
  private _loadRegionData(country: string): void {
    this._isBusy = true;
    this._currentlyLoading.push('region');
    
    let reportConfig: ReportConfig = {
      reportType: KalturaReportType.mapOverlayRegion,
      filter: this._filter,
      pager: this._pager,
      order: null
    };
    reportConfig.filter.countryIn = country;
    this._reportService.getReport(reportConfig, this._reportConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.table && report.table.header && report.table.data) {
            this._handleRegionTable(report.table); // handle table
          }
          this._currentlyLoading.splice(this._currentlyLoading.indexOf('region'), 1);
          
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          this._currentlyLoading.splice(this._currentlyLoading.indexOf('region'), 1);
        });
  }
  
  private _loadCityData(country: string, region: string): void {
    this._isBusy = true;
    this._currentlyLoading.push('city');
  
    const filter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
    filter.countryIn = country;
    filter.regionIn = region;
    
    const reportConfig: ReportConfig = {
      reportType: KalturaReportType.mapOverlayCity,
      filter: filter,
      pager: this._pager,
      order: null,
    };
    this._reportService.getReport(reportConfig, this._reportConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.table && report.table.header && report.table.data) {
            this._handleCityTable(report.table); // handle table
          }
          this._currentlyLoading.splice(this._currentlyLoading.indexOf('city'), 1);
          
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          this._currentlyLoading.splice(this._currentlyLoading.indexOf('city'), 1);
        });
  }
  
  public resetAll(): void {
    this._countriesOptions.next([]);
    this.resetRegion();
  }
  
  public resetRegion(countries?: string): void {
    this._regionsOptions.next([]);
    this.resetCity();
    
    if (countries) {
      this._loadRegionData(countries);
    }
  }
  
  public resetCity(country?: string, region?: string): void {
    this._citiesOptions.next([]);
    
    if (country && region) {
      this._loadCityData(country, region);
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
      this._loadCountryData();
      
      if (typeof callback === 'function') {
        callback();
      }
    }
  }
  
  public isBusy(type: string): boolean {
    return this._isBusy && this._currentlyLoading.indexOf(type) !== -1;
  }
}
