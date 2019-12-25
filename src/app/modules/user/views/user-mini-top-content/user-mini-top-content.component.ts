import { Component, Input, OnDestroy } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaEntryStatus, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { TranslateService } from '@ngx-translate/core';
import { AuthService, ErrorsManagerService, NavigationDrillDownService, Report, ReportConfig, ReportService } from 'shared/services';
import { UserBase } from '../user-base/user-base';
import { UserMiniTopContentConfig } from './user-mini-top-content.config';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-user-mini-top-content',
  templateUrl: './user-mini-top-content.component.html',
  styleUrls: ['./user-mini-top-content.component.scss'],
  providers: [UserMiniTopContentConfig],
})
export class UserMiniTopContentComponent extends UserBase implements OnDestroy {
  @Input() userId: string;
  
  private _order = '-count_plays';
  private _pager = new KalturaFilterPager({ pageSize: 5, pageIndex: 1 });
  private _reportType = reportTypeMap(KalturaReportType.topUserContent);
  private _dataConfig: ReportDataConfig;
  private _partnerId = this._authService.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  
  protected _componentId = 'mini-highlights';
  
  public _columns: string[] = [];
  public _firstTimeLoading = true;
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tableData: TableRow[] = [];
  public _compareTableData: TableRow[] = [];
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _currentDates: string;
  public _compareDates: string;
  public _reportInterval = KalturaReportInterval.days;
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: UserMiniTopContentConfig,
              private _authService: AuthService,
              private _navigationDrillDownService: NavigationDrillDownService) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  ngOnDestroy() {
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    this._filter.userIds = this.userId;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        this._compareFilter.userIds = this.userId;
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order, pager: this._pager };
        
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];
          
          if (compare) {
            this._handleCompare(report, compare);
          } else {
            this._currentDates = null;
            this._compareDates = null;
            
            if (report.table && report.table.data && report.table.header) {
              this._handleTable(report.table); // handle table
            }
          }
          
          this._firstTimeLoading = false;
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
  
  private _extendTableRow(item: TableRow<string>): TableRow<string> {
    item['thumbnailUrl'] = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${item['object_id']}/width/256/height/144?rnd=${Math.random()}`;
    return item;
  }
  
  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._columns = columns;
    this._tableData = tableData.map(this._extendTableRow.bind(this));
  }
  
  private _handleCompare(current: Report, compare: Report): void {
    this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM DD, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM DD, YYYY');
    this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM DD, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM DD, YYYY');
    
    if (current.table && current.table.data) {
      const { columns, tableData } = this._reportService.parseTableData(current.table, this._dataConfig.table);
      this._columns = columns;
      this._tableData = tableData.map(this._extendTableRow.bind(this)).slice(0, 3);
      
      if (compare.table && compare.table.data) {
        const { tableData: compareTableData } = this._reportService.parseTableData(compare.table, this._dataConfig.table);
        this._compareTableData = compareTableData.map(this._extendTableRow.bind(this)).slice(0, 3);
      } else {
        this._compareTableData = [];
      }
    }
  }
  
  public _drillDown(row: TableRow<string>): void {
    const { object_id: entryId, status, partner_id: partnerId, entry_source } = row;
    
    if (status === KalturaEntryStatus.ready) {
      const path = entry_source === 'Interactive Video' ? 'playlist' : 'entry';
      this._navigationDrillDownService.drilldown(path, entryId, true, partnerId);
    }
  }
  
}
