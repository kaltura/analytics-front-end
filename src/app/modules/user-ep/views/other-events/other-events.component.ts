import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import {AuthService, ErrorsManagerService, ReportConfig, ReportService} from 'shared/services';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { OtherEventsConfig } from './other-events.config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import { switchMap } from "rxjs/operators";
import {analyticsConfig} from "configuration/analytics-config";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";
import {HttpClient, HttpHeaders} from "@angular/common/http";

@Component({
  selector: 'app-other-events',
  templateUrl: './other-events.component.html',
  styleUrls: ['./other-events.component.scss'],
  providers: [
    KalturaLogger.createLogger('OtherEventsComponent'),
    OtherEventsConfig,
    ReportService,
  ]
})
export class OtherEventsComponent implements OnInit, OnDestroy {

  private _dataConfig: ReportDataConfig;
  protected _componentId = 'other-events';

  @Input() userId = '';
  @Input() set virtualEventLoaded(value: boolean) {
    if (value === true) {
      // use timeout to allow data binding to finish
      setTimeout(() => {
        // this._loadReport();
        this.loadUserEvents();
      }, 0);
    }
  }
  @Input() exporting = false;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  /*
  private startDate = new Date(2024, 6, 31);

  private _order = '-date_id';
  private _reportType = KalturaReportType.epTopSessions;
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 1, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public totalSessionsCount = 0;
  */
  public totalEventRegistrations = 0;
  public totalEventAttendance = 0;

  constructor(private _reportService: ReportService,
              private _http: HttpClient,
              private _authService: AuthService,
              private _errorsManager: ErrorsManagerService,
              _dataConfigService: OtherEventsConfig) {
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
  }

  /*
  private _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.userIds = this.userId;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(new Date().getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };

    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        return ObservableOf({ report, compare: null });
      }))
      .subscribe(({ report, compare }) => {
          if (report?.table?.totalCount) {
            this.totalSessionsCount = report.table.totalCount;
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
   */

  private loadUserEvents(): void {
    this._isBusy = true;
    const filter = {
      "userIdIn": [this.userId],
    };
    const headers = new HttpHeaders({
      'authorization': `KS ${this._authService.ks}`,
      'Content-Type': 'application/json',
    });
    this._http.post(`${analyticsConfig.externalServices.userProfileEndpoint.uri}/list`, {filter}, {headers}).pipe(cancelOnDestroy(this))
      .subscribe((data: any) => {
          if (data?.objects?.length) {
            this.totalEventRegistrations = data.objects.length;
            const attendedStatuses = ['attended', 'participated', 'participatedPostEvent'];
            this.totalEventAttendance = data.objects.filter(event => attendedStatuses.includes(event.eventData?.attendanceStatus)).length;
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
              this.loadUserEvents();
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  ngOnDestroy() {
  }

}
