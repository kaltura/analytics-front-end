import { Component } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniTopPlaybackSpeedConfig } from './mini-top-playback-speed.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { InsightsBulletValue } from 'shared/components/insights-bullet/insights-bullet.component';
import { InteractionsBaseReportComponent } from '../interactions-base-report/interactions-base-report.component';

@Component({
  selector: 'app-top-playback-speed',
  templateUrl: './mini-top-playback-speed.component.html',
  styleUrls: ['./mini-top-playback-speed.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniTopStatsComponent'),
    MiniTopPlaybackSpeedConfig,
    ReportService
  ]
})
export class MiniTopPlaybackSpeedComponent extends InteractionsBaseReportComponent {
  protected _componentId = 'mini-top-speed';
  
  private _dataConfig: ReportDataConfig;
  private _reportType = KalturaReportType.playbackRate;
  
  public _firstTimeLoading = true;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _currentDates: string;
  public _topSpeedLabel = '';
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager();
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _bulletValues: InsightsBulletValue[] = [];
  
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: MiniTopPlaybackSpeedConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: null, pager: this._pager };
    this._reportService.getReport(reportConfig, sections)
      .subscribe(report => {
          this._bulletValues = [];
          this._topSpeedLabel = null;
          
          if (report.table && report.table.data && report.table.header) {
            this._handleTable(report.table);
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
    this._pager.pageIndex = 1;
  }
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
  }
  
  private _handleTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._topSpeedLabel = `X${tableData.reduce((prev, current) => (Number(prev['count_speed']) > Number(current['count_speed']) ? prev : current))['playback_rate']}`;
    this._bulletValues = tableData
      .sort((data1, data2) => data1['playback_rate'].localeCompare(data2['playback_rate'], undefined, { numeric: true }))
      .map(item => ({ value: Number(item['count_speed']), label: `x${item['playback_rate']}` }));
  }
}
