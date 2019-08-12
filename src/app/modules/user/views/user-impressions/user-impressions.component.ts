import { Component, Input, OnInit } from '@angular/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { UserImpressionsDataConfig } from './user-impressions-data.config';
import { TranslateService } from '@ngx-translate/core';
import { EChartOption } from 'echarts';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { UserBase } from '../user-base/user-base';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-user-impressions',
  templateUrl: './user-impressions.component.html',
  styleUrls: ['./user-impressions.component.scss'],
  providers: [
    KalturaLogger.createLogger('UserImpressionsComponent'),
    UserImpressionsDataConfig,
    ReportService,
  ],
})
export class UserImpressionsComponent extends UserBase implements OnInit {
  @Input() userId: string;
  
  private _reportType = reportTypeMap(KalturaReportType.contentDropoff);
  private _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  private _order = 'count_plays';
  private _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _compareFilter: KalturaEndUserReportInputFilter = null;
  private _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  private _dataConfig: ReportDataConfig;
  
  protected _componentId = 'impressions';
  
  public _dateFilter: DateChangeEvent;
  public _refineFilter: RefineFilter = [];
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _chartData: EChartOption = null;
  public _currentDates: string;
  public _compareDates: string;
  
  public get isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: UserImpressionsDataConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  ngOnInit() {
    this._isBusy = false;
  }
  
  private _handleCompare(current: Report, compare: Report): void {
    // TODO
  }
  
  private _handleTotals(totals: KalturaReportTotal): void {
    const totalsData = this._reportService.parseTotals(totals, this._dataConfig[ReportDataSection.totals])
      .reduce((acc, val) => (acc[val.key] = parseInt(val.rawValue as string, 10), acc), {});
    this._chartData = this._dataConfigService.getChartConfig(totalsData);
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
  
  protected _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.endDate).format('MMM D, YYYY');
    this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.compare.endDate).format('MMM D, YYYY');
    this._filter.userIds = this.userId;
    
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(switchMap(report => {
        if (!this.isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        this._compareFilter.userIds = this.userId;
        
        const compareReportConfig: ReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: this._order };
        return this._reportService.getReport(compareReportConfig, this._dataConfig)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (compare) {
            this._handleCompare(report, compare);
          } else {
            if (report.totals) {
              this._handleTotals(report.totals); // handle totals
            }
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
}
