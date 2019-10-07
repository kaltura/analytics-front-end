import { Component, Input, OnDestroy } from '@angular/core';
import { of as ObservableOf } from 'rxjs';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { UserBase } from '../user-base/user-base';
import { UserInsightMinutesViewedConfig } from './user-insight-minutes-viewed.config';
import { map, switchMap } from 'rxjs/operators';
import { analyticsConfig } from 'configuration/analytics-config';
import { EChartOption } from 'echarts';
import * as moment from 'moment';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { groupBy } from 'shared/utils/group-by';
import { TrendService } from 'shared/services/trend.service';

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
  private _reportType = reportTypeMap(KalturaReportType.userEngagementTimeline);
  private _order = '+date_id';
  
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false, interval: KalturaReportInterval.days });
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _currentDates: string;
  public _compareDates: string;
  public _chartData: EChartOption;
  public _compareWeeklyMinutes: { trend: number; value: string; units: string; tooltip: string; } = null;
  public _weeklyMinutes: string;
  public _mostViewedDay: string;
  public _mostViewedDayFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'dddd MM/DD/YY' : 'dddd DD/MM/YYYY';
  public _colors = [getPrimaryColor('time'), getSecondaryColor('time')];
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _trendService: TrendService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: UserInsightMinutesViewedConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  ngOnDestroy(): void {
  }
  
  private _parseTableData(table: KalturaReportTable): { maxViewsRow: TableRow<any>, graphData: number[], weeklyAvg: number } {
    const avg = arr => arr.reduce((prev, curr) => prev + curr, 0) / arr.length;
    
    const tableData = this._reportService
      .parseTableData(table, this._dataConfig[ReportDataSection.table]).tableData
      .map((item: TableRow<any>) => {
        item['day'] = item['date_id'].get('day');
        item['week'] = item['date_id'].get('week');
        return item;
      });
    
    const maxViewsRow = tableData.reduce((prev, current) => (prev['sum_time_viewed'] > current['sum_time_viewed']) ? prev : current, {});
  
    const dataByDay = groupBy(tableData, 'day');
    const graphData = Object
      .keys(dataByDay)
      .map(key => parseFloat(ReportHelper.numberOrZero(dataByDay[key].reduce((acc, val) => acc + val['sum_time_viewed'], 0))));
  
    const dataByWeek = groupBy(tableData, 'week');
    const weeklyData = Object
      .keys(dataByWeek)
      .map(key => dataByWeek[key].reduce((acc, val) => acc + val['sum_time_viewed'], 0));
    
    const weeklyAvg = avg(weeklyData);
    
    return { maxViewsRow, graphData, weeklyAvg };
  }
  
  private _handleTable(table: KalturaReportTable): void {
    const { maxViewsRow, graphData, weeklyAvg } = this._parseTableData(table);
    this._chartData = this._dataConfigService.getGraphConfig(graphData);
    
    this._weeklyMinutes = ReportHelper.numberOrZero(weeklyAvg);
    this._mostViewedDay = maxViewsRow['date_id'].format(this._mostViewedDayFormat);
  }
  
  private _handleCompare(current: KalturaReportTable, compare: KalturaReportTable): void {
    const getTooltipRowString = (time, value) => `<div class="kTotalsCompareTooltip"><span class="kTimePeriod">${time}</span><span class="kTotalsCompareTooltipValue"><strong>${value}</strong>&nbsp;</span></div>`;
    const { graphData, weeklyAvg } = this._parseTableData(current);
    let compareGraphData = [];
    let compareWeeklyAvg = 0;
    
    if (compare.data) {
      const compareParsedData = this._parseTableData(compare);
      compareGraphData = compareParsedData.graphData;
      compareWeeklyAvg = compareParsedData.weeklyAvg;
    }
    
    this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM DD, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM DD, YYYY');
    this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM DD, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM DD, YYYY');
    
    this._chartData = this._dataConfigService.getGraphConfig(graphData, compareGraphData);
    const { value, direction } = this._trendService.calculateTrend(weeklyAvg, compareWeeklyAvg);
    this._compareWeeklyMinutes = {
      value: value,
      trend: direction,
      units: '%',
      tooltip: `${getTooltipRowString(this._currentDates, ReportHelper.numberOrZero(weeklyAvg))}${getTooltipRowString(this._compareDates, ReportHelper.numberOrZero(compareWeeklyAvg))}`,
    };
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
          if (compare) {
            this._handleCompare(report.table, compare.table);
          } else {
            if (report.table && report.table.data) {
              this._handleTable(report.table);
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
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
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
}
