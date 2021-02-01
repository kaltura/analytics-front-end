import { Component, Input } from '@angular/core';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { MiniHighlightsConfig } from './mini-highlights.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { ManualPlaylistBase } from "../manual-playlist-base/manual-playlist-base";

@Component({
  selector: 'app-manual-playlist-mini-highlights',
  templateUrl: './mini-highlights.component.html',
  styleUrls: ['./mini-highlights.component.scss'],
  providers: [
    KalturaLogger.createLogger('ManualPlaylistMiniTHighlightsComponent'),
    MiniHighlightsConfig,
    ReportService,
  ]
})
export class ManualPlaylistMiniHighlightsComponent extends ManualPlaylistBase {
  @Input() dateFilterComponent: DateFilterComponent;
  @Input() playlistId: string = null;

  private _order = '-count_plays';
  private _reportType = reportTypeMap(KalturaReportType.categoryHighlights);
  private _dataConfig: ReportDataConfig;

  protected _componentId = 'manual-playlist-mini-highlights';
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _tabsData = [];
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }

  constructor(private _frameEventManager: FrameEventManagerService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private pageScrollService: PageScrollService,
              private _dataConfigService: MiniHighlightsConfig,
              private _logger: KalturaLogger) {
    super();

    this._dataConfig = _dataConfigService.getConfig();
  }

  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;

    if (this.playlistId && !this._filter.playlistIdIn) {
      this._filter.playlistIdIn = this.playlistId;
    }

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        if (this.playlistId && !this._compareFilter.playlistIdIn) {
          this._compareFilter.playlistIdIn = this.playlistId;
        }

        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: this._order };
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (compare) {
            this._handleCompare(report, compare);
          } else {
            if (report.totals) {
              this._handleTotals(report.totals); // handle table
            }
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
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
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
