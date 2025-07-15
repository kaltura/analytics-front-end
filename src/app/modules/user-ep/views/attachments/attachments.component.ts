import {Component, Input, OnDestroy} from '@angular/core';
import {KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportType} from 'kaltura-ngx-client';
import {ReportDataConfig} from 'shared/services/storage-data-base.config';
import {TableRow} from 'shared/utils/table-local-sort-handler';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {AppAnalytics, AuthService, ButtonType, ErrorsManagerService, NavigationDrillDownService, ReportConfig, ReportService} from 'shared/services';
import {cancelOnDestroy} from '@kaltura-ng/kaltura-common';
import {AttachmentsConfig} from './attachments.config';
import {reportTypeMap} from 'shared/utils/report-type-map';
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";

@Component({
  selector: 'app-event-user-attachments',
  templateUrl: './attachments.component.html',
  styleUrls: ['./attachments.component.scss'],
  providers: [AttachmentsConfig],
})
export class UserAttachmentsComponent implements OnDestroy {

  @Input() eventIn = '';
  @Input() userId = '';
  @Input() set virtualEventLoaded(value: boolean) {
    if (value === true) {
      // use timeout to allow data binding to finish
      setTimeout(() => {
        this._loadReport();
      }, 0);
    }
  }
  @Input() exporting = false;
  @Input() startDate: Date;

  private _reportType = reportTypeMap(KalturaReportType.epLatestDownloadedAttachments);
  private _dataConfig: ReportDataConfig;
  private _order = '-extract_time';
  public _tableData: TableRow[] = [];
  public _columns: string[] = [];
  public totalCount = 0;
  public firstTimeLoading = true;
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: 500 });
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;

  constructor(private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _analytics: AppAnalytics,
              _dataConfigService: AttachmentsConfig,
              private _navigationDrillDownService: NavigationDrillDownService) {
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnDestroy(): void {
  }

  private _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.virtualEventIdIn = this.eventIn;
    this._filter.userIds = this.userId;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(new Date().getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager };
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          this._tableData = [];
          this.firstTimeLoading = false;
          if (report.table && report.table.data && report.table.header) {
            this._handleTable(report.table); // handle table
          }
          this._isBusy = false;
          this._blockerMessage = null;
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

  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this.totalCount = table.totalCount;
    this._columns = columns;
    const extendTableRow = (item, index) => {
      item['extension'] = item['attachment_ext']?.length > 0 && item['attachment_ext'] !== 'noext' ? item['attachment_ext'] : item['attachment_name'].split('.').pop();
      item['extensionClass'] = this.getExtensionClass(item['extension']);
      return item;
    };
    this._tableData = tableData.map(extendTableRow);
  }

  public _onPaginationChanged(event: { page: number }): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._analytics.trackButtonClickEvent(ButtonType.Filter, 'Events_user_attachment_paginate', this._pager.pageIndex.toString(), 'Event_user_dashboard');
      this._loadReport();
    }
  }

  private getExtensionClass(extension: string): string {
    let type = 'default';
    // try to get document type by file extension
    type = ['doc', 'docx', 'odt', 'rtf', 'tex', 'txt', 'wpd'].indexOf(extension) > -1 ? 'document' : type;
    type = extension === 'pdf' ? 'pdf' : type;
    type = ['xls', 'xlsx', 'xlsm', 'ods', 'csv'].indexOf(extension) > -1 ? 'spreadsheet' : type;
    type = ['dat', 'db', 'log', 'mdb', 'sav', 'sql', 'tar', 'xml'].indexOf(extension) > -1 ? 'data' : type;
    type = ['key', 'odp', 'pps', 'ppt', 'pptx'].indexOf(extension) > -1 ? 'presentation' : type;
    type = ['mp3', 'aif', 'cda', 'mid', 'mp3', 'mpa', 'ogg', 'wav', 'wma', 'wpl'].indexOf(extension) > -1 ? 'audio' : type;
    type = ['ai', 'jpg', 'bmp', 'gif', 'ico', 'jpeg', 'png', 'ps' , 'psd', 'svg', 'tif'].indexOf(extension) > -1 ? 'image' : type;
    type = ['7z', 'arj', 'deb', 'pkg', 'rar', 'rpm', 'tar', 'gz', 'z', 'zip'].indexOf(extension) > -1 ? 'archive' : type;
    type = ['3g2', '3gp', 'avi', 'flv', 'h264', 'm4v', 'mkv', 'mov', 'mp4', 'mpg', 'rm', 'swf', 'vob', 'wmv'].indexOf(extension) > -1 ? 'video' : type;
    return type;
  }

}


