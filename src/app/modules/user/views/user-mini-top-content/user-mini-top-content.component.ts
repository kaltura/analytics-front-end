import { Component, Input, OnDestroy } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaEntryStatus, KalturaFilterPager, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { BrowserService, ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { ActivatedRoute, Router } from '@angular/router';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { UserBase } from '../user-base/user-base';
import { UserMiniTopContentConfig } from './user-mini-top-content.config';

@Component({
  selector: 'app-user-mini-top-content',
  templateUrl: './user-mini-top-content.component.html',
  styleUrls: ['./user-mini-top-content.component.scss'],
  providers: [UserMiniTopContentConfig],
})
export class UserMiniTopContentComponent extends UserBase implements OnDestroy {
  @Input() userId: string;
  
  private _order = '-count_plays';
  private _pager = new KalturaFilterPager({ pageSize: 4, pageIndex: 1 });
  private _reportType = KalturaReportType.topContentCreator; // TODO use topUserContent once it's on lbd
  private _dataConfig: ReportDataConfig;
  private _partnerId = analyticsConfig.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  
  protected _componentId = 'mini-highlights';
  
  public _columns: string[] = [];
  public _firstTimeLoading = true;
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tableData: TableRow[] = [];
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: UserMiniTopContentConfig,
              private _router: Router,
              private _activatedRoute: ActivatedRoute,
              private _browserService: BrowserService) {
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
      .pipe(cancelOnDestroy(this))
      .subscribe(report => {
          this._tableData = [];
          
          if (report.table && report.table.data && report.table.header) {
            this._handleTable(report.table); // handle table
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
  }
  
  protected _updateRefineFilter(): void {
    this._refineFilterToServerValue(this._filter);
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
  
  public _drillDown(row: TableRow<string>): void {
    const { object_id: entryId, status } = row;
    
    if (status === KalturaEntryStatus.ready) {
      if (analyticsConfig.isHosted) {
        const params = this._browserService.getCurrentQueryParams('string');
        this._frameEventManager.publish(FrameEvents.NavigateTo, `/analytics/entry?id=${entryId}&${params}`);
      } else {
        this._router.navigate(['entry', entryId], { queryParams: this._activatedRoute.snapshot.queryParams });
      }
    }
  }
  
}
