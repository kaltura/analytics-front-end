import { Component, Input, OnDestroy } from '@angular/core';
import { of as ObservableOf } from 'rxjs';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { UserBase } from '../user-base/user-base';
import { UserInsightMinutesViewedConfig } from './user-insight-minutes-viewed.config';
import { map, switchMap } from 'rxjs/operators';
import { analyticsConfig } from 'configuration/analytics-config';
import { EChartOption } from 'echarts';
import * as moment from 'moment';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-user-insight-minutes-viewed',
  templateUrl: './user-insight-minutes-viewed.component.html',
  styleUrls: ['./user-insight-minutes-viewed.component.scss'],
  providers: [
    ReportService,
    UserInsightMinutesViewedConfig
  ],
})
export class UserInsightMinutesViewedComponent extends UserBase implements OnDestroy {
  @Input() userId: string;
  
  protected _componentId = 'insight-minutes-viewed';
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
  public _chartData: EChartOption;
  public _compareWeeklyMinutes: { trend: number; value: string; units: string; tooltip: string; } = null;
  public _weeklyMinutes: number;
  public _mostViewedDay: string;
  public _mostViewedDayFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'dddd MM/DD/YY' : 'dddd DD/MM/YYYY';
  public _colors = [getPrimaryColor('time'), getSecondaryColor('time')];
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: UserInsightMinutesViewedConfig) {
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
          // MOCKED DATA
          this._chartData = this._dataConfigService.getGraphConfig(this._isCompareMode);
          this._weeklyMinutes = 230;
          this._mostViewedDay = moment().format(this._mostViewedDayFormat);
          
          if (this._isCompareMode) {
            this._compareWeeklyMinutes = {
              value: '21',
              trend: 1,
              units: '%',
              tooltip: null,
            };
            
            this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM DD, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM DD, YYYY');
            this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM DD, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM DD, YYYY');
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
