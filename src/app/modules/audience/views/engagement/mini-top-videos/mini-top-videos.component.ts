import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';
import { KalturaAPIException, KalturaEndUserReportInputFilter, KalturaEntryStatus, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, BrowserService, ErrorsManagerService, NavigationDrillDownService, ReportService } from 'shared/services';
import { BehaviorSubject } from 'rxjs';
import { ISubscription } from 'rxjs/Subscription';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniTopVideosConfig } from './mini-top-videos.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import {Router} from "@angular/router";

@Component({
  selector: 'app-engagement-mini-top-videos',
  templateUrl: './mini-top-videos.component.html',
  styleUrls: ['./mini-top-videos.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniTopSharedComponent'),
    MiniTopVideosConfig,
    ReportService
  ]
})
export class MiniTopVideosComponent extends EngagementBaseReportComponent implements OnDestroy, OnInit {
  @Input() dateFilterComponent: DateFilterComponent;
  
  @Input() topVideos$: BehaviorSubject<{ table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException }>;
  
  protected _componentId = 'mini-top-videos';
  private _dataConfig: ReportDataConfig;
  private _partnerId = this._authService.pid;
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
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: MiniTopVideosConfig,
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
    if (this.topVideos$) {
      this.topVideos$
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
  
  public _drillDown({ object_id, status, partner_id }: { object_id: string, status: KalturaEntryStatus, partner_id: string }): void {
    if (status === KalturaEntryStatus.ready) {
      this._navigationDrillDownService.drilldown('entry', object_id, true, partner_id);
    }
  }
}
