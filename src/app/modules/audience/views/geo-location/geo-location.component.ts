import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService, ErrorDetails, AuthService, ReportService, Report, ReportConfig } from 'shared/services';
import { KalturaReportInputFilter, KalturaFilterPager, KalturaReportTable, KalturaReportTotal, KalturaReportGraph, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { analyticsConfig } from 'configuration/analytics-config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { GeoLocationDataConfig } from './geo-location-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { of as ObservableOf } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CompareService } from 'shared/services/compare.service';

@Component({
  selector: 'app-geo-location',
  templateUrl: './geo-location.component.html',
  styleUrls: ['./geo-location.component.scss'],
  providers: [GeoLocationDataConfig]
})
export class GeoLocationComponent implements OnInit {
  private _dataConfig: ReportDataConfig;

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _selectedMetrics: string;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;

  public _tableData: any[] = [];
  public _tabsData: Tab[] = [];
  public _showTable = true;

  public _isBusy: boolean;
  public _csvExportHeaders = '';
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _totalCount: number;

  public pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 10, pageIndex: 1});
  public reportType: KalturaReportType = KalturaReportType.mapOverlay;
  public compareFilter: KalturaReportInputFilter = null;
  public filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  private order = '-count_plays';

  public get isCompareMode(): boolean {
    return this.compareFilter !== null;
  }

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _authService: AuthService,
              private _dataConfigService: GeoLocationDataConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }

  ngOnInit() {
    this._isBusy = false;
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this.filter.timeZoneOffset = event.timeZoneOffset;
    this.filter.fromDay = event.startDay;
    this.filter.toDay = event.endDay;
    this.filter.interval = event.timeUnits;
    this._reportInterval = event.timeUnits;
    this.pager.pageIndex = 1;
    if (event.compare.active) {
      const compare = event.compare;
      this.compareFilter = new KalturaReportInputFilter(
        {
          searchInTags: true,
          searchInAdminTags: false,
          timeZoneOffset: event.timeZoneOffset,
          interval: event.timeUnits,
          fromDay: compare.startDay,
          toDay: compare.endDay,
        }
      );
    } else {
      this.compareFilter = null;
    }
    this.loadReport();
  }

  public _onTabChange(tab: Tab): void {
    this._selectedMetrics = tab.key;
  }

  public _onPaginationChanged(event): void {
    if (event.page !== (this.pager.pageIndex - 1)) {
      this.pager.pageIndex = event.page + 1;
      this.loadReport({table: null});
    }
  }

  public _onSortChanged(event) {
    if (event.data.length && event.field && event.order && !this.isCompareMode) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this.order) {
        this.order = order;
        this.loadReport({table: null});
      }
    }
  }

  public toggleTable(): void {
    this._showTable = !this._showTable;
    if ( analyticsConfig.callbacks && analyticsConfig.callbacks.updateLayout ) {
      analyticsConfig.callbacks.updateLayout();
    }
  }

  private loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._tableData = [];
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(switchMap(report => {
        if (!this.isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const compareReportConfig = { reportType: this.reportType, filter: this.compareFilter, pager: this.pager, order: this.order };
        return this._reportService.getReport(compareReportConfig, sections, false)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (compare) {
            this.handleCompare(report, compare);
          } else {
            if (report.table && report.table.header && report.table.data) {
              this.handleTable(report.table); // handle table
            }
            if (report.totals) {
              this.handleTotals(report.totals); // handle totals
            }
          }
          this.prepareCsvExportHeaders();
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          const err: ErrorDetails = this._errorsManager.getError(error);
          let buttons: AreaBlockerMessageButton[] = [];
          if ( err.forceLogout ) {
            buttons = [{
              label: this._translate.instant('app.common.ok'),
              action: () => {
                this._blockerMessage = null;
                this._authService.logout();
              }
            }];
          } else {
            buttons = [{
              label: this._translate.instant('app.common.close'),
              action: () => {
                this._blockerMessage = null;
              }
            },
              {
                label: this._translate.instant('app.common.retry'),
                action: () => {
                  this.loadReport();
                }
              }];
          }
          this._blockerMessage = new AreaBlockerMessage({
            title: err.title,
            message: err.message,
            buttons
          });
        });
  }

  private handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this.filter.fromDay, to: this.filter.toDay };
    const comparePeriod = { from: this.compareFilter.fromDay, to: this.filter.toDay };

    if (current.table && compare.table) {
      const { columns, tableData } = this._compareService.compareTableData(current.table, compare.table, this._dataConfig.table);
      this._totalCount = current.table.totalCount;
      this._columns = columns;
      this._tableData = tableData;
    }

    if (current.totals && compare.totals) {
      this._tabsData = this._compareService.compareTotalsData(current.totals, compare.totals, this._dataConfig.totals, this._selectedMetrics);
    }
  }

  private handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._columns[0] = this._columns.splice(1, 1, this._columns[0])[0]; // switch places between the first 2 columns
    this._columns.unshift('index'); // add line indexing column
    this._tableData = tableData;
  }

  private handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
  }

  private prepareCsvExportHeaders(): void {
    this._csvExportHeaders = this._dataConfigService.prepareCsvExportHeaders(this._tabsData, this._columns);
  }

}
