import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TopContributorsBaseReportComponent } from '../top-contributors-base-report/top-contributors-base-report.component';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';
import { KalturaAPIException, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportService } from 'shared/services';
import { BehaviorSubject } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniTopSourcesConfig } from './mini-top-sources.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'app-contributors-mini-top-sources',
  templateUrl: './mini-top-sources.component.html',
  styleUrls: ['./mini-top-sources.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniTopSourcesComponent'),
    MiniTopSourcesConfig,
    ReportService
  ]
})
export class MiniTopSourcesComponent extends TopContributorsBaseReportComponent implements OnDestroy, OnInit {
  @Input() dateFilterComponent: DateFilterComponent;
  @Input() topSources$: BehaviorSubject<{ table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException }>;
  
  protected _componentId = 'mini-top-sources';
  private _dataConfig: ReportDataConfig;
  
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tableData: any[] = [];
  public _currentDates: string;
  public _topSourceLabel = '';
  public _topSourceCount = 0;
  public _otherSourcesCount = 0;
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 3, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: MiniTopSourcesConfig,
              private pageScrollService: PageScrollService,
              private _logger: KalturaLogger) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  ngOnInit() {
    if (this.topSources$) {
      this.topSources$
        .pipe(cancelOnDestroy(this))
        .subscribe((data: { table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException }) => {
          this._isBusy = data.busy;
          this._blockerMessage = this._errorsManager.getErrorMessage(data.error, { 'close': () => { this._blockerMessage = null; } });
          this._tableData = [];
          if (data.table && data.table.header && data.table.data) {
            this._handleTable(data.table, data.compare); // handle table
          }
        });
    }
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

  private _handleTable(table: KalturaReportTable, compare?: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._tableData = tableData;
    if (this._tableData.length) {
      let totalEntriesCount = 0;
      let topEntriesCount = 0;
      this._tableData.forEach(data => {
        const addedEntries = parseInt(data.added_entries);
        totalEntriesCount += addedEntries;
        if (addedEntries > topEntriesCount) {
          topEntriesCount = addedEntries;
          this._topSourceLabel = data.source;
        }
      });
      this._topSourceCount = topEntriesCount;
      this._otherSourcesCount = totalEntriesCount - this._topSourceCount;
    }
  }
  
  public scrollTo(target: string): void {
    this._logger.trace('Handle scroll to details report action by user', { target });
    if (analyticsConfig.isHosted) {
      const targetEl = document.getElementById(target.substr(1)) as HTMLElement;
      if (targetEl) {
        const menuOffset = 50; // contributors page doesn't have sub menu, subtract menu offset for correct scroll
        this._logger.trace('Send scrollTo event to the host app', { offset: targetEl.offsetTop - menuOffset });
        this._frameEventManager.publish(FrameEvents.ScrollTo, targetEl.offsetTop - menuOffset);
      }
    } else {
      PageScrollConfig.defaultDuration = 500;
      const pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(document, target);
      this.pageScrollService.start(pageScrollInstance);
    }
  }

  ngOnDestroy() {
  }
  
}
