import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';
import { KalturaAPIException, KalturaEndUserReportInputFilter, KalturaEntryStatus, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, BrowserService, ErrorsManagerService, NavigationDrillDownService, ReportService} from 'shared/services';
import { BehaviorSubject } from 'rxjs';
import { ISubscription } from 'rxjs/Subscription';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { InsightGeoConfig } from './insight-geo.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { Router } from "@angular/router";
import { ManualPlaylistBase } from "../manual-playlist-base/manual-playlist-base";

@Component({
  selector: 'app-manual-playlist-insight-geo',
  templateUrl: './insight-geo.component.html',
  styleUrls: ['./insight-geo.component.scss'],
  providers: [
    KalturaLogger.createLogger('ManualPlaylistInsightGeoComponent'),
    InsightGeoConfig,
    ReportService
  ]
})
export class ManualPlaylistInsightGeoComponent extends ManualPlaylistBase implements OnDestroy, OnInit {
  protected _componentId = 'manual-playlist-insight-geo';
  private _dataConfig: ReportDataConfig;

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tableData: TableRow<string>[] = [];
  public _compareTableData: TableRow<string>[] = [];
  public _compareFirstTimeLoading = true;
  public _currentDates: string;
  public _compareDates: string;
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 3, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }

  public _topCountries$: BehaviorSubject<{ table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException }>;

  @Input() dateFilterComponent: DateFilterComponent;
  @Input() set topCountries(topCountries$: any) {
    if (topCountries$) {
      this._topCountries$ = topCountries$;
      this._topCountries$
        .pipe(cancelOnDestroy(this))
        .subscribe((data: { table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException }) => {
          this._isBusy = data.busy;
          this._blockerMessage = this._errorsManager.getErrorMessage(data.error, { 'close': () => { this._blockerMessage = null; } });
          this._tableData = [];
          this._compareTableData = [];
          if (data.table && data.table.header && data.table.data) {
            this._handleTable(data.table, data.compare); // handle table
          }
        });
    }
  }

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: InsightGeoConfig,
              private pageScrollService: PageScrollService,
              private _logger: KalturaLogger,
              private _authService: AuthService,
              private _browserService: BrowserService,
              private _router: Router,
              private _navigationDrillDownService: NavigationDrillDownService) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit() {

  }

  protected _loadReport(sections = this._dataConfig): void {

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

  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }

  private _handleTable(table: KalturaReportTable, compare?: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._tableData = tableData.splice(0, 3);
    this._currentDates = null;
    this._compareDates = null;

    if (compare && compare.header && compare.data) {
      const { tableData: compareTableData } = this._reportService.parseTableData(compare, this._dataConfig.table);
      this._compareTableData = compareTableData;
      this._compareFirstTimeLoading = false;
      this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.endDate).format('MMM D, YYYY');
      this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.compare.endDate).format('MMM D, YYYY');
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

  ngOnDestroy() {
  }

}
