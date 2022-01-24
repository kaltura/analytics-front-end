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

  @Output() registrationDataLoaded = new EventEmitter<{ unregistered: number }>();

  private _dateFilter: DateChangeEvent;
  private _refineFilter: RefineFilter = [];

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _chartData: EChartOption = {};
  public _chartLoaded = false;
  public _funnelData: funnelData;
  public turnout = '0';

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
    const participated = this._funnelData.registered === 0 ? '0' : Math.round(this._funnelData.participated / this._funnelData.registered * 100).toFixed(0);

    this._setEchartsOption({
      series: [{
        data: [
          {
            value: this._funnelData.registered === 0 ? 0 : 100,
            name: this._translate.instant('app.ve.all')
          },
          {
            value: Math.round(parseFloat(participated)),
            name: this._translate.instant('app.ve.participated')
          }
        ]
      }]
    }, false);
    this._setEchartsOption({ color: [getColorPalette()[2], getColorPalette()[4]] });
  }

  private _loadReport(): void {
    this._isBusy = true;
    this._chartLoaded = false;
    this._blockerMessage = null;

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
    const data = totals.data.split(analyticsConfig.valueSeparator); // ["1010","700","380","440","3","13", "30", "100"];
    const all = parseInt(data[0]) + parseInt(data[6]); // registered + invited
    this._funnelData = {
      registered: all,
      participated: parseInt(data[3])
    };
    // dispatch event for other widgets
    const unregistered = data[5].length ? parseInt(data[5]) : 0;
    const participated = all === 0 ? 0 : Math.round(this._funnelData.participated / all * 100);
    this.turnout = participated.toFixed(0);
    this.registrationDataLoaded.emit({unregistered});
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
    if (params.data.value === 100) {
      const dropoff = this.turnout.includes('.') ? (100 - parseFloat(this.turnout)).toFixed(2) + "%" : 100 - parseInt(this.turnout) + "%";
      return `<span style="color: #333333"><b>${dropoff} ${this._translate.instant('app.ve.dropoff')}</b><br/><b>${this._funnelData.registered.toLocaleString(navigator.language)} ${this._translate.instant('app.ve.attendees')}</b></span>`;
    } else {
      return `<span style="color: #333333"><b>${this.turnout}% ${this._translate.instant('app.ve.turnout2')}</b><br/><b>${this._funnelData.participated.toLocaleString(navigator.language)} ${this._translate.instant('app.ve.attendees')}</b></span>`;
    }
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
