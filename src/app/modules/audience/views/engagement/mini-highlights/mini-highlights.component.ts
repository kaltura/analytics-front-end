import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';
import { KalturaAPIException, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTotal } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportService } from 'shared/services';
import { BehaviorSubject, Unsubscribable } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniHighlightsConfig } from './mini-highlights.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'app-engagement-mini-highlights',
  templateUrl: './mini-highlights.component.html',
  styleUrls: ['./mini-highlights.component.scss'],
  providers: [
    KalturaLogger.createLogger('EngagementMiniHighlightsComponent'),
    MiniHighlightsConfig,
    ReportService,
  ]
})
export class EngagementMiniHighlightsComponent extends EngagementBaseReportComponent implements OnDestroy, OnInit {
  @Input() dateFilterComponent: DateFilterComponent;
  
  @Input() highlights$: BehaviorSubject<{ current: Report, compare: Report, busy: boolean, error: KalturaAPIException }>;
  @Input() videosCount$: BehaviorSubject<number>;
  
  private _dataConfig: ReportDataConfig;
  
  protected _componentId = 'mini-highlights';

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private pageScrollService: PageScrollService,
              private _dataConfigService: MiniHighlightsConfig,
              private _logger: KalturaLogger) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  ngOnInit(): void {
    if (this.highlights$) {
      this.highlights$
        .pipe(cancelOnDestroy(this))
        .subscribe(({ current, compare, busy, error }) => {
          this._isBusy = busy;
          this._blockerMessage = this._errorsManager.getErrorMessage(error, { 'close': () => { this._blockerMessage = null; } });
          if (compare) {
            this._handleCompare(current, compare);
          } else {
            if (current && current.totals) {
              this._handleTotals(current.totals); // handle totals
            }
          }
        });
    }
  }
  
  ngOnDestroy(): void {
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    // empty by design
  }
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
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
  
  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    const comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };
    
    if (current.totals && compare.totals) {
      this._tabsData = this._compareService.compareTotalsData(
        currentPeriod,
        comparePeriod,
        current.totals,
        compare.totals,
        this._dataConfig.totals
      );
    }
  }

  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
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
