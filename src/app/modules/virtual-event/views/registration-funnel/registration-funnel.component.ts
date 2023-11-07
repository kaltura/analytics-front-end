import { Component, Input, Output, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, BrowserService, ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { RegistrationFunnelDataConfig } from './registration-funnel-data.config';
import { TranslateService } from '@ngx-translate/core';
import { EChartOption } from 'echarts';
import { getColorPalette } from 'shared/utils/colors';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { BehaviorSubject } from "rxjs";
import {analyticsConfig} from "configuration/analytics-config";

export type funnelData = {
  registered: number;
  participated: number;
};

export type attendeesData = {
  count: number;
  dimensions: {
    eventData: {
      attendanceStatus: string;
      regOrigin: string;
    }
  }
}

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

  @Input() set appGuid(value: string) {
    if (value.length) {
      this._appGuid = value;
      this._loadReport();
    }
  }

  @Input() set refineFilter(value: RefineFilter) {
    if (value) {
      this._refineFilter = value;
      this._loadReport();
    }
  }

  @Input() virtualEventId: string;
  @Input() exporting = false;

  private _refineFilter: RefineFilter = [];
  private _appGuid = '';

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _chartData: EChartOption = {};
  public _chartLoaded = false;
  public _funnelData: funnelData;
  public turnout = '0';

  private _registered = 0;
  private _participated = 0;

  private echartsIntance: any;

  public attendees$: BehaviorSubject<{ loading: boolean, results: attendeesData[], sum: number }> = new BehaviorSubject({ loading: false, results: [], sum: 0 });

  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _http: HttpClient,
              private _authService: AuthService,
              private _translate: TranslateService,
              private _dataConfigService: RegistrationFunnelDataConfig,
              private _browserService: BrowserService) {

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
    this.attendees$.complete();
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
    this._participated = 0;
    this.attendees$.next({loading: true, results: [], sum: 0});

    const filter = {
      "appGuid": this._appGuid
    }

    // add origin filter
    const regOrigin = [];
    if (this._refineFilter.length) {
      this._refineFilter.forEach(refineFilter => {
        if (refineFilter.type === 'origin') {
          regOrigin.push(refineFilter.value.toLowerCase());
        }
      })
    }
    if (regOrigin.length) {
      filter["regOriginIn"] = regOrigin;
    } else {
      delete filter["regOriginIn"];
    }

    // set minimal pager
    const dimensions = ["regOrigin","attendanceStatus"];


    const headers = new HttpHeaders({
      'authorization': `KS ${this._authService.ks}`,
      'Content-Type': 'application/json',
    });

    this._http.post(`${analyticsConfig.externalServices.userProfileServer.uri}/api/v1/reports/eventDataStats`, {filter, dimensions}, {headers}).pipe(cancelOnDestroy(this))
      .subscribe((data: any) => {
          this.attendees$.next({loading: false, results: data.results ? data.results : [], sum: data.sum ? data.sum : 0});
          this._registered = data.sum;
          if (data?.results && data.results.length) {
            data.results.forEach((users: any) => {
              if (users.dimensions?.eventData?.attendanceStatus === "participated") {
                this._participated += users.count;
              }
            });
            this._funnelData = {
              registered: this._registered,
              participated: this._participated
            };
            this.updateFunnel();
            const participated = this._registered === 0 ? 0 : Math.round(this._participated / this._registered * 100);
            this.turnout = participated.toFixed(0);
            this._chartLoaded = true;
          }
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          this.attendees$.next({loading: false, results: [], sum: 0});
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadReport();
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
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
}
