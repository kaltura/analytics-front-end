import { Component, Inject, Input, OnDestroy } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';
import { KalturaEndUserReportInputFilter, KalturaObjectBaseFactory, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { Report, ReportService } from 'shared/services';
import { filter } from 'rxjs/operators';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { MiniTopVideosConfig } from './mini-top-videos.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import * as moment from 'moment';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { TopVideosSharedStore } from '../engagement-shared-stores';
import { SharedReportBaseStore } from 'shared/services/shared-report-base-store';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'app-engagement-mini-top-videos',
  templateUrl: './mini-top-videos.component.html',
  styleUrls: ['./mini-top-videos.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniTopVideosComponent'),
    MiniTopVideosConfig,
    ReportService,
  ]
})
export class MiniTopVideosComponent extends EngagementBaseReportComponent implements OnDestroy {
  @Input() dateFilterComponent: DateFilterComponent;
  
  private _partnerId = analyticsConfig.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  private _order = '-engagement_ranking';
  private _reportType = KalturaReportType.topContentCreator;
  private _dataConfig: ReportDataConfig;
  
  protected _componentId = 'mini-top-videos';
  
  public _isBusy: boolean;
  public _tableData: any[] = [];
  public _compareTableData: any[] = [];
  public _compareFirstTimeLoading = true;
  public _currentDates: string;
  public _compareDates: string;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _filter = new KalturaEndUserReportInputFilter();
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _pageScrollService: PageScrollService,
              private _dataConfigService: MiniTopVideosConfig,
              private _logger: KalturaLogger,
              @Inject(TopVideosSharedStore) private _sharedStoreService: SharedReportBaseStore) {
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
        this._tableData = [];
        this._compareTableData = [];
  
        if (current.table && current.table.header && current.table.data) {
          this._handleTable(current.table, compare); // handle table
        }
      });
  }
  
  protected _loadReport(sections = this._dataConfig): void {
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
  
  protected _updateRefineFilter(): void {
    // empty by design
  }
  
  private _handleTable(table: KalturaReportTable, compare?: Report): void {
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    const extendTableRow = (item, index) => {
      (<any>item)['index'] = index + 1;
      item['thumbnailUrl'] = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${item['object_id']}/width/172/height/96?rnd=${Math.random()}`;
      return item;
    };
    this._tableData = tableData.slice(0, 3).map(extendTableRow);
    this._currentDates = null;
    this._compareDates = null;
    
    if (compare && compare.table && compare.table.header && compare.table.data) {
      const { tableData: compareTableData } = this._reportService.parseTableData(compare.table, this._dataConfig.table);
      this._compareTableData = compareTableData.slice(0, 3).map(extendTableRow);
      this._compareFirstTimeLoading = false;
      this._currentDates = moment(DateFilterUtils.fromServerDate(this._dateFilter.startDate)).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM D, YYYY');
      this._compareDates = moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.startDate)).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM D, YYYY');
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
      this._pageScrollService.start(pageScrollInstance);
    }
  }
  
}
