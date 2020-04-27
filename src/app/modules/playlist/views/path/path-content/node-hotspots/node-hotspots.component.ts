import { Component, Input } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { Observable, of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { NodeHotspotsConfig } from './node-hotspots.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { analyticsConfig } from 'configuration/analytics-config';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { SortEvent } from 'primeng/api';
import { QueryBase } from "shared/components/query-base/query-base";
import { HotSpot } from "../path-content.component";

@Component({
  selector: 'app-node-hotspots',
  templateUrl: './node-hotspots.component.html',
  styleUrls: ['./node-hotspots.component.scss'],
  providers: [
    NodeHotspotsConfig,
    ReportService
  ]
})
export class NodeHotspotsComponent extends QueryBase {
  @Input() nodeId = '';
  @Input() duration = 0;
  @Input() hotspots: HotSpot[] = [];

  private _order = '-hotspot_clicked';
  private _reportTypeTopHotspots = reportTypeMap(KalturaReportType.interactiveVideoNodeTopHotspots);
  private _reportTypeSwitchTopHotspots = reportTypeMap(KalturaReportType.intercativeVideoNodeSwitchTopHotspots);
  private _dataConfig: ReportDataConfig;
  private _ignoreFirstSortEvent = true;

  public _dateFilter: DateChangeEvent;
  protected _componentId = 'node-hotspots';

  public _selectedRefineFilters: RefineFilter = null;
  public _columns: string[] = [];
  public _totalCount = 0;
  public _tableData: any[] = [];
  public _firstTimeLoading = true;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: NodeHotspotsConfig) {
    super();

    this._dataConfig = _dataConfigService.getConfig();
  }

  protected _loadReport(sections = this._dataConfig): void {
    // skip first report load due to refine filter set
    if (this._firstTimeLoading) {
      this._firstTimeLoading = false;
      return;
    }
    this._isBusy = true;
    this._blockerMessage = null;

    if (this.nodeId) {
      this._filter.nodeIdsIn = this.nodeId;
    }
    // we need to load 2 separate reports: one for external link clicks and one for node switch clicks as the player use different events
    // create 2 report calls and use forkJoin to get them both
    const reportConfigTopHotSpots: ReportConfig = { reportType: this._reportTypeTopHotspots, filter: this._filter, pager: this._pager, order: this._order };
    const topHotSpots = this._reportService.getReport(reportConfigTopHotSpots, sections, false)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        if (this.nodeId) {
          this._compareFilter.nodeIdsIn = this.nodeId;
        }

        const compareReportConfig: ReportConfig = { reportType: this._reportTypeTopHotspots, filter: this._compareFilter, pager: this._pager, order: this._order };
        return this._reportService.getReport(compareReportConfig, sections, false)
          .pipe(map(compare => ({ report, compare })));
      }));

    const reportConfigSwitchTopHotSpots: ReportConfig = { reportType: this._reportTypeSwitchTopHotspots, filter: this._filter, pager: this._pager, order: this._order };
    const topSwitchHotSpots = this._reportService.getReport(reportConfigSwitchTopHotSpots, sections, false)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        if (this.nodeId) {
          this._compareFilter.nodeIdsIn = this.nodeId;
        }

        const compareReportConfig: ReportConfig = { reportType: this._reportTypeSwitchTopHotspots, filter: this._compareFilter, pager: this._pager, order: this._order };
        return this._reportService.getReport(compareReportConfig, sections, false)
          .pipe(map(compare => ({ report, compare })));
      }));

    // once both reports return, we need to merge the results and then generate the table and compare data
    Observable.forkJoin(topHotSpots, topSwitchHotSpots)
      .subscribe(([topHotSpots, switchTopHotSpots]) => {
        this._tableData = [];
        this._totalCount = 0;
        // override headers for nodeSwitch report
        let updatedSwitchTopHotSpots: any = Object.assign(switchTopHotSpots);
          if (switchTopHotSpots.report && switchTopHotSpots.report.table && switchTopHotSpots.report.table.header) {
            updatedSwitchTopHotSpots.report.table.header = switchTopHotSpots.report.table.header.replace('count_node_switch', 'count_hotspot_clicked');
          }
        const {report, compare } = this.mergeReports(topHotSpots, updatedSwitchTopHotSpots);
          if (compare) {
             this._handleCompare(report, compare);
          } else {
            if (report && report.table && report.table.header && report.table.data) {
              this._handleTable(report.table); // handle totals
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

  // function use to merge the results of the 2 reports. As the report fields are the same we just need to extend the data string
  private mergeReports (topHotSpots, switchTopHotSpots): {report, compare} {
    // handle regular report
    let report = topHotSpots.report;
    if (topHotSpots.report.table && topHotSpots.report.table.header && topHotSpots.report.table.data) {
      if (switchTopHotSpots.report.table && switchTopHotSpots.report.table.header && switchTopHotSpots.report.table.data) {
        report.table.data += switchTopHotSpots.report.table.data;
      }
    } else {
      if (switchTopHotSpots.report.table && switchTopHotSpots.report.table.header && switchTopHotSpots.report.table.data) {
        report = switchTopHotSpots.report;
      }
    }
    // handle compare
    let compare = topHotSpots.compare;
    if (topHotSpots.compare && topHotSpots.compare.table && topHotSpots.compare.table.header && topHotSpots.compare.table.data) {
      if (switchTopHotSpots.compare && switchTopHotSpots.compare.table && switchTopHotSpots.compare.table.header && switchTopHotSpots.compare.table.data) {
        compare.table.data += switchTopHotSpots.compare.table.data;
      }
    } else {
      if (switchTopHotSpots.compare && switchTopHotSpots.compare.table && switchTopHotSpots.compare.table.header && switchTopHotSpots.compare.table.data) {
        compare = switchTopHotSpots.compare;
      }
    }
    return {report, compare};
  }

  protected _updateRefineFilter(): void {
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
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

  private extendHotspotsData(): void {
    this._tableData.forEach(tableRow => {
      // extend hotspots data from hotspots array
      this.hotspots.forEach(hotspot => {
        if (hotspot.id === tableRow.hotspot_id) {
          Object.assign(tableRow, hotspot);
        }
      });
    });
  }

  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = tableData.length;
    this._columns = columns;
    this._tableData = tableData;
    this.extendHotspotsData();
    // remove deleted hotspots
    this._tableData = this._tableData.filter(hotspot => hotspot.name);
  }

  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    const comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };

    if (current.table && compare.table) {
      const { columns, tableData } = this._compareService.compareTableData(
        currentPeriod,
        comparePeriod,
        current.table,
        compare.table,
        this._dataConfig.table,
        this._reportInterval,
        'hotspot_id'
      );
      this._totalCount = tableData.length;
      this._columns = columns;
      this._tableData = tableData;
      this.extendHotspotsData();
    }
  }

  public _onSortChanged(event: SortEvent): void {
    if (event.field && event.order && !this._isCompareMode && !this._ignoreFirstSortEvent) {
      if (event.order === 1 ) {
        this._tableData = this._tableData.sort((a, b) => parseInt(a.count_hotspot_clicked) > parseInt(b.count_hotspot_clicked) ? 1 : -1);
      } else {
        this._tableData = this._tableData.sort((a, b) => parseInt(a.count_hotspot_clicked) < parseInt(b.count_hotspot_clicked) ? 1 : -1);
      }
    }
    this._ignoreFirstSortEvent = false;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    const userIds = event.length
      ? event
        .map(filter => filter.value.id === '0' ? 'Unknown' : filter.value.id) // replace id=0 with Unknown due to the server limitation
        .join(analyticsConfig.valueSeparator)
      : null;

    if (userIds) {
      this._filter.userIds = userIds;

      if (this._compareFilter) {
        this._compareFilter.userIds = userIds;
      }
    } else {
      delete this._filter.userIds;

      if (this._compareFilter) {
        delete this._compareFilter.userIds;
      }
    }

    this._loadReport();
  }
}
