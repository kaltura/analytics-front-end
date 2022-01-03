import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AuthService, BrowserService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { SelectItem } from 'primeng/api';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { ImpressionsDataConfig } from './impressions-data.config';
import { TranslateService } from '@ngx-translate/core';
import { EChartOption } from 'echarts';
import * as moment from 'moment';
import { getColorPercent } from 'shared/utils/colors';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

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
  selector: 'app-impressions',
  templateUrl: './impressions.component.html',
  styleUrls: ['./impressions.component.scss'],
  providers: [
    KalturaLogger.createLogger('ImpressionsComponent'),
    ImpressionsDataConfig,
    ReportService,
  ],
})
export class ImpressionsComponent implements OnInit, OnDestroy {
  @Input() set dateFilter(value: DateChangeEvent) {
    if (value) {
      this._dateFilter = value;

      if (!this._dateFilter.applyIn || this._dateFilter.applyIn.indexOf(this._componentId) !== -1) {
        this._updateFilter();
        // load report in the next run cycle to be sure all properties are updated
        setTimeout(() => {
          this._loadReport();
        });
      }
    }
  }

  @Input() set refineFilter(value: RefineFilter) {
    if (value) {
      this._refineFilter = value;
      this._updateRefineFilter();
      // load report in the next run cycle to be sure all properties are updated
      setTimeout(() => {
        this._loadReport();
      });
    }
  }

  @Input() entryId: string;
  @Input() userId: string;
  @Input() title: string = null;

  private _dateFilter: DateChangeEvent;
  private _refineFilter: RefineFilter = [];

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _playthroughs: SelectItem[] = [{ label: '25%', value: 25 }, { label: '50%', value: 50 }, { label: '75%', value: 75 }, { label: '100%', value: 100 }];
  public _selectedPlaythrough = 50;
  public _chartData: EChartOption = {};
  public _compareChartData: EChartOption = {};
  public _chartLoaded = false;
  public _currentDates: string;
  public _compareDates: string;

  private _componentId = 'impressions';

  private echartsIntance: any;
  private compareEchartsIntance: any;
  private reportType: KalturaReportType = reportTypeMap(KalturaReportType.contentDropoff);
  private pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  private order = 'count_plays';
  private filter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  private compareFilter: KalturaEndUserReportInputFilter = null;
  private _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  private _dataConfig: ReportDataConfig;

  public get isCompareMode(): boolean {
    return this.compareFilter !== null;
  }

