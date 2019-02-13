import { Component, Inject, OnDestroy } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import * as moment from 'moment';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { filter, map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { TopVideosDataConfig } from './top-videos-data.config';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { HighlightsSharedStore, TopVideosSharedStore } from '../engagement-shared-stores';
import { SharedReportBaseStore } from 'shared/services/shared-report-base-store';

@Component({
  selector: 'app-engagement-top-videos',
  templateUrl: './top-videos.component.html',
  styleUrls: ['./top-videos.component.scss'],
  providers: [
    KalturaLogger.createLogger('EngagementTopVideosComponent'),
    TopVideosDataConfig,
    ReportService
  ]
})
export class EngagementTopVideosComponent extends EngagementBaseReportComponent implements OnDestroy {
  private _partnerId = analyticsConfig.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  private _order = '-engagement_ranking';
  private _compareFilter: KalturaEndUserReportInputFilter = null;
  private _dataConfig: ReportDataConfig;
  private _reportInterval = KalturaReportInterval.months;
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  
  protected _componentId = 'top-videos';
  
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy: boolean;
  public _tableData: any[] = [];
  public _compareTableData: any[] = [];
  public _isCompareMode: boolean;
  public _columns: string[] = [];
  public _pager = new KalturaFilterPager({ pageSize: 50, pageIndex: 1 });
  public _firstTimeLoading = true;
  public _compareFirstTimeLoading = true;
  public _currentDates: string;
  public _compareDates: string;
  public _reportType = KalturaReportType.topContentCreator;
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: TopVideosDataConfig,
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
      .subscribe(({ loading, error }) => {
        this._blockerMessage = null;
        this._isBusy = loading;
        
        if (error) {
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
      });
    
    this._sharedStoreService.report$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(({ current, compare }) => {
        this._tableData = [];
        this._compareTableData = [];
  
        if (current.table && current.table.header && current.table.data) {
          this._handleTable(current.table, compare); // handle table
        }
        this._firstTimeLoading = false;
        this._compareFirstTimeLoading = false;
      });
  }
  
  protected _loadReport(): void {
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    const compareReportConfig = this._isCompareMode
      ? { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: this._order }
      : null;
    this._sharedStoreService.loadData(this._dataConfig, reportConfig, compareReportConfig);
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDay = this._dateFilter.startDay;
    this._filter.toDay = this._dateFilter.endDay;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    this._isCompareMode = false;
    if (this._dateFilter.compare.active) {
      this._compareFirstTimeLoading = true;
      this._isCompareMode = true;
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDay = compare.startDay;
      this._compareFilter.toDay = compare.endDay;
    } else {
      this._compareFilter = null;
      this._compareFirstTimeLoading = true;
    }
  }
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  private _handleTable(table: KalturaReportTable, compare?: Report): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    const extendTableRow = (item, index) => {
      (<any>item)['index'] = index + 1;
      item['thumbnailUrl'] = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${item['object_id']}/width/256/height/144?rnd=${Math.random()}`;
      return item;
    };
    this._columns = columns;
    this._tableData = tableData.map(extendTableRow);
    this._currentDates = null;
    this._compareDates = null;
    
    if (compare && compare.table && compare.table.header && compare.table.data) {
      const { tableData: compareTableData } = this._reportService.parseTableData(compare.table, this._dataConfig.table);
      this._compareTableData = compareTableData.map(extendTableRow);
      this._columns = ['entry_name', 'count_plays'];
      this._currentDates = moment(DateFilterUtils.fromServerDate(this._dateFilter.startDate)).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM D, YYYY');
      this._compareDates = moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.startDate)).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM D, YYYY');
    }
  }
}
