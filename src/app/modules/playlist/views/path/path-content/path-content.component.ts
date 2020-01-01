import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {
  FileAssetListAction, FileAssetServeAction,
  KalturaAPIException,
  KalturaClient,
  KalturaFileAsset, KalturaFileAssetFilter, KalturaFileAssetListResponse,
  KalturaFileAssetObjectType,
  KalturaFilterPager,
  KalturaObjectBaseFactory, KalturaReportInputFilter,
  KalturaReportInterval,
  KalturaReportTable,
  KalturaReportType
} from 'kaltura-ngx-client';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import * as moment from 'moment';
import {AuthService, ErrorsManagerService, Report, ReportConfig, ReportService} from 'shared/services';
import {BehaviorSubject, Observable} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {CompareService} from 'shared/services/compare.service';
import {ReportDataConfig} from 'shared/services/storage-data-base.config';
import {DateFilterUtils} from 'shared/components/date-filter/date-filter-utils';
import {PathContentDataConfig} from './path-content-data.config';
import {analyticsConfig} from 'configuration/analytics-config';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {PlaylistBase} from "../../shared/playlist-base/playlist-base";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";
import {HttpClient} from "@angular/common/http";
import {reportTypeMap} from "shared/utils/report-type-map";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";

export interface Node {
  id?: string;
  isHome?: boolean;
  level?: number;
  entryId?: string;
  name?: string;
  thumbnailUrl?: string;
  plays?: number;
  viewers?: number;
  completionRate?: number;
  prefetchNodeIds?: string[];
  deleted?: boolean;
  deletedDate?: string;
}

@Component({
  selector: 'app-path-content',
  templateUrl: './path-content.component.html',
  styleUrls: ['./path-content.component.scss'],
  providers: [
    KalturaLogger.createLogger('TopContentComponent'),
    PathContentDataConfig,
    ReportService
  ]
})
export class PathContentComponent extends PlaylistBase implements OnInit, OnDestroy {
  @Input() playlistId: string;
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
  
  public topVideos$: BehaviorSubject<{ table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException }> = new BehaviorSubject({ table: null, compare: null, busy: false, error: null });
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
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _kalturaClient: KalturaClient,
              private http: HttpClient,
              private _frameEventManager: FrameEventManagerService,
              private _dataConfigService: PathContentDataConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  ngOnInit() {}
  
  private loadIVData(): Observable<Node[]> {
    const fileAssetsListFilter: KalturaFileAssetFilter = new KalturaFileAssetFilter();
    fileAssetsListFilter.fileAssetObjectTypeEqual = KalturaFileAssetObjectType.entry;
    fileAssetsListFilter.objectIdEqual = this.playlistId;
    const fileAssetsListAction = new FileAssetListAction({filter: fileAssetsListFilter});
    return this._kalturaClient.request(fileAssetsListAction)
      .pipe(cancelOnDestroy(this))
      .pipe(switchMap((response: KalturaFileAssetListResponse) => {
        let jsonFileAssetId = 0;
        let projectFileAssetId = 0;
        response.objects.forEach((fileAsset: KalturaFileAsset) => {
          if (fileAsset.name === "GRAPH_DATA") {
            jsonFileAssetId = fileAsset.id;
          }
          if (fileAsset.name === "PROJECT_DATA") {
            projectFileAssetId = fileAsset.id;
          }
        });
        const fileAssetsServeAction = new FileAssetServeAction({id: jsonFileAssetId});
        const projectAssetsServeAction = new FileAssetServeAction({id: projectFileAssetId});
        return Observable.forkJoin(this._kalturaClient.request(fileAssetsServeAction), this._kalturaClient.request(projectAssetsServeAction));
      }))
      .pipe(switchMap(responses => {
        return Observable.forkJoin(this.http.get(`${responses[0].url}&rnd=${Math.random()}`), this.http.get(`${responses[1].url}&rnd=${Math.random()}`));
      }))
      .pipe(map(dataArray => {
        return this.parseIVData(dataArray[0]).concat(this.parseIVDeletedNodes(dataArray[1]));
      }));
  }
  
