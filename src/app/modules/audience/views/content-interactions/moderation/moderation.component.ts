import { Component } from '@angular/core';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { ModerationDataConfig } from './moderation-data.config';
import { TranslateService } from '@ngx-translate/core';
import { EChartOption } from 'echarts';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { InteractionsBaseReportComponent } from '../interactions-base-report/interactions-base-report.component';
import { BarChartRow } from 'shared/components/horizontal-bar-chart/horizontal-bar-chart.component';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { BarRowTooltip, BarRowValue } from 'shared/components/horizontal-bar-row/horizontal-bar-row.component';

@Component({
  selector: 'app-moderation-report',
  templateUrl: './moderation.component.html',
  styleUrls: ['./moderation.component.scss'],
  providers: [
    KalturaLogger.createLogger('ModerationComponent'),
    ModerationDataConfig,
    ReportService,
  ],
})
export class ModerationComponent extends InteractionsBaseReportComponent {
  private _reportType = KalturaReportType.contentReportReasons;
  private _filter = new KalturaReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _compareFilter: KalturaReportInputFilter = null;
  private _reportInterval = KalturaReportInterval.months;
  private _dataConfig: ReportDataConfig;
  private _totalReports: number = null;
  private _totalCompareReports: number = null;
  
  protected _dateFilter: DateChangeEvent;
  protected _refineFilter: RefineFilter = [];
  protected _componentId = 'abuse';
  
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tableData: BarChartRow[] = [];
  public _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 6, pageIndex: 1 });
  public _totalCount: number;
  public _currentPeriod: { from: number, to: number };
  public _comparePeriod: { from: number, to: number };
  public _firstTimeLoading = true;
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: ModerationDataConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    this._isBusy = true;
    this._blockerMessage = null;
    
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: null, pager: this._pager };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: null, pager: this._pager };
        
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];
          this._totalReports = 0;
          this._totalCompareReports = 0;
          
          if (compare) {
            this._comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };
          } else {
            this._comparePeriod = null;
          }
          
          if (report.totals) {
            this._handleTotals(report.totals, compare);
          }
          
          if (report.table && report.table.data && report.table.header) {
            this._handleTable(report.table, compare); // handle table
          }
          this._isBusy = false;
          this._firstTimeLoading = false;
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
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
    } else {
      this._compareFilter = null;
    }
  }
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    refineFilterToServerValue(this._refineFilter, this._filter);
    if (this._compareFilter) {
      refineFilterToServerValue(this._refineFilter, this._compareFilter);
    }
  }
  
  private _handleTotals(totals: KalturaReportTotal, compare?: Report): void {
    const tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
    if (tabsData.length) {
      this._totalReports = Number(tabsData[0]['rawValue']);
    }
    
    if (compare && compare.totals && compare.totals.data && compare.totals.header) {
      const compareTabsData = this._reportService.parseTotals(compare.totals, this._dataConfig.totals);
      if (compareTabsData.length) {
        this._totalCompareReports = Number(compareTabsData[0]['rawValue']);
      }
    }
  }
  
  private _handleTable(table: KalturaReportTable, compare?: Report): void {
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    
    if (compare && compare.table) {
      const { tableData: compareTableData } = compare.table.data && compare.table.header
        ? this._reportService.parseTableData(compare.table, this._dataConfig.table)
        : { tableData: [] };
      this._tableData = tableData.map((item, index) => {
        const relevantCompareItem = compareTableData.find(({ reason }) => reason === item.reason) || { 'reportsubmitted': '0' };
        return this._getBarChartRow(item, index, relevantCompareItem);
      });
    } else {
      this._tableData = tableData.map((item, index) => this._getBarChartRow(item, index));
    }
    
    this._totalCount = this._tableData.length;
  }
  
  private _getBarChartRow(item: TableRow<string>, index: number, compareItem?: TableRow<string>): BarChartRow {
    let value: BarRowValue | BarRowValue[] = this._totalReports ? ReportHelper.percents(Number(item['reportsubmitted']) / this._totalReports, true, true) : '0%';
    let tooltip: BarRowTooltip | BarRowTooltip[] = { value: item['reportsubmitted'], label: this._translate.instant('app.contentInteractions.reports') };
    
    if (compareItem) {
      const compareValue = this._totalCompareReports ? ReportHelper.percents(Number(compareItem['reportsubmitted']) / this._totalCompareReports, true, true) : '0%';
      const compareTooltip = { value: compareItem['reportsubmitted'], label: this._translate.instant('app.contentInteractions.reports') };
      
      value = [value, compareValue];
      tooltip = [tooltip, compareTooltip];
    }
    
    return {
      value,
      tooltip,
      index: index + 1,
      label: item['reason'],
    };
  }
}
