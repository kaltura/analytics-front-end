import { Component, Input, OnDestroy } from '@angular/core';
import { of as ObservableOf } from 'rxjs';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReport, KalturaReportGraph, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { UserBase } from '../user-base/user-base';
import { UserInsightPlaysConfig } from './user-insight-plays.config';
import { map, switchMap } from 'rxjs/operators';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-user-insight-plays',
  templateUrl: './user-insight-plays.component.html',
  styleUrls: ['./user-insight-plays.component.scss'],
  providers: [
    ReportService,
    UserInsightPlaysConfig
  ],
})
export class UserInsightPlaysComponent extends UserBase implements OnDestroy {
  @Input() userId: string;
  
  protected _componentId = 'insight-plays';
  private _dataConfig: ReportDataConfig;
  private _reportType = reportTypeMap(KalturaReportType.userHighlights);
  private _order = '-date_id';
  
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: analyticsConfig.defaultPageSize, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _currentDates: string;
  public _compareDates: string;
  public _tableData: TableRow[] = [];
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: UserInsightPlaysConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  ngOnDestroy(): void {
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    this._filter.userIds = this.userId;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager };
    
    sections = { ...sections }; // make local copy
    delete sections[ReportDataSection.table]; // remove table config to prevent table request
    
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        this._compareFilter.userIds = this.userId;
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order, pager: this._pager };
        
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];
          this._compareDates = null;
          this._currentDates = null;
          if (compare) {
            this._handleCompare(report.graphs, compare.graphs);
          } else {
            if (report.graphs && report.graphs.length) {
              this._handleTable(report.graphs);
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
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  private _maxPlaysRow(tableData: TableRow[]): TableRow {
    return tableData.reduce((prev, current) => (prev['count_plays'] > current['count_plays']) ? prev : current);
  }
  
  private _handleCompare(current: KalturaReportGraph[], compare: KalturaReportGraph[]): void {
    let currentMaxPlays = null;
    let compareMaxPlays = null;
    
    if (current && current.length) {
      const { tableData } = this._reportService.tableFromGraph(
        current,
        this._dataConfig.table,
        this._reportInterval,
      );
  
      currentMaxPlays = this._maxPlaysRow(tableData);
      currentMaxPlays['count_plays'] = ReportHelper.numberOrZero(currentMaxPlays['count_plays']);
    }
    
    if (compare && compare.length) {
      const { tableData: compareTableData } = this._reportService.tableFromGraph(
        compare,
        this._dataConfig.table,
        this._reportInterval,
      );
  
      compareMaxPlays = this._maxPlaysRow(compareTableData);
      compareMaxPlays['count_plays'] = ReportHelper.numberOrZero(compareMaxPlays['count_plays']);
    }
  
    if (currentMaxPlays && compareMaxPlays) {
      this._tableData = [currentMaxPlays, compareMaxPlays];
      this._currentDates = currentMaxPlays['date_id'];
      this._compareDates = compareMaxPlays['date_id'];
    }
  }
  
  private _handleTable(graphs: KalturaReportGraph[]): void {
    const { tableData } = this._reportService.tableFromGraph(
      graphs,
      this._dataConfig.table,
      this._reportInterval,
    );
    const maxPlaysRow = this._maxPlaysRow(tableData);
    
    // find last day with plays
    let lastPlaysDay = null;
    for (let i = tableData.length - 1; i >= 0; i--) {
      if (tableData[i]['count_plays'] !== 0) {
        lastPlaysDay = tableData[i];
        break;
      }
    }
  
    if (lastPlaysDay && maxPlaysRow) {
      lastPlaysDay['count_plays'] = ReportHelper.numberOrZero(lastPlaysDay['count_plays']);
      maxPlaysRow['count_plays'] = ReportHelper.numberOrZero(maxPlaysRow['count_plays']);
  
      this._tableData = [lastPlaysDay, maxPlaysRow];
      this._currentDates = lastPlaysDay['date_id'];
      this._compareDates = maxPlaysRow['date_id'];
    }
  }
}
