import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import { KalturaAPIException, KalturaClient, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import * as moment from 'moment';
import {AuthService, ErrorsManagerService, Report, ReportConfig, ReportService} from 'shared/services';
import {BehaviorSubject, Observable} from 'rxjs';
import {ReportDataConfig} from 'shared/services/storage-data-base.config';
import {DateFilterUtils} from 'shared/components/date-filter/date-filter-utils';
import {PathContentDataConfig} from './path-content-data.config';
import {analyticsConfig} from 'configuration/analytics-config';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {PlaylistBase} from "../../shared/playlist-base/playlist-base";
import {reportTypeMap} from "shared/utils/report-type-map";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";
import { PathContentService , Node } from "./path-content.service";

@Component({
  selector: 'app-path-content',
  templateUrl: './path-content.component.html',
  styleUrls: ['./path-content.component.scss'],
  providers: [
    KalturaLogger.createLogger('TopContentComponent'),
    PathContentDataConfig,
    PathContentService,
    ReportService
  ]
})
export class PathContentComponent extends PlaylistBase implements OnInit, OnDestroy {
  @Input() playlistId: string;
  @Input() isPath: boolean;
  private _partnerId = this._authService.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http') ? analyticsConfig.kalturaServer.uri : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  private _order = '-count_node_plays';
  private _compareFilter: KalturaReportInputFilter = null;
  private _dataConfig: ReportDataConfig;
  private _reportInterval = KalturaReportInterval.months;
  private _filter = new KalturaReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  protected _componentId = 'path-content';

  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy: boolean;
  public _tableData: Node[] = [];
  public _compareTableData: Node[] = [];
  public _isCompareMode: boolean;
  public _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  public _firstTimeLoading = true;
  public _compareFirstTimeLoading = true;
  public _currentDates: string;
  public _compareDates: string;
  public _reportType = reportTypeMap(KalturaReportType.interactiveVideoTopNodes);
  public drillDown: Node = null;
  public _duration = 0;

  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _pathService: PathContentService,
              private _frameEventManager: FrameEventManagerService,
              private _dataConfigService: PathContentDataConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit() {}

  private loadIVReport(): Observable<{report: Report, compare: any}> {
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    reportConfig.filter.rootEntryIdIn = this.playlistId;
    return this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        this._compareFilter.rootEntryIdIn = this.playlistId;
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: this._order };
        return this._reportService.getReport(compareReportConfig, this._dataConfig)
          .pipe(map(compare => ({ report, compare })));
      }));
  }

  protected _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;

    const loadIVData$ = this.isPath ? this._pathService.loadPathData(this.playlistId) : this._pathService.loadIVData(this.playlistId);
    const loadIVReport$ = this.loadIVReport();

    Observable.forkJoin(loadIVData$, loadIVReport$)
      .subscribe(( value: [ Node[], {report: Report, compare: any} ] ) => {
        const nodes: Node[] = value[0];
        const { report, compare } = {...value[1]};
          this._tableData = [];
          this._compareTableData = [];
          if (report.table) {
            this._handleTable(nodes, report.table, compare); // handle table
          }
          this._isBusy = false;
          this._firstTimeLoading = false;
          this._compareFirstTimeLoading = false;
          this.updateLayout();
        },
        error => {
          this._isBusy = false;
          if (error.code === "NO_INTERACTIVITY_DATA") {
            this._firstTimeLoading = false;
          } else {
            const actions = {
              'close': () => {
                this._blockerMessage = null;
              },
              'retry': () => {
                this._loadReport();
              },
            };
            this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
          }
        });
  }

  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    this._isCompareMode = false;
    if (this._dateFilter.compare.active) {
      this._compareFirstTimeLoading = true;
      this._isCompareMode = true;
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
    } else {
      this._compareFilter = null;
      this._compareFirstTimeLoading = true;
    }
  }

  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }

  private _handleTable(nodes: Node[], table: KalturaReportTable, compare?: Report): void {
    const extendTableRow = (item) => {
      nodes.forEach(node => {
        if (node.id === item.node_id) {
          item = {...item, ...node, thumbnailUrl: this.getThumbnailUrl(node)};
        }
      });
      return item;
    };
    if (table.header && table.data) {
      const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
      this._tableData = tableData.map(extendTableRow).filter(node => node.node_id !== '0' && typeof node.name !== "undefined"); // add missing properties and remove nodes with id='0' (backend issue) and deleted nodes
    }
    this.appendMissingNodes(this._tableData, nodes);
    this._currentDates = this._compareDates = null;

    if (compare && compare.table) {
      if (compare.table.header && compare.table.data) {  // we have data for the compare table nodes
        const {tableData: compareTableData} = this._reportService.parseTableData(compare.table, this._dataConfig.table);
        this._compareTableData = compareTableData.map(extendTableRow).filter(node => node.node_id !== '0' && typeof node.name !== "undefined"); // add missing properties and remove nodes with id='0' (backend issue) and deleted nodes
      }
      this.appendMissingNodes(this._compareTableData, nodes);
      this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM D, YYYY');
      this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM D, YYYY');
    }
  }

  private getThumbnailUrl(node: Node): string {
    return `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${node.entryId}/width/256/height/144?rnd=${Math.random()}`;
  }

  private appendMissingNodes(table: any[], nodes: Node[]) {
    // add nodes with no data: missing from the report, available in the IV JSON data
    nodes.forEach(node => {
      if (table.filter(row => row.node_id === node.id).length === 0) { // node doesn't exist in the report
        table.push({...node, count_node_plays: 0, unique_known_users: 0, avg_completion_rate: 0, thumbnailUrl: this.getThumbnailUrl(node)}); // add node to the table
      }
    });
  }

  private updateLayout(): void {
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { 'height': document.getElementById('analyticsApp').getBoundingClientRect().height });
      }, 200);
    }
  }

  public _drillDown(node: Node): void {
    this.drillDown = node;
  }

  public _drillUp(): void {
    this.drillDown = null;
  }

  public onUpdateDuration(duration: number): void {
    this._duration = duration;
  }

  ngOnDestroy() {
  }
}
