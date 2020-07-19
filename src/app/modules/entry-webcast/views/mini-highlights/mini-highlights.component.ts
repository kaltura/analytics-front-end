import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { WebcastBaseReportComponent } from '../webcast-base-report/webcast-base-report.component';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { BehaviorSubject, of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniHighlightsConfig } from './mini-highlights.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { reportTypeMap } from "shared/utils/report-type-map";
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";

@Component({
  selector: 'app-webcast-mini-highlights',
  templateUrl: './mini-highlights.component.html',
  styleUrls: ['./mini-highlights.component.scss'],
  providers: [
    KalturaLogger.createLogger('WebcastMiniHighlightsComponent'),
    MiniHighlightsConfig,
    ReportService,
  ]
})
export class WebcastMiniHighlightsComponent extends WebcastBaseReportComponent implements OnDestroy, OnInit {

  private _dataConfig: ReportDataConfig;
  protected _componentId = 'webcast-mini-highlights';
  public _topCountries$: BehaviorSubject<{ topCountries: any[], totalCount: number }>;

  @Input() set topCountries(topCountries$: any) {
    if (topCountries$) {
      this._topCountries$ = topCountries$;
      this._topCountries$
        .pipe(cancelOnDestroy(this))
        .subscribe((data: { topCountries: any[], totalCount: number }) => {
          this._topCountries = data.topCountries;
          this._countriesCount = data.totalCount;
        });
    }
  }
  @Input() entryIdIn = '';

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  private _order = '-date_id';
  private _reportType = reportTypeMap(KalturaReportType.userTopContent);
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public _topCountries: {country: string, flag: string}[] = [];
  public _countriesCount = 0;

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: MiniHighlightsConfig,
              private _logger: KalturaLogger) {
    super();

    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order };

        return this._reportService.getReport(compareReportConfig, sections, false)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {

          if (report.totals && !this._tabsData.length) {
            this._handleTotals(report.totals); // handle totals
          }

          if (compare) {
            this._handleCompare(report, compare);
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

}
