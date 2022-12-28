import { Component, Input } from '@angular/core';
import { ManualPlaylistBase } from "../manual-playlist-base/manual-playlist-base";
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { InsightPeakDayConfig } from './insight-peak-day.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { reportTypeMap } from 'shared/utils/report-type-map';
import {analyticsConfig} from "configuration/analytics-config";


@Component({
  selector: 'app-manual-playlist-insight-peak-day',
  templateUrl: './insight-peak-day.component.html',
  styleUrls: ['./insight-peak-day.component.scss'],
  providers: [
    KalturaLogger.createLogger('ManualPlaylistInsightPeakDayComponent'),
    InsightPeakDayConfig,
    ReportService,
  ]
})
export class ManualPlaylistInsightPeakDayComponent extends ManualPlaylistBase {
  @Input() dateFilterComponent: DateFilterComponent;
  @Input() playlistId: string = null;

  private _order = '-count_plays';
  private _reportType = reportTypeMap(KalturaReportType.userEngagementTimeline);
  private _dataConfig: ReportDataConfig;
  private _partnerId = this._authService.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;

  protected _componentId = 'manual-playlist-insight-peak-day';

  public _isBusy: boolean;
  public _loadingTopEntry = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 1, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }

  public _peakDayData: any = null;

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _logger: KalturaLogger,
              private _dataConfigService: InsightPeakDayConfig) {
    super();

    this._dataConfig = _dataConfigService.getConfig();
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;

    if (!this._filter.playlistIdIn) {
      this._filter.playlistIdIn = this.playlistId;
    }
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const pager = new KalturaFilterPager({ pageSize: 1, pageIndex: 1 });

        if (!this._compareFilter.playlistIdIn) {
          this._compareFilter.playlistIdIn = this.playlistId;
        }
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: pager, order: this._order };
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._peakDayData = null;

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

  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = KalturaReportInterval.days;
    this._reportInterval = KalturaReportInterval.days;
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

  private _handleTable(table: KalturaReportTable, compare?: Report): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    if (tableData.length) {
      const data = tableData[0];
      // we might get data with 0 plays if there were impressions which we do not display. Force "No Data Found" if plays = 0
      if (data.count_plays && parseInt(data.count_plays) !== 0) {
        this._peakDayData = data;
        this._loadTopEntry();
      }
    }
  }

  private _loadTopEntry(): void {
    this._loadingTopEntry = true;
    const startDate = new Date(this._peakDayData.date_id).setHours(0, 0, 0);
    const endDate = new Date(this._peakDayData.date_id).setHours(23, 59, 59);
    const filter = new KalturaEndUserReportInputFilter({
      searchInTags: true,
      searchInAdminTags: false,
      playlistIdIn: this.playlistId,
      fromDate: startDate / 1000,
      toDate: endDate / 1000
    });
    const pager = new KalturaFilterPager({ pageSize: 1, pageIndex: 1 });
    const reportType = KalturaReportType.topContentCreator;
    const reportConfig: ReportConfig = { reportType, filter, pager, order: '-engagement_ranking' };
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(switchMap(report => {
          return ObservableOf({ report, compare: null });
      }))
      .subscribe(({ report, compare }) => {
          if (report.table && report.table.header && report.table.data) {
            const { columns, tableData } = this._reportService.parseTableData(report.table, this._dataConfig.entryDetails);
            if (tableData.length) {
              const topEntry = tableData[0];
              this._peakDayData['thumbnailUrl'] = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${topEntry['object_id']}/width/256/height/144` || '';
              this._peakDayData['entry_name'] = topEntry['entry_name'] || '';
            }
          }
          this._loadingTopEntry = false;
        },
        error => {
          this._loadingTopEntry = false;
          this._logger.error(error); // don't show error message as this is a secondary load
        });
  }

}
