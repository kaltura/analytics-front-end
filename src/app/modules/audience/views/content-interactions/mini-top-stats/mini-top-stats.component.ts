import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { Report, ReportService } from 'shared/services';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniTopStatsConfig } from './mini-top-stats.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { InsightsBulletValue } from 'shared/components/insights-bullet/insights-bullet.component';
import { InteractionsBaseReportComponent } from '../interactions-base-report/interactions-base-report.component';
import { BehaviorSubject } from 'rxjs';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

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
export class MiniTopStatsComponent extends InteractionsBaseReportComponent implements OnInit, OnDestroy {
  @Input() highlights$: BehaviorSubject<{ current: Report, compare: Report, busy: boolean, error: AreaBlockerMessage }>;
  
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
  public _stats: { value: number, label: string, desc: string; }[] = [];
  
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _dataConfigService: MiniTopStatsConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  ngOnInit(): void {
    if (this.highlights$) {
      this.highlights$
        .pipe(cancelOnDestroy(this))
        .subscribe(({ current, busy, error }) => {
          this._isBusy = busy;
          this._blockerMessage = error;
          this._stats = [];
          if (current && current.totals && current.table) {
            this._handleData(current); // handle totals
          }
        });
    }
  }
  
  ngOnDestroy(): void {
  }
  
  private _handleData(report: Report): void {
    const tabsData = this._reportService.parseTotals(report.totals, this._dataConfig[ReportDataSection.totals]);

    this._stats = tabsData.map(item => ({
      value: Number(item.value),
      label: this._translate.instant(`app.contentInteractions.${item.key}`),
      desc: '' // tbd
    }));
  }
  
  protected _loadReport(sections = this._dataConfig): void {
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
