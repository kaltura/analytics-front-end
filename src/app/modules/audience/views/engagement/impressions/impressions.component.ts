import { Component, OnInit } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { KalturaFilterPager, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { SelectItem } from 'primeng/api';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { ImpressionsDataConfig } from './impressions-data.config';
import { TranslateService } from '@ngx-translate/core';
import { EChartOption } from 'echarts';
import * as moment from 'moment';
import { getColorPercent } from 'shared/utils/colors';

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
  selector: 'app-engagement-impressions',
  templateUrl: './impressions.component.html',
  styleUrls: ['./impressions.component.scss'],
  providers: [ImpressionsDataConfig, ReportService]
})
export class EngagementImpressionsComponent extends EngagementBaseReportComponent implements OnInit {

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _playthroughs: SelectItem[] = [{label: '25%', value: 25}, {label: '50%', value: 50}, {label: '75%', value: 75}, {label: '100%', value: 100}];
  public _selectedPlaythrough = 25;
  public _chartData: EChartOption = {};
  public _compareChartData: EChartOption = {};
  public _chartLoaded = false;
  public _currentDates: string;
  public _compareDates: string;

  private echartsIntance: any;
  private compareEchartsIntance: any;
  private reportType: KalturaReportType = KalturaReportType.contentDropoff;
  private pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 25, pageIndex: 1});
  private order = 'count_plays';
  private filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  private compareFilter: KalturaReportInputFilter = null;
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
              private _dataConfigService: ImpressionsDataConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();

    this._chartData = _dataConfigService.getChartConfig((params) => {
      return this.getChartTooltip(params);
    });

    this._compareChartData = _dataConfigService.getChartConfig((params) => {
      return this.getCompareChartTooltip(params);
    });
  }

  ngOnInit() {
    this._isBusy = false;
  }

  public onChartInit(ec) {
    this.echartsIntance = ec;
  }

  public onCompareChartInit(ec) {
    this.compareEchartsIntance = ec;
  }

  public updateFunnel(): void {
    const plays = (this._funnelData.plays / this._funnelData.impressions * 100).toPrecision(3);
    const playThrough = (this._funnelData.playThrough['perc' + this._selectedPlaythrough] / this._funnelData.impressions * 100).toPrecision(3);
    this.echartsIntance.setOption({
      series: [{
        data: [
          {
            value: 100,
            name: this._translate.instant('app.engagement.playerImpressions')},
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
    this.echartsIntance.setOption({color: [getColorPercent(100), getColorPercent(parseFloat(plays)), getColorPercent(parseFloat(playThrough))]});
  }

  public onPlaythroughChange(): void {
    this.updateFunnel();
    if (this.isCompareMode) {
      this.updateCompareFunnel();
    }
  }
  
  protected _loadReport(): void {
    this._isBusy = true;
    this._chartLoaded = false;
    this._blockerMessage = null;
    this._currentDates = moment(DateFilterUtils.fromServerDate(this._dateFilter.startDate)).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM D, YYYY');
    this._compareDates = moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.startDate)).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM D, YYYY');
    if (this._dateFilter.compare.active){

    }
    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(switchMap(report => {
        if (!this.isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const compareReportConfig = { reportType: this.reportType, filter: this.compareFilter, pager: this.pager, order: this.order };
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
          this.prepareCsvExportHeaders();
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          const err: ErrorDetails = this._errorsManager.getError(error);
          let buttons: AreaBlockerMessageButton[] = [];
          if ( err.forceLogout ) {
            buttons = [{
              label: this._translate.instant('app.common.ok'),
              action: () => {
                this._blockerMessage = null;
                this._authService.logout();
              }
            }];
          } else {
            buttons = [{
              label: this._translate.instant('app.common.close'),
              action: () => {
                this._blockerMessage = null;
              }
            },
              {
                label: this._translate.instant('app.common.retry'),
                action: () => {
                  this._loadReport();
                }
              }];
          }
          this._blockerMessage = new AreaBlockerMessage({
            title: err.title,
            message: err.message,
            buttons
          });
        });
  }

  private handleCompare(current: Report, compare: Report): void {
    this.handleTotals(current.totals); // set original funnel data
    // resize funnels to fit window
    this.echartsIntance.setOption({series: [{width: '100%'}]}, false);
    this.compareEchartsIntance.setOption({series: [{width: '100%'}]}, false);
    this.echartsIntance.setOption({series: [{left: '0%'}]}, false);
    this.compareEchartsIntance.setOption({series: [{left: '0%'}]}, false);

    const data = compare.totals.data.split(',');
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
    const plays = (this.compareFunnelData.plays / this.compareFunnelData.impressions * 100).toPrecision(3);
    const playThrough = (this.compareFunnelData.playThrough['perc' + this._selectedPlaythrough] / this.compareFunnelData.impressions * 100).toPrecision(3);
    this.compareEchartsIntance.setOption({series: [{data: [
          {
            value: 100,
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
        ]}]}, false);
    this.compareEchartsIntance.setOption({color: [getColorPercent(100), getColorPercent(parseFloat(plays)), getColorPercent(parseFloat(playThrough))]});
  }

  private handleTotals(totals: KalturaReportTotal): void {
    this.echartsIntance.setOption({series: [{width: '60%'}]}, false);
    this.echartsIntance.setOption({series: [{left: '35%'}]}, false);
    const data = totals.data.split(',');
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

  private prepareCsvExportHeaders(): void {
    // TODO: TBD according to export refactor
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
      // const trend = (compareValue / value * 100).toFixed(2) + '%'; // TODO - calc trend by formula, add arrow and colors
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

  protected _updateFilter(): void {
    this.filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this.filter.fromDay = this._dateFilter.startDay;
    this.filter.toDay = this._dateFilter.endDay;
    this.filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this.pager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this.compareFilter = new KalturaReportInputFilter(
        {
          searchInTags: true,
          searchInAdminTags: false,
          timeZoneOffset: this._dateFilter.timeZoneOffset,
          interval: this._dateFilter.timeUnits,
          fromDay: compare.startDay,
          toDay: compare.endDay,
        }
      );
    } else {
      this.compareFilter = null;
    }
  }
}
