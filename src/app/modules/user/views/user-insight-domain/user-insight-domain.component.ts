import { Component, Input, OnDestroy } from '@angular/core';
import { of as ObservableOf } from 'rxjs';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { InsightsBulletValue } from 'shared/components/insights-bullet/insights-bullet.component';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { UserBase } from '../user-base/user-base';
import { UserInsightDomainConfig } from './user-insight-domain.config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { getColorPalette, getColorsBetween } from 'shared/utils/colors';
import { map, switchMap } from 'rxjs/operators';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-user-insight-domain',
  templateUrl: './user-insight-domain.component.html',
  styleUrls: ['./user-insight-domain.component.scss'],
  providers: [
    ReportService,
    UserInsightDomainConfig
  ],
})
export class UserInsightDomainComponent extends UserBase implements OnDestroy {
  @Input() userId: string;

  protected _componentId = 'insight-top-domains';
  private _dataConfig: ReportDataConfig;
  private _reportType = reportTypeMap(KalturaReportType.topSyndication);
  private _order = '-count_plays';

  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _topSourceLabel = '';
  public _compareTopSourceLabel = '';
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _bulletValues: InsightsBulletValue[] = [];
  public _compareBulletValues: InsightsBulletValue[] = [];
  public _currentDates: string;
  public _compareDates: string;
  public _colors = getColorsBetween(getColorPalette()[0], getColorPalette()[7], 2);
  public _currentTotalPlays = 0;
  public _compareTotalPlays = 0;

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: UserInsightDomainConfig) {
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
          this._bulletValues = [];
          this._compareBulletValues = [];
          this._topSourceLabel = null;
          this._compareTopSourceLabel = null;

          if (report.totals) {
            this._handleTotals(report.totals, compare ? compare.totals : null);

            if (report.table && report.table.header && report.table.data) {
              this._handleTable(report.table, compare ? compare.table : null); // handle table
            }
          }

          if (this._isCompareMode) {
            this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM DD, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM DD, YYYY');
            this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM DD, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM DD, YYYY');
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

  private _handleTotals(current: KalturaReportTotal, compare?: KalturaReportTotal): void {
    const currentData = this._reportService.parseTotals(current, this._dataConfig[ReportDataSection.totals]);
    if (currentData.length) {
      this._currentTotalPlays = parseInt(currentData[0].value, 10);
    }

    if (compare) {
      const compareData = this._reportService.parseTotals(compare, this._dataConfig[ReportDataSection.totals]);

      if (compareData) {
        this._compareTotalPlays = parseInt(compareData[0].value, 10);
      }
    }

  }

  private _handleTable(table: KalturaReportTable, compare?: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    if (tableData && tableData.length) {
      const currentTop = tableData[0];
      const topPlays = parseInt(currentTop['count_plays'], 10);
      const othersPlays = this._currentTotalPlays - topPlays;

      if (topPlays || othersPlays) {
        this._topSourceLabel = currentTop['domain_name'];
        this._bulletValues = [
          { value: topPlays, label: this._topSourceLabel },
          { value: othersPlays, label: this._translate.instant('app.contributors.others') },
        ];

        if (compare && compare.data && compare.header) {
          const { tableData: compareTableData } = this._reportService.parseTableData(compare, this._dataConfig.table);
          const compareTop = compareTableData[0];
          const compareTopPlays = parseInt(compareTop['count_plays'], 10);
          const compareOthersPlays = this._compareTotalPlays - compareTopPlays;
          if (compareTopPlays || compareOthersPlays) {
            this._compareTopSourceLabel = compareTop['domain_name'];
            this._compareBulletValues = [
              { value: compareTopPlays, label: this._compareTopSourceLabel },
              { value: compareOthersPlays, label: this._translate.instant('app.contributors.others') },
            ];
          }
        } else {
          this._currentDates = null;
          this._compareDates = null;
        }
      }
    }
  }

  public _updateColors(colors: string[]): void {
    this._colors = colors;
  }
}
