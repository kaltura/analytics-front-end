import {Component, Input, OnInit} from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportGraph, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { switchMap } from 'rxjs/operators';
import { of as ObservableOf, Subject } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { RecordingsConfig } from './recordings.config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { isEmptyObject } from 'shared/utils/is-empty-object';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {SelectItem} from "primeng/api";

@Component({
  selector: 'app-ep-recordings',
  templateUrl: './recordings.component.html',
  styleUrls: ['./recordings.component.scss'],
  providers: [
    KalturaLogger.createLogger('EpRecordingsComponent'),
    RecordingsConfig,
    ReportService
  ],
})
export class EpRecordingsComponent implements OnInit {
  @Input() entryIdIn = '';
  @Input() startDate: Date;
  @Input() endDate: Date;
  @Input() exporting = false;

  private _order = '-date_id';
  private _reportType = KalturaReportType.epWebcastVodUserTopContent;
  private _dataConfig: ReportDataConfig;

  public _tableModes = TableModes;
  public _tableMode = TableModes.users;
  public _columns: string[] = [];
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tableData: TableRow[] = [];
  public _selectedMetrics = 'count_plays';
  public _reportInterval = KalturaReportInterval.days;
  public _sortField = 'date_id';
  public _lineChartData = {};
  public _showTable = false;
  public _totalViewers = 0;
  public _totalEntries = 0;
  public _pager = new KalturaFilterPager({ pageSize: analyticsConfig.defaultPageSize, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _tableModesOptions = [
    { label: this._translate.instant('app.entryEp.recordings.viewers'), value: TableModes.users },
    { label: this._translate.instant('app.entryEp.recordings.entries'), value: TableModes.entries }
  ];

  public _timeUnitsItems: SelectItem[] = [
    {label: this._translate.instant('app.dateFilter.monthly'), value: KalturaReportInterval.months},
    {label: this._translate.instant('app.dateFilter.daily'), value: KalturaReportInterval.days},
  ];

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: RecordingsConfig,
              private _logger: KalturaLogger) {

    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
    if (this.entryIdIn.length) {
      this._loadReport();
    }
  }

  private _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.entryIdIn = this.entryIdIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = this._reportInterval;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(switchMap(report => {
        return ObservableOf({ report, compare: null });
      }))
      .subscribe(({ report, compare }) => {
          if (report.graphs.length) {
            this._handleGraphs(report.graphs); // handle graphs
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


  private _handleGraphs(graphs: KalturaReportGraph[]): void {
    const { lineChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      { from: this._filter.fromDate, to: this._filter.toDate },
      this._reportInterval,
    );
    this._lineChartData = !isEmptyObject(lineChartData) ? lineChartData : null;
  }

  public _toggleTable(): void {
    this._logger.trace('Handle toggle table visibility action by user', { tableVisible: !this._showTable });
    this._showTable = !this._showTable;

    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        const height = document.getElementById('analyticsApp').getBoundingClientRect().height;
        this._logger.trace('Send update layout event to the host app', { height });
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { height });
      }, 0);
    }
  }

  public onTotalViewersChange(value: number): void {
    this._totalViewers = value;
  }

  public onTotalEntriesChange(value: number): void {
    this._totalEntries = value;
  }

  public onTimeUnitsChange(): void {
    this._loadReport();
  }
}
