import { Component, Inject, InjectionToken, Input } from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaClient, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataBaseConfig, ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { PlaylistBase } from '../playlist-base/playlist-base';

export const TotalsConfig = new InjectionToken<string>('TotalsConfig');

@Component({
  selector: 'app-base-playlist-totals',
  template: '',
  styleUrls: [],
})
export class BasePlaylistTotalsComponent extends PlaylistBase {
  @Input() playlistId = '';
  @Input() reportType: KalturaReportType = null;
  
  private _order = '-month_id';
  private _dataConfig: ReportDataConfig;
  
  public _dateFilter: DateChangeEvent;
  protected _componentId = 'totals';
  
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _kalturaClient: KalturaClient,
              @Inject(TotalsConfig) private _dataConfigService: ReportDataBaseConfig) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this._filter, pager: this._pager, order: this._order };
    if (reportConfig['objectIds__null']) {
      delete reportConfig['objectIds__null'];
    }
    reportConfig.objectIds = this.playlistId;
    
    this._reportService.getReport(reportConfig, sections)
      .pipe(
        switchMap(report => {
          if (!this._isCompareMode) {
            return ObservableOf({ report, compare: null });
          }
          
          const compareReportConfig: ReportConfig = { reportType: this.reportType, filter: this._compareFilter, pager: this._pager, order: this._order };
          if (compareReportConfig['objectIds__null']) {
            delete compareReportConfig['objectIds__null'];
          }
          compareReportConfig.objectIds = this.playlistId;
          return this._reportService.getReport(compareReportConfig, sections)
            .pipe(map(compare => ({ report, compare })));
        }),
      )
      .subscribe(({ report, compare }) => {
          if (compare) {
            this._handleCompare(report, compare);
          } else {
            if (report.totals) {
              this._handleTotals(report.totals); // handle totals
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
  
  protected _updateRefineFilter(): void {
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
  
    if (current.totals && compare.totals && current.totals.data && compare.totals.data) {
      const tabsData = this._compareService.compareTotalsData(
        currentPeriod,
        comparePeriod,
        current.totals,
        compare.totals,
        this._dataConfig.totals
      );
      this._tabsData = tabsData.filter(({ hidden }) => !hidden);
    }
  }
  
  private _handleTotals(totals: KalturaReportTotal): void {
    const tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
    this._tabsData = tabsData.filter(({ hidden }) => !hidden);
  }
}
