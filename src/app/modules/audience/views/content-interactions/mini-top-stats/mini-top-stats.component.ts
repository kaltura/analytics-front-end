import { Component } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ReportService } from 'shared/services';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniTopStatsConfig } from './mini-top-stats.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { InsightsBulletValue } from 'shared/components/insights-bullet/insights-bullet.component';
import { InteractionsBaseReportComponent } from '../interactions-base-report/interactions-base-report.component';

@Component({
  selector: 'app-top-stats',
  templateUrl: './mini-top-stats.component.html',
  styleUrls: ['./mini-top-stats.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniTopStatsComponent'),
    MiniTopStatsConfig,
    ReportService
  ]
})
export class MiniTopStatsComponent extends InteractionsBaseReportComponent {
  protected _componentId = 'mini-top-stats';
  private _dataConfig: ReportDataConfig;
  
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tableData: any[] = [];
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 3, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _bulletValues: InsightsBulletValue[] = [];
  public _stats: { value: number, label: string, desc: string; }[] = [];
  
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _dataConfigService: MiniTopStatsConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._stats = [
      { value: 124, label: 'Times info panel was opened', desc: '4% of all play sessions' },
      { value: 562, label: 'Interactions with related content', desc: '12% of all play sessions' },
      { value: 32, label: 'Quality was manually changed', desc: '1% of all play sessions' },
    ];
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
}
