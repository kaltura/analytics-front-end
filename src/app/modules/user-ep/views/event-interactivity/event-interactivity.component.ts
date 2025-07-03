import { Component, Input, OnInit } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { forkJoin } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { EventInteractivityConfig } from './event-interactivity.config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import {analyticsConfig} from "configuration/analytics-config";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";
import {PageScrollConfig, PageScrollInstance, PageScrollService} from "ngx-page-scroll";

@Component({
  selector: 'app-event-interactivity',
  templateUrl: './event-interactivity.component.html',
  styleUrls: ['./event-interactivity.component.scss'],
  providers: [
    KalturaLogger.createLogger('EventInteractivityComponent'),
    EventInteractivityConfig,
    ReportService,
  ]
})
export class EventInteractivityComponent implements OnInit {

  private _dataConfig: ReportDataConfig;
  private _cncDataConfig: ReportDataConfig;
  protected _componentId = 'event-interactivity';

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

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  private _order = '-date_id';
  private _reportType = KalturaReportType.epWebcastEngagement;
  private _cncReportType = KalturaReportType.cncParticipation;
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public _reactionsCount = '0';
  public _messagesCount = '0';
  public _questionsCount = '0';
  public _downloadCount = '0';
  public _pollsCount = '0';

  private NEW_METRICS_RELEASE_DATE = new Date(2024, 5, 2);
  public _displayNewMetrics = true;

  private uniqueViewersCount = 0;

  constructor(private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private pageScrollService: PageScrollService,
              private _logger: KalturaLogger,
              private _frameEventManager: FrameEventManagerService,
              _dataConfigService: EventInteractivityConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    this._cncDataConfig = _dataConfigService.getCncConfig();
  }

  ngOnInit(): void {
  }

  private _loadReport(sections = this._dataConfig, cncSections = this._cncDataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._displayNewMetrics = this.startDate.getTime() > this.NEW_METRICS_RELEASE_DATE.getTime();
    this._filter.virtualEventIdIn = this.eventIn;
    this._filter.userIds = this.userId;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    const cncReportConfig: ReportConfig = { reportType: this._cncReportType, filter: this._filter, order: this._order };
    const reportRequest = this._reportService.getReport(reportConfig, sections, false);
    const cncReportRequest = this._reportService.getReport(cncReportConfig, cncSections, false);

    forkJoin({reportRequest, cncReportRequest}).subscribe(
      ({reportRequest, cncReportRequest}) => {
        if (reportRequest.totals) {
          this._handleTotals(reportRequest.totals); // handle totals
        }
        if (cncReportRequest.totals) {
          this._handleCncTotals(cncReportRequest.totals); // handle totals
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
      }
    );

  }

  private _handleTotals(totals: KalturaReportTotal): void {
    const tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
    this.uniqueViewersCount = tabsData[5].rawValue !== '' ? parseInt(tabsData[5].rawValue.toString()) : 0;
    if (this.uniqueViewersCount > 0) {
      this._reactionsCount = tabsData[2].rawValue !== '' ? ReportHelper.numberOrZero(tabsData[2].rawValue as number) : '0';
      this._downloadCount = tabsData[4].rawValue !== '' ? ReportHelper.numberOrZero(tabsData[4].rawValue as number) : '0';
    }
  }

  private _handleCncTotals(totals: KalturaReportTotal): void {
    const tabsData = this._reportService.parseTotals(totals, this._cncDataConfig.totals);
    const totalUsers = tabsData.length > 7 && tabsData[8].rawValue !== '' ? parseInt(tabsData[8].rawValue.toString()) : 0;
    if (totalUsers > 0 && this.uniqueViewersCount > 0) {
      this._messagesCount = tabsData[3].rawValue !== '' ? ReportHelper.numberOrZero(tabsData[3].rawValue as number) : '0';
      this._questionsCount = tabsData[5].rawValue !== '' ? ReportHelper.numberOrZero(tabsData[5].rawValue as number) : '0';
      this._pollsCount = tabsData[6].rawValue !== '' ? ReportHelper.numberOrZero(tabsData[6].rawValue as number) : '0';
    }
  }

  public scrollTo(target: string): void {
    this._logger.trace('Handle scroll to details report action by user', { target });
    if (analyticsConfig.isHosted) {
      const targetEl = document.getElementById(target.substr(1)) as HTMLElement;
      if (targetEl) {
        this._logger.trace('Send scrollTo event to the host app', { offset: targetEl.offsetTop });
        this._frameEventManager.publish(FrameEvents.ScrollTo, targetEl.offsetTop);
      }
    } else {
      PageScrollConfig.defaultDuration = 500;
      const pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(document, target);
      this.pageScrollService.start(pageScrollInstance);
    }
  }

}
