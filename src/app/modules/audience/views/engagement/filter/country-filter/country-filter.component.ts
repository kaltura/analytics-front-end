import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { KalturaFilterPager, KalturaReportInputFilter, KalturaReportTable, KalturaReportType, KalturaUser } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { ReportConfig, ReportService } from 'shared/services';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'app-country-filter',
  template: `
    <app-dropdown-filter [label]="'app.filters.country' | translate"
                         [options]="_options"
                         [isLoading]="_isBusy"
                         [defaultLabel]="'app.filters.countryPlaceholder' | translate"
                         [selectedFilters]="selectedFilters"
                         (itemSelected)="itemSelected.emit($event)"></app-dropdown-filter>
  `,
})
export class CountryFilterComponent implements OnDestroy {
  @Input() selectedFilters: KalturaUser[] = [];
  
  @Input() set dateFilter(event: DateChangeEvent) {
    this._filter.timeZoneOffset = event.timeZoneOffset;
    this._filter.fromDay = event.startDay;
    this._filter.toDay = event.endDay;
    this._filter.interval = event.timeUnits;
    this._pager.pageIndex = 1;
    this._loadCountryData();
  }
  
  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();
  
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
  
  public _isBusy: boolean;
  public _options = [];
  
  constructor(private _reportService: ReportService,
              private _translate: TranslateService) {
  }
  
  ngOnDestroy() {
  
  }
  
  private _loadCountryData(): void {
    this._isBusy = true;
    this._options = [];

    const reportConfig: ReportConfig = {
      reportType: KalturaReportType.mapOverlay,
      filter: this._filter,
      pager: this._pager,
      order: '+country'
    };
    this._reportService.getReport(reportConfig, this._reportConfig)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.table && report.table.header && report.table.data) {
            this.handleTable(report.table); // handle table
          }
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
        });
  }
  
  private handleTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._reportConfig.table);
    
    // set countries filter data
    this._options = tableData.map(data => ({ value: data.country.toLowerCase(), label: data.object_id }));
  }
}
