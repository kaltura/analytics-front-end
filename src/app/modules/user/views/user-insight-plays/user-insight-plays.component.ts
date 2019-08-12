import { Component, Input, OnDestroy } from '@angular/core';
import { of as ObservableOf } from 'rxjs';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { UserBase } from '../user-base/user-base';
import { UserInsightPlaysConfig } from './user-insight-plays.config';
import { map, switchMap } from 'rxjs/operators';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-user-insight-plays',
  templateUrl: './user-insight-plays.component.html',
  styleUrls: ['./user-insight-plays.component.scss'],
  providers: [
    ReportService,
    UserInsightPlaysConfig
  ],
})
export class UserInsightPlaysComponent extends UserBase implements OnDestroy {
  @Input() userId: string;
  
  protected _componentId = 'insight-plays';
  private _dataConfig: ReportDataConfig;
  private _reportType = reportTypeMap(KalturaReportType.topSyndication);
  private _order = '-avg_time_viewed';
  
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: analyticsConfig.defaultPageSize, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _currentDates: string;
  public _compareDates: string;
  public _tableData: TableRow[] = [];
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: UserInsightPlaysConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  ngOnDestroy(): void {
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    this._filter.userIds = this.userId;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        this._compareFilter.userIds = this.userId;
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order, pager: this._pager };
        
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (this._isCompareMode) {
            this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM DD, YYYY');
            this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM DD, YYYY');
          } else {
            this._currentDates = DateFilterUtils.getMomentDate(new Date()).format('MMM DD, YYYY');
            this._compareDates = DateFilterUtils.getMomentDate(new Date(2019, 3, 28)).format('MMM DD, YYYY');
          }
    
          this._tableData = [
            { 'count_plays': 10, 'sum_time_viewed': 40, 'votes': 1, 'added_entries': 3 },
            { 'count_plays': 1, 'sum_time_viewed': 2, 'votes': 3, 'added_entries': 0 },
          ];
          
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
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
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
    
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  private _handleTable(table: KalturaReportTable): void {
  
  }
}
