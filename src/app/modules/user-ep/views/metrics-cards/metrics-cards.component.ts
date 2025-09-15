import { Component, Input, OnInit } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { MetricsCardsConfig } from './metrics-cards.config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import {analyticsConfig} from "configuration/analytics-config";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";

@Component({
  selector: 'app-metrics-cards',
  templateUrl: './metrics-cards.component.html',
  styleUrls: ['./metrics-cards.component.scss'],
  providers: [
    KalturaLogger.createLogger('MetricsCardsComponent'),
    MetricsCardsConfig,
    ReportService,
  ]
})
export class MetricsCardsComponent implements OnInit {

  private _dataConfig: ReportDataConfig;
  protected _componentId = 'metrics-cards';

  @Input() eventIn = '';
  @Input() userId = '';
  @Input() set virtualEventLoaded(value: boolean) {
    if (value === true) {
      // use timeout to allow data binding to finish
      setTimeout(() => {
        this._loadReport();
      }, 0);
    }
  }
  @Input() exporting = false;
  @Input() startDate: Date;
  @Input() endDate: Date;
  @Input() contentOnDemandLoading: boolean;
  @Input() sessionsLoading: boolean;

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

  public _totalMinutesViewed = '0';
  public _avgLiveEngagement = '0';

  @Input() public _videosViewed = '0';
  @Input()  _sessionViewed = '0';

  public _reactionsCount = '0';
  public _messagesCount = '0';
  public _questionsCount = '0';
  public _downloadCount = '0';
  public _pollsCount = '0';

  constructor(private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _logger: KalturaLogger,
              private _frameEventManager: FrameEventManagerService,
              _dataConfigService: MetricsCardsConfig) {
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
  }

  private _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.virtualEventIdIn = this.eventIn;
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
    this._totalMinutesViewed = tabsData[0].value;
    this._avgLiveEngagement = tabsData[1].value;
    this._reactionsCount = tabsData[2].value;
    this._downloadCount = tabsData[3].value;
    this._messagesCount = tabsData[4].value;
    this._questionsCount = tabsData[5].value;
    this._pollsCount = tabsData[6].value;
  }

}
