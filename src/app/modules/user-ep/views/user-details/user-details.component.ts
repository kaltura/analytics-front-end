import { Component, Input, OnInit } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { UserDetailsConfig } from './user-details.config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import { switchMap } from "rxjs/operators";

@Component({
  selector: 'app-event-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
  providers: [
    KalturaLogger.createLogger('EventInteractivityComponent'),
    UserDetailsConfig,
    ReportService,
  ]
})
export class UserDetailsComponent implements OnInit {

  private _dataConfig: ReportDataConfig;
  private _cncDataConfig: ReportDataConfig;
  protected _componentId = 'event-interactivity';

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
  @Input() endDate: Date;

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  private _order = '-date_id';
  private _reportType = KalturaReportType.epWebcastLiveUserEngagement;
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _tableData: any[] = [];

  private uniqueViewersCount = 0;

  constructor(private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              _dataConfigService: UserDetailsConfig) {
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
  }

  private _loadReport(sections = this._dataConfig, cncSections = this._cncDataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.virtualEventIdIn = this.eventIn;
    this._filter.userIds = this.userId;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    const reportRequest = this._reportService.getReport(reportConfig, sections, false);

    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        return ObservableOf({ report, compare: null });
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];
          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table); // handle totals
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

  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._tableData = tableData;
  }

}
