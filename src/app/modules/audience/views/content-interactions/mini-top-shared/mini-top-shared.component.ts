import { Component, Input } from '@angular/core';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';
import { KalturaEndUserReportInputFilter, KalturaEntryStatus, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { BrowserService, ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { of as ObservableOf } from 'rxjs';
import { ISubscription } from 'rxjs/Subscription';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniTopSharedConfig } from './mini-top-shared.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { InteractionsBaseReportComponent } from '../interactions-base-report/interactions-base-report.component';
import { map, switchMap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-mini-top-shared',
  templateUrl: './mini-top-shared.component.html',
  styleUrls: ['./mini-top-shared.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniTopSharedComponent'),
    MiniTopSharedConfig,
    ReportService
  ]
})
export class MiniTopSharedComponent extends InteractionsBaseReportComponent {
  @Input() dateFilterComponent: DateFilterComponent;
  
  protected _componentId = 'mini-top-shared';
  
  private readonly _order = '-count_viral';
  private _reportType = KalturaReportType.contentInteractions;
  private _dataConfig: ReportDataConfig;
  private _partnerId = analyticsConfig.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  private subscription: ISubscription = null;
  
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
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _dataConfigService: MiniTopSharedConfig,
              private _pageScrollService: PageScrollService,
              private _errorsManager: ErrorsManagerService,
              private _logger: KalturaLogger,
              private _browserService: BrowserService,
              private _router: Router,
              private _activatedRoute: ActivatedRoute) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order };
        
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];
          this._compareTableData = [];
          
          if (report.table && report.table.data && report.table.header) {
            this._handleTable(report.table, compare ? compare.table : null); // handle table
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
    const extendTableRow = (item, index) => {
      (<any>item)['index'] = index + 1;
      item['thumbnailUrl'] = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${item['object_id']}/width/172/height/96?rnd=${Math.random()}`;
      return item;
    };
    this._tableData = tableData.map(extendTableRow).splice(0, 3);
    this._currentDates = null;
    this._compareDates = null;
    
    if (compare && compare.header && compare.data) {
      const { tableData: compareTableData } = this._reportService.parseTableData(compare, this._dataConfig.table);
      this._compareTableData = compareTableData.map(extendTableRow);
      this._compareFirstTimeLoading = false;
      this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.endDate).format('MMM D, YYYY');
      this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.compare.endDate).format('MMM D, YYYY');
    }
  }
  
  public _scrollTo(target: string): void {
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
  
  public _drillDown(row: TableRow<string>): void {
    const { object_id, status } = row;

    if (status === KalturaEntryStatus.ready) {
      if (analyticsConfig.isHosted) {
        const params = this._browserService.getCurrentQueryParams('string');
        this._frameEventManager.publish(FrameEvents.NavigateTo, `/analytics/entry?id=${object_id}&${params}`);
      } else {
        this._router.navigate(['entry', object_id], { queryParams: this._activatedRoute.snapshot.queryParams });
      }
    }
  }
}