  public _funnelData: funnelData;
  private compareFunnelData: funnelData;

  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: ImpressionsDataConfig,
              private _browserService: BrowserService) {
    this._dataConfig = _dataConfigService.getConfig();

    this._chartData = _dataConfigService.getChartConfig((params) => {
      return this.getChartTooltip(params);
    });

    this._compareChartData = _dataConfigService.getChartConfig((params) => {
      return this.getCompareChartTooltip(params);
    });

    this._browserService.contrastThemeChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(isContrast => this._toggleChartTheme(isContrast));
  }

  ngOnInit() {
    this._isBusy = false;
  }

  ngOnDestroy(): void {

  }

  private _toggleChartTheme(isContrast: boolean): void {
    const toggle = (chart, color, background) => {
      const data = {
        tooltip: { textStyle: { color } },
        series: [{ label: background }],
      };
      chart.setOption(data, false);
    };
    const color = isContrast ? '#333333' : '#999999';
    const labelBackground = isContrast ? { backgroundColor: 'black', padding: 3 } : { backgroundColor: 'transparent', padding: 0 };
    if (this.echartsIntance) {
      toggle(this.echartsIntance, color, labelBackground);
    }
    if (this.compareEchartsIntance) {
      toggle(this.compareEchartsIntance, color, labelBackground);
    }
  }

  public onChartInit(ec) {
    this.echartsIntance = ec;
  }

  public onCompareChartInit(ec) {
    this.compareEchartsIntance = ec;
  }

  public updateFunnel(): void {
    const plays = this._funnelData.impressions === 0 ? '0' : (this._funnelData.plays / this._funnelData.impressions * 100).toFixed(1);
    const playThrough = this._funnelData.impressions === 0 ? '0' : (this._funnelData.playThrough['perc' + this._selectedPlaythrough] / this._funnelData.impressions * 100).toFixed(1);
    this._setEchartsOption({
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
    this._setEchartsOption({ color: [getColorPercent(100), getColorPercent(parseFloat(plays)), getColorPercent(parseFloat(playThrough))] });
  }

  public onPlaythroughChange(): void {
    this.updateFunnel();
    if (this.isCompareMode) {
      this.updateCompareFunnel();
    }
  }

  private _loadReport(): void {
    this._isBusy = true;
    this._chartLoaded = false;
    this._blockerMessage = null;
    this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.endDate).format('MMM D, YYYY');
    this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.compare.endDate).format('MMM D, YYYY');
    if (this.userId) {
      this.filter.userIds = this.userId;
    }
    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };

    if (this.entryId) {
      reportConfig.filter.entryIdIn = this.entryId;
    }
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(switchMap(report => {
        if (!this.isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        if (this.userId) {
          this.compareFilter.userIds = this.userId;
        }
        const compareReportConfig: ReportConfig = { reportType: this.reportType, filter: this.compareFilter, pager: this.pager, order: this.order };
        if (this.entryId) {
          compareReportConfig.filter.entryIdIn = this.entryId;
        }
        return this._reportService.getReport(compareReportConfig, this._dataConfig)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (compare) {
            this.handleCompare(report, compare);
            this._chartLoaded = true;
          } else {
            if (report.totals) {
              this.handleTotals(report.totals); // handle totals
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

  private handleCompare(current: Report, compare: Report): void {
    this.handleTotals(current.totals); // set original funnel data
    // resize funnels to fit window
    this._setEchartsOption({ series: [{ width: '100%' }] }, false);
    this.compareEchartsIntance.setOption({ series: [{ width: '100%' }] }, false);
    this._setEchartsOption({ series: [{ left: '0%' }] }, false);
    this.compareEchartsIntance.setOption({ series: [{ left: '0%' }] }, false);

    const data = compare.totals.data.split(analyticsConfig.valueSeparator);
    this.compareFunnelData = {
      impressions: data[6].length ? parseInt(data[6]) : 0,
      plays: data[0].length ? parseInt(data[0]) : 0,
      playThrough: {
        perc25: data[1].length ? parseInt(data[1]) : 0,
        perc50: data[2].length ? parseInt(data[2]) : 0,
        perc75: data[3].length ? parseInt(data[3]) : 0,
        perc100: data[4].length ? parseInt(data[4]) : 0
      }
    };
    this.updateCompareFunnel();
  }

  private updateCompareFunnel(): void {
    const plays = this.compareFunnelData.impressions === 0 ? '0' : (this.compareFunnelData.plays / this.compareFunnelData.impressions * 100).toFixed(1);
    const playThrough = this.compareFunnelData.impressions === 0 ? '0' : (this.compareFunnelData.playThrough['perc' + this._selectedPlaythrough] / this.compareFunnelData.impressions * 100).toFixed(2);
    this.compareEchartsIntance.setOption({
      series: [{
        data: [
          {
            value: this.compareFunnelData.impressions === 0 ? 0 : 100,
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
    this.compareEchartsIntance.setOption({ color: [getColorPercent(100), getColorPercent(parseFloat(plays)), getColorPercent(parseFloat(playThrough))] });
  }

  private handleTotals(totals: KalturaReportTotal): void {
    this._setEchartsOption({ series: [{ width: '30%' }] }, false);
    this._setEchartsOption({ series: [{ left: '65%' }] }, false);
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
    this.updateFunnel();
  }

  private _setEchartsOption(option: EChartOption, opts?: any): void {
    setTimeout(() => {
      if (this.echartsIntance) {
        this.echartsIntance.setOption(option, opts);
      }
    }, 200);
  }

  private getChartTooltip(params): string {
    if (this.isCompareMode) {
      let value = this._funnelData.impressions;
      if (params.dataIndex === 1) {
        value = this._funnelData.plays;
      } else if (params.dataIndex === 2) {
        value = this._funnelData.playThrough['perc' + this._selectedPlaythrough];
      }

      let compareValue = this.compareFunnelData.impressions;
      if (params.dataIndex === 1) {
        compareValue = this.compareFunnelData.plays;
      } else if (params.dataIndex === 2) {
        compareValue = this.compareFunnelData.playThrough['perc' + this._selectedPlaythrough];
      }
      // const trend = (compareValue / value * 100).toFixed(1) + '%'; // TODO - calc trend by formula, add arrow and colors
      return this._currentDates + `<span style="color: #333333"><br/><b>${params.data.name}: ${ReportHelper.numberWithCommas(value)} </b></span>`; // <span> ${trend}</span> // TODO add trend if needed
    } else {
      return this._currentDates + `<span style="color: #333333"><br/><b>${params.data.name}: ${params.data.value}%</b></span>`;
    }
  }

  private getCompareChartTooltip(params): string {
    let value = this.compareFunnelData.impressions;
    if (params.dataIndex === 1) {
      value = this.compareFunnelData.plays;
    } else if (params.dataIndex === 2) {
      value = this.compareFunnelData.playThrough['perc' + this._selectedPlaythrough];
    }
    return this._compareDates + `<span style="color: #333333"><br/><b>${params.data.name}: ${ReportHelper.numberWithCommas(value)}</b></span>`;
  }

  private _updateFilter(): void {
    this.filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this.filter.fromDate = this._dateFilter.startDate;
    this.filter.toDate = this._dateFilter.endDate;
    this.filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this.pager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this.compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this.filter), this.filter);
      this.compareFilter.fromDate = compare.startDate;
      this.compareFilter.toDate = compare.endDate;
    } else {
      this.compareFilter = null;
    }
  }

  private _updateRefineFilter(): void {
    this.pager.pageIndex = 1;
    refineFilterToServerValue(this._refineFilter, this.filter);
    if (this.compareFilter) {
      refineFilterToServerValue(this._refineFilter, this.compareFilter);
    }
  }
}
