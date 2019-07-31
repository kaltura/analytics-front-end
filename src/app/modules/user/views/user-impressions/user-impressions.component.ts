import { Component, Input, OnInit } from '@angular/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { SelectItem } from 'primeng/api';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { UserImpressionsDataConfig } from './user-impressions-data.config';
import { TranslateService } from '@ngx-translate/core';
import { EChartOption } from 'echarts';
import { getColorPercent } from 'shared/utils/colors';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { UserBase } from '../user-base/user-base';

export type funnelData = {
  impressions: number;
  plays: number;
  playThrough: {
    perc25: number;
    perc50: number;
    perc75: number;
    perc100: number;
  }
};

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
  
  private _echartsIntance: any;
  private _compareEchartsIntance: any;
  private _reportType = KalturaReportType.contentDropoff;
  private _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  private _order = 'count_plays';
  private _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _compareFilter: KalturaEndUserReportInputFilter = null;
  private _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  private _dataConfig: ReportDataConfig;
  private _compareFunnelData: funnelData;
  
  protected _componentId = 'impressions';
  
  public _dateFilter: DateChangeEvent;
  public _refineFilter: RefineFilter = [];
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _playthroughs: SelectItem[] = [{ label: '25%', value: 25 }, { label: '50%', value: 50 }, { label: '75%', value: 75 }, { label: '100%', value: 100 }];
  public _selectedPlaythrough = 50;
  public _chartData: EChartOption = {};
  public _compareChartData: EChartOption = {};
  public _chartLoaded = false;
  public _currentDates: string;
  public _compareDates: string;
  public _funnelData: funnelData;
  
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
    
    this._chartData = _dataConfigService.getChartConfig((params) => {
      return this._getChartTooltip(params);
    });
    
    this._compareChartData = _dataConfigService.getChartConfig((params) => {
      return this._getCompareChartTooltip(params);
    });
  }
  
  ngOnInit() {
    this._isBusy = false;
  }
  
  private _updateFunnel(): void {
    const plays = this._funnelData.impressions === 0 ? '0' : (this._funnelData.plays / this._funnelData.impressions * 100).toFixed(1);
    const playThrough = this._funnelData.impressions === 0 ? '0' : (this._funnelData.playThrough['perc' + this._selectedPlaythrough] / this._funnelData.impressions * 100).toFixed(1);
    this._echartsIntance.setOption({
      series: [{
        data: [
          {
            value: this._funnelData.impressions === 0 ? 0 : 100,
            name: this._translate.instant('app.engagement.playerImpressions')
          },
          {
            value: Math.round(parseFloat(plays)),
            name: this._translate.instant('app.engagement.plays')
          },
          {
            value: Math.round(parseFloat(playThrough)),
            name: this._translate.instant('app.engagement.perc' + this._selectedPlaythrough)
          }
        ]
      }]
    }, false);
    this._echartsIntance.setOption({ color: [getColorPercent(100), getColorPercent(parseFloat(plays)), getColorPercent(parseFloat(playThrough))] });
  }
  
  private _handleCompare(current: Report, compare: Report): void {
    this._handleTotals(current.totals); // set original funnel data
    // resize funnels to fit window
    this._echartsIntance.setOption({ series: [{ width: '100%' }] }, false);
    this._compareEchartsIntance.setOption({ series: [{ width: '100%' }] }, false);
    this._echartsIntance.setOption({ series: [{ left: '0%' }] }, false);
    this._compareEchartsIntance.setOption({ series: [{ left: '0%' }] }, false);
    
    const data = compare.totals.data.split(analyticsConfig.valueSeparator);
    this._compareFunnelData = {
      impressions: data[6].length ? parseInt(data[6]) : 0,
      plays: data[0].length ? parseInt(data[0]) : 0,
      playThrough: {
        perc25: data[1].length ? parseInt(data[1]) : 0,
        perc50: data[2].length ? parseInt(data[2]) : 0,
        perc75: data[3].length ? parseInt(data[3]) : 0,
        perc100: data[4].length ? parseInt(data[4]) : 0
      }
    };
    this._updateCompareFunnel();
  }
  
  private _updateCompareFunnel(): void {
    const plays = this._compareFunnelData.impressions === 0 ? '0' : (this._compareFunnelData.plays / this._compareFunnelData.impressions * 100).toFixed(1);
    const playThrough = this._compareFunnelData.impressions === 0 ? '0' : (this._compareFunnelData.playThrough['perc' + this._selectedPlaythrough] / this._compareFunnelData.impressions * 100).toFixed(2);
    this._compareEchartsIntance.setOption({
      series: [{
        data: [
          {
            value: this._compareFunnelData.impressions === 0 ? 0 : 100,
            name: this._translate.instant('app.engagement.playerImpressions')
          },
          {
            value: Math.round(parseFloat(plays)),
            name: this._translate.instant('app.engagement.plays')
          },
          {
            value: Math.round(parseFloat(playThrough)),
            name: this._translate.instant('app.engagement.perc' + this._selectedPlaythrough)
          }
        ]
      }]
    }, false);
    this._compareEchartsIntance.setOption({ color: [getColorPercent(100), getColorPercent(parseFloat(plays)), getColorPercent(parseFloat(playThrough))] });
  }
  
  private _handleTotals(totals: KalturaReportTotal): void {
    this._echartsIntance.setOption({ series: [{ width: '30%' }] }, false);
    this._echartsIntance.setOption({ series: [{ left: '65%' }] }, false);
    const data = totals.data.split(analyticsConfig.valueSeparator);
    this._funnelData = {
      impressions: data[6].length ? parseInt(data[6]) : 0,
      plays: data[0].length ? parseInt(data[0]) : 0,
      playThrough: {
        perc25: data[1].length ? parseInt(data[1]) : 0,
        perc50: data[2].length ? parseInt(data[2]) : 0,
        perc75: data[3].length ? parseInt(data[3]) : 0,
        perc100: data[4].length ? parseInt(data[4]) : 0
      }
    };
    this._updateFunnel();
  }
  
  private _getChartTooltip(params): string {
    if (this.isCompareMode) {
      let value = this._funnelData.impressions;
      if (params.dataIndex === 1) {
        value = this._funnelData.plays;
      } else if (params.dataIndex === 2) {
        value = this._funnelData.playThrough['perc' + this._selectedPlaythrough];
      }
      
      let compareValue = this._compareFunnelData.impressions;
      if (params.dataIndex === 1) {
        compareValue = this._compareFunnelData.plays;
      } else if (params.dataIndex === 2) {
        compareValue = this._compareFunnelData.playThrough['perc' + this._selectedPlaythrough];
      }
      // const trend = (compareValue / value * 100).toFixed(1) + '%'; // TODO - calc trend by formula, add arrow and colors
      return this._currentDates + `<span style="color: #333333"><br/><b>${params.data.name}: ${ReportHelper.numberWithCommas(value)} </b></span>`; // <span> ${trend}</span> // TODO add trend if needed
    } else {
      return this._currentDates + `<span style="color: #333333"><br/><b>${params.data.name}: ${params.data.value}%</b></span>`;
    }
  }
  
  private _getCompareChartTooltip(params): string {
    let value = this._compareFunnelData.impressions;
    if (params.dataIndex === 1) {
      value = this._compareFunnelData.plays;
    } else if (params.dataIndex === 2) {
      value = this._compareFunnelData.playThrough['perc' + this._selectedPlaythrough];
    }
    return this._compareDates + `<span style="color: #333333"><br/><b>${params.data.name}: ${ReportHelper.numberWithCommas(value)}</b></span>`;
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
    this._chartLoaded = false;
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
            this._chartLoaded = true;
          } else {
            if (report.totals) {
              this._handleTotals(report.totals); // handle totals
              this._chartLoaded = true;
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
  
  public _onChartInit(ec) {
    this._echartsIntance = ec;
  }
  
  public _onCompareChartInit(ec) {
    this._compareEchartsIntance = ec;
  }
  
  public _onPlaythroughChange(): void {
    this._updateFunnel();
    if (this.isCompareMode) {
      this._updateCompareFunnel();
    }
  }
}
