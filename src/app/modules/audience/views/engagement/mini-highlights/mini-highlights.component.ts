import { Component, Inject, Input, OnDestroy } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';
import { KalturaEndUserReportInputFilter, KalturaObjectBaseFactory, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { Report, ReportService } from 'shared/services';
import { filter } from 'rxjs/operators';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { MiniHighlightsConfig } from './mini-highlights.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { HighlightsSharedStore } from '../engagement-shared-stores';
import { SharedReportBaseStore } from 'shared/services/shared-report-base-store';

@Component({
  selector: 'app-engagement-mini-highlights',
  templateUrl: './mini-highlights.component.html',
  styleUrls: ['./mini-highlights.component.scss'],
  providers: [
    KalturaLogger.createLogger('EngagementMiniHighlightsComponent'),
    MiniHighlightsConfig,
  ]
})
export class EngagementMiniHighlightsComponent extends EngagementBaseReportComponent implements OnDestroy {
  @Input() dateFilterComponent: DateFilterComponent;
  
  private _order = '-month_id';
  private _reportType = KalturaReportType.userEngagementTimeline;
  private _dataConfig: ReportDataConfig;
  private _filter = new KalturaEndUserReportInputFilter();
  private _compareFilter: KalturaEndUserReportInputFilter = null;

  protected _componentId = 'mini-highlights';
  
  public _isBusy: boolean;
  public _tabsData: Tab[] = [];

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _pageScrollService: PageScrollService,
              private _dataConfigService: MiniHighlightsConfig,
              @Inject(HighlightsSharedStore) private _sharedStoreService: SharedReportBaseStore,
              private _logger: KalturaLogger) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
    this._prepare();
  }
  
  ngOnDestroy() {
  
  }
  
  protected _prepare(): void {
    this._sharedStoreService.status$
      .pipe(cancelOnDestroy(this))
      .subscribe(({ loading }) => {
        this._isBusy = loading;
        
        // don't handle errors here
      });
    this._sharedStoreService.report$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(({ current, compare }) => {
        if (compare) {
          this._handleCompare(current, compare);
        } else {
          if (current.totals) {
            this._handleTotals(current.totals); // handle totals
          }
        }
      });
  }
  
  protected _loadReport(): void {
    // empty by design
  }
  
  protected _updateRefineFilter(): void {
    // empty by design
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDay = this._dateFilter.startDay;
    this._filter.toDay = this._dateFilter.endDay;
    this._filter.interval = this._dateFilter.timeUnits;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDay = compare.startDay;
      this._compareFilter.toDay = compare.endDay;
    } else {
      this._compareFilter = null;
    }
  }
  
  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this._filter.fromDay, to: this._filter.toDay };
    const comparePeriod = { from: this._compareFilter.fromDay, to: this._compareFilter.toDay };
    
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
      this._pageScrollService.start(pageScrollInstance);
    }
  }
  
}
