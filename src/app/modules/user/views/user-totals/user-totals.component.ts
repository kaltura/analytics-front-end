import { Component, Input } from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaClient, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaLikeFilter, KalturaMultiRequest, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTotal, KalturaReportType, LikeListAction } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { Observable, of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { UserTotalsConfig } from './user-totals.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { UserBase } from '../user-base/user-base';
import { map, switchMap } from 'rxjs/operators';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { TrendService } from 'shared/services/trend.service';
import { analyticsConfig } from 'configuration/analytics-config';

@Component({
  selector: 'app-user-totals',
  templateUrl: './user-totals.component.html',
  styleUrls: ['./user-totals.component.scss'],
  providers: [UserTotalsConfig, ReportService]
})
export class UserTotalsComponent extends UserBase {
  @Input() userId: string;
  
  private _dataConfig: ReportDataConfig;
  private _reportType = reportTypeMap(KalturaReportType.playerRelatedInteractions);
  
  public _dateFilter: DateChangeEvent;
  protected _componentId = 'totals';
  
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _socialHighlights = null;
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _kalturaClient: KalturaClient,
              private _trendService: TrendService,
              private _dataConfigService: UserTotalsConfig) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    this._filter.userIds = this.userId;
    
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: null };
    this._reportService.getReport(reportConfig, sections)
      .pipe(
        switchMap(report => {
          if (!this._isCompareMode) {
            return ObservableOf({ report, compare: null });
          }
          
          this._compareFilter.userIds = this.userId;
          const compareReportConfig: ReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: null };
          return this._reportService.getReport(compareReportConfig, sections)
            .pipe(map(compare => ({ report, compare })));
        }),
        switchMap(({ report, compare }) => this._getLikes().pipe(map(likes => ({ report, compare, likes })))),
      )
      .subscribe(({ report, compare, likes }) => {
          if (compare) {
            this._handleCompare(report, compare, likes);
          } else {
            if (report.totals) {
              this._handleTotals(report.totals, likes); // handle totals
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
  
  protected _updateRefineFilter(): void {
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
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
  
  private _handleCompare(current: Report, compare: Report, likes: number[]): void {
    const currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    const comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };
  
    if (likes !== null) {
      current.totals.data += `${analyticsConfig.valueSeparator}${likes[0]}`;
      current.totals.header += `${analyticsConfig.valueSeparator}votes`;
    
      compare.totals.data += `${analyticsConfig.valueSeparator}${likes[1]}`;
      compare.totals.header += `${analyticsConfig.valueSeparator}votes`;
    }
    
    if (current.totals && compare.totals && current.totals.data && compare.totals.data) {
      const tabsData = this._compareService.compareTotalsData(
        currentPeriod,
        comparePeriod,
        current.totals,
        compare.totals,
        this._dataConfig.totals
      );
  
      const shares = tabsData.find(({ key }) => key === 'count_viral');
      const like = tabsData.find(({ key }) => key === 'votes');
      
      this._socialHighlights = {
        likes: like,
        shares: shares,
      };
  
      this._tabsData = tabsData.filter(({ hidden }) => !hidden);
    }
  }
  
  private _handleTotals(totals: KalturaReportTotal, likes: number[]): void {
    const tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
  
    if (likes !== null) {
      totals.data += `${analyticsConfig.valueSeparator}${likes[0]}`;
      totals.header += `${analyticsConfig.valueSeparator}votes`;
    }

    const shares = tabsData.find(({ key }) => key === 'count_viral');
    const like = tabsData.find(({ key }) => key === 'votes');
    this._socialHighlights = {
      likes: { value: like ? like.value : 0 },
      shares: { value: shares ? shares.value : 0 },
    };
    this._tabsData = tabsData.filter(({ hidden }) => !hidden);
  }
  
  private _getLikes(): Observable<number[]> {
    const getAction = filter => new LikeListAction({
      filter: new KalturaLikeFilter({
        userIdEqual: this.userId,
        createdAtGreaterThanOrEqual: DateFilterUtils.getMomentDate(filter.fromDate).toDate(),
        createdAtLessThanOrEqual: DateFilterUtils.getMomentDate(filter.toDate).toDate(),
      }),
      pager: new KalturaFilterPager({ pageSize: 1 }),
    });
    
    const actions = [getAction(this._filter)];
    
    if (this._isCompareMode) {
      actions.push(getAction(this._compareFilter));
    }
    
    return this._kalturaClient.multiRequest(new KalturaMultiRequest(...actions))
      .pipe(map(responses => {
        if (responses.hasErrors()) {
          throw responses.getFirstError();
        }
        return responses.map(response => response.result.totalCount);
      }));
  }
  
}
