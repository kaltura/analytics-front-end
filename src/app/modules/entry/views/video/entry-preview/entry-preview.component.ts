import { Component, Input, NgZone, OnInit } from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { EntryPreviewConfig } from './entry-preview.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig, getKalturaServerUri } from 'configuration/analytics-config';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { EntryBase } from '../../shared/entry-base/entry-base';
import {getPrimaryColor, getSecondaryColor} from 'shared/utils/colors';
import {map, switchMap} from "rxjs/operators";
import {of as ObservableOf} from "rxjs";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { reportTypeMap } from 'shared/utils/report-type-map';
import {AnalyticsPermissionsService} from "shared/analytics-permissions/analytics-permissions.service";
import {AnalyticsPermissions} from "shared/analytics-permissions/analytics-permissions";

@Component({
  selector: 'app-video-entry-preview',
  templateUrl: './entry-preview.component.html',
  styleUrls: ['./entry-preview.component.scss'],
  providers: [EntryPreviewConfig, ReportService]
})
export class VideoEntryPreviewComponent extends EntryBase implements OnInit {
  @Input() entryId = '';
  @Input() thumbnailUrl = '';

  private _dataConfig: ReportDataConfig;
  private _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _playerInstance: any = null;
  private _playerInitialized = false;
  private _reportType = reportTypeMap(KalturaReportType.percentiles);

  public _dateFilter: DateChangeEvent;
  protected _componentId = 'preview';

  public _currentDatePeriodLabel: string = null;
  public _compareDatePeriodLabel: string = null;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _playerConfig: any = {};
  public serverUri = getKalturaServerUri();
  public _playerPlayed = false;
  public _playProgress = 0;
  public _duration = 0;
  public _currentTime = 0;
  public _loadThumbnailWithKs = false;

