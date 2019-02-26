import { Component, OnInit } from '@angular/core';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import * as moment from 'moment';
import { AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { TopContributorsDataConfig } from './top-contributors-data.config';
import { analyticsConfig } from 'configuration/analytics-config';
import { TopContributorsBaseReportComponent } from '../top-contributors-base-report/top-contributors-base-report.component';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { TableRow } from 'shared/utils/table-local-sort-handler';

@Component({
  selector: 'app-contributors-top-contributors',
  templateUrl: './top-contributors.component.html',
  styleUrls: ['./top-contributors.component.scss'],
  providers: [
    KalturaLogger.createLogger('ContributorsTopContributorsComponent'),
    TopContributorsDataConfig,
    ReportService,
  ]
})
export class ContributorsTopContributorsComponent extends TopContributorsBaseReportComponent implements OnInit {
  private _order = '-added_entries';
  private _compareFilter: KalturaEndUserReportInputFilter = null;
  private _dataConfig: ReportDataConfig;
  private _reportInterval = KalturaReportInterval.months;
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  
  protected _componentId = 'top-contributors';
  
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy: boolean;
  public _tableData: TableRow<string>[] = [];
  public _compareTableData: TableRow<string>[] = [];
  public _isCompareMode: boolean;
  public _columns: string[] = [];
  public _pager = new KalturaFilterPager({ pageSize: 50, pageIndex: 1 });
  public _firstTimeLoading = true;
  public _compareFirstTimeLoading = true;
  public _currentDates: string;
  public _compareDates: string;
  public _reportType = KalturaReportType.topContentContributors;

  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: TopContributorsDataConfig,
              private _logger: KalturaLogger) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  
  ngOnInit() {
  }
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  protected _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: this._order };
        return this._reportService.getReport(compareReportConfig, this._dataConfig)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];
          this._compareTableData = [];
          
          if (report.table && report.table.header && report.table.data) {
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
    this._filter.entryCreatedAtGreaterThanOrEqual = DateFilterUtils.fromServerDate(this._dateFilter.startDate);
    this._filter.entryCreatedAtLessThanOrEqual = DateFilterUtils.fromServerDate(this._dateFilter.endDate);
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    this._isCompareMode = false;
    if (this._dateFilter.compare.active) {
      this._isCompareMode = true;
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
      this._compareFilter.entryCreatedAtGreaterThanOrEqual = DateFilterUtils.fromServerDate(compare.startDate);
      this._compareFilter.entryCreatedAtLessThanOrEqual = DateFilterUtils.fromServerDate(compare.endDate);
    } else {
      this._compareFilter = null;
      this._compareFirstTimeLoading = true;
    }
  }
  
  private _handleTable(table: KalturaReportTable, compare?: Report): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    const extendTableRow = (item, index) => {
      (<any>item)['index'] = index + 1;
      return item;
    };
    this._columns = columns;
    this._tableData = tableData.map(extendTableRow);
    this._currentDates = null;
    this._compareDates = null;
    
    if (compare && compare.table && compare.table.header && compare.table.data) {
      const { tableData: compareTableData } = this._reportService.parseTableData(compare.table, this._dataConfig.table);
      this._compareTableData = compareTableData.map(extendTableRow);
      this._compareFirstTimeLoading = false;
      this._columns = ['entry_name', 'count_plays'];
      this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.endDate).format('MMM D, YYYY');
      this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.compare.endDate).format('MMM D, YYYY');
    }
  }
  
  public _onSortChanged(field: string): void {
    const order = `-${field}`;
    if (order !== this._order) {
      this._logger.trace('Handle sort changed action by user', { order });
      this._order = order;
      this._loadReport();
    }
  }
}
