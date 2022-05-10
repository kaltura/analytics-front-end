import { Component, Input, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, BrowserService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { TranscodingConfig } from './transcoding.config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { reportTypeMap } from "shared/utils/report-type-map";
import { TranscodingBaseReportComponent } from "./transcoding-base-report.component";
import { TableRow } from "shared/utils/table-local-sort-handler";

@Component({
  selector: 'app-transcoding',
  templateUrl: './transcoding.component.html',
  styleUrls: ['./transcoding.component.scss'],
  providers: [
    KalturaLogger.createLogger('TranscodingComponent'),
    TranscodingConfig,
    ReportService,
  ]
})
export class TranscodingComponent extends TranscodingBaseReportComponent implements OnDestroy, OnInit {

  @Input() currentTimeFrame: string;
  @Input() set totalTranscodingDuration(value: string) {
    this._totalTranscodingDuration = parseFloat(value) / 60;
  }

  @Output() onClose = new EventEmitter();

  private _dataConfig: ReportDataConfig;
  protected _componentId = 'transcoding';

  private _totalTranscodingDuration: number;

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tableData: TableRow<string>[] = [];
  public _columns: string[] = [];
  private _order = '-transcoding_duration';
  private _reportType = reportTypeMap(KalturaReportType.flavorParamsTranscodingUsage);
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  constructor(private _translate: TranslateService,
              private _reportService: ReportService,
              private _browserService: BrowserService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: TranscodingConfig,
              private _logger: KalturaLogger) {
    super();

    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(switchMap(report => {
        return ObservableOf({ report, compare: null });
      }))
      .subscribe(({ report, compare }) => {
          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table, compare); // handle table
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
  private _handleTable(table: KalturaReportTable, compare?: Report): void {
    const {columns, tableData} = this._reportService.parseTableData(table, this._dataConfig.table);
    const extendTableRow = (profile, index) => {
      (<any>profile)['percent'] = parseFloat(profile.transcoding_duration.split(',').join('')) / this._totalTranscodingDuration * 100;
      return profile;
    };
    this._columns = columns;
    this._tableData = tableData.map(extendTableRow);
  }

  public close(): void {
    this.onClose.emit();
  }

  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
  }

  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
  }

}
