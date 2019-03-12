import { Component, Input } from '@angular/core';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInputFilter, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { ModerationDataConfig } from './moderation-data.config';
import { TranslateService } from '@ngx-translate/core';
import { EChartOption } from 'echarts';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { InteractionsBaseReportComponent } from '../interactions-base-report/interactions-base-report.component';
import { BarChartRow } from 'shared/components/horizontal-bar-chart/horizontal-bar-chart.component';

@Component({
  selector: 'app-moderation-report',
  templateUrl: './moderation.component.html',
  styleUrls: ['./moderation.component.scss'],
  providers: [
    KalturaLogger.createLogger('ModerationComponent'),
    ModerationDataConfig,
    ReportService,
  ],
})
export class ModerationComponent extends InteractionsBaseReportComponent {
  private _reportType = KalturaReportType.contentDropoff;
  private _filter = new KalturaReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _compareFilter: KalturaReportInputFilter = null;
  private _reportInterval = KalturaReportInterval.months;
  private _dataConfig: ReportDataConfig;
  private _mockData: BarChartRow[] = [];
  
  protected _dateFilter: DateChangeEvent;
  protected _refineFilter: RefineFilter = [];
  protected _componentId = 'abuse';
  
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tableData: BarChartRow[] = [];
  public _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 4, pageIndex: 1 });
  public _totalCount: number;
  public _currentPeriod: { from: number, to: number };
  public _comparePeriod: { from: number, to: number };
  
  public get isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: ModerationDataConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  protected _loadReport(): void {
    this._mockData = [
      {
        index: 1,
        label: 'Hateful or abusive content',
        value: [60, 20],
        tooltip: [
          { value: '43', label: 'Lorem ipsum 1' },
          { value: '3', label: 'Lorem ipsum 1' },
        ]
      },
      {
        index: 2,
        label: 'Infringe my rights',
        value: [30, 3],
        tooltip: [
          { value: '21', label: 'Lorem ipsum 2' },
          { value: '1', label: 'Lorem ipsum 2' },
        ]
      },
      {
        index: 3,
        label: 'Harmful and Dangerous Act',
        value: [10, 42],
        tooltip: [
          { value: '12', label: 'Lorem ipsum 3' },
          { value: '25', label: 'Lorem ipsum 3' },
        ]
      },
      {
        index: 4,
        label: 'Violent or Repulsive',
        value: [10, 42],
        tooltip: [
          { value: '12', label: 'Lorem ipsum 4' },
          { value: '52', label: 'Lorem ipsum 4' },
        ]
      },
      {
        index: 5,
        label: 'Super long string to test ellipsis',
        value: [15, 10],
        tooltip: [
          { value: '12', label: 'Lorem ipsum 5' },
          { value: '62', label: 'Lorem ipsum 5' },
        ]
      }
    ];
  
    this._tableData = this._mockData.slice(0, this._pager.pageSize);
    this._totalCount = this._mockData.length;
  
    this._currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    if (this._compareFilter) {
      this._comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };
    } else {
      this._comparePeriod = null;
    }
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
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    refineFilterToServerValue(this._refineFilter, this._filter);
    if (this._compareFilter) {
      refineFilterToServerValue(this._refineFilter, this._compareFilter);
    }
  }
  
  public _onPaginationChanged(event: { page: number, first: number, rows: number, pageCount: number }): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._tableData = this._mockData.slice(event.first, event.first + event.rows);
    }
  }
}
