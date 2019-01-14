import { Component } from '@angular/core';
import {AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportService} from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import {
  KalturaEndUserReportInputFilter,
  KalturaFilterPager,
  KalturaObjectBaseFactory, KalturaReportGraph,
  KalturaReportInputFilter,
  KalturaReportInterval,
  KalturaReportTable, KalturaReportTotal,
  KalturaReportType
} from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { CompareService } from 'shared/services/compare.service';
import { SourcesDataConfig } from './sources-data.config';
import { TrendService } from 'shared/services/trend.service';
import { TopContributorsBaseReportComponent } from '../top-contributors-base-report/top-contributors-base-report.component';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import * as moment from "moment";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {isEmptyObject} from "shared/utils/is-empty-object";

@Component({
  selector: 'app-contributors-sources',
  templateUrl: './sources.component.html',
  styleUrls: ['./sources.component.scss'],
  providers: [ReportService, SourcesDataConfig]
})
export class ContributorsSourcesComponent extends TopContributorsBaseReportComponent {
  private _compareFilter: KalturaEndUserReportInputFilter = null;
  private _pager = new KalturaFilterPager();
  private _dataConfig: ReportDataConfig;
  private _reportInterval = KalturaReportInterval.months;
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false,
    interval: this._reportInterval,
  });
  
  protected _componentId = 'sources';
  
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = true;
  public _isCompareMode: boolean;
  public _columns: string[] = [];
  public _compareFirstTimeLoading = true;
  public _reportType = KalturaReportType.topSources;
  public _barChartData: any = {};
  public _tableData: any[] = [];
  public _compareTableData: any[] = [];
  public _selectedMetrics: string;
  public _tabsData: Tab[] = [];
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _trendService: TrendService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: SourcesDataConfig) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  protected _updateRefineFilter(): void {
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  protected _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: null };
    this._reportService.getReport(reportConfig, { graph: null })
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        const compareReportConfig = {
          reportType: this._reportType,
          filter: this._compareFilter,
          pager: this._pager,
          order: null
        };
        return this._reportService.getReport(compareReportConfig, { graph: null })
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._barChartData = {};
          this._tableData = [];
          this._compareTableData = [];

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
    this._isCompareMode = false;
    if (this._dateFilter.compare.active) {
      this._isCompareMode = true;
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDay = compare.startDay;
      this._compareFilter.toDay = compare.endDay;
    } else {
      this._compareFilter = null;
      this._compareFirstTimeLoading = true;
    }
  }
  
  public _onTabChange(tab: Tab): void {
    this._selectedMetrics = tab.key;
  }

  private _handleTable(table: KalturaReportTable, compare?: Report): void {
    this._tabsData = this._reportService.parseTotals(table, this._dataConfig.totals, this._selectedMetrics);
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._tableData = tableData;

    if (compare && compare.table && compare.table.header && compare.table.data) {
      const { tableData: compareTableData } = this._reportService.parseTableData(compare.table, this._dataConfig.table);
      this._compareTableData = compareTableData;
      this._compareFirstTimeLoading = false;
    }
  }

}