  public _chartOptions = {};

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private zone: NgZone,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _permissionsService: AnalyticsPermissionsService,
              private _dataConfigService: EntryPreviewConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
    this._loadThumbnailWithKs = this._permissionsService.hasPermission(AnalyticsPermissions.FEATURE_LOAD_THUMBNAIL_WITH_KS);
  }

  ngOnInit() {
    this._initPlayer();
  }

  private _getGraphData(yData1: number[], yData2: number[], compareYData1: number[] = null, compareYData2: number[] = null) {
    let graphData = {
      color: [getPrimaryColor(), getSecondaryColor()],
      backgroundColor: '#333333',
      grid: {
        left: 0,
        right: 0,
        top: 18,
        bottom: 0
      },
      xAxis: {
        show: false,
        boundaryGap: false,
        type: 'category',
        data: Array.from({ length: 100 }, (_, i) => i + 1),
      },
      tooltip: {
        confine: true,
        formatter: params => {
          const { value: value1, dataIndex } = params[0];
          const value2 = params[1].value;
          const progressValue = ReportHelper.time(String(dataIndex / 99 * this._duration)); // empirically found formula, closest result to expected so far
          let tooltip = `
            <div class="kEntryGraphTooltip">
              <div class="kCurrentTime">${progressValue}</div>
              <div class="kValue">
                <span class="kBullet" style="color: ${getPrimaryColor()}">&bull;</span>
                ${this._translate.instant('app.entry.views')}:&nbsp;${value1}
              </div>
              <div class="kValue">
                <span class="kBullet" style="color: ${getPrimaryColor('viewers')}">&bull;</span>
                ${this._translate.instant('app.entry.unique_auth_known_users')}:&nbsp;${value2}
              </div>
            </div>
          `;
          if (this._isCompareMode && Array.isArray(params) && params.length > 1) {
            const compareValue1 = params[2].value;
            const compareValue2 = params[3].value;

            tooltip = `
              <div style="font-size: 15px; margin-left: 5px; font-weight: bold; color: #999999">${progressValue}</div>
              <div class="kEntryCompareGraphTooltip" style="padding-bottom: 0; margin-bottom: 12px">
                <span class="kPeriodLabel">${this._compareDatePeriodLabel}</span>
                <div class="kValue">
                  <span class="kBullet" style="color: ${getSecondaryColor()}">&bull;</span>
                  <span>${this._translate.instant('app.entry.views')}:&nbsp;${compareValue1}</span>
                </div>
                <div class="kValue">
                  <span class="kBullet" style="color: ${getSecondaryColor('viewers')}">&bull;</span>
                  <span>${this._translate.instant('app.entry.unique_auth_known_users')}:&nbsp;${compareValue2}</span>
                </div>
              </div>
              <div class="kEntryCompareGraphTooltip" style="padding-top: 0">
                <span class="kPeriodLabel">${this._currentDatePeriodLabel}</span>
                <div class="kValue">
                  <span class="kBullet" style="color: ${getPrimaryColor()}">&bull;</span>
                  <span>${this._translate.instant('app.entry.views')}:&nbsp;${value1}</span>
                </div>
                <div class="kValue">
                  <span class="kBullet" style="color: ${getPrimaryColor('viewers')}">&bull;</span>
                  <span>${this._translate.instant('app.entry.unique_auth_known_users')}:&nbsp;${value2}</span>
                </div>
              </div>
           `;
          }
          return tooltip;
        },
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#dadada',
        borderWidth: 1,
        padding: 8,
        extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
        textStyle: {
          color: '#333333',
          fontWeight: 'bold'
        },
        axisPointer: {
          lineStyle: {
            color: '#ffffff'
          },
          z: 1
        }
      },
      yAxis: {
        zlevel: 0,
        type: 'value',
        position: 'right',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#535353'
          }
        },
        axisLabel: {
          inside: true,
          margin: 4,
          verticalAlign: 'top',
          padding: [8, 0, 0, 0],
          color: '#FFFFFF'
        }
      },
      series: [
        {
          data: yData1,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          type: 'line',
          lineStyle: {
            color: '#487adf',
            width: 2
          }
        },
        {
          data: yData2,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          type: 'line',
          lineStyle: {
            color: '#1b8271',
            width: 2
          }
        }]
    };
    if (compareYData1 !== null && compareYData2 !== null) {
      graphData.series.push({
        data: compareYData1,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false,
        type: 'line',
        lineStyle: {
          color: '#88acf6',
          width: 2
        }
      });
      graphData.series.push({
        data: compareYData2,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false,
        type: 'line',
        lineStyle: {
          color: '#60e4cc',
          width: 2
        }
      });
    }
    return graphData;
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;

    if (this.entryId) {
      this._filter.entryIdIn = this.entryId;
    }

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: null };
    if (reportConfig['objectIds__null']) {
      delete reportConfig['objectIds__null'];
    }

    sections = { ...sections }; // make local copy

    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        if (this.entryId) {
          this._compareFilter.entryIdIn = this.entryId;
        }
        const compareReportConfig: ReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: null };
        if (compareReportConfig['objectIds__null']) {
          delete compareReportConfig['objectIds__null'];
        }
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._isBusy = false;
          this._chartOptions = {};

          if (this._isCompareMode) {
            const dateFormat = 'MMM DD YYYY';
            this._currentDatePeriodLabel = DateFilterUtils.getMomentDate(this._filter.fromDate).format(dateFormat) + ' - ' + DateFilterUtils.getMomentDate(this._filter.toDate).format(dateFormat);
            this._compareDatePeriodLabel = DateFilterUtils.getMomentDate(this._compareFilter.fromDate).format(dateFormat) + ' - ' + DateFilterUtils.getMomentDate(this._compareFilter.toDate).format(dateFormat);
          }

          if (report.table && report.table.header && report.table.data) {
            const { tableData } = this._reportService.parseTableData(report.table, this._dataConfig[ReportDataSection.table]);
            const yAxisData1 = this._getAxisData(tableData, 'count_viewers');
            const yAxisData2 = this._getAxisData(tableData, 'unique_known_users');

            if (compare && compare.table) {
              let compareYAxisData1 = [];
              let compareYAxisData2 = [];
              if (compare.table.header && compare.table.data) {
                const { tableData: compareTableData } = this._reportService.parseTableData(compare.table, this._dataConfig[ReportDataSection.table]);
                compareYAxisData1 = this._getAxisData(compareTableData, 'count_viewers');
                compareYAxisData2 = this._getAxisData(compareTableData, 'unique_known_users');
              } else {
                compareYAxisData1 = Array.from({ length: 100 }, () => 0);
                compareYAxisData2 = Array.from({ length: 100 }, () => 0);
              }
              this._chartOptions = this._getGraphData(yAxisData1, yAxisData2, compareYAxisData1, compareYAxisData2);
            } else {
              this._chartOptions = this._getGraphData(yAxisData1, yAxisData2);
            }
          } else {
            const emptyLine = Array.from({ length: 100 }, () => 0);
            this._chartOptions = this._isCompareMode
              ? this._getGraphData(emptyLine, emptyLine, emptyLine, emptyLine)
              : this._getGraphData(emptyLine, emptyLine);
          }
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

  protected _updateRefineFilter(): void {
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
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

  public _onChartClick(event): void {
    const percent = event.offsetX / event.currentTarget.clientWidth;
    this._seekTo(percent, true);
  }

  private _getAxisData(tableData: TableRow[], key: string): number[] {
    const result = tableData
      .sort((a, b) => Number(a['percentile']) - Number(b['percentile']))
      .map(item => Number(item[key] || 0));

    result[0] = result[1];

    return result;
  }

  /* ------------------------ start of player logic --------------------------*/

  private _initPlayer(): void {
    if (!this._playerInitialized) {
      this._playerInitialized = true;
      this._playerConfig = {
        uiconfid: analyticsConfig.kalturaServer.previewUIConfV7,
        pid: this._authService.pid,
        entryid: this.entryId,
        ks: this._authService.ks,
        thumbnailUrl: this.thumbnailUrl
      };
    }
  }

  private _seekTo(percent: number, forcePlay = false): void {
    this._playerInstance.currentTime = this._duration / 1000 * percent;
    if (forcePlay) {
      this._playerInstance.play();
    }
  }

  public _onPlayerReady(player): void {
    this._playerInstance = player;

    // event registration
    this._playerInstance.addEventListener(this._playerInstance.Event.CHANGE_SOURCE_STARTED, event => {
      this._duration = this._playerInstance.sources.duration * 1000;
    });
    this._playerInstance.addEventListener(this._playerInstance.Event.MEDIA_LOADED, event => {
      this._playerPlayed = true;
    });
    this._playerInstance.addEventListener(this._playerInstance.Event.TIME_UPDATE, event => {
      this._playProgress = this._playerInstance.currentTime / this._duration * 1000 *100;
      this._currentTime = this._playerInstance.currentTime * 1000;
    });
    this._playerInstance.addEventListener(this._playerInstance.Event.ENDED, event => {
      this._playProgress = 100;
    });
  }

  /* -------------------------- end of player logic --------------------------*/


}


