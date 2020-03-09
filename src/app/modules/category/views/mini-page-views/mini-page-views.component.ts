import {Component, EventEmitter, Input, Output} from '@angular/core';
import {
  KalturaEndUserReportInputFilter,
  KalturaFilterPager, KalturaObjectBaseFactory,
  KalturaReportInterval,
  KalturaReportTotal,
  KalturaReportType
} from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniPageViewsConfig } from './mini-page-views.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { CategoryBase } from "../category-base/category-base";

@Component({
  selector: 'app-category-mini-page-views',
  templateUrl: './mini-page-views.component.html',
  styleUrls: ['./mini-page-views.component.scss'],
  providers: [
    KalturaLogger.createLogger('CategoryMiniTPageViewsComponent'),
    MiniPageViewsConfig,
    ReportService,
  ]
})
export class CategoryMiniPageViewsComponent extends CategoryBase {
  @Input() dateFilterComponent: DateFilterComponent;
  @Input() categoryId: string = null;
  
  @Output() openFilterClick = new EventEmitter<void>();
  
  private _order = '-count_plays';
  private _reportType = reportTypeMap(KalturaReportType.userTopContent);
  private _dataConfig: ReportDataConfig;
  
  protected _componentId = 'mini-page-views';
  public _currentDates: string;
  public _compareDates: string;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 3, pageIndex: 1 });
  public _currentValues = [];
  public _compareValues = [];
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: MiniPageViewsConfig,
              private _logger: KalturaLogger) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
  
    if (this.categoryId && !this._filter.categoriesIdsIn && !this._filter.playbackContextIdsIn) {
      this._filter.categoriesIdsIn = this.categoryId;
    }
    
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
  
        if (this.categoryId && !this._compareFilter.categoriesIdsIn && !this._compareFilter.playbackContextIdsIn) {
          this._compareFilter.categoriesIdsIn = this.categoryId;
        }
        
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: this._order };
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (compare) {
            this._handleCompare(report, compare);
          } else {
            if (report.totals) {
              this._handleTotals(report.totals); // handle table
            }
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
  
  private _handleTotals(totals: KalturaReportTotal): void {
    this._currentValues = this._reportService.parseTotals(totals, this._dataConfig.totals);
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
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
  
  private _handleCompare(current: Report, compare: Report): void {
    this._handleTotals(current.totals);
    this._compareValues = this._reportService.parseTotals(compare.totals, this._dataConfig.totals);
    this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.endDate).format('MMM D, YYYY');
    this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.compare.endDate).format('MMM D, YYYY');
  }
  
  public openFilter(): void {
    this.openFilterClick.emit();
  }
  
}
