import {Component, Input, Output, OnDestroy, OnInit, EventEmitter} from '@angular/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { BrowserService, ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { RegistrationFunnelDataConfig } from './registration-funnel-data.config';
import { TranslateService } from '@ngx-translate/core';
import { EChartOption } from 'echarts';
import { getColorPalette } from 'shared/utils/colors';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

export type funnelData = {
  registered: number;
  confirmed: number;
  participated: number;
};

@Component({
  selector: 'app-registration-funnel',
  templateUrl: './registration-funnel.component.html',
  styleUrls: ['./registration-funnel.component.scss'],
  providers: [
    KalturaLogger.createLogger('RegistrationFunnelComponent'),
    RegistrationFunnelDataConfig,
    ReportService,
  ],
})
export class RegistrationFunnelComponent implements OnInit, OnDestroy {
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

  @Input() virtualEventId: string;

  @Output() registrationDataLoaded = new EventEmitter<{ unregistered: number, participated: number }>();

  private _dateFilter: DateChangeEvent;
  private _refineFilter: RefineFilter = [];

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _chartData: EChartOption = {};
  public _chartLoaded = false;
  public _currentDates: string;
  public _funnelData: funnelData;

  private _componentId = 'registration-funnel';

  private echartsIntance: any;
  private reportType: KalturaReportType = reportTypeMap(KalturaReportType.veHighlights);
  private pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private order = 'registered';
  private filter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  private _reportInterval: KalturaReportInterval = KalturaReportInterval.days;
  private _dataConfig: ReportDataConfig;

  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _dataConfigService: RegistrationFunnelDataConfig,
              private _browserService: BrowserService) {
    this._dataConfig = _dataConfigService.getConfig();

    this._chartData = _dataConfigService.getChartConfig((params) => {
      return this.getChartTooltip(params);
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
  }

  public onChartInit(ec) {
    this.echartsIntance = ec;
  }

  public updateFunnel(): void {
    const confirmed = this._funnelData.registered === 0 ? '0' : (this._funnelData.confirmed / this._funnelData.registered * 100).toFixed(1);
    const participated = this._funnelData.registered === 0 ? '0' : (this._funnelData.participated / this._funnelData.registered * 100).toFixed(1);

    this._setEchartsOption({
      series: [{
        data: [
          {
            value: this._funnelData.registered === 0 ? 0 : 100,
            name: this._translate.instant('app.ve.registered')
          },
          {
            value: Math.round(parseFloat(confirmed)),
            name: this._translate.instant('app.ve.confirmed')
          },
          {
            value: Math.round(parseFloat(participated)),
            name: this._translate.instant('app.ve.participated')
          }
        ]
      }]
    }, false);
    this._setEchartsOption({ color: [getColorPalette()[2], getColorPalette()[4], getColorPalette()[7]] });
  }

  private _loadReport(): void {
    this._isBusy = true;
    this._chartLoaded = false;
    this._blockerMessage = null;
    this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.endDate).format('MMM D, YYYY');

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };

    if (this.virtualEventId) {
      reportConfig.filter.virtualEventIdIn = this.virtualEventId;
    }
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(switchMap(report => {
          return ObservableOf({ report, compare: null });
      }))
      .subscribe(({ report, compare }) => {
          if (report.totals) {
            this.handleTotals(report.totals); // handle totals
            this._chartLoaded = true;
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

  private handleTotals(totals: KalturaReportTotal): void {
    this._setEchartsOption({ series: [{ width: '50%' }] }, false);
    this._setEchartsOption({ series: [{ left: '50%' }] }, false);
    const data =  totals.data.split(analyticsConfig.valueSeparator); // ["1000","700","380","220","0","13"];
    this._funnelData = {
      registered: data[0].length ? parseInt(data[0]) : 0,
      confirmed: data[1].length ? parseInt(data[1]) : 0,
      participated: data[3].length ? parseInt(data[3]) : 0
    };
    // dispatch event for other widgets
    const unregistered = data[5].length ? parseInt(data[5]) : 0;
    const participated = this._funnelData.registered === 0 ? 0 : this._funnelData.participated / this._funnelData.registered * 100;
    this.registrationDataLoaded.emit({unregistered, participated});
    // update funnel graph
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
    return this._currentDates + `<span style="color: #333333"><br/><b>${params.data.name}: ${params.data.value}%</b></span>`;
  }

  private _updateFilter(): void {
    this.filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this.filter.fromDate = this._dateFilter.startDate;
    this.filter.toDate = this._dateFilter.endDate;
    this.filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this.pager.pageIndex = 1;
  }

  private _updateRefineFilter(): void {
    this.pager.pageIndex = 1;
    refineFilterToServerValue(this._refineFilter, this.filter);
  }
}