  private parseIVData(data): Node[] {
    let nodes: Node[] = [];   // the returned nodes array
    let currentLevel = 1;     // initial level. We use this variable to increment the level for each pass on the nodes array
    let nextLevelNodes = [];  // array holding all the found next level nodes to be scanned for
    let levelsNodeFound = 0;  // counter used to check if all node levels were found
    const startNodeId = data.settings && data.settings.startNodeId ? data.settings.startNodeId : '';  // get the start node ID from the JSON data. Used to mark the start node in the table (home icon)
    if (data.nodes) {
      // first run on all nodes to find the start node. We also use this run to create all the IV nodes array, setting the level only to the start node (level = 0)
      data.nodes.forEach(node => {
        const newNode: Node = {
          id: node.id,
          isHome: node.id === startNodeId,
          name: node.name,
          entryId: node.entryId,
          prefetchNodeIds: node.prefetchNodeIds
        };
        if (node.id === startNodeId) {
          newNode.level = currentLevel; // set level 0
          levelsNodeFound++;            // increment found nodes with levels counter
          nextLevelNodes = [...nextLevelNodes, ...new Set(node.prefetchNodeIds)]; // set the array to scan next with the found node children nodes
        }
        nodes.push(newNode); // save the found node with level to the returned nodes array
      });
      // continue searching for node levels until all nodes are set with levels
      while (levelsNodeFound < nodes.length) {
        currentLevel++;    // increment level
        // prevent infinite loop in case of un-attached nodes or corrupted data
        if (currentLevel > nodes.length) {
          console.warn("Not all node levels were found. Could be un-attached nodes or corrupted data.");
          break;
        }
        let newNodes = []; // array holding the nodes that will be found in this pass
        // scan the nextLevelNodes array and set the level to its nodes
        nextLevelNodes.forEach(nodeId => {
          nodes.forEach(node => {
            // since the same node can be accessed in more than 1 level, we first check the the level wasn't set yet. This ensures we set the minimal level value (shortest IV route to this node)
            if (node.id === nodeId && typeof node.level === "undefined") {
              node.level = currentLevel;   // set node level to the current level
              levelsNodeFound++;           // increment found nodes with levels counter
              newNodes = [...newNodes, ...node.prefetchNodeIds]; // append this node children to the nodes that will be scanned in the next pass
            }
          });
        });
        // since nodes can be access more than once, we might get the same node few times in the array. The following code removes duplicated nodes from the nextLevelNodes array
        nextLevelNodes = newNodes.filter(function(item, pos, self) {
          return self.indexOf(item) === pos;
        });
      }
      return nodes; // return the found nodes with levels
    } else {
      return [];    // if no nodes were found - return an empty array
    }
  }
  
  private parseIVDeletedNodes(data): Node[] {
    let nodes: Node[] = [];   // the returned nodes array
    if (data.deletedNodes) {
      data.deletedNodes.forEach(node => {
        const newNode: Node = {
          id: node.id,
          name: node.name,
          deleted: true,
          entryId: node.entryId,
          deletedDate: node.deleteDate ? this._translate.instant('app.playlist.deletionDate') + ' ' + DateFilterUtils.formatFullDateString(node.deleteDate) : ''
        };
        nodes.push(newNode);
      });
    }
    return nodes;
  }
  
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
    this.topVideos$.next({table: null, compare: null, busy: true, error: null});
    this._isBusy = true;
    this._blockerMessage = null;
  
    const loadIVData$ = this.loadIVData();
    const loadIVReport$ = this.loadIVReport();
  
    Observable.forkJoin(loadIVData$, loadIVReport$)
      .subscribe(( value: [ Node[], {report: Report, compare: any} ] ) => {
        const nodes: Node[] = value[0];
        const { report, compare } = {...value[1]};
          this._tableData = [];
          this._compareTableData = [];
          if (report.table) {
            this._handleTable(nodes, report.table, compare); // handle table
            this.topVideos$.next({ table: report.table, compare: compare && compare.table ? compare.table : null, busy: false, error: null });
          } else {
            this.topVideos$.next({ table: null, compare: null, busy: false, error: null });
          }
          this._isBusy = false;
          this._firstTimeLoading = false;
          this._compareFirstTimeLoading = false;
          this.updateLayout();
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
          this.topVideos$.next({ table: null, compare: null, busy: false, error: error });
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
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
  
  private appendMissingNodes(table: any[], nodes: Node[]) {
    // add nodes with no data: missing from the report, available in the IV JSON data
    nodes.forEach(node => {
      if (table.filter(row => row.node_id === node.id).length === 0) { // node doesn't exist in the report
        table.push({...node, count_node_plays: 0, unique_known_users: 0, avg_completion_rate: 0, thumbnailUrl: this.getThumbnailUrl(node)}); // add node to the table
      }
    });
  }
  
  private getThumbnailUrl(node: Node): string {
    return `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${node.entryId}/width/256/height/144?rnd=${Math.random()}`;
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
  
  private updateLayout(): void {
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { 'height': document.getElementById('analyticsApp').getBoundingClientRect().height });
      }, 0);
    }
  }
  
  ngOnDestroy() {
    this.topVideos$.complete();
  }
}
