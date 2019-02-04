import { Component, Input } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniPeakDayConfig } from './mini-peak-day.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';


@Component({
  selector: 'app-engagement-mini-peak-day',
  templateUrl: './mini-peak-day.component.html',
  styleUrls: ['./mini-peak-day.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniPeakDayComponent'),
    MiniPeakDayConfig,
    ReportService,
  ]
})
export class MiniPeakDayComponent extends EngagementBaseReportComponent {
  @Input() dateFilterComponent: DateFilterComponent;

  private _order = '-count_plays';
  private _reportType = KalturaReportType.userEngagementTimeline;
  private _dataConfig: ReportDataConfig;
  
  protected _componentId = 'mini-peak-day';
  
  public _isBusy: boolean;
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
              private _dataConfigService: MiniPeakDayConfig) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        const pager = new KalturaFilterPager({ pageSize: 1, pageIndex: 1 });
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
          const err: ErrorDetails = this._errorsManager.getError(error);
          let buttons: AreaBlockerMessageButton[] = [];
          if (err.forceLogout) {
            buttons = [{
              label: this._translate.instant('app.common.ok'),
              action: () => {
                this._blockerMessage = null;
                this._authService.logout();
              }
            }];
          } else {
            buttons = [{
              label: this._translate.instant('app.common.close'),
              action: () => {
                this._blockerMessage = null;
              }
            },
              {
                label: this._translate.instant('app.common.retry'),
                action: () => {
                  this._loadReport();
                }
              }];
          }
          this._blockerMessage = new AreaBlockerMessage({
            title: err.title,
            message: err.message,
            buttons
          });
        });
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDay = this._dateFilter.startDay;
    this._filter.toDay = this._dateFilter.endDay;
    this._filter.interval = KalturaReportInterval.days;
    this._reportInterval = KalturaReportInterval.days;
    this._pager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDay = compare.startDay;
      this._compareFilter.toDay = compare.endDay;
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
      this._peakDayData = tableData[0];
    }
  }
  
}
