import { Component, Input, OnInit } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { UserEngagementConfig } from './user-engagement.config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import {analyticsConfig} from "configuration/analytics-config";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";

@Component({
  selector: 'app-user-engagement',
  templateUrl: './user-engagement.component.html',
  styleUrls: ['./user-engagement.component.scss'],
  providers: [
    KalturaLogger.createLogger('UserEngagementComponent'),
    UserEngagementConfig,
    ReportService,
  ]
})
export class UserEngagementComponent implements OnInit {

  private _dataConfig: ReportDataConfig;
  protected _componentId = 'metrics-cards';

  @Input() eventIn = '';
  @Input() eventSessionContextIdIn = '';
  @Input() userId = '';
  @Input() exporting = false;
  @Input() startDate: Date;
  @Input() endDate: Date;
  @Input() totalAttachments = '0';

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  private _order = '-date_id';
  private _reportType = KalturaReportType.epWebcastVodLiveUsersEngagement;
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public _reactionsCount = '0';
  public _messagesCount = '0';
  public _raisedHandCount = '0';
  public _downloadCount = '0';
  public _pollsCount = '0';

  constructor(private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _logger: KalturaLogger,
              private _frameEventManager: FrameEventManagerService,
              _dataConfigService: UserEngagementConfig) {
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
    this._loadReport();
  }

  private _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.virtualEventIdIn = this.eventIn;
    this._filter.eventSessionContextIdIn = this.eventSessionContextIdIn;
    this._filter.userIds = this.userId;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    const reportRequest = this._reportService.getReport(reportConfig, sections, false);

    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        return ObservableOf({ report, compare: null });
      }))
      .subscribe(({ report, compare }) => {
          if (report.totals) {
            this._handleTotals(report.totals); // handle totals
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

  private _handleTotals(totals: KalturaReportTotal): void {
    const tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
    this._reactionsCount = tabsData[0].value;
    this._downloadCount = tabsData[1].value;
    this._messagesCount = tabsData[2].value;
    this._raisedHandCount = tabsData[3].value;
    this._pollsCount = tabsData[4].value;
  }

}
