import { Injectable, KeyValueDiffer, KeyValueDiffers, OnDestroy } from '@angular/core';
import { ReportConfig, ReportService } from 'src/app/shared/services';
import { KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInputFilter, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { BehaviorSubject } from 'rxjs';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { reportTypeMap } from 'shared/utils/report-type-map';

export interface DomainFilterItem {
  value: { id: string, name: string };
  label: string;
}

@Injectable()
export class DomainsFilterService implements OnDestroy {
  private _isBusy: boolean;
  private _domainsOptions = new BehaviorSubject<DomainFilterItem[]>([]);
  private _dateFilterDiffer: KeyValueDiffer<DateChangeEvent, any>;
  private _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _filter = new KalturaReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  private _reportConfig = {
    table: {
      fields: {
        'domain_name': { format: value => value },
        'object_id': { format: value => value }
      }
    }
  };
  
  public readonly domainsOptions = this._domainsOptions.asObservable();
  
  constructor(private _reportService: ReportService,
              private _objectDiffers: KeyValueDiffers) {
    this._dateFilterDiffer = this._objectDiffers.find([]).create();
  }
  
  ngOnDestroy() {
    this._domainsOptions.complete();
  }
  
  private _handleDomainsTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._reportConfig.table);
  
    this._domainsOptions.next(tableData.map(data => ({
      value: { name: data.domain_name, id: data.object_id.toLowerCase() },
      label: data.domain_name,
    })));
  }

  
  private _loadDomainsData(): void {
    this._isBusy = true;
    
    const reportConfig: ReportConfig = {
      reportType: reportTypeMap(KalturaReportType.topSyndication),
      filter: this._filter,
      pager: this._pager,
      order: null,
    };
    this._reportService.getReport(reportConfig, this._reportConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.table && report.table.header && report.table.data) {
            this._handleDomainsTable(report.table); // handle table
          }
          
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
        });
  }

  
  public resetAll(): void {
    this._domainsOptions.next([]);
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
    return this._isBusy;
  }
}
