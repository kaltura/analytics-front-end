import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { AuthService, ErrorDetails, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { DomainsDataConfig } from './domains-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TrendService } from 'shared/services/trend.service';
import { SelectItem, SortEvent } from 'primeng/api';
import * as echarts from 'echarts';
import { EChartOption } from 'echarts';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { DateFilterUtils, DateRanges } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { significantDigits } from 'shared/utils/significant-digits';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { getCountryName } from 'shared/utils/get-country-name';
import { Table } from 'primeng/table';
import { canDrillDown } from 'shared/utils/can-drill-down-country';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { WebcastBaseReportComponent } from "../webcast-base-report/webcast-base-report.component";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: 'app-webcast-domains',
  templateUrl: './domains.component.html',
  styleUrls: ['./domains.component.scss'],
  providers: [
    DomainsDataConfig,
    KalturaLogger.createLogger('WebcastDomainsComponent')
  ]
})
export class WebcastDomainsComponent extends WebcastBaseReportComponent implements OnInit, OnDestroy {

  @Input() entryIdIn = '';
  protected _componentId = 'webcast-domains';
  private _dataConfig: ReportDataConfig;
  public _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 10, pageIndex: 1 });
  private _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _reportType: KalturaReportType = reportTypeMap(KalturaReportType.topDomainsWebcast);
  private order = '-count_plays';
  private _totalPlaysCount = 0;
  public _selectedMetrics: string;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.days;
  public _dateRange = DateRanges.Last30D;
  public _tableData: TableRow<any>[] = [];
  public _tabsData: Tab[] = [];
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _totalCount: number;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = [];
  public _exportConfig: ExportItem[] = [];
  public _distributionColorScheme = 'default';

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _dataConfigService: DomainsDataConfig,
              private _logger: KalturaLogger) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
  }

  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    refineFilterToServerValue(this._refineFilter, this._filter);
  }

  public _onPaginationChanged(event): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._logger.trace('Handle pagination changed action by user', { newPage: event.page + 1 });
      this._pager.pageIndex = event.page + 1;
      this._loadReport({ table: this._dataConfig.table });
    }
  }

  public _onSortChanged(event) {
    const field = event.field === 'plays_distribution' ? 'count_plays' : event.field;
    if (event.data.length && field && event.order) {
      const order = event.order === 1 ? '+' + field : '-' + field;
      if (order !== this.order) {
        this._logger.trace('Handle sort changed action by user, reset page index to 1', { order });
        this.order = order;
        this._pager.pageIndex = 1;
        this._loadReport({ table: this._dataConfig.table });
      }
    }
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._tableData = [];
    this._blockerMessage = null;
    this._filter.entryIdIn = this.entryIdIn;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this.order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.totals) {
            this._handleTotals(report.totals); // handle totals
          }
          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table); // handle table
          }
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadReport();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._insertColumnAfter('plays_distribution', 'count_plays', columns);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._columns.shift();
    this._tableData = tableData.map((row, index) => {
      let playsDistribution = 0;
      if (this._totalPlaysCount !== 0) {
        const countPlays = parseFloat(row['count_plays']) || 0;
        playsDistribution = (countPlays / this._totalPlaysCount) * 100;
      }
      playsDistribution = significantDigits(playsDistribution);
      row['index'] = String(1 + index + (this._pager.pageIndex - 1) * this._pager.pageSize);
      row['plays_distribution'] = ReportHelper.numberWithCommas(playsDistribution);

      return row;
    });
  }

  private _insertColumnAfter(column: string, after: string, columns: string[]): void {
    const countPlaysIndex = columns.indexOf(after);
    if (countPlaysIndex !== -1) {
      columns.splice(countPlaysIndex + 1, 0, column);
    }
  }

  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
    if (this._tabsData.length) {
      this._totalPlaysCount = Number(this._tabsData[0].rawValue);
    }
  }

}
